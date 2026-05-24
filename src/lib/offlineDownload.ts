import type { Track } from "../types/catalog";
import { fetchDiskDownloadHref, isStubTrack, playbackSrc } from "./diskDownload";
import { mediaUrlForPath, useServerMedia } from "./mediaUrl";
import { deleteOfflineTracks, getOfflineTrack, putOfflineTrack } from "./offlineDb";
import {
  getOfflineFolderEntry,
  removeOfflineFolder,
  setOfflineFolder,
} from "./offlineManifest";
import { cacheAudioFetchUrl, deleteCachedAudioUrls } from "./offlineSwCache";

export type OfflineDownloadProgress = {
  folder: string;
  done: number;
  total: number;
  currentTitle?: string;
};

export async function resolveTrackFetchUrl(track: Track): Promise<string> {
  if (isStubTrack(track)) throw new Error("stub");
  if (useServerMedia()) {
    return mediaUrlForPath(track.path);
  }
  let href = track.url;
  if (!href) {
    href = await fetchDiskDownloadHref(track.path);
  }
  if (!href) throw new Error("no url");
  return playbackSrc(href);
}

export async function downloadFolderOffline(opts: {
  folder: string;
  tracks: Track[];
  signal?: AbortSignal;
  onProgress?: (p: OfflineDownloadProgress) => void;
}): Promise<void> {
  const { folder, tracks, signal, onProgress } = opts;
  const list = tracks.filter((t) => t.folder === folder && !isStubTrack(t));
  const total = list.length;
  if (!total) return;

  const savedIds: string[] = [];
  const cachedUrls: string[] = [];

  const report = (done: number, currentTitle?: string) => {
    onProgress?.({ folder, done, total, currentTitle });
  };

  report(0);

  for (let i = 0; i < list.length; i++) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    const track = list[i]!;
    report(i, track.title);

    const fetchUrl = await resolveTrackFetchUrl(track);
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");

    const res = await fetch(fetchUrl, { signal });
    if (!res.ok) throw new Error(`audio ${res.status}: ${track.title}`);

    await cacheAudioFetchUrl(fetchUrl, res);
    cachedUrls.push(fetchUrl);

    const blob = await res.blob();
    if (!blob.size) throw new Error(`empty: ${track.title}`);

    await putOfflineTrack({
      trackId: track.id,
      folder,
      blob,
      playbackUrl: fetchUrl,
      savedAt: new Date().toISOString(),
      bytes: blob.size,
    });

    savedIds.push(track.id);
    setOfflineFolder(folder, savedIds);
    report(i + 1, track.title);
  }

  setOfflineFolder(folder, savedIds);
  report(total);
}

export async function removeFolderOffline(folder: string): Promise<void> {
  const entry = getOfflineFolderEntry(folder);
  const ids = entry?.trackIds ?? [];
  const urls: string[] = [];
  if (entry) {
    for (const id of ids) {
      const row = await getOfflineTrack(id);
      if (row?.playbackUrl) urls.push(row.playbackUrl);
    }
  }
  await deleteOfflineTracks(ids);
  await deleteCachedAudioUrls(urls);
  removeOfflineFolder(folder);
}
