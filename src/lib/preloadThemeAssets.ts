import type { AppSkin } from "../themes/types";
import { ASSETS } from "./assets";
import {
  CONTINUE_BG_DARK,
  CONTINUE_BG_LIGHT,
  DEFAULT_COVER_DARK,
  DEFAULT_COVER_LIGHT,
  GLASS_NOISE_DARK,
  GLASS_NOISE_LIGHT,
  HERO_AUTHOR_BG_DARK,
  HERO_AUTHOR_BG_LIGHT,
  LIBRARY_BG_DARK,
  LIBRARY_BG_LIGHT,
} from "./cover";

function preloadImage(url: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

/** Критичные статичные ассеты текущей темы — до видеофона. */
export function preloadThemeImages(skin: AppSkin): void {
  if (typeof window === "undefined") return;

  const dark = skin === "rastaman" || skin === "moon-dub";
  const urls = [
    dark ? DEFAULT_COVER_DARK : DEFAULT_COVER_LIGHT,
    dark ? LIBRARY_BG_DARK : LIBRARY_BG_LIGHT,
    dark ? HERO_AUTHOR_BG_DARK : HERO_AUTHOR_BG_LIGHT,
    dark ? CONTINUE_BG_DARK : CONTINUE_BG_LIGHT,
    dark ? GLASS_NOISE_DARK : GLASS_NOISE_LIGHT,
    ASSETS.brandLogo,
  ];

  for (const url of urls) preloadImage(url);
}
