import { useCallback, useEffect, useState } from "react";
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
import { registerAppSW } from "./pwa/register";
import type { LibraryView } from "./types/user";

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
    cycleRepeat,
  } = useUserState();

  const [view, setView] = useState<LibraryView>("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const { skin, setSkin, isJaipur, isRastamanLight } = useAppTheme();
  const [swNeedRefresh, setSwNeedRefresh] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosHintDismissed, setIosHintDismissed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const {
    catalog,
    setCatalog,
    catalogLoading,
    loadingCatalog,
    refreshCatalog,
    resumeTrack,
    patchTrackUrl,
    trackMap,
    tracks,
    trackIds,
    queue,
    resumeCount,
    sectionTitle,
    sectionSub,
  } = useCatalog(user, { view, selectedFolder, selectedPlaylist });

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
      libraryScreenPath(view, selectedFolder, selectedPlaylist),
      sectionTitle,
    );
  }, [view, selectedFolder, selectedPlaylist, sectionTitle]);

  useEffect(() => {
    if (navOpen) ymGoal("nav_open");
  }, [navOpen]);

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

  const handlePlayTrack = useCallback(
    (t: Track) => {
      void player.playTrack(t);
    },
    [player.playTrack],
  );
  const handleToggleLike = useCallback(
    (id: string) => {
      const liked = !isLiked(id);
      toggleLike(id);
      ymGoal("like_toggle", { track_id: id, liked: liked ? 1 : 0 });
    },
    [toggleLike, isLiked],
  );

  const handleRefreshCatalog = async () => {
    const cat = await refreshCatalog();
    if (cat) setCatalog(cat);
    else {
      ymGoal("catalog_refresh_fail");
      pushToast("Не удалось обновить каталог. Проверьте сеть.");
    }
  };

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
          selectedFolder={selectedFolder}
          selectedPlaylist={selectedPlaylist}
          resumeCount={resumeCount}
          onSelectView={(id) => {
            setView(id);
            setSelectedFolder(null);
            setSelectedPlaylist(null);
            closeNav();
          }}
          onSelectFolder={(folder) => {
            setView("all");
            setSelectedFolder(folder);
            setSelectedPlaylist(null);
            closeNav();
          }}
          onSelectPlaylist={(id) => {
            setView("playlist");
            setSelectedPlaylist(id);
            setSelectedFolder(null);
            closeNav();
          }}
          onOpenPlaylistModal={() => setShowPlaylistModal(true)}
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
            loadingCatalog={loadingCatalog}
            onRefreshCatalog={() => void handleRefreshCatalog()}
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
            selectedFolder={selectedFolder}
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
        onPrev={() => player.nextTrack(-1)}
        onNext={() => player.nextTrack(1)}
        onTogglePlay={() => void player.togglePlay()}
        onSeek={player.seek}
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
