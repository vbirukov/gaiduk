import type { Track } from "../types/catalog";

export type TrackFolderGroup = {
  folder: string;
  tracks: Track[];
};

export type FeedLayoutRow =
  | { kind: "header"; folder: string; key: string }
  | { kind: "cards"; tracks: Track[]; key: string };

export function groupTracksByFolder(tracks: Track[]): TrackFolderGroup[] {
  const groups: TrackFolderGroup[] = [];
  for (const track of tracks) {
    const last = groups[groups.length - 1];
    if (last?.folder === track.folder) {
      last.tracks.push(track);
    } else {
      groups.push({ folder: track.folder, tracks: [track] });
    }
  }
  return groups;
}

export function buildFeedLayoutRows(
  tracks: Track[],
  cols: number,
  withFolderHeaders: boolean,
): FeedLayoutRow[] {
  if (!withFolderHeaders) {
    const rows: FeedLayoutRow[] = [];
    for (let i = 0; i < tracks.length; i += cols) {
      rows.push({
        kind: "cards",
        tracks: tracks.slice(i, i + cols),
        key: `row-${i}`,
      });
    }
    return rows;
  }

  const rows: FeedLayoutRow[] = [];
  let batch: Track[] = [];
  let lastFolder: string | null = null;

  const flushBatch = () => {
    for (let i = 0; i < batch.length; i += cols) {
      const slice = batch.slice(i, i + cols);
      rows.push({
        kind: "cards",
        tracks: slice,
        key: `cards-${rows.length}-${slice[0]?.id ?? i}`,
      });
    }
    batch = [];
  };

  for (const track of tracks) {
    if (track.folder !== lastFolder) {
      flushBatch();
      rows.push({
        kind: "header",
        folder: track.folder,
        key: `folder-${track.folder}`,
      });
      lastFolder = track.folder;
    }
    batch.push(track);
  }
  flushBatch();
  return rows;
}

export function layoutRowForTrackId(
  rows: FeedLayoutRow[],
  trackId: string,
): number {
  return rows.findIndex(
    (row) => row.kind === "cards" && row.tracks.some((t) => t.id === trackId),
  );
}

export function layoutRowForFolderHeader(
  rows: FeedLayoutRow[],
  folder: string,
): number {
  return rows.findIndex(
    (row) => row.kind === "header" && row.folder === folder,
  );
}
