import type { RepeatMode } from "../lib/queue";

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  system?: boolean;
};

export type Progress = {
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: string | null;
};

export type FeedLayout = "tiles" | "rows";

/** Фильтр ленты по прогрессу прослушивания (поверх раздела / папки). */
export type FeedListenFilter = "all" | "unstarted" | "in-progress" | "completed";

export type UserState = {
  likes: Record<string, true>;
  playlists: Playlist[];
  progress: Record<string, Progress>;
  lastTrackId: string | null;
  volume: number;
  playbackRate: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  wakeLock: boolean;
  feedLayout: FeedLayout;
  feedListenFilter: FeedListenFilter;
};

export type LibraryView = "all" | "resume" | "liked" | "playlist";
