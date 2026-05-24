import { resolveSiteOrigin, trackIdFromShareSlug } from "./shareOg";

export const EMBED_WIDTH = 480;
export const EMBED_HEIGHT = 168;

export type EmbedParams = {
  trackId: string | null;
  startAtSec: number | undefined;
  autoplay: boolean;
};

export function parseEmbedParams(): EmbedParams {
  if (typeof window === "undefined") {
    return { trackId: null, startAtSec: undefined, autoplay: false };
  }
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get("track")?.trim() || null;
  const tRaw = params.get("t");
  let startAtSec: number | undefined;
  if (tRaw != null && tRaw !== "") {
    const t = parseInt(tRaw, 10);
    if (Number.isFinite(t) && t >= 0) startAtSec = t;
  }
  const autoplay =
    params.get("autoplay") === "1" || params.get("autoplay") === "true";
  return { trackId, startAtSec, autoplay };
}

export function embedPageUrl(
  trackId: string,
  origin?: string,
  startAtSec?: number,
): string {
  const base = (origin ?? resolveSiteOrigin()).replace(/\/$/, "");
  const url = new URL("/embed.html", `${base}/`);
  url.searchParams.set("track", trackId);
  if (startAtSec != null && startAtSec >= 3) {
    url.searchParams.set("t", String(Math.floor(startAtSec)));
  }
  return url.href;
}

export function embedIframeHtml(
  trackId: string,
  origin?: string,
  startAtSec?: number,
): string {
  const src = embedPageUrl(trackId, origin, startAtSec).replace(/"/g, "&quot;");
  return `<iframe src="${src}" width="${EMBED_WIDTH}" height="${EMBED_HEIGHT}" frameborder="0" scrolling="no" allow="autoplay; encrypted-media" style="border:0;border-radius:16px;overflow:hidden;max-width:100%;"></iframe>`;
}

export function trackIdFromPageUrl(pageUrl: string): string | null {
  const origin = resolveSiteOrigin();
  let u: URL;
  try {
    u = new URL(pageUrl);
  } catch {
    return null;
  }

  const trackParam = u.searchParams.get("track")?.trim();
  if (trackParam) return trackParam;

  const shareMatch = u.pathname.match(/\/share\/([^/]+)\.html$/i);
  if (shareMatch?.[1]) {
    return trackIdFromShareSlug(shareMatch[1]);
  }

  return null;
}

export function oembedApiUrl(pageUrl: string, origin?: string): string {
  const base = (origin ?? resolveSiteOrigin()).replace(/\/$/, "");
  const q = new URLSearchParams({ format: "json", url: pageUrl });
  return `${base}/oembed?${q.toString()}`;
}
