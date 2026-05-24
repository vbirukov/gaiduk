const KEY = "gayduk-offline-manifest-v1";

export type OfflineFolderEntry = {
  trackIds: string[];
  updatedAt: string;
};

export type OfflineManifest = {
  folders: Record<string, OfflineFolderEntry>;
};

function read(): OfflineManifest {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { folders: {} };
    const parsed = JSON.parse(raw) as OfflineManifest;
    if (!parsed?.folders || typeof parsed.folders !== "object") {
      return { folders: {} };
    }
    return parsed;
  } catch {
    return { folders: {} };
  }
}

function write(m: OfflineManifest) {
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function getOfflineManifest(): OfflineManifest {
  return read();
}

export function getOfflineTrackIdSet(): Set<string> {
  const ids = new Set<string>();
  for (const entry of Object.values(read().folders)) {
    for (const id of entry.trackIds) ids.add(id);
  }
  return ids;
}

export function getOfflineFolderEntry(
  folder: string,
): OfflineFolderEntry | null {
  return read().folders[folder] ?? null;
}

export function setOfflineFolder(folder: string, trackIds: string[]) {
  const m = read();
  m.folders[folder] = {
    trackIds: [...trackIds],
    updatedAt: new Date().toISOString(),
  };
  write(m);
}

export function removeOfflineFolder(folder: string) {
  const m = read();
  delete m.folders[folder];
  write(m);
}

export function isFolderMarkedOffline(
  folder: string,
  expectedTrackIds: string[],
): boolean {
  const entry = getOfflineFolderEntry(folder);
  if (!entry || entry.trackIds.length !== expectedTrackIds.length) return false;
  const want = new Set(expectedTrackIds);
  return entry.trackIds.every((id) => want.has(id));
}

export function offlineFolderProgress(
  folder: string,
  expectedTrackIds: string[],
): { downloaded: number; total: number } {
  const entry = getOfflineFolderEntry(folder);
  const total = expectedTrackIds.length;
  if (!entry) return { downloaded: 0, total };
  const have = new Set(entry.trackIds);
  const downloaded = expectedTrackIds.filter((id) => have.has(id)).length;
  return { downloaded, total };
}
