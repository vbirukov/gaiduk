import type { Track } from "../types/catalog";
import { artworkUrlForTrack, defaultCoverPath } from "./cover";

const SITE_NAME = "Haiduk — аудиосказки Дмитрия Гайдука";

export function utf8ShareSlug(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function utf8FromShareSlug(slug: string): string | null {
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

/** @deprecated используй utf8ShareSlug */
export function trackShareSlug(trackId: string): string {
  return utf8ShareSlug(trackId);
}

export function trackIdFromShareSlug(slug: string): string | null {
  return utf8FromShareSlug(slug);
}

export function folderShareSlug(folder: string): string {
  return utf8ShareSlug(folder);
}

export function folderFromShareSlug(slug: string): string | null {
  return utf8FromShareSlug(slug);
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

export function shareTitleForFolder(folder: string): string {
  return folder;
}

export function shareDescriptionForFolder(
  folder: string,
  trackCount: number,
): string {
  const n = trackCount > 0 ? `${trackCount} сказок` : "аудиосказки";
  return `Альбом «${folder}» — ${n}. Дмитрий Гайдук`;
}

export function shareTitleForCatalog(): string {
  return "Каталог аудиосказок";
}

export function shareDescriptionForCatalog(
  trackCount: number,
  albumCount?: number,
): string {
  const albums =
    albumCount != null && albumCount > 0
      ? ` · ${albumCount} альбомов`
      : "";
  return `Каталог Haiduk — ${trackCount} записей${albums}. Дмитрий Гайдук`;
}

export function albumSharePagePath(folder: string): string {
  return `/share/album/${folderShareSlug(folder)}.html`;
}

export function catalogSharePagePath(): string {
  return "/share/catalog.html";
}

export function albumSharePageUrl(folder: string, origin: string): string {
  const base = (origin || "http://localhost").replace(/\/$/, "");
  return new URL(albumSharePagePath(folder), `${base}/`).href;
}

export function catalogSharePageUrl(origin: string): string {
  const base = (origin || "http://localhost").replace(/\/$/, "");
  return new URL(catalogSharePagePath(), `${base}/`).href;
}

export function appDeepLinkFolder(folder: string, origin: string): string {
  const url = new URL("/", origin || "http://localhost");
  url.searchParams.set("album", folderShareSlug(folder));
  return url.pathname + url.search;
}

export function appDeepLinkCatalog(origin: string): string {
  const url = new URL("/", origin || "http://localhost");
  url.searchParams.set("catalog", "1");
  return url.pathname + url.search;
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

export type OgFolderMetaInput = {
  folder: string;
  trackCount: number;
  origin?: string;
};

export type OgCatalogMetaInput = {
  trackCount: number;
  albumCount?: number;
  origin?: string;
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

export function applyFolderOgMeta(input: OgFolderMetaInput) {
  if (typeof document === "undefined") return;
  const origin = resolveSiteOrigin(input.origin);
  const title = shareTitleForFolder(input.folder);
  const description = shareDescriptionForFolder(input.folder, input.trackCount);
  const image = origin
    ? `${origin}${defaultCoverPath()}`
    : defaultCoverPath();
  const pageUrl = albumSharePageUrl(input.folder, origin);

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

export function applyCatalogOgMeta(input: OgCatalogMetaInput) {
  if (typeof document === "undefined") return;
  const origin = resolveSiteOrigin(input.origin);
  const title = shareTitleForCatalog();
  const description = shareDescriptionForCatalog(
    input.trackCount,
    input.albumCount,
  );
  const image = origin
    ? `${origin}${defaultCoverPath()}`
    : defaultCoverPath();
  const pageUrl = catalogSharePageUrl(origin);

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
    ? `${origin}${defaultCoverPath()}`
    : defaultCoverPath();
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
