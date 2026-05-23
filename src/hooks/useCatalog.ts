import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ymGoal } from "../lib/metrika";
import {
  isCatalogRefreshDue,
  loadCachedCatalog,
  markCatalogRefreshed,
  saveCachedCatalog,
} from "../lib/catalogCache";
import { fallbackCatalog } from "../data/fallbackCatalog";
import { catalogWithServerMediaUrls } from "../lib/serverMediaCatalog";
import { useServerMedia } from "../lib/mediaUrl";
import { runCatalogWorker } from "../lib/catalogWorker";
import { listenStatus, matchesFeedListenFilter } from "../lib/listenStatus";
import { pickAdjacentId, shuffleIds, shuffleIdsLeading } from "../lib/queue";
import type { Catalog, Track } from "../types/catalog";
import type { FeedListenFilter, LibraryView, UserState } from "../types/user";

type Filters = {
  view: LibraryView;
  selectedFolder: string | null;
  selectedPlaylist: string | null;
  feedListenFilter: FeedListenFilter;
  /** Ref на текущий трек — при включении shuffle ставится первым в очереди */
  leadTrackIdRef?: RefObject<string | null>;
};

function resolveLeadId(
  filteredIds: string[],
  leadRef: RefObject<string | null> | undefined,
  lastTrackId: string | null,
): string | null {
  const fromRef = leadRef?.current;
  if (fromRef && filteredIds.includes(fromRef)) return fromRef;
  if (lastTrackId && filteredIds.includes(lastTrackId)) return lastTrackId;
  return null;
}

