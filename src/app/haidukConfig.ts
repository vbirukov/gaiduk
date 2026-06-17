import {
  DEFAULT_THEME_OPTIONS,
  type PlayerConfig,
} from "@vbonline/player";
import { fallbackCatalog } from "../data/fallbackCatalog";

export const haidukPlayerConfig: PlayerConfig = {
  appName: "gayduk",
  storage: {
    user: "gayduk-react-player-v1",
    catalogCache: "gayduk-catalog-cache-v1",
    catalogRefresh: "gayduk-catalog-refresh-v1",
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
  },
  getFallbackCatalog: () => fallbackCatalog,
  themeOptions: DEFAULT_THEME_OPTIONS,
};
