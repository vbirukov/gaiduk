import { useState, type Dispatch, type SetStateAction } from "react";
import type { Progress, UserState } from "../types/user";

const embedUser = (): UserState => ({
  likes: {},
  playlists: [{ id: "resume", name: "Продолжить позже", trackIds: [], system: true }],
  progress: {},
  lastTrackId: null,
  volume: 1,
  playbackRate: 1,
  shuffle: false,
  repeatMode: "off",
  wakeLock: false,
  feedLayout: "rows",
  feedListenFilter: "all",
});

/** Виджет: state в памяти, без записи в localStorage основного приложения. */
export function useEmbedUserState(): [UserState, Dispatch<SetStateAction<UserState>>] {
  return useState(embedUser);
}

export function embedProgressOf(
  user: UserState,
  id: string,
): Progress {
  return (
    user.progress[id] ?? {
      position: 0,
      duration: 0,
      completed: false,
      updatedAt: null,
    }
  );
}
