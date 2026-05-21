import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPLASH_SEEN_KEY } from "../config";
import { useHeroCollapsed } from "../hooks/useHeroCollapsed";
import { emptyStateCopy } from "../lib/emptyState";
import type { Catalog, Track } from "../types/catalog";
import type { FeedLayout, LibraryView, Progress, UserState } from "../types/user";
import { FeedLayoutSwitch } from "./FeedLayoutSwitch";
import type { LivePlayback } from "../lib/trackProgress";
import type { TrackCardProps } from "./TrackCard";
import { ContinueBanner } from "./ContinueBanner";
import { HookahSmoke } from "./HookahSmoke";
import { RastaSunLight } from "./RastaSunLight";
import { JaipurClouds } from "./JaipurClouds";
import { LibraryHero } from "./LibraryHero";
import { VirtualTrackGrid } from "./VirtualTrackGrid";

type Props = {
  catalog: Catalog;
  user: UserState;
  tracks: Track[];
  view: LibraryView;
  selectedFolder: string | null;
  selectedPlaylist: string | null;
  resumeTrack: Track | null;
  catalogLoading: boolean;
  sectionTitle: string;
  sectionSub: string;
  activeTrackId: string | null;
  isPlaying: boolean;
  livePlayback: LivePlayback | null;
  progressOf: (id: string) => Progress;
  isLiked: (id: string) => boolean;
  onPlayTrack: TrackCardProps["onPlayTrack"];
  onToggleLike: TrackCardProps["onToggleLike"];
  onAddToPlaylist: TrackCardProps["onAddToPlaylist"];
  onSelectFolder: TrackCardProps["onSelectFolder"];
  onOpenNav: () => void;
  onFeedLayoutChange: (layout: FeedLayout) => void;
  nextTrackId: string | null;
  isJaipur: boolean;
  isRastamanLight: boolean;
};

export function TrackList({
  catalog,
  user,
  tracks,
  view,
  selectedFolder,
  selectedPlaylist,
  resumeTrack,
  catalogLoading,
  sectionTitle,
  sectionSub,
  activeTrackId,
  isPlaying,
  livePlayback,
  progressOf,
  isLiked,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  onSelectFolder,
  onOpenNav,
  onFeedLayoutChange,
  nextTrackId,
  isJaipur,
  isRastamanLight,
}: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  const { collapsed, collapse, expand } = useHeroCollapsed();

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const alignFeedTop = () => {
      const instant = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      el.scrollIntoView({
        block: "start",
        behavior: instant ? "auto" : "instant",
      });
    };

    requestAnimationFrame(() => requestAnimationFrame(alignFeedTop));

    let splashDelay = 0;
    try {
      if (sessionStorage.getItem(SPLASH_SEEN_KEY) !== "1") splashDelay = 2050;
    } catch {
      /* private mode */
    }
    const afterSplash = window.setTimeout(alignFeedTop, splashDelay);
    return () => window.clearTimeout(afterSplash);
  }, []);
  const [scrollToTrackId, setScrollToTrackId] = useState<string | null>(null);
  const clearScrollToTrack = useCallback(() => setScrollToTrackId(null), []);
  const handleContinue = useCallback(
    (track: Track) => {
      onPlayTrack(track);
      setScrollToTrackId(track.id);
    },
    [onPlayTrack],
  );
  const playlistButtons = useMemo(
    () => user.playlists.filter((pl) => !pl.system),
    [user.playlists],
  );

  const playlistName =
    user.playlists.find((p) => p.id === selectedPlaylist)?.name ?? "";

  const empty = emptyStateCopy({
    view,
    selectedFolder,
    selectedPlaylist,
    playlistName,
  });

  const showContinueBanner =
    Boolean(resumeTrack) && view === "all" && !selectedFolder;

  const showFolderHeaders = !selectedFolder && !user.shuffle;
  const showFolderNames = user.shuffle && !selectedFolder;

  return (
    <section className="library-feed">
      <div className="library-feed-bg" aria-hidden />
      {isRastamanLight ? <RastaSunLight /> : null}
      {isJaipur ? (
        <JaipurClouds active={isPlaying} />
      ) : (
        <HookahSmoke active={isPlaying} dense={isRastamanLight} />
      )}
      <div className="library-feed-content" ref={feedRef}>
      <LibraryHero
        catalog={catalog}
        collapsed={collapsed}
        onCollapse={collapse}
        onExpand={expand}
      />
      {showContinueBanner && resumeTrack ? (
        <ContinueBanner
          track={resumeTrack}
          progress={progressOf(resumeTrack.id)}
          onContinue={handleContinue}
        />
      ) : null}
      <section className="section-head section-head--catalog">
        <button
          type="button"
          className="ghost section-head-catalog-btn"
          onClick={onOpenNav}
          aria-label={`Каталог: ${sectionTitle}. ${sectionSub}`}
        >
          Каталог
        </button>
        <p>{sectionSub}</p>
      </section>
      <div className="feed-toolbar">
        <p className="feed-toolbar__sub mini-text">{sectionSub}</p>
        <FeedLayoutSwitch
          value={user.feedLayout ?? "tiles"}
          onChange={onFeedLayoutChange}
        />
      </div>
      {catalogLoading ? (
        <VirtualTrackGrid
          tracks={[]}
          catalogLoading
          activeTrackId={activeTrackId}
          isPlaying={isPlaying}
          livePlayback={livePlayback}
          progressOf={progressOf}
          isLiked={isLiked}
          playlistButtons={playlistButtons}
          onPlayTrack={onPlayTrack}
          onToggleLike={onToggleLike}
          onAddToPlaylist={onAddToPlaylist}
          scrollToTrackId={scrollToTrackId}
          onScrolledToTrack={clearScrollToTrack}
          showFolderHeaders={showFolderHeaders}
          showFolderNames={showFolderNames}
          feedLayout={user.feedLayout ?? "tiles"}
          nextTrackId={nextTrackId}
          onSelectFolder={onSelectFolder}
        />
      ) : tracks.length === 0 ? (
        <section className="cards">
          <div className="empty">
            <h4 className="empty-title">{empty.title}</h4>
            <p>{empty.hint}</p>
          </div>
        </section>
      ) : (
        <VirtualTrackGrid
          tracks={tracks}
          catalogLoading={false}
          activeTrackId={activeTrackId}
          isPlaying={isPlaying}
          livePlayback={livePlayback}
          progressOf={progressOf}
          isLiked={isLiked}
          playlistButtons={playlistButtons}
          onPlayTrack={onPlayTrack}
          onToggleLike={onToggleLike}
          onAddToPlaylist={onAddToPlaylist}
          scrollToTrackId={scrollToTrackId}
          onScrolledToTrack={clearScrollToTrack}
          showFolderHeaders={showFolderHeaders}
          showFolderNames={showFolderNames}
          feedLayout={user.feedLayout ?? "tiles"}
          nextTrackId={nextTrackId}
          onSelectFolder={onSelectFolder}
        />
      )}
      </div>
    </section>
  );
}
