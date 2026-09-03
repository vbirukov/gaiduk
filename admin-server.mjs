/**
 * Админ-сервер для Haiduk (гайдук.рф).
 * Порт 8790, проксируется через nginx /admin/api/.
 * Статистика хранится в JSON-файлах (без нативных модулей).
 */

import { createServer } from "node:http";
import { readFile, writeFile, stat, mkdir, rename } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const PORT = process.env.ADMIN_PORT || 8790;
const MEDIA_ROOT = process.env.MEDIA_ROOT || "/var/media";
const SYNC_LOG = process.env.SYNC_LOG || "/var/log/gayduk/media-sync.log";
const SYNC_SERVICE = process.env.SYNC_SERVICE || "gayduk-media-sync.service";
const DATA_DIR = process.env.DATA_DIR || "/var/lib/haiduk-admin";
const COLLECTIONS_FILE =
  process.env.COLLECTIONS_FILE || join(MEDIA_ROOT, "collections.json");

const __dirname = dirname(fileURLToPath(import.meta.url));
await mkdir(DATA_DIR, { recursive: true }).catch(() => {});

// === JSON-based storage ===
const VISITS_FILE = join(DATA_DIR, "visits.json");

function loadVisits() {
  try {
    if (!existsSync(VISITS_FILE)) return [];
    return JSON.parse(require("fs").readFileSync(VISITS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveVisits(visits) {
  // Keep last 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const trimmed = visits.filter((v) => new Date(v.timestamp).getTime() > cutoff);
  // Keep max 100000 records
  const kept = trimmed.slice(-100000);
  writeFile(VISITS_FILE, JSON.stringify(kept), "utf8").catch(() => {});
}

function addVisit(ip, path, ua, ref) {
  const visits = loadVisits();
  visits.push({
    timestamp: new Date().toISOString(),
    path: path || "/",
    ip_hash: hashIp(ip),
    user_agent: (ua || "").slice(0, 300),
    referrer: (ref || "").slice(0, 300),
  });
  saveVisits(visits);
}

function getVisitsStats(days = 30) {
  const visits = loadVisits();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const filtered = visits.filter((v) => new Date(v.timestamp) >= cutoff);

  const byDay = {};
  const byPath = {};
  const ips = new Set();
  for (const v of filtered) {
    const day = v.timestamp.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
    byPath[v.path] = (byPath[v.path] || 0) + 1;
    ips.add(v.ip_hash);
  }

  return {
    total: filtered.length,
    uniqueIps: ips.size,
    days,
    byDay: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, c]) => ({ day, c })),
    byPath: Object.entries(byPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([path, c]) => ({ path, c })),
  };
}

// === Helpers ===
function json(res, data, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

function hashIp(ip) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h * 31 + ip.charCodeAt(i)) & 0x7fffffff;
  }
  return h.toString(36);
}

function execFileAsync(cmd, args) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 10000 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve({ stdout, stderr });
    });
  });
}

// === Sync log ===
async function tailLog(lines = 50) {
  try {
    const st = await stat(SYNC_LOG);
    const stream = createReadStream(SYNC_LOG, { encoding: "utf8" });
    const rl = createInterface({ input: stream });
    const all = [];
    for await (const line of rl) {
      all.push(line);
      if (all.length > lines) all.shift();
    }
    rl.close();
    return { lines: all, size: st.size, modified: st.mtime.toISOString() };
  } catch (e) {
    return { error: e.message };
  }
}

