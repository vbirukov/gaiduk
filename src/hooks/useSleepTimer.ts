/**
 * Sleep timer — таймер сна с плавным затуханием громкости.
 *
 * Логика:
 *   1. Пользователь выбирает длительность (15/30/60 мин).
 *   2. Таймер отсчитывает. За FADE_DURATION_MS до конца начинается fade:
 *      громкость линейно снижается от текущей до 0.
 *   3. По истечении — audio.pause().
 *   4. Отмена (кнопка/касание) — восстановление исходной громкости.
 *
 * Доступ к аудио-элементу движка через DOM:
 *   document.querySelector("audio.player-audio-host")
 * (класс стабилен в @vbirukov/player@0.4.4, PlayerBar.tsx:118).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type SleepTimerState = "off" | "running" | "fading";

export type SleepTimerOption = {
  label: string;
  minutes: number;
};

const STORAGE_KEY = "gayduk-sleep-timer-v1";

/** Preset-опции таймера. */
export const SLEEP_TIMER_OPTIONS: SleepTimerOption[] = [
  { label: "15 мин", minutes: 15 },
  { label: "30 мин", minutes: 30 },
  { label: "60 мин", minutes: 60 },
];

/** Длительность фейда в миллисекундах. */
const FADE_DURATION_MS = 30_000;

/** Интервал шага фейда (мс). */
const FADE_STEP_MS = 500;

interface StoredTimer {
  /** Когда таймер должен сработать (Date.now() timestamp). */
  expiresAt: number;
  /** Исходная громкость перед началом фейда. */
  originalVolume: number;
  /** Выбранные минуты. */
  minutes: number;
}

function getAudioElement(): HTMLAudioElement | null {
  return document.querySelector("audio.player-audio-host");
}

function loadStoredTimer(): StoredTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTimer>;
    if (
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.originalVolume !== "number" ||
      typeof parsed.minutes !== "number"
    ) {
      return null;
    }
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as StoredTimer;
  } catch {
    return null;
  }
}

function saveTimer(timer: StoredTimer): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  } catch {
    /* private mode */
  }
}

