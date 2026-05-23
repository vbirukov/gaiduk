import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTHOR_PHOTOS,
  AUTHOR_SLIDE_MS,
  createAuthorSlideOrder,
  preloadAuthorPhotos,
} from "../lib/authorPhotos";

export function useAuthorPhotoSlideshow() {
  const [order] = useState(createAuthorSlideOrder);
  const [pos, setPos] = useState(0);
  const [motionOk, setMotionOk] = useState(true);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = AUTHOR_PHOTOS.length;
  const activeSrc = AUTHOR_PHOTOS[order[pos]!]!;

  const goTo = useCallback(
    (nextPos: number) => {
      setPos(((nextPos % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => {
    setPos((p) => (p + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setPos((p) => (p - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    preloadAuthorPhotos();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!motionOk) return;

    const tick = () => {
      if (pausedRef.current || document.visibilityState === "hidden") return;
      setPos((p) => (p + 1) % count);
    };

    timerRef.current = setInterval(tick, AUTHOR_SLIDE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, motionOk]);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  return {
    order,
    pos,
    activeSrc,
    motionOk,
    next,
    prev,
    goTo,
    setPaused,
  };
}
