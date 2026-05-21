import { CATALOG_CACHE_KEY, CATALOG_REFRESH_KEY } from "../config";
import type { Catalog } from "../types/catalog";

export const CATALOG_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function getLastCatalogRefreshAt(): number | null {
  try {
    const raw = localStorage.getItem(CATALOG_REFRESH_KEY);
    if (!raw) return null;
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

export function isCatalogRefreshDue(
  now = Date.now(),
  intervalMs = CATALOG_REFRESH_INTERVAL_MS,
): boolean {
  const last = getLastCatalogRefreshAt();
  if (last == null) return true;
  return now - last >= intervalMs;
}

export function markCatalogRefreshed(at = new Date()) {
  try {
    localStorage.setItem(CATALOG_REFRESH_KEY, at.toISOString());
  } catch {}
}

export function loadCachedCatalog(): Catalog | null {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Catalog;
    if (!data?.tracks?.length) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCachedCatalog(catalog: Catalog) {
  try {
    const slim: Catalog = {
      ...catalog,
      tracks: catalog.tracks.map(({ url: _url, ...t }) => t),
    };
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(slim));
  } catch {}
}
