import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Catalog, Track } from "../types/catalog";
import { isStubTrack } from "../lib/diskDownload";
import {
  downloadFolderOffline,
  downloadSelectionOffline,
  downloadTrackOffline,
  removeFolderOffline,
  removeTrackOffline,
  type OfflineDownloadProgress,
} from "../lib/offlineDownload";
import { getOfflineStorageBytes } from "../lib/offlineDb";
import {
  getOfflineManifest,
  getOfflineTrackIdSet,
  isFolderMarkedOffline,
  offlineFolderProgress,
} from "../lib/offlineManifest";
import { ymGoal } from "../lib/metrika";

export type OfflineFolderJob = OfflineDownloadProgress & {
  status: "downloading";
  scope: "folder" | "selection";
  folders?: string[];
};

export type OfflineTrackJob = {
  status: "downloading";
  scope: "track";
  trackId: string;
  title: string;
  folder: string;
};

export type OfflineJob = OfflineFolderJob | OfflineTrackJob;

export function useOfflineLibrary(catalog: Catalog) {
  const [revision, setRevision] = useState(0);
  const [job, setJob] = useState<OfflineJob | null>(null);
  const [storageBytes, setStorageBytes] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const bump = useCallback(() => setRevision((n) => n + 1), []);

  const refreshStorage = useCallback(() => {
    void getOfflineStorageBytes().then(setStorageBytes).catch(() => {});
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [revision, refreshStorage]);

  const offlineTrackIds = useMemo(
    () => getOfflineTrackIdSet(),
    [revision],
  );

  const offlineFolders = useMemo(() => {
    const folders = new Set<string>();
    for (const entry of Object.values(getOfflineManifest().tracks)) {
      folders.add(entry.folder);
    }
    return [...folders];
  }, [revision]);

  const folderTrackIds = useCallback(
    (folder: string) =>
      catalog.tracks
        .filter((t) => t.folder === folder && !isStubTrack(t))
        .map((t) => t.id),
    [catalog.tracks],
  );

  const isFolderOffline = useCallback(
    (folder: string) => {
      const ids = folderTrackIds(folder);
      return ids.length > 0 && isFolderMarkedOffline(folder, ids);
    },
    [folderTrackIds, revision],
  );

  const folderProgress = useCallback(
    (folder: string) => {
      const ids = folderTrackIds(folder);
      return offlineFolderProgress(folder, ids);
    },
    [folderTrackIds, revision],
  );

  const isTrackOffline = useCallback(
    (trackId: string) => offlineTrackIds.has(trackId),
    [offlineTrackIds],
  );

  const isTrackDownloading = useCallback(
    (trackId: string) =>
      job?.scope === "track" && job.trackId === trackId,
    [job],
  );

  const isFolderDownloading = useCallback(
    (folder: string) =>
      (job?.scope === "folder" && job.folder === folder) ||
      (job?.scope === "selection" && job.folders?.includes(folder)) === true,
    [job],
  );

  const isSelectionDownloading = job?.scope === "selection";

  const downloadSelection = useCallback(
    async (folders: string[]) => {
      if (!folders.length) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const tracks = catalog.tracks.filter((t) => folders.includes(t.folder));
      setJob({
        folder: folders.length === 1 ? folders[0]! : `Выборка (${folders.length})`,
        done: 0,
        total: tracks.length,
        status: "downloading",
        scope: "selection",
        folders,
      });
      try {
        await downloadSelectionOffline({
          folders,
          tracks: catalog.tracks,
          signal: ctrl.signal,
          onProgress: (p) =>
            setJob({
              ...p,
              status: "downloading",
              scope: "selection",
              folders,
            }),
        });
        ymGoal("offline_selection_saved", { folders: folders.length });
        bump();
        refreshStorage();
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        throw e;
      } finally {
        setJob(null);
        abortRef.current = null;
      }
    },
    [catalog.tracks, bump, refreshStorage],
  );

  const downloadFolder = useCallback(
    async (folder: string) => {
      if (job?.scope === "folder" && job.folder === folder) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const tracks = catalog.tracks.filter((t) => t.folder === folder);
      setJob({
        folder,
        done: 0,
        total: tracks.length,
        status: "downloading",
        scope: "folder",
      });
      try {
        await downloadFolderOffline({
          folder,
          tracks,
          signal: ctrl.signal,
          onProgress: (p) =>
            setJob({ ...p, status: "downloading", scope: "folder" }),
        });
        ymGoal("offline_folder_saved", {
          folder,
          tracks: tracks.length,
        });
        bump();
        refreshStorage();
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        throw e;
      } finally {
        setJob(null);
        abortRef.current = null;
      }
    },
    [catalog.tracks, job, bump, refreshStorage],
  );

  const downloadTrack = useCallback(
    async (track: Track) => {
      if (isStubTrack(track) || isTrackOffline(track.id)) return;
      if (job?.scope === "track" && job.trackId === track.id) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setJob({
        status: "downloading",
        scope: "track",
        trackId: track.id,
        title: track.title,
        folder: track.folder,
      });
      try {
        await downloadTrackOffline(track, ctrl.signal);
        ymGoal("offline_track_saved", { track_id: track.id });
        bump();
        refreshStorage();
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        throw e;
      } finally {
        setJob(null);
        abortRef.current = null;
      }
    },
    [isTrackOffline, job, bump, refreshStorage],
  );

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setJob(null);
  }, []);

  const removeFolder = useCallback(
    async (folder: string) => {
      cancelDownload();
      await removeFolderOffline(folder);
      ymGoal("offline_folder_removed", { folder });
      bump();
      refreshStorage();
    },
    [cancelDownload, bump, refreshStorage],
  );

  const removeTrack = useCallback(
    async (trackId: string) => {
      if (job?.scope === "track" && job.trackId === trackId) cancelDownload();
      await removeTrackOffline(trackId);
      ymGoal("offline_track_removed", { track_id: trackId });
      bump();
      refreshStorage();
    },
    [cancelDownload, job, bump, refreshStorage],
  );

  return {
    offlineTrackIds,
    offlineFolders,
    storageBytes,
    job,
    isFolderOffline,
    isTrackOffline,
    isTrackDownloading,
    isFolderDownloading,
    folderProgress,
    downloadFolder,
    downloadSelection,
    isSelectionDownloading,
    downloadTrack,
    cancelDownload,
    removeFolder,
    removeTrack,
  };
}
