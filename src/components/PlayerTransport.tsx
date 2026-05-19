import type { UserState } from "../types/user";
import { Icon } from "./icons/Icon";

type Props = {
  user: UserState;
  isPlaying: boolean;
  audioBusy: boolean;
  playButtonLabel: string;
  repeatLabel: string;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  size?: "md" | "lg";
};

export function PlayerTransport({
  user,
  isPlaying,
  audioBusy,
  playButtonLabel,
  repeatLabel,
  onToggleShuffle,
  onCycleRepeat,
  onPrev,
  onTogglePlay,
  onNext,
  size = "md",
}: Props) {
  const icon = size === "lg" ? 24 : 20;
  const playIcon = size === "lg" ? 28 : 24;

  const repeatIcon =
    user.repeatMode === "one"
      ? "repeat-one"
      : user.repeatMode === "all"
        ? "repeat"
        : "repeat-off";

  return (
    <div className={`player-controls${size === "lg" ? " player-controls--lg" : ""}`}>
      <button
        type="button"
        className={`ghost round${user.shuffle ? " active" : ""}`}
        onClick={onToggleShuffle}
        aria-label="Случайный порядок"
        aria-pressed={user.shuffle}
      >
        <Icon name="shuffle" size={icon} />
      </button>
      <button
        type="button"
        className={`ghost round${user.repeatMode !== "off" ? " active" : ""}`}
        onClick={onCycleRepeat}
        aria-label={repeatLabel}
      >
        <Icon name={repeatIcon} size={icon} />
      </button>
      <button type="button" className="ghost round" onClick={onPrev} aria-label="Предыдущий трек">
        <Icon name="skip-back" size={icon} />
      </button>
      <button
        type="button"
        className={`primary round big${audioBusy ? " is-busy" : ""}`}
        onClick={onTogglePlay}
        disabled={audioBusy && !isPlaying}
        aria-label={playButtonLabel}
      >
        {audioBusy ? (
          <Icon name="loader" size={playIcon} className="icon-spin" />
        ) : isPlaying ? (
          <Icon name="pause" size={playIcon} />
        ) : (
          <Icon name="play" size={playIcon} />
        )}
      </button>
      <button type="button" className="ghost round" onClick={onNext} aria-label="Следующий трек">
        <Icon name="skip-forward" size={icon} />
      </button>
    </div>
  );
}
