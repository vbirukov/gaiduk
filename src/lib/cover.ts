import type { Track } from "../types/catalog";

export const DEFAULT_COVER_PATH = "/covers/default.webp";

/** Пока в /covers/ только default.webp — без 404 на каждую папку. */
export function coverForFolder(_folder: string | null | undefined): string {
  return DEFAULT_COVER_PATH;
}

export function coverForTrack(track: Pick<Track, "folder"> | null | undefined): string {
  if (!track) return DEFAULT_COVER_PATH;
  return coverForFolder(track.folder);
}

export function artworkUrlForTrack(
  track: Pick<Track, "folder"> | null | undefined,
): string {
  const path = coverForTrack(track);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}
