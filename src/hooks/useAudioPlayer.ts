import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { configureBackgroundAudioElement, useBackgroundPlayback } from "./useBackgroundPlayback";
import { useMediaSession } from "./useMediaSession";
import { usePlayerKeyboard } from "./usePlayerKeyboard";
import { useWakeLock } from "./useWakeLock";
import {
  cancelInflightDownloads,
  peekCachedPlaybackUrl,
  prefetchPlayback,
  streamPlaybackUrl,
} from "../lib/audioCache";
import { fetchDiskDownloadHref, isStubTrack } from "../lib/diskDownload";
import { formatPlaybackError } from "../lib/playbackErrors";
import { pickAdjacentId } from "../lib/queue";
import type { LivePlayback } from "../lib/trackProgress";
import type { Catalog, Track } from "../types/catalog";
import type { UserState } from "../types/user";

const PROGRESS_SAVE_INTERVAL_SEC = 5;
/** Не качаем соседние треки сразу — иначе душим стрим текущего через прокси. */
const PREFETCH_ADJACENT_DELAY_MS = 25_000;

type ToastPush = (
  message: string,
  action?: { label: string; onClick: () => void },
) => void;

type Options = {
  catalog: Catalog;
  patchTrackUrl: (trackId: string, url: string) => void;
  user: UserState;
  setUser: Dispatch<SetStateAction<UserState>>;
  tracks: Track[];
  trackIds: string[];
  queue: string[];
  trackMap: Map<string, Track>;
  pushToast: ToastPush;
};

