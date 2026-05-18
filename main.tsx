/// <reference types="vite/client" />
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import CatalogWorkerCtor from "./src/workers/catalog.worker?worker";
import { ToastStack } from "./src/components/ToastStack";
import { useMediaSession } from "./src/hooks/useMediaSession";
import { usePlayerKeyboard } from "./src/hooks/usePlayerKeyboard";
import { useToasts } from "./src/hooks/useToasts";
import { formatPlaybackError } from "./src/lib/playbackErrors";
import { registerAppSW } from "./src/pwa/register";
import "./styles.css";
import { API_ROOT, PUBLIC_KEY, STORAGE_KEY } from "./src/config";
import type { Catalog, Track } from "./src/types/catalog";

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  system?: boolean;
};
type Progress = {
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: string | null;
};
type UserState = {
  likes: Record<string, true>;
  favorites: Record<string, true>;
  playlists: Playlist[];
  progress: Record<string, Progress>;
  lastTrackId: string | null;
  volume: number;
  playbackRate: number;
};
const fallbackCatalog: Catalog = {
  sourceTitle: "СКАЗКИ АУДИО",
  loaded: false,
  folders: [
    "01 RASTAMANSKIE SKAZKI 1995 - 1997",
    "01 RASTAMANSKIE SKAZKI 1997 - 1999",
    "01 RASTAMANSKIE SKAZKI 2000 - 2004",
    "01 RASTAMANSKIE SKAZKI 2004 - 2008",
    "01 RASTAMANSKIE SKAZKI 2010 - 2020",
    "02 JAH BUDDHA I EGO JAHTAKI",
    "03 SKAZKI NARODOV MIRA",
    "04 POVEST' PRO CHUJIE GLAZA",
    "05 INDIYSKIY POKOYNIK",
    "06 DRUGIE SKAZKI",
    "07 STIKHI I PESNI",
  ],
  tracks: [
    {
      id: "stub-1",
      title: "Демо: Растаманская сказка",
      fileName: "demo.mp3",
      folder: "01 RASTAMANSKIE SKAZKI 1995 - 1997",
      folderPath: "/",
      path: "/demo1",
      url: "",
    },
    {
      id: "stub-2",
      title: "Демо: Jah Buddha",
      fileName: "demo2.mp3",
      folder: "02 JAH BUDDHA I EGO JAHTAKI",
      folderPath: "/",
      path: "/demo2",
      url: "",
    },
    {
      id: "stub-3",
      title: "Демо: Сказка народов мира",
      fileName: "demo3.mp3",
      folder: "03 SKAZKI NARODOV MIRA",
      folderPath: "/",
      path: "/demo3",
      url: "",
    },
  ],
};
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
const saveUserState = (state: UserState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const diskDownloadHrefByPath = new Map<string, string>();
const diskDownloadInflight = new Map<string, Promise<string>>();

const isStubTrack = (t: Track) => t.id.startsWith("stub-");

async function fetchDiskDownloadHref(path: string): Promise<string> {
  const cached = diskDownloadHrefByPath.get(path);
  if (cached) return cached;
  const inflight = diskDownloadInflight.get(path);
  if (inflight) return inflight;

  const promise = (async () => {
    const apiUrl = `${API_ROOT}/download?public_key=${encodeURIComponent(PUBLIC_KEY)}&path=${encodeURIComponent(path)}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        await new Promise((r) =>
          setTimeout(r, Math.min(8000, 400 * 2 ** (attempt - 1))),
        );
      }
      try {
        const res = await fetch(apiUrl);
        if (res.status === 429) {
          lastErr = new Error("429");
          continue;
        }
        if (!res.ok) throw new Error(String(res.status));
        const dl = (await res.json()) as { href?: string };
        const href = String(dl.href || "");
        if (!href) throw new Error("empty href");
        diskDownloadHrefByPath.set(path, href);
        return href;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  })();

  diskDownloadInflight.set(path, promise);
  return promise.finally(() => {
    diskDownloadInflight.delete(path);
  });
}

function playbackSrc(diskHref: string): string {
  const raw = import.meta.env.VITE_AUDIO_PROXY_BASE;
  const base = typeof raw === "string" ? raw.trim().replace(/\/$/, "") : "";
  if (!base) return diskHref;
  return `${base}?url=${encodeURIComponent(diskHref)}`;
}

type CatalogWorkerOut =
  | { type: "done"; catalog: Catalog }
  | { type: "error"; message: string };

function runCatalogWorker(): Promise<Catalog | null> {
  return new Promise((resolve) => {
    const w = new CatalogWorkerCtor();
    const finish = (cat: Catalog | null) => {
      w.terminate();
      resolve(cat);
    };
    w.onmessage = (ev: MessageEvent<CatalogWorkerOut>) => {
      const d = ev.data;
      if (d?.type === "done") finish(d.catalog);
      else if (d?.type === "error") finish(null);
    };
    w.onerror = () => finish(null);
    w.postMessage({ type: "build" });
  });
}

const fmtTime = (sec: number) => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600),
    m = Math.floor((sec % 3600) / 60),
    s = Math.floor(sec % 60);
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
};
const fmtBytes = (bytes?: number) => {
  if (!bytes) return "";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  let i = 0,
    val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};
function PlayerTimeline({
  audioRef,
  onSeek,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSeek: (value: number) => void;
}) {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setTime(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
    };
  }, [audioRef]);
  return (
    <div className="timeline">
      <span>{fmtTime(time)}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={duration ? time / duration : 0}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <span>{fmtTime(duration)}</span>
    </div>
  );
}
function App() {
  const [catalog, setCatalog] = useState<Catalog>(fallbackCatalog);
  const [user, setUser] = useState<UserState>(loadUserState);
  const [view, setView] = useState<
    "all" | "resume" | "favorites" | "liked" | "playlist"
  >("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [swNeedRefresh, setSwNeedRefresh] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosHintDismissed, setIosHintDismissed] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlaybackUrlRef = useRef<string>("");
  const lastSavedSecond = useRef<number>(-1);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    const b = import.meta.env.VITE_AUDIO_PROXY_BASE;
    if (import.meta.env.PROD && (typeof b !== "string" || !String(b).trim())) {
      console.warn(
        "[gayduk] Сборка без VITE_AUDIO_PROXY_BASE — прямое аудио с Яндекс.Диска часто даёт 403. См. .env.example и Dockerfile.",
      );
    }
  }, []);
  useEffect(() => saveUserState(user), [user]);
  useEffect(() => {
    registerAppSW(() => setSwNeedRefresh(true));
  }, []);
  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);
  useEffect(() => {
    void (async () => {
      const cat = await runCatalogWorker();
      if (cat?.tracks.length) setCatalog(cat);
    })();
  }, []);
  const trackMap = useMemo(
    () => new Map(catalog.tracks.map((t) => [t.id, t])),
    [catalog.tracks],
  );
  const currentTrack = currentTrackId
    ? (trackMap.get(currentTrackId) ?? null)
    : null;
  const progressOf = (id: string): Progress =>
    user.progress[id] ?? {
      position: 0,
      duration: 0,
      completed: false,
      updatedAt: null,
    };
  const isLiked = (id: string) => Boolean(user.likes[id]);
  const isFavorite = (id: string) => Boolean(user.favorites[id]);
  const tracks = useMemo(() => {
    let list = [...catalog.tracks];
    const q = query.toLowerCase().trim();
    if (q)
      list = list.filter((t) =>
        [t.title, t.folder, t.fileName].some((v) =>
          v.toLowerCase().includes(q),
        ),
      );
    if (selectedFolder) list = list.filter((t) => t.folder === selectedFolder);
    if (view === "liked") list = list.filter((t) => isLiked(t.id));
    if (view === "favorites") list = list.filter((t) => isFavorite(t.id));
    if (view === "resume")
      list = list.filter((t) => {
        const p = progressOf(t.id);
        return p.position > 15 && !p.completed;
      });
    if (view === "playlist" && selectedPlaylist) {
      const pl = user.playlists.find((p) => p.id === selectedPlaylist);
      const ids = new Set(pl?.trackIds ?? []);
      list = list.filter((t) => ids.has(t.id));
    }
    return list.sort(
      (a, b) =>
        a.folder.localeCompare(b.folder, "ru") ||
        a.title.localeCompare(b.title, "ru"),
    );
  }, [
    catalog.tracks,
    query,
    selectedFolder,
    selectedPlaylist,
    user.playlists,
    user.likes,
    user.favorites,
    user.progress,
    view,
  ]);
  useEffect(() => {
    setQueue(tracks.map((t) => t.id));
  }, [tracks]);
  useEffect(() => {
    if (!currentTrackId && user.lastTrackId && trackMap.has(user.lastTrackId))
      setCurrentTrackId(user.lastTrackId);
  }, [currentTrackId, trackMap, user.lastTrackId]);

  useEffect(() => {
    const track = currentTrackId ? trackMap.get(currentTrackId) : undefined;
    if (!track || track.url || isStubTrack(track)) return;
    let cancelled = false;
    void (async () => {
      try {
        const url = await fetchDiskDownloadHref(track.path);
        if (cancelled || !url) return;
        setCatalog((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === track.id ? { ...t, url } : t,
          ),
        }));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTrackId, trackMap]);

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

  const resumeCount = catalog.tracks.filter((t) => {
    const p = progressOf(t.id);
    return p.position > 15 && !p.completed;
  }).length;
  const sectionTitle = selectedFolder
    ? selectedFolder
    : view === "resume"
      ? "Продолжить прослушивание"
      : view === "favorites"
        ? "Избранное"
        : view === "liked"
          ? "Лайки"
          : view === "playlist"
            ? `Плейлист: ${user.playlists.find((p) => p.id === selectedPlaylist)?.name ?? ""}`
            : "Каталог";
  const sectionSub = selectedFolder
    ? "Все треки выбранной серии."
    : catalog.loaded
      ? "Живой индекс публичной папки Яндекс.Диска."
      : "Идет fallback-режим до полной индексации каталога.";
  const playTrack = useCallback(
    async (track: Track) => {
      setCurrentTrackId(track.id);
      setUser((prev) => ({ ...prev, lastTrackId: track.id }));
      const audio = audioRef.current;
      if (!audio || isStubTrack(track)) return;
      setIsLoadingTrack(true);
      let url = track.url;
      try {
        if (!url) {
          url = await fetchDiskDownloadHref(track.path);
          if (!url) throw new Error("empty href");
          setCatalog((prev) => ({
            ...prev,
            tracks: prev.tracks.map((t) =>
              t.id === track.id ? { ...t, url } : t,
            ),
          }));
        }
        const pu = playbackSrc(url);
        lastPlaybackUrlRef.current = pu;
        audio.src = pu;
        await audio.play();
      } catch (err) {
        const message = formatPlaybackError(err);
        pushToast(message, {
          label: "Повторить",
          onClick: () => void playTrack(track),
        });
      } finally {
        setIsLoadingTrack(false);
      }
    },
    [pushToast],
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
      try {
        await audio.play();
      } catch (err) {
        pushToast(formatPlaybackError(err));
      }
    } else audio.pause();
  }, [catalog.tracks, currentTrackId, playTrack, pushToast, trackMap, tracks]);

  const nextTrack = useCallback(
    (step: number) => {
      const source = queue.length ? queue : tracks.map((t) => t.id);
      const idx = source.indexOf(currentTrackId || "");
      const nextId = source[idx + step];
      const next = nextId ? trackMap.get(nextId) : null;
      if (next) void playTrack(next);
    },
    [currentTrackId, playTrack, queue, trackMap, tracks],
  );

  const seekBy = useCallback((deltaSec: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration, audio.currentTime + deltaSec),
    );
  }, []);

  const playerActionsRef = useRef({
    togglePlay: async () => {},
    nextTrack: (_step: number) => {},
    seekBy: (_delta: number) => {},
    play: async () => {},
    pause: () => {},
  });
  playerActionsRef.current.togglePlay = togglePlay;
  playerActionsRef.current.nextTrack = nextTrack;
  playerActionsRef.current.seekBy = seekBy;
  playerActionsRef.current.play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
    } catch (err) {
      pushToast(formatPlaybackError(err));
    }
  };
  playerActionsRef.current.pause = () => audioRef.current?.pause();

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
    const audio = audioRef.current;
    if (!audio || !currentTrack?.url || isStubTrack(currentTrack)) return;
    const pu = playbackSrc(currentTrack.url);
    if (lastPlaybackUrlRef.current !== pu) {
      lastPlaybackUrlRef.current = pu;
      audio.src = pu;
    }
    audio.volume = user.volume;
    audio.playbackRate = user.playbackRate;
    const handleLoaded = () => {
      const p = progressOf(currentTrack.id);
      if (p.position > 0 && p.position < (audio.duration || Infinity) - 5)
        audio.currentTime = p.position;
    };
    const handleTime = () => {
      const current = Math.floor(audio.currentTime || 0);
      if (current === lastSavedSecond.current) return;
      lastSavedSecond.current = current;
      setUser((prev) => {
        const duration = audio.duration || 0;
        const completed = duration
          ? audio.currentTime / duration > 0.97
          : false;
        const next = {
          ...prev,
          lastTrackId: currentTrack.id,
          progress: {
            ...prev.progress,
            [currentTrack.id]: {
              position: audio.currentTime,
              duration,
              completed,
              updatedAt: new Date().toISOString(),
            },
          },
        };
        const resume = next.playlists.find((p) => p.id === "resume");
        if (resume) {
          resume.trackIds = resume.trackIds.filter(
            (id) => id !== currentTrack.id,
          );
          if (audio.currentTime > 15 && !completed)
            resume.trackIds.unshift(currentTrack.id);
          resume.trackIds = Array.from(new Set(resume.trackIds)).slice(0, 100);
        }
        return next;
      });
    };
    const handleEnded = () => playerActionsRef.current.nextTrack(1);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack, user.volume, user.playbackRate]);

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
  const toggleMap = (type: "likes" | "favorites", id: string) => {
    setUser((prev) => {
      const nextMap = { ...prev[type] };
      if (nextMap[id]) delete nextMap[id];
      else nextMap[id] = true;
      return { ...prev, [type]: nextMap };
    });
  };
  const addPlaylist = () => {
    const name = playlistName.trim();
    if (!name) return;
    setUser((prev) => ({
      ...prev,
      playlists: [
        ...prev.playlists,
        { id: crypto.randomUUID(), name, trackIds: [] },
      ],
    }));
    setPlaylistName("");
    setShowPlaylistModal(false);
  };
  const addTrackToPlaylist = (playlistId: string, trackId: string) =>
    setUser((prev) => ({
      ...prev,
      playlists: prev.playlists.map((pl) =>
        pl.id === playlistId
          ? { ...pl, trackIds: Array.from(new Set([...pl.trackIds, trackId])) }
          : pl,
      ),
    }));
  const refreshCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const cat = await runCatalogWorker();
      if (cat) setCatalog(cat);
      else pushToast("Не удалось обновить каталог. Проверьте сеть.");
    } finally {
      setLoadingCatalog(false);
    }
  };
  const audioBusy = isLoadingTrack || isBuffering;
  const playButtonLabel = audioBusy
    ? "Загрузка"
    : isPlaying
      ? "Пауза"
      : "Воспроизведение";
  const showIosInstallHint =
    !iosHintDismissed &&
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(
      "standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone
    );
  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = audio.duration * value;
  };
  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="logo-box">♪</div>
            <div>
              <h1>Gayduk</h1>
              <p>аудиосказки · React player</p>
            </div>
          </div>
          <section className="side-section">
            <h2>Разделы</h2>
            {[
              ["all", "Весь каталог"],
              ["resume", `Продолжить · ${resumeCount}`],
              [
                "favorites",
                `Избранное · ${Object.keys(user.favorites).length}`,
              ],
              ["liked", `Лайки · ${Object.keys(user.likes).length}`],
            ].map(([id, label]) => (
              <button
                key={id}
                className={view === id ? "nav active" : "nav"}
                onClick={() => {
                  setView(id as any);
                  setSelectedFolder(null);
                  setSelectedPlaylist(null);
                }}
              >
                {label}
              </button>
            ))}
          </section>
          <section className="side-section">
            <h2>Коллекция</h2>
            <div className="side-list">
              {catalog.folders.map((folder) => (
                <button
                  key={folder}
                  className={selectedFolder === folder ? "nav active" : "nav"}
                  onClick={() => {
                    setView("all");
                    setSelectedFolder(folder);
                    setSelectedPlaylist(null);
                  }}
                >
                  {folder}
                </button>
              ))}
            </div>
          </section>
          <section className="side-section">
            <div className="side-head">
              <h2>Плейлисты</h2>
              <button
                className="ghost round"
                onClick={() => setShowPlaylistModal(true)}
              >
                ＋
              </button>
            </div>
            <div className="side-list">
              {user.playlists.filter((p) => !p.system).length === 0 ? (
                <div className="mini-text">
                  Пока нет пользовательских плейлистов
                </div>
              ) : null}
              {user.playlists
                .filter((p) => !p.system)
                .map((pl) => (
                  <button
                    key={pl.id}
                    className={
                      selectedPlaylist === pl.id ? "nav active" : "nav"
                    }
                    onClick={() => {
                      setView("playlist");
                      setSelectedPlaylist(pl.id);
                      setSelectedFolder(null);
                    }}
                  >
                    {pl.name} <span>{pl.trackIds.length}</span>
                  </button>
                ))}
            </div>
          </section>
        </aside>
        <main className="main">
          {swNeedRefresh ? (
            <div className="pwa-toast" role="status">
              <span>Доступна новая версия приложения.</span>
              <button
                type="button"
                className="ghost"
                onClick={() => window.location.reload()}
              >
                Обновить
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setSwNeedRefresh(false)}
              >
                Позже
              </button>
            </div>
          ) : null}
          <header className="topbar">
            <div>
              <div className="eyebrow">Публичная коллекция Дмитрия Гайдука</div>
              <div className="source">Источник: {PUBLIC_KEY}</div>
            </div>
            <div className="toolbar">
              {installPrompt ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={async () => {
                    try {
                      await installPrompt.prompt();
                      await installPrompt.userChoice;
                    } catch {
                      /* отмена */
                    }
                    setInstallPrompt(null);
                  }}
                >
                  Установить
                </button>
              ) : null}
              {showIosInstallHint ? (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setIosHintDismissed(true)}
                  title="Закрыть подсказку"
                >
                  iOS: Поделиться → На экран «Домой»
                </button>
              ) : null}
              <button type="button" className="ghost" onClick={refreshCatalog}>
                {loadingCatalog ? "Обновляю…" : "Обновить каталог"}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
            </div>
          </header>
          <section className="hero">
            <div>
              <div className="eyebrow">Библиотека вместо архива</div>
              <h2>
                Удобное прослушивание с прогрессом, избранным и плейлистами.
              </h2>
              <p>
                Приложение подгружает каталог из публичной папки Яндекс.Диска и
                превращает его в аккуратную медиатеку с сохранением места
                остановки.
              </p>
              <div className="hero-actions">
                <div className="search-wrap">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск по названию, серии или имени файла"
                  />
                </div>
                <button
                  className="chip"
                  onClick={() => {
                    setView("resume");
                    setSelectedFolder(null);
                  }}
                >
                  Продолжить
                </button>
                <button
                  className="chip"
                  onClick={() => {
                    setView("favorites");
                    setSelectedFolder(null);
                  }}
                >
                  Избранное
                </button>
                <button
                  className="chip"
                  onClick={() => {
                    setView("liked");
                    setSelectedFolder(null);
                  }}
                >
                  Лайки
                </button>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat">
                <span>Разделов</span>
                <strong>{catalog.folders.length}</strong>
              </div>
              <div className="stat">
                <span>Треков</span>
                <strong>{catalog.tracks.length}</strong>
              </div>
              <div className="stat">
                <span>Продолжить</span>
                <strong>{resumeCount}</strong>
              </div>
              <div className="stat">
                <span>Плейлистов</span>
                <strong>
                  {user.playlists.filter((p) => !p.system).length}
                </strong>
              </div>
            </div>
          </section>
          <section className="section-head">
            <div>
              <h3>{sectionTitle}</h3>
              <p>{sectionSub}</p>
            </div>
            <div className="mini-text">{tracks.length} элементов</div>
          </section>
          <section className="cards">
            {tracks.length === 0 ? (
              <div className="empty">
                Пока ничего не найдено. Снимите фильтры или обновите каталог.
              </div>
            ) : null}
            {tracks.map((track) => {
              const p = progressOf(track.id);
              const ratio = p.duration
                ? Math.min(100, (p.position / p.duration) * 100)
                : 0;
              return (
                <article key={track.id} className="card">
                  <div className="card-top">
                    <div>
                      <div className="pill">{track.folder}</div>
                      <h4>{track.title}</h4>
                      <p className="mini-text">{track.fileName}</p>
                    </div>
                    <div className="row-actions">
                      <button
                        className="ghost round"
                        onClick={() => toggleMap("likes", track.id)}
                      >
                        {isLiked(track.id) ? "♥" : "♡"}
                      </button>
                      <button
                        className="ghost round"
                        onClick={() => toggleMap("favorites", track.id)}
                      >
                        {isFavorite(track.id) ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                  <div className="mini-meta">
                    <span>{fmtBytes(track.size)}</span>
                    <span>
                      {p.position > 0
                        ? `С последнего раза: ${fmtTime(p.position)}`
                        : "Еще не запускали"}
                    </span>
                  </div>
                  <div className="progress-line">
                    <span style={{ width: `${ratio}%` }} />
                  </div>
                  <div className="row-actions wrap">
                    <button
                      className="primary"
                      onClick={() => playTrack(track)}
                    >
                      {isStubTrack(track) ? "Подготовлено" : "Слушать"}
                    </button>
                    {user.playlists
                      .filter((p) => !p.system)
                      .slice(0, 3)
                      .map((pl) => (
                        <button
                          key={pl.id}
                          className="tag"
                          onClick={() => addTrackToPlaylist(pl.id, track.id)}
                        >
                          + {pl.name}
                        </button>
                      ))}
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      </div>
      <footer className="player-bar">
        <div className="now-box">
          <div className="cover">♪</div>
          <div>
            <strong>{currentTrack?.title ?? "Ничего не выбрано"}</strong>
            <div className="mini-text">
              {currentTrack?.folder ?? "Выберите сказку из каталога"}
            </div>
          </div>
        </div>
        <div className="center-box">
          <div className="player-controls">
            <button className="ghost round" onClick={() => nextTrack(-1)}>
              ⏮
            </button>
            <button
              type="button"
              className={`primary round big${audioBusy ? " is-busy" : ""}`}
              onClick={togglePlay}
              disabled={audioBusy && !isPlaying}
              aria-label={playButtonLabel}
            >
              {audioBusy ? "◌" : isPlaying ? "⏸" : "▶"}
            </button>
            <button className="ghost round" onClick={() => nextTrack(1)}>
              ⏭
            </button>
          </div>
          <PlayerTimeline audioRef={audioRef} onSeek={seek} />
          <p className="player-hints mini-text">
            Пробел · воспроизведение · ←→ перемотка · N/P треки
          </p>
        </div>
        <div className="right-box">
          <button
            className="ghost round"
            onClick={() => currentTrackId && toggleMap("likes", currentTrackId)}
          >
            {currentTrackId && isLiked(currentTrackId) ? "♥" : "♡"}
          </button>
          <button
            className="ghost round"
            onClick={() =>
              currentTrackId && toggleMap("favorites", currentTrackId)
            }
          >
            {currentTrackId && isFavorite(currentTrackId) ? "★" : "☆"}
          </button>
          <label className="speed">
            <span>Скорость</span>
            <select
              value={user.playbackRate}
              onChange={(e) => {
                const rate = Number(e.target.value);
                if (audioRef.current) audioRef.current.playbackRate = rate;
                setUser((prev) => ({ ...prev, playbackRate: rate }));
              }}
            >
              {PLAYBACK_RATES.map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>
          <label className="volume">
            <span>Громкость</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={user.volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (audioRef.current) audioRef.current.volume = v;
                setUser((prev) => ({ ...prev, volume: v }));
              }}
            />
          </label>
        </div>
        <audio
          ref={(el) => {
            audioRef.current = el;
            if (el) el.setAttribute("referrerpolicy", "no-referrer");
          }}
          preload="metadata"
          crossOrigin="anonymous"
        />
      </footer>
      {showPlaylistModal ? (
        <div
          className="modal-backdrop"
          onClick={() => setShowPlaylistModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">Новый плейлист</div>
            <h3>Собрать свою подборку</h3>
            <input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Например: Вечерние сказки"
            />
            <div className="row-actions end">
              <button
                className="ghost"
                onClick={() => setShowPlaylistModal(false)}
              >
                Отмена
              </button>
              <button className="primary" onClick={addPlaylist}>
                Создать
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
