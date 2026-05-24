import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppTheme } from "./hooks/useAppTheme";
import type { Track } from "./types/catalog";
import { MainHeader } from "./components/MainHeader";
import { PlaylistModal } from "./components/PlaylistModal";
import { PlayerBar } from "./components/PlayerBar";
import { Sidebar } from "./components/Sidebar";
import { TrackList } from "./components/TrackList";
import { SplashScreen } from "./components/SplashScreen";
import { ScrollToTop } from "./components/ScrollToTop";
import { ToastStack } from "./components/ToastStack";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useCatalog } from "./hooks/useCatalog";
import { useServerMedia } from "./lib/mediaUrl";
import { useToasts } from "./hooks/useToasts";
import { useUserState } from "./hooks/useUserState";
import {
  libraryScreenPath,
  ymGoal,
  ymHit,
} from "./lib/metrika";
import {
  applyCatalogOgMeta,
  applyFolderOgMeta,
  applyOgMeta,
  applySiteOgDefaults,
} from "./lib/shareOg";
import { shareFolder } from "./lib/shareCatalog";
import { clearAppEntryParams, parseAppEntryParams } from "./lib/shareNavigation";
import { preloadThemeImages } from "./lib/preloadThemeAssets";
import { registerAppSW } from "./pwa/register";
import type { LibraryView } from "./types/user";
import { useOfflineLibrary } from "./hooks/useOfflineLibrary";
import { FolderOfflineControl } from "./components/FolderOfflineControl";
import { SelectionOfflineControl } from "./components/SelectionOfflineControl";
import { formatStorageBytes } from "./lib/formatStorage";