export function useCatalog(user: UserState, filters: Filters) {
  const [catalog, setCatalog] = useState<Catalog>(() => {
    const cached = loadCachedCatalog();
    return cached?.tracks.length ? catalogWithServerMediaUrls(cached) : fallbackCatalog;
  });
  const [initialLoading, setInitialLoading] = useState(() => !loadCachedCatalog()?.tracks.length);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const catalogReportedRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  const applyCatalog = useCallback((cat: Catalog) => {
    const prepared = catalogWithServerMediaUrls(cat);
    setCatalog(prepared);
    saveCachedCatalog(prepared);
    markCatalogRefreshed();
    if (!catalogReportedRef.current) {
      catalogReportedRef.current = true;
      ymGoal("catalog_loaded", { track_count: prepared.tracks.length });
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    const cat = await runCatalogWorker();
    return cat?.tracks.length ? cat : null;
  }, []);

  const refreshCatalog = useCallback(
    async (opts?: { background?: boolean }) => {
      if (refreshInFlightRef.current) return null;
      refreshInFlightRef.current = true;
      if (!opts?.background) setLoadingCatalog(true);
      try {
        const cat = await fetchCatalog();
        if (cat) applyCatalog(cat);
        return cat;
      } finally {
        refreshInFlightRef.current = false;
        if (!opts?.background) setLoadingCatalog(false);
      }
    },
    [applyCatalog, fetchCatalog],
  );

  useEffect(() => {
    const hasCache = Boolean(loadCachedCatalog()?.tracks.length);
    void (async () => {
      try {
        if (!isCatalogRefreshDue()) return;
        await refreshCatalog({ background: hasCache });
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [refreshCatalog]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!isCatalogRefreshDue()) return;
      void refreshCatalog({ background: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshCatalog]);

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

  const filteredTracks = useMemo(() => {
    let list: Track[] = [...catalog.tracks];
    if (filters.selectedFolder) {
      list = list.filter((t) => t.folder === filters.selectedFolder);
    }
    if (filters.view === "liked") {
      list = list.filter((t) => user.likes[t.id]);
    }
    if (filters.view === "resume") {
      list = list.filter(
        (t) => listenStatus(progressOf(t.id)) === "in-progress",
      );
    }
    if (filters.view === "playlist" && filters.selectedPlaylist) {
      const pl = user.playlists.find((p) => p.id === filters.selectedPlaylist);
      const ids = new Set(pl?.trackIds ?? []);
      list = list.filter((t) => ids.has(t.id));
    }
    if (
      filters.feedListenFilter !== "all" &&
      filters.view !== "resume"
    ) {
      list = list.filter((t) =>
        matchesFeedListenFilter(progressOf(t.id), filters.feedListenFilter),
      );
    }
    return list;
  }, [
    catalog.tracks,
    filters.feedListenFilter,
    filters.selectedFolder,
    filters.selectedPlaylist,
    filters.view,
    progressOf,
    user.likes,
    user.playlists,
  ]);

  const sortTracks = useCallback(
    (list: Track[]) =>
      [...list].sort(
        (a, b) =>
          a.folder.localeCompare(b.folder, "ru") ||
          a.title.localeCompare(b.title, "ru"),
      ),
    [],
  );

  const filteredIds = useMemo(
    () => filteredTracks.map((t) => t.id),
    [filteredTracks],
  );

  const filteredIdKey = filteredIds.join("\u0001");

  const shuffleOnRef = useRef(user.shuffle);
  useEffect(() => {
    const wasShuffle = shuffleOnRef.current;
    shuffleOnRef.current = user.shuffle;

    if (!user.shuffle) {
      setQueue(sortTracks(filteredTracks).map((t) => t.id));
      return;
    }

    if (!wasShuffle && user.shuffle) {
      const lead = resolveLeadId(
        filteredIds,
        filters.leadTrackIdRef,
        user.lastTrackId,
      );
      setQueue(shuffleIdsLeading(lead, filteredIds));
      return;
    }

    setQueue((prev) => {
      const allowed = new Set(filteredIds);
      const kept = prev.filter((id) => allowed.has(id));
      const added = filteredIds.filter((id) => !kept.includes(id));
      if (!prev.length || kept.length !== prev.length) {
        const lead = resolveLeadId(
          filteredIds,
          filters.leadTrackIdRef,
          user.lastTrackId,
        );
        return shuffleIdsLeading(lead, filteredIds);
      }
      if (!added.length) return kept;
      return [...kept, ...shuffleIds(added)];
    });
  }, [filteredIdKey, filteredIds, filters.leadTrackIdRef, sortTracks, user.shuffle]);

  const trackById = useMemo(
    () => new Map(filteredTracks.map((t) => [t.id, t])),
    [filteredTracks],
  );

  const tracks = useMemo(() => {
    if (!user.shuffle) return sortTracks(filteredTracks);
    return queue
      .map((id) => trackById.get(id))
      .filter((t): t is Track => t != null);
  }, [filteredTracks, queue, sortTracks, trackById, user.shuffle]);

  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);

  const resumeCount = useMemo(
    () =>
      catalog.tracks.filter(
        (t) => listenStatus(progressOf(t.id)) === "in-progress",
      ).length,
    [catalog.tracks, progressOf],
  );

  const resumeTrack = useMemo(() => {
    const resume = user.playlists.find((p) => p.id === "resume");
    for (const id of resume?.trackIds ?? []) {
      const track = trackMap.get(id);
      if (!track) continue;
      if (listenStatus(progressOf(id)) === "in-progress") return track;
    }
    return (
      catalog.tracks.find(
        (t) => listenStatus(progressOf(t.id)) === "in-progress",
      ) ?? null
    );
  }, [catalog.tracks, progressOf, trackMap, user.playlists]);

  const sectionTitle = filters.selectedFolder
    ? filters.selectedFolder
    : filters.view === "resume"
      ? "Продолжить прослушивание"
      : filters.view === "liked"
          ? "Лайки"
          : filters.view === "playlist"
            ? `Плейлист: ${user.playlists.find((p) => p.id === filters.selectedPlaylist)?.name ?? ""}`
            : "Каталог";

  const sectionSub = filters.selectedFolder
    ? "Все треки выбранной серии."
    : useServerMedia()
      ? "Каталог и аудио с сервера."
      : catalog.loaded
        ? "Живой индекс публичной папки Яндекс.Диска."
        : "Идет fallback-режим до полной индексации каталога.";

  const nextTrackId = useCallback(
    (currentTrackId: string | null) => {
      if (!user.shuffle || !queue.length) return null;
      return pickAdjacentId(queue, currentTrackId, 1, user.repeatMode);
    },
    [queue, user.repeatMode, user.shuffle],
  );

  return {
    catalog,
    setCatalog,
    catalogLoading: initialLoading || loadingCatalog,
    patchTrackUrl,
    trackMap,
    tracks,
    trackIds,
    queue,
    nextTrackId,
    resumeCount,
    resumeTrack,
    sectionTitle,
    sectionSub,
  };
}
