import type { AppSkin, Appearance, ThemeMeta } from "./types";

export type { AppSkin, Appearance, ThemeMeta } from "./types";
export { jaipurTheme } from "./jaipur";
export { rastamanTheme } from "./rastaman";
export { rastamanLightTheme } from "./rastaman-light";
export { motion, motionMs } from "./motion";

export const SKIN_STORAGE_KEY = "gayduk-skin-v1";
export const APPEARANCE_STORAGE_KEY = "gayduk-appearance-v1";

export const THEME_OPTIONS: ThemeMeta[] = [
  {
    id: "rastaman",
    label: "Раста тёмная",
    shortLabel: "Раста",
    description: "Джунгли, закат, кальян",
  },
  {
    id: "rastaman-light",
    label: "Раста светлая",
    shortLabel: "Светлая",
    description: "Солнечный постер, флаг, комикс",
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
    if (v === "jaipur" || v === "rastaman" || v === "rastaman-light") {
      return v;
    }
  } catch {
    /* private mode */
  }
  try {
    if (localStorage.getItem(APPEARANCE_STORAGE_KEY) === "light") {
      return "rastaman-light";
    }
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
  "rastaman-light": "#fff5bf",
  jaipur: "#c5796d",
};

export function applyDocumentTheme(skin: AppSkin) {
  const root = document.documentElement;
  root.setAttribute("data-skin", skin);
  if (skin === "jaipur") {
    root.setAttribute("data-theme", "jaipur");
  } else if (skin === "rastaman-light") {
    root.setAttribute("data-theme", "rastaman-light");
  } else {
    root.setAttribute("data-theme", "dark");
  }

  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((el) => el.setAttribute("content", THEME_COLOR[skin]));
}
