/**
 * Скачивает публичную папку Яндекс.Диска в локальную директорию + catalog.json.
 *
 *   node scripts/sync-disk-media.mjs --dry-run
 *   MEDIA_ROOT=/var/media node scripts/sync-disk-media.mjs
 *   MEDIA_ROOT=./data/media node scripts/sync-disk-media.mjs --limit 3
 *
 * Пропуск файла: локальный mp3 + совпадение size, modified и id с прошлым catalog.json.
 * Замена на Диске с тем же именем → перекачает при смене size, modified или resource_id.
 */
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const PUBLIC_KEY = "https://disk.yandex.ru/d/fqkAWd063U6ViZ";
const API_ROOT = "https://cloud-api.yandex.net/v1/disk/public/resources";
const AUDIO_EXT = [".mp3", ".m4a", ".ogg", ".wav"];
const CONCURRENCY = 3;

// Mail.ru Cloud источники. Каждый: weblink публичной папки → локальная папка.
// 09 22 MINUTW 1 и 2 переехали на Mail.ru Cloud.
const MAILRU_API = "https://cloud.mail.ru/api/v2"; // v2 для листинга
const MAILRU_DISPATCHER = "https://cloud.mail.ru/api/v3"; // v3 для dispatcher
const MAILRU_SOURCES = [
  {
    weblink: "4Jzg/HoVQdUYMj",
    folder: "09 22 MINUTW 1",
  },
  {
    weblink: "vDPx/8XEnr6thX",
    folder: "09 22 MINUTW 2",
  },
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const verbose = args.has("--verbose");
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

function log(msg) {
  const t = new Date().toISOString().slice(11, 19);
  console.error(`[${t}] ${msg}`);
}

function formatMb(bytes) {
  if (bytes == null || !Number.isFinite(bytes)) return "?";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

/**
 * Определяет секцию по имени папки.
 * Удаляет годовые диапазоны («1995 - 1997») из имени секции,
 * чтобы все выпуски одной серии группировались вместе.
 */
function resolveSection(folderName) {
  return folderName.replace(/\s*\d{4}\s*[-–—]\s*\d{4}\s*$/, "").trim();
}

/** Листинг публичной папки Mail.ru Cloud → массив файлов. */
async function listMailruFolder(source) {
  const url = `${MAILRU_API}/folder?weblink=${encodeURIComponent(source.weblink)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Referer: "https://cloud.mail.ru/" },
  });
  if (!res.ok) throw new Error(`mailru folder ${res.status} ${source.weblink}`);
  const data = await res.json();
  const items = data.body?.list ?? [];
  // Реальный weblink папки (может отличаться от входного token)
  const folderWeblink = String(data.body?.weblink || source.weblink);
  return { folderWeblink, items };
}

/** Прямая ссылка на скачивание файла с Mail.ru Cloud. */
async function mailruDownloadHref(fileWeblink, attempt = 0) {
  const dispUrl = `${MAILRU_DISPATCHER}/dispatcher?weblink=${encodeURIComponent(fileWeblink)}`;
  const res = await fetch(dispUrl, {
    headers: { "User-Agent": "Mozilla/5.0", Referer: "https://cloud.mail.ru/" },
  });
  if (res.status === 429 && attempt < 6) {
    await sleep(Math.min(12_000, 600 * 2 ** attempt));
    return mailruDownloadHref(fileWeblink, attempt + 1);
  }
  if (!res.ok) throw new Error(`mailru dispatcher ${res.status}`);
  const data = await res.json();
  const base = data.body?.weblink_view?.[0]?.url;
  if (!base) throw new Error(`empty weblink_view ${fileWeblink}`);
  // weblink_view.url заканчивается на "/", добавляем полный weblink файла
  return `${base}${fileWeblink}`;
}

/** Собирает треки с Mail.ru Cloud («09 22 MINUTW 1» и «2»). */
async function buildMailruCatalog() {
  const tracks = [];
  for (const source of MAILRU_SOURCES) {
    try {
      const { folderWeblink, items } = await listMailruFolder(source);
      for (const item of items) {
        const lower = String(item.name || "").toLowerCase();
        const isAudio =
          item.kind === "file" &&
          AUDIO_EXT.some((ext) => lower.endsWith(ext));
        if (!isAudio) continue;
        const fileWeblink = String(item.weblink || `${folderWeblink}/${item.name}`);
        const localPath = `/${source.folder}/${item.name}`;
        tracks.push({
          id: `mailru:${item.hash || fileWeblink}`,
          title: String(item.name).replace(/\.[^.]+$/, ""),
          fileName: String(item.name),
          folder: source.folder,
          folderPath: `/${source.folder}`,
          path: localPath,
          size: item.size,
          modified: item.mtime ? new Date(item.mtime * 1000).toISOString() : null,
          mimeType: "audio/mpeg",
          section: resolveSection(source.folder),
          source: "mailru",
          mailruWeblink: fileWeblink,
        });
      }
    } catch (e) {
      console.warn("mailru folder skip:", source.weblink, e.message);
    }
  }
  return tracks;
}

async function buildCatalog() {
  const root = await fetchJson(
    `${API_ROOT}?public_key=${encodeURIComponent(PUBLIC_KEY)}&limit=200`,
  );
  const folders = (root._embedded?.items ?? []).filter((i) => i.type === "dir");
  const tracks = [];
  const sectionSet = new Set();
  for (const folder of folders) {
    const section = resolveSection(String(folder.name));
    sectionSet.add(section);
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
          section,
          source: "yandex",
        });
      }
    } catch (e) {
      console.warn("folder skip:", folder.path, e.message);
    }
  }

  // Добавляем треки из Mail.ru Cloud («09 22 MINUTW 1» и «2»).
  const mailruTracks = await buildMailruCatalog();
  const mailruFolders = [...new Set(mailruTracks.map((t) => t.folder))];
  for (const t of mailruTracks) {
    sectionSet.add(t.section);
    tracks.push(t);
  }

  const allFolders = [
    ...folders.map((f) => String(f.name)),
    ...mailruFolders,
  ];

  return {
    sourceTitle: root.name || "СКАЗКИ АУДИО",
    sections: [...sectionSet].sort((a, b) => a.localeCompare(b, "ru")),
    folders: allFolders,
    tracks,
  };
}

function localFilePath(diskPath) {
  const parts = diskPath.split("/").filter(Boolean);
  return path.join(rootDir, ...parts);
}

function normModified(v) {
  return v == null || v === "" ? "" : String(v);
}

async function loadPreviousCatalogMap() {
  const catalogPath = path.join(rootDir, "catalog.json");
  try {
    const data = JSON.parse(await readFile(catalogPath, "utf8"));
    const map = new Map();
    for (const t of data.tracks ?? []) {
      if (t.path) map.set(String(t.path), t);
    }
    return map;
  } catch {
    return new Map();
  }
}

/** Локальный файл совпадает с API и с прошлым catalog.json (size + modified + id). */
async function localFileUpToDate(track, prevByPath) {
  const dest = localFilePath(track.path);
  let st;
  try {
    st = await stat(dest);
    if (!st.isFile() || st.size <= 0) return false;
  } catch {
    return false;
  }
  if (track.size != null && st.size !== track.size) return false;

  const prev = prevByPath.get(track.path);
  if (!prev) return false;

  const apiMod = normModified(track.modified);
  const prevMod = normModified(prev.modified);
  if (apiMod) {
    if (!prevMod) return false;
    if (apiMod !== prevMod) return false;
  }

  const apiId = track.id != null ? String(track.id) : "";
  const prevId = prev.id != null ? String(prev.id) : "";
  if (apiId && prevId && apiId !== prevId) return false;

  return true;
}

async function downloadFile(track, prevByPath, ctx) {
  const dest = localFilePath(track.path);
  if (await localFileUpToDate(track, prevByPath)) {
    if (verbose) log(`skip ${ctx.pos}/${ctx.total}: ${track.path}`);
    return { status: "skip", dest };
  }
  if (dryRun) {
    return { status: "dry", dest };
  }
  const t0 = Date.now();
  log(
    `dl start ${ctx.pos}/${ctx.total}: ${track.path} (${formatMb(track.size)})`,
  );
  await mkdir(path.dirname(dest), { recursive: true });
  const href =
    track.source === "mailru"
      ? await mailruDownloadHref(track.mailruWeblink)
      : await fetchDownloadHref(track.path);
  const res = await fetch(href, {
    headers: track.source === "mailru" ? { "User-Agent": "Mozilla/5.0" } : {},
  });
  if (!res.ok) throw new Error(`GET ${res.status} ${track.path}`);
  const tmp = `${dest}.part`;
  const heartbeat = setInterval(() => {
    log(`dl … ${Math.round((Date.now() - t0) / 1000)}s: ${track.path}`);
  }, 30_000);
  try {
    await pipeline(res.body, createWriteStream(tmp));
  } finally {
    clearInterval(heartbeat);
  }
  const st = await stat(tmp);
  if (track.size && st.size !== track.size) {
    log(`size mismatch: ${track.path} api=${track.size} got=${st.size}`);
  }
  await rename(tmp, dest);
  log(
    `dl done ${ctx.pos}/${ctx.total}: ${track.path} (${formatMb(st.size)}, ${Math.round((Date.now() - t0) / 1000)}s)`,
  );
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
  log(`sync start pid=${process.pid} MEDIA_ROOT=${rootDir} dry-run=${dryRun}`);
  const catalog = await buildCatalog();
  const prevByPath = await loadPreviousCatalogMap();
  let tracks = catalog.tracks;
  if (limit > 0) tracks = tracks.slice(0, limit);
  log(`tracks: ${tracks.length}, prev catalog: ${prevByPath.size}`);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  let done = 0;
  const total = tracks.length;
  await runPool(tracks, async (track, n) => {
    const pos = n + 1;
    try {
      const r = await downloadFile(track, prevByPath, { pos, total });
      if (r.status === "ok") ok++;
      else if (r.status === "skip") skip++;
      else if (r.status === "dry") {
        const up = await localFileUpToDate(track, prevByPath);
        log(up ? `[dry skip] ${track.path}` : `[dry dl] ${track.path}`);
      }
      done++;
      if (done % 10 === 0 || done === total) {
        log(`progress ${done}/${total} ok=${ok} skip=${skip} fail=${fail}`);
      }
    } catch (e) {
      fail++;
      done++;
      log(`FAIL ${track.path}: ${e.message}`);
    }
  });

  const out = { ...catalog, tracks: limit > 0 ? tracks : catalog.tracks };
  const catalogPath = path.join(rootDir, "catalog.json");
  if (!dryRun) {
    await mkdir(rootDir, { recursive: true });
    const tmp = `${catalogPath}.tmp`;
    await writeFile(tmp, JSON.stringify(out, null, 2), "utf8");
    await rename(tmp, catalogPath);
  }
  log(`done: ok=${ok} skip=${skip} fail=${fail}`);
  log(`catalog: ${catalogPath}`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
