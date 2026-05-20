import { mediaUrlForPath, useServerMedia } from "./mediaUrl";
import type { Catalog } from "../types/catalog";

export function catalogWithServerMediaUrls(cat: Catalog): Catalog {
  if (!useServerMedia()) return cat;
  return {
    ...cat,
    tracks: cat.tracks.map((t) => ({
      ...t,
      url: mediaUrlForPath(t.path),
    })),
  };
}
