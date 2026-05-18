import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEY } from "../config";
import type { Progress, UserState } from "../types/user";

const defaultUserState = (): UserState => ({
  likes: {},
  favorites: {},
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
});

const loadUserState = (): UserState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...defaultUserState(), ...JSON.parse(raw) }
      : defaultUserState();
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
  const isFavorite = useCallback(
    (id: string) => Boolean(user.favorites[id]),
    [user.favorites],
  );

  const toggleMap = useCallback((type: "likes" | "favorites", id: string) => {
    setUser((prev) => {
      const nextMap = { ...prev[type] };
      if (nextMap[id]) delete nextMap[id];
      else nextMap[id] = true;
      return { ...prev, [type]: nextMap };
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
    isFavorite,
    toggleMap,
    addPlaylist,
    addTrackToPlaylist,
    cycleRepeat,
  };
}
