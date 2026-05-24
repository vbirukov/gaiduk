import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Catalog } from "../types/catalog";
import { isStubTrack } from "../lib/diskDownload";
import {
  downloadFolderOffline,
  removeFolderOffline,
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

export type OfflineJob = OfflineDownloadProgress & {
  status: "downloading";
};

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

  const offlineFolders = useMemo(
    () => Object.keys(getOfflineManifest().folders),
    [revision],
  );

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

  const downloadFolder = useCallback(
    async (folder: string) => {
      if (job?.folder === folder) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const tracks = catalog.tracks.filter((t) => t.folder === folder);
      setJob({ folder, done: 0, total: tracks.length, status: "downloading" });
      try {
        await downloadFolderOffline({
          folder,
          tracks,
          signal: ctrl.signal,
          onProgress: (p) => setJob({ ...p, status: "downloading" }),
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
    [catalog.tracks, job?.folder, bump, refreshStorage],
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

  const isTrackOffline = useCallback(
    (trackId: string) => offlineTrackIds.has(trackId),
    [offlineTrackIds],
  );

  return {
    offlineTrackIds,
    offlineFolders,
    storageBytes,
    job,
    isFolderOffline,
    isTrackOffline,
    folderProgress,
    downloadFolder,
    cancelDownload,
    removeFolder,
  };
}
