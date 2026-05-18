import { useEffect, type RefObject } from "react";

type TrackInfo = {
  id: string;
  title: string;
  folder: string;
} | null;

export type MediaSessionHandlers = {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
};

export function useMediaSession(
  track: TrackInfo,
  audioRef: RefObject<HTMLAudioElement | null>,
  handlersRef: RefObject<MediaSessionHandlers>,
) {
  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.folder,
      album: "Gayduk — аудиосказки",
    });
  }, [track?.id, track?.title, track?.folder]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const set = (action: MediaSessionAction, fn: (() => void) | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {
        /* Safari */
      }
    };
    set("play", () => handlersRef.current.onPlay());
    set("pause", () => handlersRef.current.onPause());
    set("previoustrack", () => handlersRef.current.onPrev());
    set("nexttrack", () => handlersRef.current.onNext());
    set("seekbackward", () => handlersRef.current.onSeekBackward());
    set("seekforward", () => handlersRef.current.onSeekForward());
    return () => {
      set("play", null);
      set("pause", null);
      set("previoustrack", null);
      set("nexttrack", null);
      set("seekbackward", null);
      set("seekforward", null);
    };
  }, [handlersRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track || !("mediaSession" in navigator)) return;
    const syncState = () => {
      navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
      if ("setPositionState" in navigator.mediaSession && audio.duration) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: Math.min(audio.currentTime, audio.duration),
          });
        } catch {
          /* invalid state */
        }
      }
    };
    syncState();
    audio.addEventListener("play", syncState);
    audio.addEventListener("pause", syncState);
    audio.addEventListener("timeupdate", syncState);
    audio.addEventListener("ratechange", syncState);
    return () => {
      audio.removeEventListener("play", syncState);
      audio.removeEventListener("pause", syncState);
      audio.removeEventListener("timeupdate", syncState);
      audio.removeEventListener("ratechange", syncState);
    };
  }, [audioRef, track?.id]);
}