export function App() {
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const {
    user,
    setUser,
    progressOf,
    isLiked,
    toggleLike,
    addPlaylist,
    addTrackToPlaylist,
    deletePlaylist,
    cycleRepeat,
  } = useUserState();

  const [view, setView] = useState<LibraryView>("all");
  const [feedFolderFilter, setFeedFolderFilter] = useState<string[]>([]);
  const [scrollToFolder, setScrollToFolder] = useState<string | null>(null);
  const [focusedFolder, setFocusedFolder] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const { skin, setSkin, isJaipur, isRastamanLight } = useAppTheme();

  useEffect(() => {
    preloadThemeImages(skin);
  }, [skin]);

  const [swNeedRefresh, setSwNeedRefresh] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosHintDismissed, setIosHintDismissed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const leadTrackIdRef = useRef<string | null>(user.lastTrackId);

  const {
    catalog,
    catalogLoading,
    resumeTrack,
    patchTrackUrl,
    trackMap,
    tracks,
    trackIds,
    queue,
    nextTrackId,
    resumeCount,
    sectionTitle,
    sectionSub,
  } = useCatalog(user, {
    view,
    feedFolderFilter,
    selectedPlaylist,
    feedListenFilter: user.feedListenFilter,
    leadTrackIdRef,
  });

  const entryLinkHandled = useRef(false);

  const offline = useOfflineLibrary(catalog);

  const runDownloadFolder = useCallback(
    (folder: string) => {
      void offline
        .downloadFolder(folder)
        .then(() => pushToast(`«${folder}» доступна офлайн`))
        .catch((e) => {
          pushToast(
            e instanceof Error ? e.message : "Не удалось скачать серию",
          );
        });
    },
    [offline.downloadFolder, pushToast],
  );

  const runRemoveFolderOffline = useCallback(
    (folder: string) => {
      void offline.removeFolder(folder).catch(() => {
        pushToast("Не удалось удалить офлайн-копию");
      });
    },
    [offline.removeFolder, pushToast],
  );

  const renderFolderOffline = useCallback(
    (folder: string) => (
      <FolderOfflineControl
        folder={folder}
        layout="stacked"
        isOffline={offline.isFolderOffline(folder)}
        isDownloading={offline.isFolderDownloading(folder)}
        progress={offline.folderProgress(folder)}
        job={offline.job?.scope === "folder" ? offline.job : null}
        onDownload={() => runDownloadFolder(folder)}
        onCancel={offline.cancelDownload}
        onRemove={() => runRemoveFolderOffline(folder)}
      />
    ),
    [offline, runDownloadFolder, runRemoveFolderOffline],
  );

  const handleTrackOfflineAction = useCallback(
    (track: Track) => {
      if (offline.isTrackOffline(track.id)) {
        void offline.removeTrack(track.id).then(() => {
          pushToast(`«${track.title}» удалена с устройства`);
        });
        return;
      }
      void offline
        .downloadTrack(track)
        .then(() => pushToast(`«${track.title}» доступна офлайн`))
        .catch((e) => {
          pushToast(
            e instanceof Error ? e.message : "Не удалось скачать сказку",
          );
        });
    },
    [offline, pushToast],
  );

  const offlineSidebarSummary = useMemo(() => {
    if (!offline.offlineFolders.length && !offline.storageBytes) return null;
    return (
      <>
        <p className="side-offline-summary">
          {offline.offlineFolders.length
            ? `${offline.offlineFolders.length} серий · `
            : ""}
          {formatStorageBytes(offline.storageBytes)} на устройстве
        </p>
        <div className="side-offline-list">
          {offline.offlineFolders.map((folder) => (
            <div key={folder} className="side-offline-item">
              <span className="side-offline-item__label">{folder}</span>
              {renderFolderOffline(folder)}
            </div>
          ))}
        </div>
      </>
    );
  }, [offline.offlineFolders, offline.storageBytes, renderFolderOffline]);

  const player = useAudioPlayer({
    catalog,
    patchTrackUrl,
    user,
    setUser,
    tracks,
    trackIds,
    queue,
    trackMap,
    pushToast,
  });

  leadTrackIdRef.current = player.currentTrackId ?? user.lastTrackId;

  useEffect(() => {
    document.documentElement.classList.toggle(
      "has-player",
      Boolean(player.currentTrackId),
    );
  }, [player.currentTrackId]);

  useEffect(() => {
    if (!import.meta.env.PROD || useServerMedia()) return;
    const proxy = import.meta.env.VITE_AUDIO_PROXY_BASE;
    if (typeof proxy !== "string" || !String(proxy).trim()) {
      console.warn(
        "[gayduk] Нет VITE_MEDIA_BASE и VITE_AUDIO_PROXY_BASE — воспроизведение не настроено.",
      );
    }
  }, []);

  useEffect(() => {
    ymHit(
      libraryScreenPath(
        view,
        feedFolderFilter.length === 1 ? feedFolderFilter[0]! : null,
        selectedPlaylist,
      ),
      sectionTitle,
    );
  }, [view, feedFolderFilter, selectedPlaylist, sectionTitle]);

  useEffect(() => {
    if (navOpen) ymGoal("nav_open");
  }, [navOpen]);

  useEffect(() => {
    const track = player.currentTrack;
    if (track) {
      applyOgMeta({ track });
      return;
    }
    applySiteOgDefaults();
  }, [player.currentTrack]);

  useEffect(() => {
    if (catalogLoading || entryLinkHandled.current) return;
    const entry = parseAppEntryParams();
    if (entry.kind === "none") return;
    entryLinkHandled.current = true;
    clearAppEntryParams();

    if (entry.kind === "track") {
      const track = trackMap.get(entry.trackId);
      if (!track) {
        pushToast("Сказка по ссылке не найдена в каталоге");
        return;
      }
      applyOgMeta({ track, startAtSec: entry.startAtSec });
      void player.playTrack(track, { startAtSec: entry.startAtSec });
      return;
    }

    if (entry.kind === "folder") {
      if (!catalog.folders.includes(entry.folder)) {
        pushToast("Альбом по ссылке не найден");
        return;
      }
      setView("all");
      setFeedFolderFilter([entry.folder]);
      setFocusedFolder(entry.folder);
      setScrollToFolder(entry.folder);
      setSelectedPlaylist(null);
      const trackCount = catalog.tracks.filter(
        (t) => t.folder === entry.folder,
      ).length;
      applyFolderOgMeta({ folder: entry.folder, trackCount });
      return;
    }

    setView("all");
    setFeedFolderFilter([]);
    setSelectedPlaylist(null);
    applyCatalogOgMeta({
      trackCount: catalog.tracks.length,
      albumCount: catalog.folders.length,
    });
  }, [
    catalogLoading,
    catalog.folders,
    catalog.tracks,
    trackMap,
    player.playTrack,
    pushToast,
  ]);

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
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  const handleScrollToFolder = useCallback((folder: string) => {
    setView("all");
    setSelectedPlaylist(null);
    setFocusedFolder(folder);
    setScrollToFolder(folder);
    closeNav();
  }, []);

  const handleFilterOnlyFolder = useCallback((folder: string) => {
    setView("all");
    setSelectedPlaylist(null);
    setFeedFolderFilter([folder]);
    setFocusedFolder(folder);
    ymGoal("feed_filter_folder", { folder });
  }, []);

  const handleAddFolderToSelection = useCallback((folder: string) => {
    setView("all");
    setSelectedPlaylist(null);
    setFeedFolderFilter((prev) =>
      prev.includes(folder) ? prev : [...prev, folder],
    );
    setFocusedFolder(folder);
    setScrollToFolder(folder);
    ymGoal("feed_filter_add_folder", { folder });
  }, []);

  const handleClearFeedFilter = useCallback(() => {
    setFeedFolderFilter([]);
    ymGoal("feed_filter_clear");
  }, []);

  const handleScrolledToFolder = useCallback(() => {
    setScrollToFolder(null);
  }, []);

  const runDownloadSelection = useCallback(() => {
    void offline
      .downloadSelection(feedFolderFilter)
      .then(() => pushToast("Выборка скачана для офлайн"))
      .catch((e) => {
        pushToast(
          e instanceof Error ? e.message : "Не удалось скачать выборку",
        );
      });
  }, [feedFolderFilter, offline.downloadSelection, pushToast]);

  const renderSelectionOffline = useMemo(() => {
    if (!feedFolderFilter.length) return null;
    return (
      <SelectionOfflineControl
        label={sectionTitle}
        trackCount={tracks.length}
        isDownloading={Boolean(offline.isSelectionDownloading)}
        job={
          offline.job?.scope === "selection" || offline.job?.scope === "folder"
            ? offline.job
            : null
        }
        onDownload={runDownloadSelection}
        onCancel={offline.cancelDownload}
      />
    );
  }, [
    feedFolderFilter.length,
    offline.cancelDownload,
    offline.isSelectionDownloading,
    offline.job,
    runDownloadSelection,
    sectionTitle,
    tracks.length,
  ]);

  const handleShareFolder = useCallback(
    (folder: string) => {
      const trackCount = catalog.tracks.filter((t) => t.folder === folder).length;
      void shareFolder({ folder, trackCount }).then((r) => {
        if (r === "copied") pushToast("Ссылка на альбом скопирована");
        if (r === "shared") ymGoal("album_share", { folder });
      });
    },
    [catalog.tracks, pushToast],
  );

  const handlePlayTrack = useCallback(
    (t: Track) => {
      if (player.currentTrackId === t.id) {
        void player.togglePlay();
        return;
      }
      void player.playTrack(t);
    },
    [player.currentTrackId, player.playTrack, player.togglePlay],
  );
  const handleToggleLike = useCallback(
    (id: string) => {
      const liked = !isLiked(id);
      toggleLike(id);
      ymGoal("like_toggle", { track_id: id, liked: liked ? 1 : 0 });
    },
    [toggleLike, isLiked],
  );

  const showIosInstallHint =
    !iosHintDismissed &&
    typeof navigator !== "undefined" &&
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(
      "standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone
    );

  return (
    <>
      <SplashScreen />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <div
        className={
          player.currentTrackId ? "app-shell has-player" : "app-shell"
        }
      >
        <Sidebar
          skin={skin}
          onSkinChange={setSkin}
          navOpen={navOpen}
          onClose={closeNav}
          catalog={catalog}
          user={user}
          view={view}
          feedFolderFilter={feedFolderFilter}
          focusedFolder={focusedFolder}
          selectedPlaylist={selectedPlaylist}
          resumeCount={resumeCount}
          onSelectView={(id) => {
            setView(id);
            setFeedFolderFilter([]);
            setSelectedPlaylist(null);
            if (id === "resume") {
              setUser((prev) => ({ ...prev, feedListenFilter: "in-progress" }));
            }
            closeNav();
          }}
          onScrollToFolder={handleScrollToFolder}
          onAddFolderToSelection={handleAddFolderToSelection}
          onSelectPlaylist={(id) => {
            setView("playlist");
            setSelectedPlaylist(id);
            setFeedFolderFilter([]);
            closeNav();
          }}
          onOpenPlaylistModal={() => setShowPlaylistModal(true)}
          onDeletePlaylist={(id) => {
            deletePlaylist(id);
            if (selectedPlaylist === id) {
              setView("all");
              setSelectedPlaylist(null);
            }
          }}
          onShareFolder={handleShareFolder}
          renderFolderOffline={renderFolderOffline}
          offlineSummary={offlineSidebarSummary}
        />
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
          <MainHeader
            onOpenNav={() => setNavOpen(true)}
            installPrompt={installPrompt}
            onInstall={async () => {
              try {
                await installPrompt?.prompt();
                const { outcome } = (await installPrompt?.userChoice) ?? {
                  outcome: "dismissed" as const,
                };
                ymGoal("pwa_install", { outcome });
              } catch {
                ymGoal("pwa_install", { outcome: "dismissed" });
              }
              setInstallPrompt(null);
            }}
            showIosInstallHint={showIosInstallHint}
            onDismissIosHint={() => setIosHintDismissed(true)}
            skin={skin}
            onSkinChange={setSkin}
          />
          <TrackList
            isJaipur={isJaipur}
            isRastamanLight={isRastamanLight}
            catalog={catalog}
            user={user}
            tracks={tracks}
            view={view}
            feedFolderFilter={feedFolderFilter}
            scrollToFolder={scrollToFolder}
            onScrolledToFolder={handleScrolledToFolder}
            onClearFeedFilter={handleClearFeedFilter}
            onFilterOnlyFolder={handleFilterOnlyFolder}
            selectedPlaylist={selectedPlaylist}
            resumeTrack={resumeTrack}
            catalogLoading={catalogLoading}
            sectionTitle={sectionTitle}
            sectionSub={sectionSub}
            activeTrackId={player.currentTrackId}
            isPlaying={player.isPlaying}
            livePlayback={player.livePlayback}
            progressOf={progressOf}
            isLiked={isLiked}
            onPlayTrack={handlePlayTrack}
            onToggleLike={handleToggleLike}
            onAddToPlaylist={addTrackToPlaylist}
            onOpenNav={() => setNavOpen(true)}
            onFeedLayoutChange={(feedLayout) =>
              setUser((prev) => ({ ...prev, feedLayout }))
            }
            onFeedListenFilterChange={(feedListenFilter) =>
              setUser((prev) => ({ ...prev, feedListenFilter }))
            }
            onSelectFolder={handleScrollToFolder}
            onShareFolder={handleShareFolder}
            renderFolderOffline={renderFolderOffline}
            renderSelectionOffline={renderSelectionOffline}
            isTrackOffline={offline.isTrackOffline}
            isTrackDownloading={offline.isTrackDownloading}
            onTrackOfflineAction={handleTrackOfflineAction}
            nextTrackId={nextTrackId(player.currentTrackId)}
          />
        </main>
      </div>
      <ScrollToTop />
      <PlayerBar
        currentTrack={player.currentTrack}
        currentTrackId={player.currentTrackId}
        audioRef={player.audioRef}
        bindAudioRef={player.bindAudioRef}
        user={user}
        setUser={setUser}
        isPlaying={player.isPlaying}
        audioBusy={player.audioBusy}
        playButtonLabel={player.playButtonLabel}
        repeatLabel={player.repeatLabel}
        isLiked={isLiked}
        onToggleLike={handleToggleLike}
        onToggleShuffle={() =>
          setUser((prev) => ({ ...prev, shuffle: !prev.shuffle }))
        }
        onCycleRepeat={cycleRepeat}
        onPrev={() => player.prevTrack()}
        onNext={() => player.nextTrack(1)}
        onTogglePlay={() => void player.togglePlay()}
        onSeek={player.seek}
        onShareToast={pushToast}
      />
      {showPlaylistModal ? (
        <PlaylistModal
          playlistName={playlistName}
          onNameChange={setPlaylistName}
          onClose={() => setShowPlaylistModal(false)}
          onSubmit={() => {
            if (addPlaylist(playlistName)) {
              ymGoal("playlist_created");
              setPlaylistName("");
              setShowPlaylistModal(false);
            }
          }}
        />
      ) : null}
    </>
  );
}
