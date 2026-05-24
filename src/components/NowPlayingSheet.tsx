import { useEffect, type RefObject } from "react";
import type { Track } from "../types/catalog";
import type { UserState } from "../types/user";
import { Icon } from "./icons/Icon";
import { IconButton } from "./IconButton";
import { PlayerTimeline } from "./PlayerTimeline";
import { PlayerTransport } from "./PlayerTransport";
import { TrackCover } from "./TrackCover";

type Props = {
  open: boolean;
  onClose: () => void;
  track: Track | null;
  currentTrackId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  user: UserState;
  isPlaying: boolean;
  audioBusy: boolean;
  playButtonLabel: string;
  repeatLabel: string;
  isLiked: (id: string) => boolean;
  onToggleLike: (id: string) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSeek: (value: number) => void;
  onShare?: () => void;
  shareDisabled?: boolean;
  onEmbedCopy?: () => void;
  embedDisabled?: boolean;
};

export function NowPlayingSheet({
  open,
  onClose,
  track,
  currentTrackId,
  audioRef,
  user,
  isPlaying,
  audioBusy,
  playButtonLabel,
  repeatLabel,
  isLiked,
  onToggleLike,
  onToggleShuffle,
  onCycleRepeat,
  onPrev,
  onNext,
  onTogglePlay,
  onSeek,
  onShare,
  shareDisabled = false,
  onEmbedCopy,
  embedDisabled = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !track) return null;

  const liked = currentTrackId ? isLiked(currentTrackId) : false;

  return (
    <div
      className="now-playing-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Сейчас играет"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="now-playing-sheet">
        <header className="now-playing-head">
          <IconButton onClick={onClose} aria-label="Закрыть">
            <Icon name="close" size={22} />
          </IconButton>
        </header>
        <div className="now-playing-art">
          <TrackCover track={track} size="xl" />
        </div>
        <div className="now-playing-meta">
          <p className="eyebrow">{track.folder}</p>
          <h2>{track.title}</h2>
          <p className="mini-text">{track.fileName}</p>
        </div>
        <PlayerTimeline
          audioRef={audioRef}
          trackId={currentTrackId}
          onSeek={onSeek}
        />
        <PlayerTransport
          user={user}
          isPlaying={isPlaying}
          audioBusy={audioBusy}
          playButtonLabel={playButtonLabel}
          repeatLabel={repeatLabel}
          onToggleShuffle={onToggleShuffle}
          onCycleRepeat={onCycleRepeat}
          onPrev={onPrev}
          onTogglePlay={onTogglePlay}
          onNext={onNext}
          onShare={onShare}
          shareDisabled={shareDisabled}
          onEmbedCopy={onEmbedCopy}
          embedDisabled={embedDisabled}
          size="lg"
        />
        <div className="now-playing-actions row-actions">
          <IconButton
            active={liked}
            onClick={() => currentTrackId && onToggleLike(currentTrackId)}
            aria-label={liked ? "Убрать лайк" : "Лайк"}
          >
            <Icon name={liked ? "heart" : "heart-outline"} size={22} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
