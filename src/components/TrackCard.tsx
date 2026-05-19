import { memo } from "react";
import { fmtBytes, fmtTime } from "../lib/format";
import { isStubTrack } from "../lib/diskDownload";
import { listenStatus, listenStatusLabel } from "../lib/listenStatus";
import { Icon } from "./icons/Icon";
import { ASSETS } from "../lib/assets";
import { TrackCover } from "./TrackCover";
import type { Track } from "../types/catalog";
import type { Playlist, Progress } from "../types/user";

export type TrackCardProps = {
  track: Track;
  progress: Progress;
  isActive: boolean;
  isPlaying: boolean;
  liked: boolean;
  favorite: boolean;
  playlistButtons: Playlist[];
  onPlayTrack: (track: Track) => void;
  onToggleLike: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
};

function TrackCardInner({
  track,
  progress,
  isActive,
  isPlaying,
  liked,
  favorite,
  playlistButtons,
  onPlayTrack,
  onToggleLike,
  onToggleFavorite,
  onAddToPlaylist,
}: TrackCardProps) {
  const ratio = progress.duration
    ? Math.min(100, (progress.position / progress.duration) * 100)
    : 0;
  const status = listenStatus(progress);

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

  const cardClass = [
    "card",
    `card-status-${status}`,
    isActive && "is-active",
    isActive && isPlaying && "is-playing",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={cardClass}
      data-track-id={track.id}
      aria-current={isActive ? "true" : undefined}
    >
      <div className="card-bg" aria-hidden>
        <img src={ASSETS.trackBg} alt="" decoding="async" />
        <div className="card-bg__shade" />
      </div>
      <div className="card-top">
        <TrackCover track={track} size="lg" className="card-thumb" />
        <div className="card-main">
          {isActive ? (
            <div className="card-now-playing" aria-live="polite">
              {isPlaying ? "Сейчас играет" : "На паузе"}
            </div>
          ) : null}
          <div className="card-pills">
            <div className="pill">{track.folder}</div>
            {!isActive && status !== "unstarted" ? (
              <span
                className={`status-mark status-mark--${status}`}
                title={listenStatusLabel[status]}
                aria-label={listenStatusLabel[status]}
              >
                {status === "completed" ? (
                  <Icon name="check" size={12} />
                ) : (
                  <span className="status-mark-dot" aria-hidden="true" />
                )}
              </span>
            ) : null}
          </div>
          <h4>{track.title}</h4>
        </div>
      </div>
      <div className="mini-meta">
        <span>{fmtBytes(track.size)}</span>
        <span className={isActive ? "mini-meta-now" : undefined}>
          {progressHint}
        </span>
      </div>
      <div
        className={`progress-line progress-line--${status}${isActive && isPlaying ? " is-live" : ""}`}
      >
        <span style={{ width: `${ratio}%` }} />
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
          <button
            type="button"
            className={`ghost round${favorite ? " active" : ""}`}
            onClick={() => onToggleFavorite(track.id)}
            aria-label={favorite ? "Убрать из избранного" : "В избранное"}
          >
            <Icon name={favorite ? "star" : "star-outline"} size={20} />
          </button>
        </div>
        <button
          type="button"
          className="primary card-play"
          onClick={() => onPlayTrack(track)}
        >
          {isStubTrack(track) ? "Подготовлено" : "Слушать"}
        </button>
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
  if (prev.favorite !== next.favorite) return false;
  if (!progressEqual(prev.progress, next.progress)) return false;
  if (prev.playlistButtons !== next.playlistButtons) return false;
  return (
    prev.onPlayTrack === next.onPlayTrack &&
    prev.onToggleLike === next.onToggleLike &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.onAddToPlaylist === next.onAddToPlaylist
  );
});
