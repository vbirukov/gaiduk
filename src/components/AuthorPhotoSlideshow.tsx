import { useEffect, useState, type CSSProperties } from "react";
import {
  AUTHOR_PHOTOS,
  randomAuthorPhotoIndex,
} from "../lib/authorPhotos";

const SLIDE_INTERVAL_MS = 5500;
const FADE_MS = 1200;

export function AuthorPhotoSlideshow() {
  const start = randomAuthorPhotoIndex();
  const [indexA, setIndexA] = useState(start);
  const [indexB, setIndexB] = useState((start + 1) % AUTHOR_PHOTOS.length);
  const [showA, setShowA] = useState(true);
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

    const id = window.setInterval(() => {
      setShowA((visible) => {
        if (visible) {
          setIndexB((i) => (i + 1) % AUTHOR_PHOTOS.length);
        } else {
          setIndexA((i) => (i + 1) % AUTHOR_PHOTOS.length);
        }
        return !visible;
      });
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [motionOk]);

  const visibleIndex = showA ? indexA : indexB;

  return (
    <div
      className="hero-art"
      aria-hidden="true"
      style={{ "--hero-fade-ms": `${FADE_MS}ms` } as CSSProperties}
    >
      {motionOk ? (
        <>
          <img
            src={AUTHOR_PHOTOS[indexA]}
            alt=""
            className={`hero-art-slide${showA ? " is-visible" : ""}`}
            decoding="async"
          />
          <img
            src={AUTHOR_PHOTOS[indexB]}
            alt=""
            className={`hero-art-slide${showA ? "" : " is-visible"}`}
            decoding="async"
          />
        </>
      ) : (
        <img
          src={AUTHOR_PHOTOS[visibleIndex]}
          alt=""
          className="hero-art-slide is-visible"
          decoding="async"
        />
      )}
    </div>
  );
}
