import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  variant?: "light" | "dark";
};

export function RastaVideoBg({ src, variant = "dark" }: Props) {
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
  }, [active, src]);

  if (!active) return null;

  return (
    <div className={`rasta-video-bg rasta-video-bg--${variant}`}>
      <video
        ref={videoRef}
        className="rasta-video-bg__media"
        src={src}
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
