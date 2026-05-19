/**
 * Скачивает публичную папку Яндекс.Диска в локальную директорию + catalog.json.
 *
 *   node scripts/sync-disk-media.mjs --dry-run
 *   MEDIA_ROOT=/var/media node scripts/sync-disk-media.mjs
 *   MEDIA_ROOT=./data/media node scripts/sync-disk-media.mjs --limit 3
 */
import { createWriteStream } from "node:fs";
import { mkdir, writeFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const PUBLIC_KEY = "https://disk.yandex.ru/d/fqkAWd063U6ViZ";
const API_ROOT = "https://cloud-api.yandex.net/v1/disk/public/resources";
const AUDIO_EXT = [".mp3", ".m4a", ".ogg", ".wav"];
const CONCURRENCY = 3;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const limit = (() => {
  const i = process.argv.indexOf("--limit");
  return i >= 0 ? Number(process.argv[i + 1]) : 0;
})();

const rootDir = path.resolve(
  process.env.MEDIA_ROOT ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "media"),
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, attempt = 0) {
  const res = await fetch(url);
  if (res.status === 429 && attempt < 6) {
    await sleep(Math.min(12_000, 600 * 2 ** attempt));
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchDownloadHref(filePath, attempt = 0) {
  const apiUrl = `${API_ROOT}/download?public_key=${encodeURIComponent(PUBLIC_KEY)}&path=${encodeURIComponent(filePath)}`;
  const res = await fetch(apiUrl);
  if (res.status === 429 && attempt < 6) {
    await sleep(Math.min(12_000, 600 * 2 ** attempt));
    return fetchDownloadHref(filePath, attempt + 1);
  }
  if (!res.ok) throw new Error(`download meta ${res.status} ${filePath}`);
  const data = await res.json();
  const href = String(data.href || "");
  if (!href) throw new Error(`empty href ${filePath}`);
  return href;
}

async function buildCatalog() {
  const root = await fetchJson(
    `${API_ROOT}?public_key=${encodeURIComponent(PUBLIC_KEY)}&limit=200`,
  );
  const folders = (root._embedded?.items ?? []).filter((i) => i.type === "dir");
  const tracks = [];
  for (const folder of folders) {
    try {
      const folderData = await fetchJson(
        `${API_ROOT}?public_key=${encodeURIComponent(PUBLIC_KEY)}&path=${encodeURIComponent(String(folder.path))}&limit=500`,
      );
      for (const item of folderData._embedded?.items ?? []) {
        const lower = String(item.name || "").toLowerCase();
        const isAudio =
          item.type === "file" &&
          AUDIO_EXT.some((ext) => lower.endsWith(ext));
        if (!isAudio) continue;
        tracks.push({
          id: String(item.resource_id || item.path),
          title: String(item.name).replace(/\.[^.]+$/, ""),
          fileName: String(item.name),
          folder: String(folder.name),
          folderPath: String(folder.path),
          path: String(item.path),
          size: item.size,
          modified: item.modified,
          mimeType: item.mime_type,
        });
      }
    } catch (e) {
      console.warn("folder skip:", folder.path, e.message);
    }
  }
  return {
    sourceTitle: root.name || "СКАЗКИ АУДИО",
    folders: folders.map((f) => String(f.name)),
    tracks,
  };
}

function localFilePath(diskPath) {
  const parts = diskPath.split("/").filter(Boolean);
  return path.join(rootDir, ...parts);
}

async function fileSizeOk(dest, expected) {
  try {
    const st = await stat(dest);
    if (!st.isFile()) return false;
    if (expected && st.size !== expected) return false;
    return st.size > 0;
  } catch {
    return false;
  }
}

async function downloadFile(track) {
  const dest = localFilePath(track.path);
  if (await fileSizeOk(dest, track.size)) {
    return { status: "skip", dest };
  }
  if (dryRun) {
    return { status: "dry", dest };
  }
  await mkdir(path.dirname(dest), { recursive: true });
  const href = await fetchDownloadHref(track.path);
  const res = await fetch(href);
  if (!res.ok) throw new Error(`GET ${res.status} ${track.path}`);
  const tmp = `${dest}.part`;
  await pipeline(res.body, createWriteStream(tmp));
  const st = await stat(tmp);
  if (track.size && st.size !== track.size) {
    console.warn("size mismatch:", track.path, track.size, st.size);
  }
  await rename(tmp, dest);
  return { status: "ok", dest };
}

async function runPool(items, worker) {
  let i = 0;
  const results = [];
  async function next() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => next()));
  return results;
}

async function main() {
  console.error("MEDIA_ROOT:", rootDir);
  console.error("dry-run:", dryRun);
  const catalog = await buildCatalog();
  let tracks = catalog.tracks;
  if (limit > 0) tracks = tracks.slice(0, limit);
  console.error(`tracks: ${tracks.length}`);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  await runPool(tracks, async (track, n) => {
    try {
      const r = await downloadFile(track);
      if (r.status === "ok") ok++;
      else if (r.status === "skip") skip++;
      else if (r.status === "dry") {
        console.error(`[dry] ${track.path}`);
      }
      if ((n + 1) % 10 === 0) {
        console.error(`progress ${n + 1}/${tracks.length}`);
      }
    } catch (e) {
      fail++;
      console.error("FAIL", track.path, e.message);
    }
  });

  const out = { ...catalog, tracks: limit > 0 ? tracks : catalog.tracks };
  const catalogPath = path.join(rootDir, "catalog.json");
  if (!dryRun) {
    await mkdir(rootDir, { recursive: true });
    await writeFile(catalogPath, JSON.stringify(out, null, 2), "utf8");
  }
  console.error(`done: ok=${ok} skip=${skip} fail=${fail}`);
  console.error("catalog:", catalogPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
