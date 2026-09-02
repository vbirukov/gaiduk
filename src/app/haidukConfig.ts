import {
  DEFAULT_THEME_OPTIONS,
  type PlayerConfig,
} from "@vbirukov/player";
import { fallbackCatalog } from "../data/fallbackCatalog";

export const haidukPlayerConfig: PlayerConfig = {
  branding: {
    appTitle: "Haiduk",
    siteName: "Haiduk — аудиосказки Дмитрия Гайдука",
    siteDescription: "Аудиосказки и сказочные записи Дмитрия Гайдука.",
  },
  storage: {
    user: "gayduk-react-player-v1",
    catalogCache: "gayduk-catalog-cache-v2",
    catalogRefresh: "gayduk-catalog-refresh-v2",
    skin: "gayduk-skin-v1",
    appearance: "gayduk-appearance-v1",
    heroCollapsed: "gayduk-hero-collapsed-v1",
    splashSeen: "gayduk-splash-seen-v1",
  },
  catalog: {
    publicDiskKey: "https://disk.yandex.ru/d/fqkAWd063U6ViZ",
    apiRoot: "https://cloud-api.yandex.net/v1/disk/public/resources",
  },
  features: {
    offline: true,
    pwa: true,
    share: true,
    video: true,
    text: true,
  },
  getFallbackCatalog: () => fallbackCatalog,
  themeOptions: DEFAULT_THEME_OPTIONS,
};
