import type { Dispatch, RefObject, SetStateAction } from "react";
import { PLAYBACK_RATES } from "../constants/player";
import type { Track } from "../types/catalog";
import type { UserState } from "../types/user";
import { PlayerTimeline } from "./PlayerTimeline";

type Props = {
  currentTrack: Track | null;
  currentTrackId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  bindAudioRef: (el: HTMLAudioElement | null) => void;
  user: UserState;
  setUser: Dispatch<SetStateAction<UserState>>;
  isPlaying: boolean;
  audioBusy: boolean;
  playButtonLabel: string;
  repeatLabel: string;
  isLiked: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onToggleLike: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSeek: (value: number) => void;
};

export function PlayerBar({
  currentTrack,
  currentTrackId,
  audioRef,
  bindAudioRef,
  user,
  setUser,
  isPlaying,
  audioBusy,
  playButtonLabel,
  repeatLabel,
  isLiked,
  isFavorite,
  onToggleLike,
  onToggleFavorite,
  onToggleShuffle,
  onCycleRepeat,
  onPrev,
  onNext,
  onTogglePlay,
  onSeek,
}: Props) {
  return (
    <footer className="player-bar">
      <div className="now-box">
        <div className="cover">♪</div>
        <div>
          <strong>{currentTrack?.title ?? "Ничего не выбрано"}</strong>
          <div className="mini-text">
            {currentTrack?.folder ?? "Выберите сказку из каталога"}
          </div>
        </div>
      </div>
      <div className="center-box">
        <div className="player-controls">
          <button
            type="button"
            className={`ghost round${user.shuffle ? " active" : ""}`}
            onClick={onToggleShuffle}
            aria-label="Случайный порядок"
            aria-pressed={user.shuffle}
          >
            🔀
          </button>
          <button
            type="button"
            className={`ghost round${user.repeatMode !== "off" ? " active" : ""}`}
            onClick={onCycleRepeat}
            aria-label={repeatLabel}
          >
            {user.repeatMode === "one"
              ? "🔂"
              : user.repeatMode === "all"
                ? "🔁"
                : "↻"}
          </button>
          <button
            type="button"
            className="ghost round"
            onClick={onPrev}
            aria-label="Предыдущий трек"
          >
            ⏮
          </button>
          <button
            type="button"
            className={`primary round big${audioBusy ? " is-busy" : ""}`}
            onClick={onTogglePlay}
            disabled={audioBusy && !isPlaying}
            aria-label={playButtonLabel}
          >
            {audioBusy ? "◌" : isPlaying ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            className="ghost round"
            onClick={onNext}
            aria-label="Следующий трек"
          >
            ⏭
          </button>
        </div>
        <PlayerTimeline audioRef={audioRef} onSeek={onSeek} />
        <p className="player-hints mini-text">
          Пробел · воспроизведение · ←→ перемотка · N/P треки
        </p>
      </div>
      <div className="right-box">
        <button
          type="button"
          className={`ghost round btn-wake${user.wakeLock ? " active" : ""}`}
          onClick={() =>
            setUser((prev) => ({ ...prev, wakeLock: !prev.wakeLock }))
          }
          aria-label={
            user.wakeLock ? "Экран не гасить: вкл" : "Экран не гасить: выкл"
          }
          aria-pressed={user.wakeLock}
          title="Не давать экрану погаснуть"
        >
          ◉
        </button>
        <button
          type="button"
          className="ghost round btn-like"
          onClick={() => currentTrackId && onToggleLike(currentTrackId)}
        >
          {currentTrackId && isLiked(currentTrackId) ? "♥" : "♡"}
        </button>
        <button
          type="button"
          className="ghost round btn-favorite"
          onClick={() => currentTrackId && onToggleFavorite(currentTrackId)}
        >
          {currentTrackId && isFavorite(currentTrackId) ? "★" : "☆"}
        </button>
        <label className="speed">
          <span>Скорость</span>
          <select
            value={user.playbackRate}
            onChange={(e) => {
              const rate = Number(e.target.value);
              if (audioRef.current) audioRef.current.playbackRate = rate;
              setUser((prev) => ({ ...prev, playbackRate: rate }));
            }}
          >
            {PLAYBACK_RATES.map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>
        <label className="volume">
          <span>Громкость</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={user.volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (audioRef.current) audioRef.current.volume = v;
              setUser((prev) => ({ ...prev, volume: v }));
            }}
          />
        </label>
      </div>
      <audio
        ref={bindAudioRef}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
      />
    </footer>
  );
}
