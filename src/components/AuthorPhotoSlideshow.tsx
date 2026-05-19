import { useEffect, useState, type CSSProperties } from "react";
import {
  AUTHOR_PHOTOS,
  randomAuthorPhotoIndex,
} from "../lib/authorPhotos";

const SLIDE_INTERVAL_MS = 5500;
const FADE_MS = 1200;

function preloadPhoto(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("photo load failed"));
    img.src = path;
  });
}

export function AuthorPhotoSlideshow() {
  const [index, setIndex] = useState(randomAuthorPhotoIndex);
  const [visible, setVisible] = useState(true);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOk(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!motionOk) return;

    let cancelled = false;
    const id = window.setInterval(() => {
      const next = (index + 1) % AUTHOR_PHOTOS.length;
      void preloadPhoto(AUTHOR_PHOTOS[next]).then(() => {
        if (cancelled) return;
        setVisible(false);
        window.setTimeout(() => {
          if (cancelled) return;
          setIndex(next);
          setVisible(true);
        }, FADE_MS);
      });
    }, SLIDE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [index, motionOk]);

  return (
    <div
      className="hero-art"
      aria-hidden="true"
      style={{ "--hero-fade-ms": `${FADE_MS}ms` } as CSSProperties}
    >
      <img
        src={AUTHOR_PHOTOS[index]}
        alt=""
        className={`hero-art-slide${visible ? " is-visible" : ""}`}
        decoding="async"
        fetchPriority="low"
      />
    </div>
  );
}