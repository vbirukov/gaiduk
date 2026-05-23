import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEY } from "../config";
import type { Progress, UserState } from "../types/user";

const defaultUserState = (): UserState => ({
  likes: {},
  playlists: [
    { id: "resume", name: "Продолжить позже", trackIds: [], system: true },
  ],
  progress: {},
  lastTrackId: null,
  volume: 1,
  playbackRate: 1,
  shuffle: false,
  repeatMode: "off",
  wakeLock: true,
  feedLayout: "tiles",
  feedListenFilter: "all",
});

const loadUserState = (): UserState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUserState();
    const parsed = JSON.parse(raw) as Partial<UserState> & {
      favorites?: Record<string, true>;
    };
    const { favorites: _favorites, ...rest } = parsed;
    const merged = { ...defaultUserState(), ...rest };
    return {
      ...merged,
      feedLayout: merged.feedLayout === "rows" ? "rows" : "tiles",
      feedListenFilter:
        merged.feedListenFilter === "unstarted" ||
        merged.feedListenFilter === "in-progress" ||
        merged.feedListenFilter === "completed" ||
        merged.feedListenFilter === "all"
          ? merged.feedListenFilter
          : "all",
    };
  } catch {
    return defaultUserState();
  }
};

export function useUserState() {
  const [user, setUser] = useState<UserState>(loadUserState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {}
  }, [user]);

  const progressOf = useCallback(
    (id: string): Progress =>
      user.progress[id] ?? {
        position: 0,
        duration: 0,
        completed: false,
        updatedAt: null,
      },
    [user.progress],
  );

  const isLiked = useCallback((id: string) => Boolean(user.likes[id]), [user.likes]);

  const toggleLike = useCallback((id: string) => {
    setUser((prev) => {
      const nextLikes = { ...prev.likes };
      if (nextLikes[id]) delete nextLikes[id];
      else nextLikes[id] = true;
      return { ...prev, likes: nextLikes };
    });
  }, []);

  const addPlaylist = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setUser((prev) => ({
      ...prev,
      playlists: [
        ...prev.playlists,
        { id: crypto.randomUUID(), name: trimmed, trackIds: [] },
      ],
    }));
    return true;
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setUser((prev) => ({
      ...prev,
      playlists: prev.playlists.map((pl) =>
        pl.id === playlistId
          ? { ...pl, trackIds: Array.from(new Set([...pl.trackIds, trackId])) }
          : pl,
      ),
    }));
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setUser((prev) => ({
      ...prev,
      playlists: prev.playlists.filter(
        (pl) => pl.system || pl.id !== playlistId,
      ),
    }));
  }, []);

  const cycleRepeat = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      repeatMode:
        prev.repeatMode === "off"
          ? "all"
          : prev.repeatMode === "all"
            ? "one"
            : "off",
    }));
  }, []);

  return {
    user,
    setUser,
    progressOf,
    isLiked,
    toggleLike,
    addPlaylist,
    addTrackToPlaylist,
    deletePlaylist,
    cycleRepeat,
  };
}
