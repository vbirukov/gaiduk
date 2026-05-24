const KEY = "gayduk-offline-manifest-v1";

export type OfflineTrackEntry = {
  folder: string;
  updatedAt: string;
};

export type OfflineManifest = {
  tracks: Record<string, OfflineTrackEntry>;
};

function empty(): OfflineManifest {
  return { tracks: {} };
}

function migrate(parsed: unknown): OfflineManifest {
  if (!parsed || typeof parsed !== "object") return empty();
  const o = parsed as Record<string, unknown>;
  if (o.tracks && typeof o.tracks === "object" && !Array.isArray(o.tracks)) {
    return { tracks: o.tracks as OfflineManifest["tracks"] };
  }
  const legacy = o.folders as
    | Record<string, { trackIds?: string[]; updatedAt?: string }>
    | undefined;
  if (!legacy || typeof legacy !== "object") return empty();
  const tracks: OfflineManifest["tracks"] = {};
  for (const [folder, entry] of Object.entries(legacy)) {
    const at = entry?.updatedAt ?? new Date().toISOString();
    for (const id of entry?.trackIds ?? []) {
      tracks[id] = { folder, updatedAt: at };
    }
  }
  return { tracks };
}

function read(): OfflineManifest {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return migrate(JSON.parse(raw));
  } catch {
    return empty();
  }
}

function write(m: OfflineManifest) {
  localStorage.setItem(KEY, JSON.stringify(m));
}

export function getOfflineManifest(): OfflineManifest {
  return read();
}

export function getOfflineTrackIdSet(): Set<string> {
  return new Set(Object.keys(read().tracks));
}

export function getOfflineTrackEntry(trackId: string): OfflineTrackEntry | null {
  return read().tracks[trackId] ?? null;
}

export function registerOfflineTrack(trackId: string, folder: string) {
  const m = read();
  m.tracks[trackId] = { folder, updatedAt: new Date().toISOString() };
  write(m);
}

export function unregisterOfflineTrack(trackId: string) {
  const m = read();
  delete m.tracks[trackId];
  write(m);
}

export function getOfflineTrackIdsInFolder(folder: string): string[] {
  return Object.entries(read().tracks)
    .filter(([, e]) => e.folder === folder)
    .map(([id]) => id);
}

/** @deprecated — для совместимости */
export function getOfflineFolderEntry(folder: string) {
  const ids = getOfflineTrackIdsInFolder(folder);
  if (!ids.length) return null;
  const updatedAt = ids
    .map((id) => read().tracks[id]?.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  return { trackIds: ids, updatedAt: updatedAt ?? new Date().toISOString() };
}

export function setOfflineFolder(folder: string, trackIds: string[]) {
  const m = read();
  const at = new Date().toISOString();
  for (const id of Object.keys(m.tracks)) {
    if (m.tracks[id]?.folder === folder && !trackIds.includes(id)) {
      delete m.tracks[id];
    }
  }
  for (const id of trackIds) {
    m.tracks[id] = { folder, updatedAt: at };
  }
  write(m);
}

export function removeOfflineFolder(folder: string) {
  const m = read();
  for (const id of Object.keys(m.tracks)) {
    if (m.tracks[id]?.folder === folder) delete m.tracks[id];
  }
  write(m);
}

export function isFolderMarkedOffline(
  folder: string,
  expectedTrackIds: string[],
): boolean {
  if (!expectedTrackIds.length) return false;
  const have = getOfflineTrackIdSet();
  return expectedTrackIds.every((id) => have.has(id));
}

export function offlineFolderProgress(
  folder: string,
  expectedTrackIds: string[],
): { downloaded: number; total: number } {
  const have = new Set(getOfflineTrackIdsInFolder(folder));
  const total = expectedTrackIds.length;
  const downloaded = expectedTrackIds.filter((id) => have.has(id)).length;
  return { downloaded, total };
}
