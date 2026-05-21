import type { UserState } from "../types/user";
import { Icon } from "./icons/Icon";
import { IconButton, PlayPauseIcon } from "./IconButton";

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
  onShare?: () => void;
  shareDisabled?: boolean;
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
  onShare,
  shareDisabled = false,
  size = "md",
}: Props) {
  const icon = size === "lg" ? 24 : 20;
  const playIcon = size === "lg" ? 28 : 24;
  const btnSize = size === "lg" ? "lg" : "md";

  const repeatIcon =
    user.repeatMode === "one"
      ? "repeat-one"
      : user.repeatMode === "all"
        ? "repeat"
        : "repeat-off";

  return (
    <div className={`player-controls${size === "lg" ? " player-controls--lg" : ""}`}>
      <IconButton
        size={btnSize}
        active={user.shuffle}
        onClick={onToggleShuffle}
        aria-label="Случайный порядок"
        aria-pressed={user.shuffle}
      >
        <Icon name="shuffle" size={icon} />
      </IconButton>
      <IconButton
        size={btnSize}
        active={user.repeatMode !== "off"}
        onClick={onCycleRepeat}
        aria-label={repeatLabel}
      >
        <Icon name={repeatIcon} size={icon} />
      </IconButton>
      <IconButton size={btnSize} onClick={onPrev} aria-label="Предыдущий трек">
        <Icon name="skip-back" size={icon} />
      </IconButton>
      <IconButton
        variant="primary"
        size="play"
        className={audioBusy ? "is-busy" : undefined}
        onClick={onTogglePlay}
        disabled={audioBusy && !isPlaying}
        aria-label={playButtonLabel}
      >
        <PlayPauseIcon playing={isPlaying} busy={audioBusy} iconSize={playIcon} />
      </IconButton>
      <IconButton size={btnSize} onClick={onNext} aria-label="Следующий трек">
        <Icon name="skip-forward" size={icon} />
      </IconButton>
      {onShare ? (
        <IconButton
          className="btn-share"
          size={btnSize}
          disabled={shareDisabled}
          onClick={onShare}
          aria-label="Поделиться сказкой"
          title="Поделиться ссылкой"
        >
          <Icon name="share" size={icon} />
        </IconButton>
      ) : null}
    </div>
  );
}
