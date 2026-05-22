export const ASSETS = {
  icon192: "/icons/icon-192.webp",
  iconSvg: "/icon.svg",
  brandLogo: "/brand/logo.webp",
  hero: "/images/hero.webp",
  splash: "/images/splash.webp",
  rastaBikeVideo: "/haiduk-rasta-bike.mp4",
  rastaDarkBgVideo: "/rasta-dark-bg.mp4",
} as const;

export function assetUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).href;
}
