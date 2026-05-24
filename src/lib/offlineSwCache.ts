export const OFFLINE_AUDIO_CACHE = "gayduk-audio-v1";

export async function cacheAudioFetchUrl(
  url: string,
  response: Response,
): Promise<void> {
  if (!("caches" in window) || !response.ok) return;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    await cache.put(url, response.clone());
  } catch {
    /* quota / private mode */
  }
}

export async function deleteCachedAudioUrls(urls: string[]): Promise<void> {
  if (!("caches" in window) || !urls.length) return;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE);
    await Promise.all(urls.map((u) => cache.delete(u)));
  } catch {
    /* */
  }
}
