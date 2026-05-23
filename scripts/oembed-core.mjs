/**
 * oEmbed + embed URL helpers (Node, без React).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const OEMBED_VERSION = "1.0";
export const EMBED_WIDTH = 480;
export const EMBED_HEIGHT = 168;

export function utf8ShareSlug(value) {
  return Buffer.from(String(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function utf8FromShareSlug(slug) {
  try {
    const b64 = String(slug).replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const binary = Buffer.from(b64 + pad, "base64").toString("utf8");
    return binary || null;
  } catch {
    return null;
  }
}

export function resolveSiteOrigin() {
  const o = (
    process.env.VITE_SITE_ORIGIN ||
    process.env.OG_SITE_ORIGIN ||
    "https://xn--80afepl7c.xn--p1ai"
  ).trim();
  return o.replace(/\/$/, "");
}

export function resolveCatalogPath() {
  const envRoot = process.env.MEDIA_ROOT?.trim();
  const candidates = [
    envRoot ? join(envRoot, "catalog.json") : null,
    join(root, "data", "media", "catalog.json"),
    join(root, "dist", "media", "catalog.json"),
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

let catalogCache = null;

export function loadCatalog() {
  if (catalogCache) return catalogCache;
  const path = resolveCatalogPath();
  if (!path) return { tracks: [] };
  try {
    catalogCache = JSON.parse(readFileSync(path, "utf8"));
    return catalogCache;
  } catch {
    return { tracks: [] };
  }
}

export function sharePageUrl(origin, trackId) {
  const slug = utf8ShareSlug(trackId);
  return `${origin}/share/${slug}.html`;
}

export function embedPageUrl(origin, trackId, startAtSec) {
  const url = new URL("/embed.html", `${origin}/`);
  url.searchParams.set("track", trackId);
  if (startAtSec != null && startAtSec >= 3) {
    url.searchParams.set("t", String(Math.floor(startAtSec)));
  }
  return url.href;
}

/** Из URL страницы (share / главная / embed) — id трека. */
export function trackIdFromPageUrl(pageUrl, origin) {
  let u;
  try {
    u = new URL(pageUrl);
  } catch {
    return null;
  }
  const base = origin.replace(/\/$/, "");
  if (!pageUrl.startsWith(base) && !pageUrl.startsWith("http")) {
    try {
      u = new URL(pageUrl, `${base}/`);
    } catch {
      return null;
    }
  }

  const trackParam = u.searchParams.get("track")?.trim();
  if (trackParam) return trackParam;

  const shareMatch = u.pathname.match(/\/share\/([^/]+)\.html$/i);
  if (shareMatch?.[1]) {
    return utf8FromShareSlug(shareMatch[1]);
  }

  return null;
}

export function findTrack(trackId) {
  if (!trackId) return null;
  const cat = loadCatalog();
  return cat.tracks?.find((t) => t?.id === trackId) ?? null;
}

export function buildEmbedIframeHtml(embedUrl) {
  const src = embedUrl.replace(/"/g, "&quot;");
  return `<iframe src="${src}" width="${EMBED_WIDTH}" height="${EMBED_HEIGHT}" frameborder="0" scrolling="no" allow="autoplay; encrypted-media" style="border:0;border-radius:16px;overflow:hidden;max-width:100%;"></iframe>`;
}

export function buildOembedPayload({ pageUrl, origin }) {
  const trackId = trackIdFromPageUrl(pageUrl, origin);
  const track = findTrack(trackId);
  if (!track) return null;

  const title = track.title || "Сказка";
  const description = track.folder
    ? `«${track.title}» · ${track.folder}`
    : `«${track.title}»`;
  const embedUrl = embedPageUrl(origin, track.id);
  const providerUrl = `${origin}/`;

  return {
    type: "rich",
    version: OEMBED_VERSION,
    title,
    author_name: "Дмитрий Гайдук",
    provider_name: "Haiduk",
    provider_url: providerUrl,
    cache_age: 3600,
    width: EMBED_WIDTH,
    height: EMBED_HEIGHT,
    html: buildEmbedIframeHtml(embedUrl),
    description,
  };
}

export function oembedDiscoveryHref(origin, pageUrl) {
  const q = new URLSearchParams({
    format: "json",
    url: pageUrl,
  });
  return `${origin}/oembed?${q.toString()}`;
}

export function handleOembedHttp(req, res) {
  let parsed;
  try {
    parsed = new URL(req.url || "/", "http://localhost");
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("bad url");
    return;
  }

  if (parsed.pathname !== "/oembed") {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }

  const pageUrl = parsed.searchParams.get("url")?.trim();
  const origin = resolveSiteOrigin();

  if (!pageUrl) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "missing url parameter" }));
    return;
  }

  const payload = buildOembedPayload({ pageUrl, origin });
  if (!payload) {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "track not found" }));
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(payload));
}
