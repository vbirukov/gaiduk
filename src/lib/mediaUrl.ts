import { isRuntimeServerMediaTest } from "./serverMediaTest";

/** Локальные mp3 с сервера (после scripts/sync-disk-media.mjs). */
function mediaBaseFromEnv(): string {
  const raw = import.meta.env.VITE_MEDIA_BASE;
  return typeof raw === "string" ? raw.trim().replace(/\/$/, "") : "";
}

export function effectiveMediaBase(): string {
  const env = mediaBaseFromEnv();
  if (env) return env;
  if (isRuntimeServerMediaTest()) return "/media";
  return "";
}

export function mediaBase(): string {
  return effectiveMediaBase();
}

export function useServerMedia(): boolean {
  return Boolean(effectiveMediaBase());
}

/** @deprecated use useServerMedia */
export function useLocalMedia(): boolean {
  return useServerMedia();
}

export function mediaUrlForPath(diskPath: string): string {
  const base = effectiveMediaBase();
  if (!base) return "";
  const segments = diskPath
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s));
  return `${base}/${segments.join("/")}`;
}

export function isYandexDiskDownloadUrl(url: string): boolean {
  return url.includes("downloader.disk.yandex.ru");
}
