import type { Track } from "../types/catalog";

export const DEFAULT_COVER_LIGHT = "/images/cover-default.png";
export const DEFAULT_COVER_DARK = "/images/cover-default-dark.png";
export const PLAYER_AMBIENT_LIGHT = "/images/player-ambient.png";
export const PLAYER_AMBIENT_DARK = "/images/player-ambient-dark.png";
export const LIBRARY_BG_LIGHT = "/images/library-background-soft.png";
export const LIBRARY_BG_DARK = "/images/library-background-soft-dark.png";
export const GLASS_NOISE_LIGHT = "/images/modal-glass-noise.png";
export const GLASS_NOISE_DARK = "/images/modal-glass-noise-dark.png";
export const HERO_AUTHOR_BG_DARK = "/images/hero.png";
export const HERO_AUTHOR_BG_LIGHT = "/images/hero-palm-moon.png";
export const CONTINUE_BG_LIGHT = "/images/continue-listening.png";
export const CONTINUE_BG_DARK = "/images/continue-listening-dark.png";

/** @deprecated используй defaultCoverPath() */
export const DEFAULT_COVER_PATH = DEFAULT_COVER_LIGHT;

const DARK_SKINS = new Set(["rastaman", "moon-dub"]);

export function defaultCoverPath(): string {
  if (typeof document === "undefined") return DEFAULT_COVER_DARK;
  const skin = document.documentElement.getAttribute("data-skin");
  return skin && DARK_SKINS.has(skin) ? DEFAULT_COVER_DARK : DEFAULT_COVER_LIGHT;
}

export function playerAmbientPath(): string {
  if (typeof document === "undefined") return PLAYER_AMBIENT_DARK;
  const skin = document.documentElement.getAttribute("data-skin");
  return skin && DARK_SKINS.has(skin) ? PLAYER_AMBIENT_DARK : PLAYER_AMBIENT_LIGHT;
}

export function librarySidebarBgPath(): string {
  if (typeof document === "undefined") return LIBRARY_BG_DARK;
  const skin = document.documentElement.getAttribute("data-skin");
  return skin && DARK_SKINS.has(skin) ? LIBRARY_BG_DARK : LIBRARY_BG_LIGHT;
}

export function glassNoisePath(): string {
  if (typeof document === "undefined") return GLASS_NOISE_DARK;
  const skin = document.documentElement.getAttribute("data-skin");
  return skin && DARK_SKINS.has(skin) ? GLASS_NOISE_DARK : GLASS_NOISE_LIGHT;
}

export function isDefaultCoverPath(path: string): boolean {
  return path === DEFAULT_COVER_LIGHT || path === DEFAULT_COVER_DARK;
}

/** Пока в /covers/ только default — без 404 на каждую папку. */
export function coverForFolder(_folder: string | null | undefined): string {
  return defaultCoverPath();
}

export function coverForTrack(
  track: Pick<Track, "folder"> | null | undefined,
): string {
  if (!track) return defaultCoverPath();
  return coverForFolder(track.folder);
}

export function artworkUrlForTrack(
  track: Pick<Track, "folder"> | null | undefined,
): string {
  const path = coverForTrack(track);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}
