import { memo, useEffect, useState } from "react";
import { fmtTime } from "../lib/format";
import { isStubTrack } from "../lib/diskDownload";
import { listenStatus, listenStatusLabel } from "../lib/listenStatus";
import { Icon } from "./icons/Icon";
import { CardPlaylistMenu } from "./CardPlaylistMenu";
import { IconButton, PlayPauseIcon } from "./IconButton";
import type { Track } from "../types/catalog";
import type { Playlist, Progress } from "../types/user";

export type TrackCardProps = {
  track: Track;
  showFolderName?: boolean;
  progress: Progress;
  isActive: boolean;
  isPlaying: boolean;
  liked: boolean;
  playlistButtons: Playlist[];
  onPlayTrack: (track: Track) => void;
  onToggleLike: (id: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
};

function TrackCardInner({
  track,
  showFolderName = false,
  progress,
  isActive,
  isPlaying,
  liked,
  playlistButtons,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
}: TrackCardProps) {
  const status = listenStatus(progress);
  const [mobileTapPlay, setMobileTapPlay] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 720px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setMobileTapPlay(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const cardClass = [
    "card",
    `card-status-${status}`,
    isActive && "is-active",
    isActive && isPlaying && "is-playing",
  ]
    .filter(Boolean)
    .join(" ");

  const progressBadgeLabel =
    progress.position > 0 ? fmtTime(progress.position) : "···";

  const renderProgressBadge = () => {
    if (isActive || status !== "in-progress") return null;
    return (
      <span
        className="card-badge card-badge--progress card-badge--corner"
        title={listenStatusLabel["in-progress"]}
        aria-label={`${listenStatusLabel["in-progress"]}, ${progressBadgeLabel}`}
      >
        {progressBadgeLabel}
      </span>
    );
  };

  const renderStatusBadge = () => {
    if (isActive) {
      return (
        <span
          className={`card-badge card-badge--live${isPlaying ? " is-playing" : ""}`}
          aria-live="polite"
        >
          {isPlaying ? "Сейчас" : "Пауза"}
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span
          className="card-badge card-badge--completed"
          title={listenStatusLabel.completed}
          aria-label={listenStatusLabel.completed}
        >
          <Icon name="check" size={11} />
        </span>
      );
    }
    return null;
  };

  const playLabel = isStubTrack(track)
    ? "Подготовлено"
    : isActive && isPlaying
      ? "Пауза"
      : isActive
        ? "Продолжить"
        : "Слушать";

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!mobileTapPlay) return;
    if ((e.target as HTMLElement).closest("button, a")) return;
    onPlayTrack(track);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!mobileTapPlay) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    if ((e.target as HTMLElement).closest("button, a")) return;
    e.preventDefault();
    onPlayTrack(track);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayTrack(track);
  };

  return (
    <article
      className={cardClass}
      data-track-id={track.id}
      aria-current={isActive ? "true" : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={mobileTapPlay ? 0 : undefined}
      aria-label={`${track.title}, ${track.folder}. ${playLabel}`}
    >
      <div className="card-bg" aria-hidden>
        <div className="card-bg__shade" />
      </div>
      <div className="card-top">
        <div className="card-main">
          <div className="card-pills">
            {showFolderName ? <div className="pill">{track.folder}</div> : null}
            {renderStatusBadge()}
          </div>
          <h4 className="card-title">{track.title}</h4>
        </div>
      </div>
      <div className="card-actions row-actions wrap">
        <div className="card-social row-actions">
          <button
            type="button"
            className={`ghost round${liked ? " active" : ""}`}
            onClick={() => onToggleLike(track.id)}
            aria-label={liked ? "Убрать лайк" : "Лайк"}
          >
            <Icon name={liked ? "heart" : "heart-outline"} size={20} />
          </button>
        </div>
        <IconButton
          variant="primary"
          size="md"
          className="card-play"
          onClick={handlePlayClick}
          aria-label={playLabel}
        >
          <PlayPauseIcon
            playing={isActive && isPlaying}
            busy={false}
            iconSize={22}
          />
        </IconButton>
        <CardPlaylistMenu
          trackId={track.id}
          playlists={playlistButtons}
          onSelect={onAddToPlaylist}
        />
      </div>
      {renderProgressBadge()}
    </article>
  );
}

function progressEqual(a: Progress, b: Progress) {
  return (
    a.position === b.position &&
    a.duration === b.duration &&
    a.completed === b.completed
  );
}

export const TrackCard = memo(TrackCardInner, (prev, next) => {
  if (prev.track !== next.track) return false;
  if (prev.showFolderName !== next.showFolderName) return false;
  if (prev.isActive !== next.isActive) return false;
  if (prev.isPlaying !== next.isPlaying) return false;
  if (prev.liked !== next.liked) return false;
  if (!progressEqual(prev.progress, next.progress)) return false;
  if (prev.playlistButtons !== next.playlistButtons) return false;
  return (
    prev.onPlayTrack === next.onPlayTrack &&
    prev.onToggleLike === next.onToggleLike &&
    prev.onAddToPlaylist === next.onAddToPlaylist
  );
});
