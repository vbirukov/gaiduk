import { playbackSrc } from "./diskDownload";
import { getOfflineTrack } from "./offlineDb";
import { getOfflineTrackIdSet } from "./offlineManifest";

const blobUrlByTrackId = new Map<string, string>();
const inflightByTrackId = new Map<string, Promise<string>>();
const abortByTrackId = new Map<string, AbortController>();
const cacheOrder: string[] = [];
const MAX_CACHED_TRACKS = 6;

function touchCache(trackId: string) {
  const i = cacheOrder.indexOf(trackId);
  if (i >= 0) cacheOrder.splice(i, 1);
  cacheOrder.push(trackId);
  const pinned = getOfflineTrackIdSet();
  while (cacheOrder.length > MAX_CACHED_TRACKS) {
    const evict = cacheOrder.find((id) => !pinned.has(id));
    if (!evict) break;
    const idx = cacheOrder.indexOf(evict);
    if (idx >= 0) cacheOrder.splice(idx, 1);
    abortByTrackId.get(evict)?.abort();
    abortByTrackId.delete(evict);
    inflightByTrackId.delete(evict);
    const url = blobUrlByTrackId.get(evict);
    if (url) URL.revokeObjectURL(url);
    blobUrlByTrackId.delete(evict);
    continue;
  }
}

/** Постоянный офлайн-кэш (IndexedDB) → blob URL. */
export async function resolveOfflinePlaybackUrl(
  trackId: string,
): Promise<string | null> {
  const mem = blobUrlByTrackId.get(trackId);
  if (mem) return mem;
  const row = await getOfflineTrack(trackId);
  if (!row?.blob?.size) return null;
  const objectUrl = URL.createObjectURL(row.blob);
  blobUrlByTrackId.set(trackId, objectUrl);
  touchCache(trackId);
  return objectUrl;
}

export function isOfflinePinnedTrack(trackId: string): boolean {
  return getOfflineTrackIdSet().has(trackId);
}

/** Сбросить фоновые загрузки blob (не трогает уже готовый кэш). */
export function cancelInflightDownloads(exceptTrackId?: string) {
  for (const [id, ctrl] of abortByTrackId) {
    if (exceptTrackId && id === exceptTrackId) continue;
    ctrl.abort();
    abortByTrackId.delete(id);
    inflightByTrackId.delete(id);
  }
}

export function abortPlaybackForTrack(trackId: string) {
  abortByTrackId.get(trackId)?.abort();
  abortByTrackId.delete(trackId);
  inflightByTrackId.delete(trackId);
}

export function peekCachedPlaybackUrl(trackId: string) {
  return blobUrlByTrackId.get(trackId);
}

export function streamPlaybackUrl(diskHref: string) {
  return playbackSrc(diskHref);
}

export function getCachedPlaybackUrl(
  trackId: string,
  diskHref: string,
): Promise<string> {
  const cached = blobUrlByTrackId.get(trackId);
  if (cached) return Promise.resolve(cached);

  const pending = inflightByTrackId.get(trackId);
  if (pending) return pending;

  const ctrl = new AbortController();
  abortByTrackId.set(trackId, ctrl);

  const promise = (async () => {
    const res = await fetch(playbackSrc(diskHref), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`audio ${res.status}`);
    const blob = await res.blob();
    if (!blob.size) throw new Error("empty audio");
    const objectUrl = URL.createObjectURL(blob);
    blobUrlByTrackId.set(trackId, objectUrl);
    touchCache(trackId);
    return objectUrl;
  })();

  inflightByTrackId.set(trackId, promise);
  return promise.finally(() => {
    if (abortByTrackId.get(trackId) === ctrl) abortByTrackId.delete(trackId);
    inflightByTrackId.delete(trackId);
  });
}

/** Фоновый полный кэш — только для следующего трека, не мешает стриму текущего. */
export function prefetchPlayback(trackId: string, diskHref: string) {
  if (blobUrlByTrackId.has(trackId) || inflightByTrackId.has(trackId)) return;
  void getCachedPlaybackUrl(trackId, diskHref).catch(() => {});
}
