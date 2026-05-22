import { useEffect, useRef, useState } from "react";
import { ASSETS } from "../lib/assets";

export function RastaVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setActive(!reduceMq.matches);
    sync();
    reduceMq.addEventListener("change", sync);
    return () => reduceMq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!active) {
      el.pause();
      return;
    }
    el.play().catch(() => {});
  }, [active]);

  if (!active) return null;

  return (
    <div className="rasta-video-bg">
      <video
        ref={videoRef}
        className="rasta-video-bg__media"
        src={ASSETS.rastaBikeVideo}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-hidden
      />
      <div className="rasta-video-bg__veil" aria-hidden />
    </div>
  );
}
