import type { Track } from "../types/catalog";

const DEFAULT_COVER = "/covers/default.webp";

export function coverForFolder(folder: string | null | undefined): string {
  if (!folder?.trim()) return DEFAULT_COVER;
  return `/covers/${encodeURIComponent(folder.trim())}.webp`;
}

export function coverForTrack(track: Pick<Track, "folder"> | null | undefined): string {
  if (!track) return DEFAULT_COVER;
  return coverForFolder(track.folder);
}

export function artworkUrlForTrack(
  track: Pick<Track, "folder"> | null | undefined,
): string {
  const path = coverForTrack(track);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}
