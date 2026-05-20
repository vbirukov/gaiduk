import { memo, useEffect, useState } from "react";
import { fmtBytes, fmtTime } from "../lib/format";
import { isStubTrack } from "../lib/diskDownload";
import { listenStatus, listenStatusLabel } from "../lib/listenStatus";
import { Icon } from "./icons/Icon";
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
  const ratio = progress.duration
    ? Math.min(100, (progress.position / progress.duration) * 100)
    : 0;
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

  const cardClass = [
    "card",
    `card-status-${status}`,
    isActive && "is-active",
    isActive && isPlaying && "is-playing",
  ]
    .filter(Boolean)
    .join(" ");

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
        </div>
        <button
          type="button"
          className="primary round card-play"
          onClick={(e) => {
            e.stopPropagation();
            onPlayTrack(track);
          }}
          aria-label={playLabel}
        >
          <Icon
            name={isActive && isPlaying ? "pause" : "play"}
            size={22}
          />
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
  if (!progressEqual(prev.progress, next.progress)) return false;
  if (prev.playlistButtons !== next.playlistButtons) return false;
  return (
    prev.onPlayTrack === next.onPlayTrack &&
    prev.onToggleLike === next.onToggleLike &&
    prev.onAddToPlaylist === next.onAddToPlaylist
  );
});
