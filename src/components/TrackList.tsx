import { useMemo } from "react";
import { useHeroCollapsed } from "../hooks/useHeroCollapsed";
import { emptyStateCopy } from "../lib/emptyState";
import type { Catalog, Track } from "../types/catalog";
import type { LibraryView, Progress, UserState } from "../types/user";
import type { LivePlayback } from "../lib/trackProgress";
import type { TrackCardProps } from "./TrackCard";
import { ContinueBanner } from "./ContinueBanner";
import { LibraryHero } from "./LibraryHero";
import { VirtualTrackGrid } from "./VirtualTrackGrid";

type Props = {
  catalog: Catalog;
  user: UserState;
  tracks: Track[];
  view: LibraryView;
  selectedFolder: string | null;
  selectedPlaylist: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  resumeCount: number;
  resumeTrack: Track | null;
  catalogLoading: boolean;
  sectionTitle: string;
  sectionSub: string;
  activeTrackId: string | null;
  isPlaying: boolean;
  livePlayback: LivePlayback | null;
  progressOf: (id: string) => Progress;
  isLiked: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onPlayTrack: TrackCardProps["onPlayTrack"];
  onToggleLike: TrackCardProps["onToggleLike"];
  onToggleFavorite: TrackCardProps["onToggleFavorite"];
  onAddToPlaylist: TrackCardProps["onAddToPlaylist"];
  onQuickView: (view: "resume" | "favorites" | "liked") => void;
};

export function TrackList({
  catalog,
  user,
  tracks,
  view,
  selectedFolder,
  selectedPlaylist,
  query,
  onQueryChange,
  resumeCount,
  resumeTrack,
  catalogLoading,
  sectionTitle,
  sectionSub,
  activeTrackId,
  isPlaying,
  livePlayback,
  progressOf,
  isLiked,
  isFavorite,
  onPlayTrack,
  onToggleLike,
  onToggleFavorite,
  onAddToPlaylist,
  onQuickView,
}: Props) {
  const { collapsed, collapse, expand } = useHeroCollapsed();
  const playlistButtons = useMemo(
    () => user.playlists.filter((pl) => !pl.system).slice(0, 3),
    [user.playlists],
  );

  const playlistName =
    user.playlists.find((p) => p.id === selectedPlaylist)?.name ?? "";

  const empty = emptyStateCopy({
    view,
    query,
    selectedFolder,
    selectedPlaylist,
    playlistName,
  });

  const showContinueBanner =
    Boolean(resumeTrack) &&
    view === "all" &&
    !selectedFolder &&
    !query.trim();

  return (
    <>
      <LibraryHero
        catalog={catalog}
        user={user}
        resumeCount={resumeCount}
        query={query}
        collapsed={collapsed}
        onQueryChange={onQueryChange}
        onCollapse={collapse}
        onExpand={expand}
        onQuickView={onQuickView}
      />
      {showContinueBanner && resumeTrack ? (
        <ContinueBanner
          track={resumeTrack}
          progress={progressOf(resumeTrack.id)}
          onContinue={onPlayTrack}
        />
      ) : null}
      <section className="section-head">
        <div>
          <h3>{sectionTitle}</h3>
          <p>{sectionSub}</p>
        </div>
        <div className="mini-text">
          {catalogLoading ? "Загрузка…" : `${tracks.length} элементов`}
        </div>
      </section>
      {catalogLoading ? (
        <VirtualTrackGrid
          tracks={[]}
          catalogLoading
          activeTrackId={activeTrackId}
          isPlaying={isPlaying}
          livePlayback={livePlayback}
          progressOf={progressOf}
          isLiked={isLiked}
          isFavorite={isFavorite}
          playlistButtons={playlistButtons}
          onPlayTrack={onPlayTrack}
          onToggleLike={onToggleLike}
          onToggleFavorite={onToggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
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
          isFavorite={isFavorite}
          playlistButtons={playlistButtons}
          onPlayTrack={onPlayTrack}
          onToggleLike={onToggleLike}
          onToggleFavorite={onToggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
        />
      )}
    </>
  );
}
