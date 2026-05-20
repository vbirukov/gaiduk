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

const RESUME_END_RATIO = 0.97;

/** Секунда, с которой продолжить, или null (с начала). */
export function getResumePositionSec(
  entry: Progress | undefined,
  mediaDuration: number,
): number | null {
  if (!entry || entry.completed || entry.position <= 0) return null;

  const d =
    Number.isFinite(mediaDuration) && mediaDuration > 0
      ? mediaDuration
      : entry.duration > 0
        ? entry.duration
        : 0;

  if (d <= 0) return entry.position;

  const pos = Math.min(entry.position, Math.max(0, d - 0.5));
  if (pos < 2) return null;
  if (pos / d >= RESUME_END_RATIO) return null;

  return pos;
}

export function applyResumePosition(
  audio: HTMLAudioElement,
  entry: Progress | undefined,
): number | null {
  const target = getResumePositionSec(entry, audio.duration);
  if (target == null) return null;
  if (Math.abs(audio.currentTime - target) < 0.35) return target;
  audio.currentTime = target;
  return target;
}

export function isTimeBuffered(
  audio: HTMLAudioElement,
  time: number,
  epsilonSec = 0.25,
): boolean {
  const b = audio.buffered;
  for (let i = 0; i < b.length; i++) {
    if (time + epsilonSec >= b.start(i) && time <= b.end(i) + epsilonSec) {
      return true;
    }
  }
  return false;
}

export function waitForSeeked(
  audio: HTMLAudioElement,
  timeoutMs = 20_000,
): Promise<void> {
  if (!audio.seeking) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const to = window.setTimeout(() => {
      cleanup();
      reject(new Error("seek timeout"));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(to);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("error", onErr);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("seek failed"));
    };
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("error", onErr, { once: true });
  });
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

  const meets = () => {
    if (isAudioFullyBuffered(audio)) return true;
    const t = audio.currentTime;
    if (t > 0.5 && isTimeBuffered(audio, t)) {
      const need = Math.min(2, minBufferAheadToStart(audio));
      return bufferedAheadSeconds(audio) >= need - 0.05;
    }
    return bufferedAheadSeconds(audio) >= minBufferAheadToStart(audio) - 0.05;
  };

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
      audio.removeEventListener("seeked", check);
      signal?.removeEventListener("abort", onAbort);
    };

    audio.addEventListener("progress", check);
    audio.addEventListener("loadedmetadata", check);
    audio.addEventListener("canplay", check);
    audio.addEventListener("durationchange", check);
    audio.addEventListener("suspend", check);
    audio.addEventListener("seeked", check);
    signal?.addEventListener("abort", onAbort);
    check();
  });
}
