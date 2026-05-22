import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  src: string | readonly string[];
  variant?: "light" | "dark";
};

function pickSessionSource(sources: readonly string[]): string {
  if (sources.length <= 1) return sources[0] ?? "";
  const i = Math.floor(Math.random() * sources.length);
  return sources[i]!;
}

export function RastaVideoBg({ src, variant = "dark" }: Props) {
  const sources = useMemo(
    () => (typeof src === "string" ? [src] : [...src]),
    [src],
  );
  const sessionSrc = useMemo(() => pickSessionSource(sources), [sources]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotionOk(!reduceMq.matches);
    sync();
    reduceMq.addEventListener("change", sync);
    return () => reduceMq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !motionOk) return;
    void el.play().catch(() => {});
  }, [motionOk, sessionSrc]);

  if (!motionOk || !sessionSrc) return null;

  return (
    <div className={`rasta-video-bg rasta-video-bg--${variant}`}>
      <div className="rasta-video-bg__layer is-active">
        <video
          ref={videoRef}
          className="rasta-video-bg__media"
          src={sessionSrc}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
        />
      </div>
      <div className="rasta-video-bg__veil" aria-hidden />
    </div>
  );
}
