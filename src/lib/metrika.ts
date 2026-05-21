import type { LibraryView } from "../types/user";

export const YM_COUNTER_ID = Number(import.meta.env.VITE_YM_COUNTER_ID) || 0;

type YmFn = ((id: number, method: string, ...args: unknown[]) => void) & {
  a?: unknown[];
  l?: number;
};

declare global {
  interface Window {
    ym?: YmFn;
    dataLayer?: unknown[];
  }
}

let initialized = false;

function callYm(method: string, ...args: unknown[]) {
  if (!YM_COUNTER_ID || typeof window === "undefined") return;
  window.ym?.(YM_COUNTER_ID, method, ...args);
}

export function initMetrika() {
  if (!YM_COUNTER_ID || typeof window === "undefined" || initialized) return;

  window.dataLayer = window.dataLayer || [];

  const ym: YmFn =
    window.ym ||
    (((id: number, method: string, ...args: unknown[]) => {
      (ym.a = ym.a || []).push([id, method, ...args]);
    }) as YmFn);
  window.ym = ym;
  ym.l = Date.now();

  const tagUrl = `https://mc.yandex.ru/metrika/tag.js?id=${YM_COUNTER_ID}`;
  let hasTag = false;
  for (let j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j]!.src === tagUrl) {
      hasTag = true;
      break;
    }
  }
  if (!hasTag) {
    const script = document.createElement("script");
    script.async = true;
    script.src = tagUrl;
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(script, first);
  }

  callYm("init", {
    webvisor: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
  });

  initialized = true;
  ymHit("/app/open", document.title);
}

export function ymHit(url: string, title?: string) {
  if (!YM_COUNTER_ID) return;
  callYm("hit", url, title ? { title } : undefined);
}

export function ymGoal(
  goal: string,
  params?: Record<string, string | number | boolean>,
) {
  if (!YM_COUNTER_ID) return;
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
