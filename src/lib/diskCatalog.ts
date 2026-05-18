import { API_ROOT, PUBLIC_KEY } from "../config";
import type { Catalog, Track } from "../types/catalog";

type YandexItem = {
  type?: string;
  name?: string;
  path?: string;
  resource_id?: string;
  size?: number;
  modified?: string;
  mime_type?: string;
};

type YandexList = {
  name?: string;
  _embedded?: { items?: YandexItem[] };
};

export async function fetchJson(url: string): Promise<YandexList> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<YandexList>;
}

export async function buildDiskCatalog(): Promise<Catalog> {
  const root = await fetchJson(
    `${API_ROOT}?public_key=${encodeURIComponent(PUBLIC_KEY)}&limit=200`,
  );
  const folders = (root._embedded?.items ?? []).filter(
    (item): item is YandexItem => item.type === "dir",
  );
  const tracks: Track[] = [];
  for (const folder of folders) {
    try {
      const folderData = await fetchJson(
        `${API_ROOT}?public_key=${encodeURIComponent(PUBLIC_KEY)}&path=${encodeURIComponent(String(folder.path))}&limit=500`,
      );
      const items = folderData._embedded?.items ?? [];
      for (const item of items) {
        const lower = String(item.name || "").toLowerCase();
        const isAudio =
          item.type === "file" &&
          [".mp3", ".m4a", ".ogg", ".wav"].some((ext) => lower.endsWith(ext));
        if (!isAudio) continue;
        tracks.push({
          id: String(item.resource_id || item.path),
          title: String(item.name).replace(/\.[^.]+$/, ""),
          fileName: String(item.name),
          folder: String(folder.name),
          folderPath: String(folder.path),
          path: String(item.path),
          size: item.size,
          modified: item.modified,
          mimeType: item.mime_type,
        });
      }
    } catch {
      /* папка недоступна */
    }
  }
  return {
    sourceTitle: root.name || "СКАЗКИ АУДИО",
    folders: folders.map((f) => String(f.name)),
    tracks,
    loaded: true,
  };
}
