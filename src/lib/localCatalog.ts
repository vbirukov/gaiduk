import { mediaBase, mediaUrlForPath } from "./mediaUrl";
import type { Catalog, Track } from "../types/catalog";

type CatalogFile = Omit<Catalog, "loaded"> & { tracks: Track[] };

export async function loadLocalCatalog(): Promise<Catalog> {
  const base = mediaBase();
  const res = await fetch(`${base}/catalog.json`, { cache: "no-store" });
  if (!res.ok) throw new Error(`catalog.json ${res.status}`);
  const data = (await res.json()) as CatalogFile;
  return {
    sourceTitle: data.sourceTitle,
    folders: data.folders,
    tracks: data.tracks.map((t) => ({
      ...t,
      url: mediaUrlForPath(t.path),
    })),
    loaded: true,
  };
}
