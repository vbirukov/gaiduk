export const ASSETS = {
  icon192: "/icons/icon-192.webp",
  iconSvg: "/icon.svg",
  brandLogo: "/brand/logo.webp",
  hero: "/images/hero.webp",
  heroAuthorBg: "/images/hero.png",
  heroAuthorBgLight: "/images/hero-palm-moon.png",
  continueListening: "/images/continue-listening.png",
  continueListeningDark: "/images/continue-listening-dark.png",
  coverDefault: "/images/cover-default.png",
  coverDefaultDark: "/images/cover-default-dark.png",
  playerAmbient: "/images/player-ambient.png",
  playerAmbientDark: "/images/player-ambient-dark.png",
  libraryBgSoft: "/images/library-background-soft.png",
  libraryBgSoftDark: "/images/library-background-soft-dark.png",
  glassNoise: "/images/modal-glass-noise.png",
  glassNoiseDark: "/images/modal-glass-noise-dark.png",
  splash: "/images/splash.webp",
  rastaBikeVideo: "/haiduk-rasta-bike.mp4",
  rastaDarkBgVideo: "/rasta-dark-bg.mp4",
  rastaDarkBgVideoAlt: "/rasta-dark-alternate-bg.mp4",
  rastaDarkBgVideos: [
    "/rasta-dark-bg.mp4",
    "/rasta-dark-alternate-bg.mp4",
  ] as const,
  jaipurBgVideo: "/jaipur-bg.mp4",
} as const;

export function assetUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}
