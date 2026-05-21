import type { Track } from "../types/catalog";

export function buildTrackShareUrl(
  trackId: string,
  positionSec?: number,
): string {
  const url = new URL(window.location.href);
  url.searchParams.set("track", trackId);
  url.searchParams.delete("t");
  if (positionSec != null && positionSec >= 3) {
    url.searchParams.set("t", String(Math.floor(positionSec)));
  }
  return url.toString();
}

export function parseTrackShareParams(): {
  trackId: string | null;
  startAtSec: number | undefined;
} {
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get("track")?.trim() || null;
  const tRaw = params.get("t");
  if (!trackId) return { trackId: null, startAtSec: undefined };
  if (tRaw == null || tRaw === "") return { trackId, startAtSec: undefined };
  const t = parseInt(tRaw, 10);
  return {
    trackId,
    startAtSec: Number.isFinite(t) && t >= 0 ? t : undefined,
  };
}

export function clearTrackShareParams() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("track")) return;
  url.searchParams.delete("track");
  url.searchParams.delete("t");
  const qs = url.searchParams.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `${url.pathname}?${qs}${url.hash}` : `${url.pathname}${url.hash}`,
  );
}

export type ShareTrackResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareTrack(opts: {
  track: Track;
  positionSec?: number;
}): Promise<ShareTrackResult> {
  const url = buildTrackShareUrl(opts.track.id, opts.positionSec);
  const title = opts.track.title;
  const text = `Сказка «${title}» — Дмитрий Гайдук`;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    const ok = window.prompt("Ссылка на сказку:", url);
    return ok === null ? "cancelled" : "copied";
  }
}