function clearStoredTimer(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function useSleepTimer() {
  const [state, setState] = useState<SleepTimerState>("off");
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(0);

  // Ref — чтобы следить за актуальной фазой внутри локальных таймеров
  // (избегаем stale-closure при чтении `state` в callback).
  const phaseRef = useRef<SleepTimerState>("off");

  // Рефы активных таймеров (для очистки при unmount/cancel).
  // В браузере setInterval/setTimeout возвращают number.
  const timersRef = useRef<{
    countdown: number | null;
    fade: number | null;
    fadeTimeout: number | null;
  }>({
    countdown: null,
    fade: null,
    fadeTimeout: null,
  });

  const originalVolumeRef = useRef<number>(1);

  const clearAllTimers = useCallback(() => {
    if (timersRef.current.countdown) {
      clearInterval(timersRef.current.countdown);
      timersRef.current.countdown = null;
    }
    if (timersRef.current.fade) {
      clearInterval(timersRef.current.fade);
      timersRef.current.fade = null;
    }
    if (timersRef.current.fadeTimeout) {
      clearTimeout(timersRef.current.fadeTimeout);
      timersRef.current.fadeTimeout = null;
    }
  }, []);

  const restoreVolume = useCallback(() => {
    const audio = getAudioElement();
    if (audio) {
      audio.volume = originalVolumeRef.current;
    }
  }, []);

  const setPhase = useCallback((next: SleepTimerState) => {
    phaseRef.current = next;
    setState(next);
  }, []);

  // Полная остановка: очистка таймеров, восстановление громкости, сброс.
  const stopAndReset = useCallback(() => {
    clearAllTimers();
    restoreVolume();
    clearStoredTimer();
    setPhase("off");
    setRemainingSec(0);
  }, [clearAllTimers, restoreVolume, setPhase]);

  // Запуск фейда: плавное снижение громкости до 0 за FADE_DURATION_MS.
  const startFade = useCallback(() => {
    setPhase("fading");

    const audio = getAudioElement();
    if (!audio) {
      // Нет аудио-элемента — просто пауза после задержки.
      timersRef.current.fadeTimeout = window.setTimeout(() => {
        const a = getAudioElement();
        a?.pause();
        clearStoredTimer();
        setPhase("off");
        setRemainingSec(0);
      }, FADE_DURATION_MS);
      return;
    }

    originalVolumeRef.current = audio.volume;
    const startVolume = audio.volume;
    const fadeStart = Date.now();

    timersRef.current.fade = window.setInterval(() => {
      const elapsed = Date.now() - fadeStart;
      const progress = Math.min(elapsed / FADE_DURATION_MS, 1);
      audio.volume = Math.max(0, startVolume * (1 - progress));

      if (progress >= 1) {
        if (timersRef.current.fade) {
          clearInterval(timersRef.current.fade);
          timersRef.current.fade = null;
        }
        audio.pause();
        audio.volume = startVolume; // восстановим на случай возобновления
        clearStoredTimer();
        setPhase("off");
        setRemainingSec(0);
      }
    }, FADE_STEP_MS);
  }, [setPhase]);

  // Единый countdown-планировщик: тикает раз в секунду,
  // обновляет remainingSec и запускает fade/паузу по достижению порогов.
  const runCountdown = useCallback(
    (totalMs: number, startedAtAlreadyInPastMs: number) => {
      // Уже было истёкшее время от setup — начинаем не с нуля.
      const baseElapsed = Math.max(0, Date.now() - startedAtAlreadyInPastMs);
      const startedAt = Date.now() - baseElapsed;

      timersRef.current.countdown = window.setInterval(() => {
        // Если таймер уже отменён — выходим.
        if (phaseRef.current === "off") return;

        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, totalMs - elapsed);
        setRemainingSec(Math.ceil(remaining / 1000));

        // Если осталось ≤ fade-duration и мы ещё НЕ в фазе fading — начать fade.
        if (remaining <= FADE_DURATION_MS && phaseRef.current === "running") {
          if (timersRef.current.countdown) {
            clearInterval(timersRef.current.countdown);
            timersRef.current.countdown = null;
          }
          startFade();
          return;
        }

        // Если закончилось и мы так и не на fade (аварийный случай) — пауза.
        if (remaining <= 0) {
          clearAllTimers();
          clearStoredTimer();
          const a = getAudioElement();
          a?.pause();
          setPhase("off");
          setRemainingSec(0);
        }
      }, 1000);
    },
    [clearAllTimers, setPhase, startFade],
  );

  // Запуск таймера с явно заданным количеством минут.
  const startTimer = useCallback(
    (minutes: number) => {
      stopAndReset();
      if (minutes <= 0) return;

      setSelectedMinutes(minutes);
      const totalMs = minutes * 60 * 1000;

      const audio = getAudioElement();
      saveTimer({
        expiresAt: Date.now() + totalMs,
        originalVolume: audio?.volume ?? 1,
        minutes,
      });

      setPhase("running");
      setRemainingSec(minutes * 60);
      runCountdown(totalMs, Date.now());
    },
    [runCountdown, setPhase, stopAndReset],
  );

  // Восстановление таймера из localStorage при монтировании.
  useEffect(() => {
    const stored = loadStoredTimer();
    if (!stored) return;

    const remaining = stored.expiresAt - Date.now();
    if (remaining <= 0) {
      clearStoredTimer();
      return;
    }

    setSelectedMinutes(stored.minutes);
    originalVolumeRef.current = stored.originalVolume;

    if (remaining <= FADE_DURATION_MS) {
      // Уже пора fade.
      startFade();
      setRemainingSec(Math.ceil(remaining / 1000));
    } else {
      setPhase("running");
      setRemainingSec(Math.ceil(remaining / 1000));
      runCountdown(stored.expiresAt - Date.now(), stored.expiresAt - Date.now());
    }

    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pagehide / visibilitychange: не оставляем аудио заглушенным в фоне.
  useEffect(() => {
    const handler = () => {
      if (phaseRef.current !== "off") {
        stopAndReset();
      }
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("pagehide", handler);
    };
  }, [stopAndReset]);

  return {
    state,
    remainingSec,
    selectedMinutes,
    startTimer,
    cancelTimer: stopAndReset,
    options: SLEEP_TIMER_OPTIONS,
  };
}
