import type { AppSkin, Appearance, ThemeMeta } from "./types";

export type { AppSkin, Appearance, ThemeMeta } from "./types";
export { jaipurTheme } from "./jaipur";
export { rastamanTheme } from "./rastaman";

export const SKIN_STORAGE_KEY = "gayduk-skin-v1";
export const APPEARANCE_STORAGE_KEY = "gayduk-appearance-v1";

export const THEME_OPTIONS: ThemeMeta[] = [
  {
    id: "rastaman",
    label: "Раста",
    shortLabel: "Раста",
    description: "Джунгли, закат, кальян",
  },
  {
    id: "jaipur",
    label: "Джайпур",
    shortLabel: "Джайпур",
    description: "Розовый город, jali, арки",
  },
];

export function readStoredSkin(): AppSkin {
  try {
    const v = localStorage.getItem(SKIN_STORAGE_KEY);
    if (v === "jaipur" || v === "rastaman") return v;
  } catch {
    /* private mode */
  }
  return "rastaman";
}

export function readStoredAppearance(): Appearance {
  try {
    const v = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* private mode */
  }
  return "dark";
}

const THEME_COLOR: Record<AppSkin, string> = {
  rastaman: "#0c1115",
  jaipur: "#c5796d",
};

const THEME_COLOR_LIGHT: Record<AppSkin, string> = {
  rastaman: "#f3e0bc",
  jaipur: "#f9f4ed",
};

export function applyDocumentTheme(skin: AppSkin, appearance: Appearance) {
  const root = document.documentElement;
  root.setAttribute("data-skin", skin);
  if (skin === "jaipur") {
    root.setAttribute("data-theme", "jaipur");
  } else {
    root.setAttribute("data-theme", appearance);
  }

  const color =
    skin === "jaipur"
      ? THEME_COLOR.jaipur
      : appearance === "dark"
        ? THEME_COLOR.rastaman
        : THEME_COLOR_LIGHT.rastaman;

  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.setAttribute("content", color));
}
