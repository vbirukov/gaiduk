import { useCallback, useEffect, useRef, useState } from "react";
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
import { applyOgMeta, applySiteOgDefaults } from "./lib/shareOg";
import {
  clearTrackShareParams,
  parseTrackShareParams,
} from "./lib/shareTrack";
import { preloadThemeImages } from "./lib/preloadThemeAssets";
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
    deletePlaylist,
    cycleRepeat,
  } = useUserState();

  const [view, setView] = useState<LibraryView>("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
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
    selectedFolder,
    selectedPlaylist,
    leadTrackIdRef,
  });

  const shareLinkHandled = useRef(false);

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
      libraryScreenPath(view, selectedFolder, selectedPlaylist),
      sectionTitle,
    );
  }, [view, selectedFolder, selectedPlaylist, sectionTitle]);

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
    if (catalogLoading || shareLinkHandled.current) return;
    const { trackId, startAtSec } = parseTrackShareParams();
    if (!trackId) return;
    shareLinkHandled.current = true;
    const track = trackMap.get(trackId);
    clearTrackShareParams();
    if (!track) {
      pushToast("Сказка по ссылке не найдена в каталоге");
      return;
    }
    applyOgMeta({ track, startAtSec });
    void player.playTrack(track, { startAtSec });
  }, [catalogLoading, trackMap, player.playTrack, pushToast]);

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

  const handleSelectFolder = useCallback((folder: string) => {
    setView("all");
    setSelectedFolder(folder);
    setSelectedPlaylist(null);
    closeNav();
  }, []);

  const handleClearFolder = useCallback(() => {
    setSelectedFolder(null);
  }, []);

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
          selectedFolder={selectedFolder}
          selectedPlaylist={selectedPlaylist}
          resumeCount={resumeCount}
          onSelectView={(id) => {
            setView(id);
            setSelectedFolder(null);
            setSelectedPlaylist(null);
            closeNav();
          }}
          onSelectFolder={handleSelectFolder}
          onSelectPlaylist={(id) => {
            setView("playlist");
            setSelectedPlaylist(id);
            setSelectedFolder(null);
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
            onFeedLayoutChange={(feedLayout) =>
              setUser((prev) => ({ ...prev, feedLayout }))
            }
            onSelectFolder={handleSelectFolder}
            onClearFolder={handleClearFolder}
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
