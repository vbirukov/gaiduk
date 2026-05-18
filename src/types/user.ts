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

export type UserState = {
  likes: Record<string, true>;
  favorites: Record<string, true>;
  playlists: Playlist[];
  progress: Record<string, Progress>;
  lastTrackId: string | null;
  volume: number;
  playbackRate: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  wakeLock: boolean;
};

export type LibraryView = "all" | "resume" | "favorites" | "liked" | "playlist";
