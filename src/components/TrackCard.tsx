import { memo } from "react";
import { fmtBytes, fmtTime } from "../lib/format";
import { isStubTrack } from "../lib/diskDownload";
import type { Track } from "../types/catalog";
import type { Playlist, Progress } from "../types/user";

export type TrackCardProps = {
  track: Track;
  progress: Progress;
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

  return (
    <article className="card" data-track-id={track.id}>
      <div className="card-top">
        <div>
          <div className="pill">{track.folder}</div>
          <h4>{track.title}</h4>
          <p className="mini-text">{track.fileName}</p>
        </div>
        <div className="row-actions">
          <button
            type="button"
            className="ghost round"
            onClick={() => onToggleLike(track.id)}
          >
            {liked ? "♥" : "♡"}
          </button>
          <button
            type="button"
            className="ghost round"
            onClick={() => onToggleFavorite(track.id)}
          >
            {favorite ? "★" : "☆"}
          </button>
        </div>
      </div>
      <div className="mini-meta">
        <span>{fmtBytes(track.size)}</span>
        <span>
          {progress.position > 0
            ? `С последнего раза: ${fmtTime(progress.position)}`
            : "Еще не запускали"}
        </span>
      </div>
      <div className="progress-line">
        <span style={{ width: `${ratio}%` }} />
      </div>
      <div className="row-actions wrap">
        <button
          type="button"
          className="primary"
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
