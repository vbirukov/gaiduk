import { useEffect, useState, type Dispatch, RefObject, SetStateAction } from "react";
import { PLAYBACK_RATES } from "../constants/player";
import type { Track } from "../types/catalog";
import type { UserState } from "../types/user";
import { Icon } from "./icons/Icon";
import { IconButton } from "./IconButton";
import { ymGoal } from "../lib/metrika";
import { shareTrack } from "../lib/shareTrack";
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
  onToggleLike: (id: string) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSeek: (value: number) => void;
  onShareToast: (message: string) => void;
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
  onToggleLike,
  onToggleShuffle,
  onCycleRepeat,
  onPrev,
  onNext,
  onTogglePlay,
  onSeek,
  onShareToast,
}: Props) {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  useEffect(() => {
    if (!currentTrack) setNowPlayingOpen(false);
  }, [currentTrack?.id]);

  const liked = currentTrackId ? isLiked(currentTrackId) : false;

  return (
    <>
      <audio
        ref={bindAudioRef}
        className="player-audio-host"
        preload="auto"
        playsInline
        crossOrigin="anonymous"
      />
      {currentTrackId ? (
        <>
          <footer className="player-bar">
            <div className="player-bar-bg" aria-hidden>
              <div className="player-bar-bg__shade" />
            </div>
            <div className="now-box">
              <button
                type="button"
                className="cover cover-btn"
                onClick={() => {
                  if (!currentTrack) return;
                  setNowPlayingOpen(true);
                  ymGoal("now_playing_open");
                }}
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
              <PlayerTimeline
                audioRef={audioRef}
                trackId={currentTrackId}
                onSeek={onSeek}
              />
              <p className="player-hints mini-text">
                Пробел · воспроизведение · ←→ перемотка · N/P треки
              </p>
            </div>
            <div className="right-box">
              <IconButton
                className="btn-wake"
                active={user.wakeLock}
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
              </IconButton>
              <IconButton
                className="btn-like"
                active={liked}
                onClick={() => currentTrackId && onToggleLike(currentTrackId)}
                aria-label={liked ? "Убрать лайк" : "Лайк"}
              >
                <Icon name={liked ? "heart" : "heart-outline"} size={20} />
              </IconButton>
              <IconButton
                className="btn-share"
                disabled={!currentTrack}
                onClick={() => {
                  if (!currentTrack) return;
                  const pos = audioRef.current?.currentTime;
                  void shareTrack({
                    track: currentTrack,
                    positionSec: Number.isFinite(pos) ? pos : undefined,
                  }).then((r) => {
                    if (r === "copied") onShareToast("Ссылка скопирована");
                    if (r === "shared") {
                      ymGoal("track_share", { track_id: currentTrack.id });
                    }
                  });
                }}
                aria-label="Поделиться сказкой"
                title="Поделиться ссылкой"
              >
                <Icon name="share" size={20} />
              </IconButton>
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
            onToggleLike={onToggleLike}
            onToggleShuffle={onToggleShuffle}
            onCycleRepeat={onCycleRepeat}
            onPrev={onPrev}
            onNext={onNext}
            onTogglePlay={onTogglePlay}
            onSeek={onSeek}
          />
        </>
      ) : null}
    </>
  );
}