export function useAudioPlayer({
  catalog,
  patchTrackUrl,
  user,
  setUser,
  tracks,
  trackIds,
  queue,
  trackMap,
  pushToast,
}: Options) {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [livePlayback, setLivePlayback] = useState<LivePlayback | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntentRef = useRef(false);
  const activePlaybackTrackRef = useRef<string | null>(null);
  const lastPlaybackUrlRef = useRef("");
  const lastSavedSecond = useRef(-1);
  const lastLiveSecond = useRef(-1);
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const userProgressRef = useRef(user.progress);
  userProgressRef.current = user.progress;

  const currentTrack = currentTrackId
    ? (trackMap.get(currentTrackId) ?? null)
    : null;

  useWakeLock(isPlaying && user.wakeLock);
  useBackgroundPlayback(audioEl, playbackIntentRef);

  useEffect(() => {
    if (!currentTrackId && user.lastTrackId && trackMap.has(user.lastTrackId)) {
      setCurrentTrackId(user.lastTrackId);
    }
  }, [currentTrackId, trackMap, user.lastTrackId]);

  const playbackSource = useCallback(
    () => (queue.length ? queue : trackIds),
    [queue, trackIds],
  );

  const schedulePrefetchNext = useCallback(
    (fromTrackId: string) => {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = setTimeout(() => {
        const source = playbackSource();
        const idx = source.indexOf(fromTrackId);
        if (idx < 0) return;
        const nextId = source[idx + 1];
        if (!nextId || nextId === activePlaybackTrackRef.current) return;
        const t = trackMap.get(nextId);
        if (!t || isStubTrack(t)) return;
        void (async () => {
          let href = t.url;
          if (!href) {
            try {
              href = await fetchDiskDownloadHref(t.path);
              patchTrackUrl(t.id, href);
            } catch {
              return;
            }
          }
          if (activePlaybackTrackRef.current === fromTrackId) {
            prefetchPlayback(t.id, href);
          }
        })();
      }, PREFETCH_ADJACENT_DELAY_MS);
    },
    [patchTrackUrl, playbackSource, trackMap],
  );

  useEffect(() => {
    const track = currentTrackId ? trackMap.get(currentTrackId) : undefined;
    if (!track || track.url || isStubTrack(track)) return;
    let cancelled = false;
    void (async () => {
      try {
        const url = await fetchDiskDownloadHref(track.path);
        if (cancelled || !url) return;
        patchTrackUrl(track.id, url);
      } catch {
        /* href */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTrackId, patchTrackUrl, trackMap]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const syncPlaying = () => setIsPlaying(!audio.paused && !audio.ended);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    syncPlaying();
    audio.addEventListener("play", syncPlaying);
    audio.addEventListener("pause", syncPlaying);
    audio.addEventListener("ended", syncPlaying);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("canplay", onPlaying);
    return () => {
      audio.removeEventListener("play", syncPlaying);
      audio.removeEventListener("pause", syncPlaying);
      audio.removeEventListener("ended", syncPlaying);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("canplay", onPlaying);
    };
  }, [currentTrackId, currentTrack?.url]);

  const assignPlaybackSource = useCallback(
    (audio: HTMLAudioElement, trackId: string, diskHref: string) => {
      activePlaybackTrackRef.current = trackId;
      const url = peekCachedPlaybackUrl(trackId) ?? streamPlaybackUrl(diskHref);
      audio.preload = "auto";
      if (lastPlaybackUrlRef.current !== url) {
        lastPlaybackUrlRef.current = url;
        audio.src = url;
      }
    },
    [],
  );

  const playTrack = useCallback(
    async (track: Track) => {
      setCurrentTrackId(track.id);
      setUser((prev) => ({ ...prev, lastTrackId: track.id }));
      const audio = audioRef.current;
      if (!audio || isStubTrack(track)) return;
      clearTimeout(prefetchTimerRef.current);
      cancelInflightDownloads();
      setIsLoadingTrack(true);
      let url = track.url;
      try {
        if (!url) {
          url = await fetchDiskDownloadHref(track.path);
          if (!url) throw new Error("empty href");
          patchTrackUrl(track.id, url);
        }
        assignPlaybackSource(audio, track.id, url);
        playbackIntentRef.current = true;
        await audio.play();
        schedulePrefetchNext(track.id);
      } catch (err) {
        playbackIntentRef.current = false;
        pushToast(formatPlaybackError(err), {
          label: "Повторить",
          onClick: () => void playTrack(track),
        });
      } finally {
        setIsLoadingTrack(false);
      }
    },
    [assignPlaybackSource, patchTrackUrl, schedulePrefetchNext, pushToast, setUser],
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrackId || !trackMap.get(currentTrackId)) {
      const first = tracks[0] ?? catalog.tracks[0];
      if (first) await playTrack(first);
      return;
    }
    if (audio.paused) {
      playbackIntentRef.current = true;
      try {
        await audio.play();
      } catch (err) {
        playbackIntentRef.current = false;
        pushToast(formatPlaybackError(err));
      }
    } else {
      playbackIntentRef.current = false;
      audio.pause();
    }
  }, [catalog.tracks, currentTrackId, playTrack, pushToast, trackMap, tracks]);

  const nextTrack = useCallback(
    (step: number) => {
      const source = playbackSource();
      const nextId = pickAdjacentId(
        source,
        currentTrackId,
        step,
        user.repeatMode,
      );
      const next = nextId ? trackMap.get(nextId) : null;
      if (next) void playTrack(next);
    },
    [currentTrackId, playTrack, playbackSource, trackMap, user.repeatMode],
  );

  const onTrackEnded = useCallback(() => {
    if (user.repeatMode === "one" && currentTrackId) {
      const audio = audioRef.current;
      if (audio) {
        playbackIntentRef.current = true;
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      }
      return;
    }
    const source = playbackSource();
    const nextId = pickAdjacentId(source, currentTrackId, 1, user.repeatMode);
    const next = nextId ? trackMap.get(nextId) : null;
    if (next) void playTrack(next);
  }, [
    currentTrackId,
    playTrack,
    playbackSource,
    trackMap,
    user.repeatMode,
  ]);

  const persistProgress = useCallback(
    (audio: HTMLAudioElement, trackId: string) => {
      const duration = audio.duration || 0;
      const position = audio.currentTime || 0;
      const completed = duration ? position / duration > 0.97 : false;
      const updatedAt = new Date().toISOString();
      setUser((prev) => ({
        ...prev,
        lastTrackId: trackId,
        progress: {
          ...prev.progress,
          [trackId]: { position, duration, completed, updatedAt },
        },
        playlists: prev.playlists.map((pl) => {
          if (pl.id !== "resume") return pl;
          let trackIds = pl.trackIds.filter((id) => id !== trackId);
          if (position > 15 && !completed) {
            trackIds = [trackId, ...trackIds];
          }
          return {
            ...pl,
            trackIds: Array.from(new Set(trackIds)).slice(0, 100),
          };
        }),
      }));
    },
    [setUser],
  );

  const seekBy = useCallback(
    (deltaSec: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.max(
        0,
        Math.min(audio.duration, audio.currentTime + deltaSec),
      );
      if (currentTrackId) persistProgress(audio, currentTrackId);
    },
    [currentTrackId, persistProgress],
  );

  const seek = useCallback(
    (value: number) => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      audio.currentTime = audio.duration * value;
      if (currentTrackId) persistProgress(audio, currentTrackId);
    },
    [currentTrackId, persistProgress],
  );

  const playerActionsRef = useRef({
    togglePlay: async () => {},
    nextTrack: (_step: number) => {},
    onTrackEnded: () => {},
    seekBy: (_delta: number) => {},
    play: async () => {},
    pause: () => {},
  });
  playerActionsRef.current.togglePlay = togglePlay;
  playerActionsRef.current.nextTrack = nextTrack;
  playerActionsRef.current.onTrackEnded = onTrackEnded;
  playerActionsRef.current.seekBy = seekBy;
  playerActionsRef.current.play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    playbackIntentRef.current = true;
    try {
      await audio.play();
    } catch (err) {
      playbackIntentRef.current = false;
      pushToast(formatPlaybackError(err));
    }
  };
  playerActionsRef.current.pause = () => {
    playbackIntentRef.current = false;
    audioRef.current?.pause();
  };

  const mediaSessionRef = useRef({
    onPlay: () => void playerActionsRef.current.play(),
    onPause: () => playerActionsRef.current.pause(),
    onNext: () => playerActionsRef.current.nextTrack(1),
    onPrev: () => playerActionsRef.current.nextTrack(-1),
    onSeekBackward: () => playerActionsRef.current.seekBy(-10),
    onSeekForward: () => playerActionsRef.current.seekBy(10),
  });
  mediaSessionRef.current = {
    onPlay: () => void playerActionsRef.current.play(),
    onPause: () => playerActionsRef.current.pause(),
    onNext: () => playerActionsRef.current.nextTrack(1),
    onPrev: () => playerActionsRef.current.nextTrack(-1),
    onSeekBackward: () => playerActionsRef.current.seekBy(-10),
    onSeekForward: () => playerActionsRef.current.seekBy(10),
  };

  useMediaSession(
    currentTrack
      ? {
          id: currentTrack.id,
          title: currentTrack.title,
          folder: currentTrack.folder,
        }
      : null,
    audioRef,
    mediaSessionRef,
  );

  useEffect(() => {
    if (!currentTrack?.url || isStubTrack(currentTrack)) {
      setLivePlayback(null);
      return;
    }
    lastSavedSecond.current = -1;
    lastLiveSecond.current = -1;
  }, [currentTrack?.id, currentTrack?.url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url || isStubTrack(currentTrack)) return;
    const trackId = currentTrack.id;

    audio.volume = user.volume;
    audio.playbackRate = user.playbackRate;

    const handleLoaded = () => {
      const p = userProgressRef.current[trackId] ?? {
        position: 0,
        duration: 0,
        completed: false,
        updatedAt: null,
      };
      if (p.position > 0 && p.position < (audio.duration || Infinity) - 5) {
        audio.currentTime = p.position;
      }
      setLivePlayback({
        position: audio.currentTime || 0,
        duration: audio.duration || 0,
      });
      schedulePrefetchNext(trackId);
    };

    const handleTime = () => {
      const position = audio.currentTime || 0;
      const duration = audio.duration || 0;
      const sec = Math.floor(position);
      if (sec !== lastLiveSecond.current) {
        lastLiveSecond.current = sec;
        setLivePlayback({ position, duration });
      }
      if (sec === lastSavedSecond.current) return;
      lastSavedSecond.current = sec;
      if (sec % PROGRESS_SAVE_INTERVAL_SEC === 0) {
        persistProgress(audio, trackId);
      }
    };

    const flush = () => persistProgress(audio, trackId);
    const handlePause = () => flush();
    const handleEnded = () => {
      flush();
      playerActionsRef.current.onTrackEnded();
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      flush();
    };
  }, [currentTrack, persistProgress, schedulePrefetchNext, user.playbackRate, user.volume]);

  useEffect(
    () => () => {
      clearTimeout(prefetchTimerRef.current);
      cancelInflightDownloads();
    },
    [],
  );

  const keyboardRef = useRef({
    onTogglePlay: () => void playerActionsRef.current.togglePlay(),
    onSeek: (d: number) => playerActionsRef.current.seekBy(d),
    onNext: () => playerActionsRef.current.nextTrack(1),
    onPrev: () => playerActionsRef.current.nextTrack(-1),
  });
  keyboardRef.current = {
    onTogglePlay: () => void playerActionsRef.current.togglePlay(),
    onSeek: (d) => playerActionsRef.current.seekBy(d),
    onNext: () => playerActionsRef.current.nextTrack(1),
    onPrev: () => playerActionsRef.current.nextTrack(-1),
  };
  usePlayerKeyboard(keyboardRef);

  const bindAudioRef = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
    setAudioEl(el);
    if (el) configureBackgroundAudioElement(el);
  }, []);

  const audioBusy = isLoadingTrack || isBuffering;
  const playButtonLabel = audioBusy
    ? "Загрузка"
    : isPlaying
      ? "Пауза"
      : "Воспроизведение";

  const repeatLabel =
    user.repeatMode === "one"
      ? "Повтор трека"
      : user.repeatMode === "all"
        ? "Повтор списка"
        : "Повтор выключен";

  return {
    audioRef,
    bindAudioRef,
    currentTrackId,
    currentTrack,
    livePlayback,
    isPlaying,
    audioBusy,
    playButtonLabel,
    repeatLabel,
    playTrack,
    togglePlay,
    nextTrack,
    seek,
  };
}
