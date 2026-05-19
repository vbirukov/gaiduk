import { playbackSrc } from "./diskDownload";

const blobUrlByTrackId = new Map<string, string>();
const inflightByTrackId = new Map<string, Promise<string>>();
const cacheOrder: string[] = [];
const MAX_CACHED_TRACKS = 10;

function touchCache(trackId: string) {
  const i = cacheOrder.indexOf(trackId);
  if (i >= 0) cacheOrder.splice(i, 1);
  cacheOrder.push(trackId);
  while (cacheOrder.length > MAX_CACHED_TRACKS) {
    const evict = cacheOrder.shift();
    if (!evict) break;
    const url = blobUrlByTrackId.get(evict);
    if (url) URL.revokeObjectURL(url);
    blobUrlByTrackId.delete(evict);
  }
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

  const promise = (async () => {
    const res = await fetch(playbackSrc(diskHref));
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
    inflightByTrackId.delete(trackId);
  });
}

export function prefetchPlayback(trackId: string, diskHref: string) {
  void getCachedPlaybackUrl(trackId, diskHref).catch(() => {});
}
