import type { LibraryView } from "../types/user";

/** Публичный номер счётчика; fallback если CI собрал без VITE_YM_COUNTER_ID */
export const YM_COUNTER_ID =
  Number(import.meta.env.VITE_YM_COUNTER_ID) || 109337902;

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function callYm(method: string, ...args: unknown[]) {
  if (!YM_COUNTER_ID || typeof window === "undefined") return;
  if (typeof window.ym !== "function") return;
  window.ym(YM_COUNTER_ID, method, ...args);
}

/** Доп. hit после React; счётчик и init — в index.html (официальный сниппет). */
export function initMetrika() {
  if (!YM_COUNTER_ID || typeof window === "undefined") return;
}

export function ymHit(url: string, title?: string) {
  callYm("hit", url, title ? { title, referer: location.href } : { referer: location.href });
}

export function ymGoal(
  goal: string,
  params?: Record<string, string | number | boolean>,
) {
  callYm("reachGoal", goal, params);
}

export function libraryScreenPath(
  view: LibraryView,
  folder: string | null,
  playlistId: string | null,
): string {
  if (folder) return `/library/folder/${encodeURIComponent(folder)}`;
  if (view === "playlist" && playlistId) {
    return `/library/playlist/${encodeURIComponent(playlistId)}`;
  }
  return `/library/${view}`;
}
