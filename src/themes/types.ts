export type AppSkin =
  | "rastaman"
  | "rastaman-light"
  | "jaipur"
  | "moon-dub";

export type Appearance = "light" | "dark";

export type ThemeMeta = {
  id: AppSkin;
  label: string;
  shortLabel: string;
  description: string;
};
