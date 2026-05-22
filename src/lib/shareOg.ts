import type { Track } from "../types/catalog";
import { artworkUrlForTrack } from "./cover";

const SITE_NAME = "Haiduk — аудиосказки Дмитрия Гайдука";

export function trackShareSlug(trackId: string): string {
  const bytes = new TextEncoder().encode(trackId);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function trackIdFromShareSlug(slug: string): string | null {
  try {
    const b64 = slug.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const binary = atob(b64 + pad);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function shareTitleForTrack(track: Pick<Track, "title">): string {
  return track.title;
}

export function shareDescriptionForTrack(
  track: Pick<Track, "title" | "folder">,
): string {
  const series = track.folder?.trim();
  if (series) {
    return `Сказка «${track.title}» · ${series} — Дмитрий Гайдук`;
  }
  return `Сказка «${track.title}» — Дмитрий Гайдук`;
}

export function resolveSiteOrigin(explicit?: string): string {
  const fromEnv =
    explicit ??
    (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SITE_ORIGIN
      ? String(import.meta.env.VITE_SITE_ORIGIN).trim()
      : "");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function sharePagePath(trackId: string): string {
  return `/share/${trackShareSlug(trackId)}.html`;
}

export function appDeepLink(
  trackId: string,
  origin: string,
  startAtSec?: number,
): string {
  const url = new URL("/", origin || "http://localhost");
  url.searchParams.set("track", trackId);
  if (startAtSec != null && startAtSec >= 3) {
    url.searchParams.set("t", String(Math.floor(startAtSec)));
  }
  return url.pathname + url.search;
}

export function sharePageUrl(
  trackId: string,
  origin: string,
  startAtSec?: number,
): string {
  const base = (origin || "http://localhost").replace(/\/$/, "");
  const path = sharePagePath(trackId);
  const url = new URL(path, `${base}/`);
  if (startAtSec != null && startAtSec >= 3) {
    url.searchParams.set("t", String(Math.floor(startAtSec)));
  }
  return url.href;
}

export type OgMetaInput = {
  track: Pick<Track, "id" | "title" | "folder">;
  origin?: string;
  startAtSec?: number;
};

function upsertMeta(
  selector: string,
  attrs: Record<string, string>,
  createTag: "meta" | "link" = "meta",
) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(createTag);
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "content" || k === "href") el.setAttribute(k, v);
    else el.setAttribute(k, v);
  }
}

export function applyOgMeta(input: OgMetaInput | null) {
  if (typeof document === "undefined") return;
  if (!input?.track) {
    applySiteOgDefaults();
    return;
  }

  const origin = resolveSiteOrigin(input.origin);
  const title = shareTitleForTrack(input.track);
  const description = shareDescriptionForTrack(input.track);
  const image = artworkUrlForTrack(input.track);
  const pageUrl = sharePageUrl(input.track.id, origin, input.startAtSec);

  document.title = `${title} — ${SITE_NAME}`;

  upsertMeta('meta[name="description"]', {
    name: "description",
    content: description,
  });
  upsertMeta('link[rel="canonical"]', { rel: "canonical", href: pageUrl }, "link");

  const ogPairs: [string, string][] = [
    ["og:site_name", SITE_NAME],
    ["og:type", "website"],
    ["og:title", title],
    ["og:description", description],
    ["og:image", image],
    ["og:url", pageUrl],
    ["og:locale", "ru_RU"],
  ];
  for (const [prop, content] of ogPairs) {
    upsertMeta(`meta[property="${prop}"]`, { property: prop, content });
  }

  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: "summary_large_image",
  });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: description,
  });
  upsertMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: image,
  });
}

export function applySiteOgDefaults() {
  if (typeof document === "undefined") return;
  const origin = resolveSiteOrigin();
  const pageUrl = origin ? `${origin}/` : "/";
  const image = origin
    ? `${origin}/covers/default.webp`
    : "/covers/default.webp";
  const title = SITE_NAME;
  const description =
    "Аудиосказки и сказочные записи Дмитрия Гайдука — слушайте в браузере или установите как приложение.";

  document.title = title;
  upsertMeta('meta[name="description"]', {
    name: "description",
    content: description,
  });
  upsertMeta('link[rel="canonical"]', { rel: "canonical", href: pageUrl }, "link");
  upsertMeta('meta[property="og:site_name"]', {
    property: "og:site_name",
    content: SITE_NAME,
  });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', {
    property: "og:description",
    content: description,
  });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: pageUrl });
  upsertMeta('meta[property="og:locale"]', {
    property: "og:locale",
    content: "ru_RU",
  });
  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: "summary_large_image",
  });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: description,
  });
  upsertMeta('meta[name="twitter:image"]', {
    name: "twitter:image",
    content: image,
  });
}
