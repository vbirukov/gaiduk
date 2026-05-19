import { useEffect, useState, type Dispatch, RefObject, SetStateAction } from "react";
import { PLAYBACK_RATES } from "../constants/player";
import type { Track } from "../types/catalog";
import type { UserState } from "../types/user";
import { Icon } from "./icons/Icon";
import { NowPlayingSheet } from "./NowPlayingSheet";
import { PlayerTimeline } from "./PlayerTimeline";
import { PlayerTransport } from "./PlayerTransport";
import { TrackCover } from "./TrackCover";

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
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  useEffect(() => {
    if (!currentTrack) setNowPlayingOpen(false);
  }, [currentTrack?.id]);

  const liked = currentTrackId ? isLiked(currentTrackId) : false;
  const favorite = currentTrackId ? isFavorite(currentTrackId) : false;

  return (
    <>
      <footer className="player-bar">
        <div className="now-box">
          <button
            type="button"
            className="cover cover-btn"
            onClick={() => currentTrack && setNowPlayingOpen(true)}
            disabled={!currentTrack}
            aria-label={currentTrack ? "Открыть сейчас играет" : undefined}
          >
            <TrackCover track={currentTrack} size="md" />
          </button>
          <div className="now-box-text">
            <strong>{currentTrack?.title ?? "Ничего не выбрано"}</strong>
            <div className="mini-text">
              {currentTrack?.folder ?? "Выберите сказку из каталога"}
            </div>
          </div>
        </div>
        <div className="center-box">
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
          />
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
            <Icon name="wake" size={20} />
          </button>
          <button
            type="button"
            className={`ghost round btn-like${liked ? " active" : ""}`}
            onClick={() => currentTrackId && onToggleLike(currentTrackId)}
            aria-label={liked ? "Убрать лайк" : "Лайк"}
          >
            <Icon name={liked ? "heart" : "heart-outline"} size={20} />
          </button>
          <button
            type="button"
            className={`ghost round btn-favorite${favorite ? " active" : ""}`}
            onClick={() => currentTrackId && onToggleFavorite(currentTrackId)}
            aria-label={favorite ? "Убрать из избранного" : "В избранное"}
          >
            <Icon name={favorite ? "star" : "star-outline"} size={20} />
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
      <NowPlayingSheet
        open={nowPlayingOpen}
        onClose={() => setNowPlayingOpen(false)}
        track={currentTrack}
        currentTrackId={currentTrackId}
        audioRef={audioRef}
        user={user}
        isPlaying={isPlaying}
        audioBusy={audioBusy}
        playButtonLabel={playButtonLabel}
        repeatLabel={repeatLabel}
        isLiked={isLiked}
        isFavorite={isFavorite}
        onToggleLike={onToggleLike}
        onToggleFavorite={onToggleFavorite}
        onToggleShuffle={onToggleShuffle}
        onCycleRepeat={onCycleRepeat}
        onPrev={onPrev}
        onNext={onNext}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
      />
    </>
  );
}