// === Sync status ===
async function syncStatus() {
  try {
    const { stdout } = await execFileAsync("systemctl", [
      "show",
      SYNC_SERVICE,
      "--property=ActiveState,SubState,LastTriggerUSec,ExecMainStatus",
      "--no-pager",
    ]);
    const props = {};
    for (const line of stdout.trim().split("\n")) {
      const [k, v] = line.split("=", 2);
      props[k] = v;
    }
    return {
      active: props.ActiveState || "unknown",
      substate: props.SubState || "unknown",
      lastTrigger: props.LastTriggerUSec || null,
      lastExitCode: props.ExecMainStatus || null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// === Trigger sync ===
async function triggerSync() {
  try {
    await execFileAsync("sudo", ["-n", "systemctl", "start", SYNC_SERVICE]);
    return { ok: true };
  } catch (e) {
    return {
      error: "Нет прав для запуска синхронизации. Выполните на сервере: sudo systemctl start " + SYNC_SERVICE,
    };
  }
}

// === Catalog stats ===
async function catalogStats() {
  try {
    const catalogPath = join(MEDIA_ROOT, "catalog.json");
    const raw = await readFile(catalogPath, "utf8");
    const cat = JSON.parse(raw);
    const byFolder = {};
    for (const t of cat.tracks || []) {
      byFolder[t.folder] = (byFolder[t.folder] || 0) + 1;
    }
    // Дедупликация: старые catalog.json могли содержать дубли папок
    // (например, «09 22 MINUTW 1/2» из Яндекс-листинга и Mail.ru).
    const folders = [...new Set(cat.folders || [])].map((f) => ({
      name: f,
      trackCount: byFolder[f] || 0,
    }));
    const emptyFolders = folders.filter((f) => f.trackCount === 0);
    const totalSize = cat.tracks?.reduce((sum, t) => sum + (t.size || 0), 0) || 0;
    return {
      sourceTitle: cat.sourceTitle,
      totalTracks: cat.tracks?.length || 0,
      totalFolders: folders.length,
      totalSections: cat.sections?.length || 0,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(1),
      emptyFolders: emptyFolders.map((f) => f.name),
      folders,
      sections: cat.sections || [],
      lastModified: (await stat(catalogPath)).mtime.toISOString(),
    };
  } catch (e) {
    return { error: e.message };
  }
}

// === Коллекции (collections.json) ===
function resolveSectionName(folderName) {
  return String(folderName)
    .replace(/\s*\d{4}\s*[-–—]\s*\d{4}\s*$/, "")
    .trim();
}

function stripNumberPrefix(name) {
  return String(name).replace(/^\s*\d{1,3}\s+/, "").trim();
}

async function readCollectionsFile() {
  try {
    const raw = await readFile(COLLECTIONS_FILE, "utf8");
    const data = JSON.parse(raw);
    return {
      exists: true,
      config: Array.isArray(data) ? { collections: data } : data,
    };
  } catch {
    return { exists: false, config: null };
  }
}

async function writeCollectionsFile(config) {
  const payload = Array.isArray(config) ? { collections: config } : config;
  await mkdir(dirname(COLLECTIONS_FILE), { recursive: true });
  const tmp = `${COLLECTIONS_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
  await rename(tmp, COLLECTIONS_FILE);
}

/** Собирает доступные физические папки из текущего catalog.json. */
async function catalogFolderIndex() {
  const catalogPath = join(MEDIA_ROOT, "catalog.json");
  try {
    const cat = JSON.parse(await readFile(catalogPath, "utf8"));
    const tracks = cat.tracks || [];
    const byFolder = new Map(); // folder → { section, count }
    for (const t of tracks) {
      const f = t.folder;
      if (!byFolder.has(f)) {
        byFolder.set(f, {
          folder: f,
          section: t.section || resolveSectionName(f),
          count: 0,
        });
      }
      byFolder.get(f).count += 1;
    }
    return {
      folders: [...byFolder.values()],
      sections: cat.sections || [],
      sourceTitle: cat.sourceTitle,
    };
  } catch (e) {
    return { error: e.message, folders: [], sections: [] };
  }
}

/** Предзаполнение коллекций из текущего каталога (не сохраняет). */
async function suggestCollections() {
  const idx = await catalogFolderIndex();
  if (idx.error) return { error: idx.error };
  // Группируем папки по секции текущего каталога (resolveSection уже свёл
  // растаманские и т.п. в один раздел). Каждая секция → коллекция.
  const groups = new Map(); // sectionId → { title, folders: [] }
  for (const f of idx.folders) {
    const sectionId = f.section;
    if (!groups.has(sectionId)) {
      groups.set(sectionId, {
        title: stripNumberPrefix(sectionId) || sectionId,
        folders: [],
      });
    }
    groups.get(sectionId).folders.push(f.folder);
  }
  const collections = [];
  for (const [sectionId, g] of groups) {
    const labelOf = (folder) => {
      let label = stripNumberPrefix(folder);
      const clean = stripNumberPrefix(sectionId);
      if (clean && label.startsWith(clean)) {
        const rest = label.slice(clean.length).trim();
        if (rest) label = rest;
      }
      return label;
    };
    collections.push({
      id: sectionId,
      title: g.title || sectionId,
      folders: g.folders.sort((a, b) => a.localeCompare(b, "ru")).map((folder) => ({
        name: folder,
        label: labelOf(folder),
      })),
    });
  }
  return { collections };
}

// === Router ===
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const method = req.method.toUpperCase();

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    if (url.pathname === "/api/collections" && method === "GET") {
      const [file, idx] = await Promise.all([
        readCollectionsFile(),
        catalogFolderIndex(),
      ]);
      return json(res, { ...file, catalog: idx });
    }
    if (url.pathname === "/api/collections/suggest" && method === "GET") {
      return json(res, await suggestCollections());
    }
    if (url.pathname === "/api/collections" && (method === "PUT" || method === "POST")) {
      const body = await readBody(req);
      let config;
      try {
        config = JSON.parse(body);
      } catch {
        return json(res, { error: "Тело должно быть JSON (collections)" }, 400);
      }
      await writeCollectionsFile(config);
      return json(res, { ok: true, file: COLLECTIONS_FILE });
    }
    if (url.pathname === "/api/collections" && method === "DELETE") {
      await writeCollectionsFile({ collections: [] });
      return json(res, { ok: true, file: COLLECTIONS_FILE });
    }
    if (url.pathname === "/api/sync/log" && method === "GET") {
      const lines = parseInt(url.searchParams.get("lines") || "50");
      return json(res, await tailLog(lines));
    }
    if (url.pathname === "/api/sync/status" && method === "GET") {
      return json(res, await syncStatus());
    }
    if (url.pathname === "/api/sync/run" && method === "POST") {
      return json(res, await triggerSync());
    }
    if (url.pathname === "/api/catalog/stats" && method === "GET") {
      return json(res, await catalogStats());
    }
    if (url.pathname === "/api/stats/visits" && method === "GET") {
      const days = parseInt(url.searchParams.get("days") || "30");
      return json(res, getVisitsStats(days));
    }
    if (url.pathname === "/api/stats/visit" && method === "POST") {
      const body = await readBody(req);
      let data = {};
      try { data = JSON.parse(body); } catch {}
      const ip = req.headers["x-real-ip"] || req.socket.remoteAddress || "unknown";
      addVisit(ip, data.path || "/", req.headers["user-agent"] || "", req.headers["referer"] || "");
      return json(res, { ok: true });
    }
    return json(res, { error: "Not found" }, 404);
  } catch (e) {
    console.error(e);
    return json(res, { error: e.message }, 500);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[admin] http://127.0.0.1:${PORT}`);
  console.log(`[admin] data: ${DATA_DIR}`);
  console.log(`[admin] media: ${MEDIA_ROOT}`);
});