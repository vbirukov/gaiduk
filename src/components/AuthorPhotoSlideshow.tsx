import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AUTHOR_PHOTOS,
  randomAuthorPhotoIndex,
} from "../lib/authorPhotos";

const SLIDE_INTERVAL_MS = 5500;
const FADE_MS = 1200;

export function AuthorPhotoSlideshow() {
  const [index, setIndex] = useState(randomAuthorPhotoIndex);
  const [visible, setVisible] = useState(true);
  const [motionOk, setMotionOk] = useState(true);
  const indexRef = useRef(index);
  indexRef.current = index;

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
      setVisible(false);
      window.setTimeout(() => {
        setIndex((indexRef.current + 1) % AUTHOR_PHOTOS.length);
      }, FADE_MS);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [motionOk]);

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
        onLoad={() => {
          if (!visible) setVisible(true);
        }}
      />
    </div>
  );
}
