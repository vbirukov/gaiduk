import { useEffect, type RefObject } from "react";

function syncMediaSessionPlaying() {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "playing";
  }
}

/** Держит воспроизведение при блокировке экрана / уходе вкладки в фон. */
export function useBackgroundPlayback(
  audio: HTMLAudioElement | null,
  playbackIntentRef: RefObject<boolean>,
) {
  useEffect(() => {
    if (!audio) return;

    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const tryResume = () => {
      if (!playbackIntentRef.current || !audio.paused || audio.ended) return;
      syncMediaSessionPlaying();
      void audio.play().catch(() => {});
    };

    const scheduleRetries = () => {
      clearTimeout(retryTimer);
      tryResume();
      retryTimer = setTimeout(tryResume, 400);
      setTimeout(tryResume, 1200);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") scheduleRetries();
    };

    const onPageHide = () => scheduleRetries();

    const onPause = () => {
      if (document.visibilityState === "hidden" && playbackIntentRef.current) {
        scheduleRetries();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    audio.addEventListener("pause", onPause);

    return () => {
      clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      audio.removeEventListener("pause", onPause);
    };
  }, [audio, playbackIntentRef]);
}

export function configureBackgroundAudioElement(audio: HTMLAudioElement) {
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.setAttribute("x-webkit-airplay", "allow");
  audio.setAttribute("referrerpolicy", "no-referrer");
}
