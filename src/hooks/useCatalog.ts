import { useCallback, useEffect, useMemo, useState } from "react";
import { fallbackCatalog } from "../data/fallbackCatalog";
import { useLocalMedia } from "../lib/mediaUrl";
import { runCatalogWorker } from "../lib/catalogWorker";
import { shuffleIds } from "../lib/queue";
import type { Catalog, Track } from "../types/catalog";
import type { LibraryView, UserState } from "../types/user";

type Filters = {
  view: LibraryView;
  selectedFolder: string | null;
  selectedPlaylist: string | null;
  query: string;
};

export function useCatalog(user: UserState, filters: Filters) {
  const [catalog, setCatalog] = useState<Catalog>(fallbackCatalog);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);

  const refreshCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      return await runCatalogWorker();
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const cat = await runCatalogWorker();
        if (cat?.tracks.length) setCatalog(cat);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  const patchTrackUrl = useCallback((trackId: string, url: string) => {
    setCatalog((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, url } : t)),
    }));
  }, []);

  const progressOf = useCallback(
    (id: string) =>
      user.progress[id] ?? {
        position: 0,
        duration: 0,
        completed: false,
        updatedAt: null,
      },
    [user.progress],
  );

  const trackMap = useMemo(
    () => new Map(catalog.tracks.map((t) => [t.id, t])),
    [catalog.tracks],
  );

  const tracks = useMemo(() => {
    let list: Track[] = [...catalog.tracks];
    const q = filters.query.toLowerCase().trim();
    if (q) {
      list = list.filter((t) =>
        [t.title, t.folder, t.fileName].some((v) =>
          v.toLowerCase().includes(q),
        ),
      );
    }
    if (filters.selectedFolder) {
      list = list.filter((t) => t.folder === filters.selectedFolder);
    }
    if (filters.view === "liked") {
      list = list.filter((t) => user.likes[t.id]);
    }
    if (filters.view === "favorites") {
      list = list.filter((t) => user.favorites[t.id]);
    }
    if (filters.view === "resume") {
      list = list.filter((t) => {
        const p = progressOf(t.id);
        return p.position > 15 && !p.completed;
      });
    }
    if (filters.view === "playlist" && filters.selectedPlaylist) {
      const pl = user.playlists.find((p) => p.id === filters.selectedPlaylist);
      const ids = new Set(pl?.trackIds ?? []);
      list = list.filter((t) => ids.has(t.id));
    }
    return list.sort(
      (a, b) =>
        a.folder.localeCompare(b.folder, "ru") ||
        a.title.localeCompare(b.title, "ru"),
    );
  }, [
    catalog.tracks,
    filters.query,
    filters.selectedFolder,
    filters.selectedPlaylist,
    filters.view,
    progressOf,
    user.favorites,
    user.likes,
    user.playlists,
  ]);

  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);

  useEffect(() => {
    setQueue(user.shuffle ? shuffleIds(trackIds) : trackIds);
  }, [trackIds, user.shuffle]);

  const resumeCount = useMemo(
    () =>
      catalog.tracks.filter((t) => {
        const p = progressOf(t.id);
        return p.position > 15 && !p.completed;
      }).length,
    [catalog.tracks, progressOf],
  );

  const resumeTrack = useMemo(() => {
    const resume = user.playlists.find((p) => p.id === "resume");
    for (const id of resume?.trackIds ?? []) {
      const track = trackMap.get(id);
      if (!track) continue;
      const p = progressOf(id);
      if (p.position > 15 && !p.completed) return track;
    }
    return (
      catalog.tracks.find((t) => {
        const p = progressOf(t.id);
        return p.position > 15 && !p.completed;
      }) ?? null
    );
  }, [catalog.tracks, progressOf, trackMap, user.playlists]);

  const sectionTitle = filters.selectedFolder
    ? filters.selectedFolder
    : filters.view === "resume"
      ? "Продолжить прослушивание"
      : filters.view === "favorites"
        ? "Избранное"
        : filters.view === "liked"
          ? "Лайки"
          : filters.view === "playlist"
            ? `Плейлист: ${user.playlists.find((p) => p.id === filters.selectedPlaylist)?.name ?? ""}`
            : "Каталог";

  const sectionSub = filters.selectedFolder
    ? "Все треки выбранной серии."
    : useLocalMedia()
      ? "Каталог и аудио с вашего сервера."
      : catalog.loaded
        ? "Живой индекс публичной папки Яндекс.Диска."
        : "Идет fallback-режим до полной индексации каталога.";

  return {
    catalog,
    setCatalog,
    catalogLoading: initialLoading || loadingCatalog,
    loadingCatalog,
    refreshCatalog,
    patchTrackUrl,
    trackMap,
    tracks,
    trackIds,
    queue,
    resumeCount,
    resumeTrack,
    sectionTitle,
    sectionSub,
  };
}
