import type { Progress } from "../types/user";

/** Сколько секунд вперёд по буферу нужно до старта воспроизведения */
export const PLAY_BUFFER_AHEAD_SEC = 10;

/** Макс. ожидание буфера перед ошибкой (мс) */
export const PLAY_BUFFER_WAIT_MS = 180_000;

export function bufferedAheadSeconds(audio: HTMLAudioElement): number {
  const t = audio.currentTime;
  const b = audio.buffered;
  let ahead = 0;
  for (let i = 0; i < b.length; i++) {
    const start = b.start(i);
    const end = b.end(i);
    if (end > t) {
      ahead = Math.max(ahead, end - Math.max(t, start));
    }
  }
  return ahead;
}

export function minBufferAheadToStart(audio: HTMLAudioElement): number {
  const d = audio.duration;
  if (Number.isFinite(d) && d > 0 && d < PLAY_BUFFER_AHEAD_SEC) {
    return Math.max(0.25, d * 0.98);
  }
  return PLAY_BUFFER_AHEAD_SEC;
}

export function waitForLoadedMetadata(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const to = window.setTimeout(() => {
      cleanup();
      reject(new Error("metadata timeout"));
    }, 60_000);
    const cleanup = () => {
      window.clearTimeout(to);
      audio.removeEventListener("loadedmetadata", on);
    };
    const on = () => {
      cleanup();
      resolve();
    };
    audio.addEventListener("loadedmetadata", on);
  });
}

export function applyResumePosition(
  audio: HTMLAudioElement,
  entry: Progress | undefined,
) {
  if (!entry) return;
  const d = audio.duration || 0;
  if (entry.position > 0 && d > 0 && entry.position < d - 5) {
    audio.currentTime = entry.position;
  }
}

/** Весь файл в буфере браузера (прогрессивная загрузка / стрим до конца). */
export function isAudioFullyBuffered(
  audio: HTMLAudioElement,
  epsilonSec = 0.45,
): boolean {
  const d = audio.duration;
  if (!Number.isFinite(d) || d <= 0) return false;
  const b = audio.buffered;
  if (b.length === 0) return false;
  let maxEnd = 0;
  for (let i = 0; i < b.length; i++) {
    maxEnd = Math.max(maxEnd, b.end(i));
  }
  return maxEnd >= d - epsilonSec;
}

export function maxBufferedEndRatio(audio: HTMLAudioElement): number {
  const d = audio.duration;
  if (!Number.isFinite(d) || d <= 0) return 0;
  let maxEnd = 0;
  const b = audio.buffered;
  for (let i = 0; i < b.length; i++) {
    maxEnd = Math.max(maxEnd, b.end(i));
  }
  return Math.min(1, maxEnd / d);
}

export function waitForBufferAhead(
  audio: HTMLAudioElement,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const { signal } = options ?? {};
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }

  const meets = () =>
    bufferedAheadSeconds(audio) >= minBufferAheadToStart(audio) - 0.05;

  if (meets()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const to = window.setTimeout(() => {
      cleanup();
      reject(new Error("buffer wait timeout"));
    }, PLAY_BUFFER_WAIT_MS);

    const check = () => {
      if (signal?.aborted) {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      if (meets()) {
        cleanup();
        resolve();
      }
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      window.clearTimeout(to);
      audio.removeEventListener("progress", check);
      audio.removeEventListener("loadedmetadata", check);
      audio.removeEventListener("canplay", check);
      audio.removeEventListener("durationchange", check);
      audio.removeEventListener("suspend", check);
      signal?.removeEventListener("abort", onAbort);
    };

    audio.addEventListener("progress", check);
    audio.addEventListener("loadedmetadata", check);
    audio.addEventListener("canplay", check);
    audio.addEventListener("durationchange", check);
    audio.addEventListener("suspend", check);
    signal?.addEventListener("abort", onAbort);
    check();
  });
}
