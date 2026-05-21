import { memo, useEffect, useState } from "react";
import { coverForTrack, DEFAULT_COVER_PATH } from "../lib/cover";
import { fmtTime } from "../lib/format";
import { isStubTrack } from "../lib/diskDownload";
import { listenStatus, listenStatusLabel } from "../lib/listenStatus";
import { Icon } from "./icons/Icon";
import { IconButton, PlayPauseIcon } from "./IconButton";
import { TrackCover } from "./TrackCover";
import type { Track } from "../types/catalog";
import type { Playlist, Progress } from "../types/user";

export type TrackCardProps = {
  track: Track;
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

  const progressHint = isActive
    ? isPlaying
      ? progress.position > 0
        ? `Сейчас играет · ${fmtTime(progress.position)}`
        : "Сейчас играет"
      : progress.position > 0
        ? `На паузе · ${fmtTime(progress.position)}`
        : "На паузе"
    : progress.position > 0
      ? `С последнего раза: ${fmtTime(progress.position)}`
      : "Еще не запускали";

  const thumbPlay = coverForTrack(track) === DEFAULT_COVER_PATH;

  const cardClass = [
    "card",
    `card-status-${status}`,
    isActive && "is-active",
    isActive && isPlaying && "is-playing",
    thumbPlay && "card--thumb-play",
  ]
    .filter(Boolean)
    .join(" ");

  const progressPct =
    progress.duration > 0
      ? Math.min(100, Math.round((progress.position / progress.duration) * 100))
      : 0;

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
    if (status === "in-progress") {
      const label =
        progress.duration > 0
          ? `${progressPct}%`
          : progress.position > 0
            ? fmtTime(progress.position)
            : "···";
      return (
        <span
          className="card-badge card-badge--progress"
          title={listenStatusLabel["in-progress"]}
          aria-label={`${listenStatusLabel["in-progress"]}, ${label}`}
        >
          {label}
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
        <div className="card-aside">
          {thumbPlay ? (
            <IconButton
              variant="primary"
              size="md"
              className="card-thumb card-thumb-play"
              onClick={handlePlayClick}
              aria-label={playLabel}
            >
              <PlayPauseIcon
                playing={isActive && isPlaying}
                busy={false}
                iconSize={22}
              />
            </IconButton>
          ) : (
            <TrackCover track={track} size="lg" className="card-thumb" />
          )}
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
        </div>
        <div className="card-main">
          <div className="card-pills">
            <div className="pill">{track.folder}</div>
            {renderStatusBadge()}
          </div>
          <h4 className="card-title">{track.title}</h4>
        </div>
      </div>
      <div className="mini-meta">
        <span className={isActive ? "mini-meta-now" : undefined}>
          {progressHint}
        </span>
      </div>
      <div className="card-actions row-actions wrap">
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
        {playlistButtons.map((pl) => (
          <button
            key={pl.id}
            type="button"
            className="tag"
            onClick={() => onAddToPlaylist(pl.id, track.id)}
          >
            + {pl.name}
          </button>
        ))}
      </div>
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
