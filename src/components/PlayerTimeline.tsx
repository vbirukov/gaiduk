import { useEffect, useRef, useState } from "react";
import { maxBufferedEndRatio } from "../lib/audioBuffer";
import { fmtTime } from "../lib/format";

export function PlayerTimeline({
  audioRef,
  trackId,
  onSeek,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  trackId: string | null;
  onSeek: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const durationRef = useRef(0);
  const seekingRef = useRef(false);
  const lastLabelSecRef = useRef(-1);
  const lastSeekAtRef = useRef(0);

  const paintRatio = (ratio: number) => {
    const r = Math.max(0, Math.min(1, ratio));
    const pct = `${r * 100}%`;
    if (fillRef.current) fillRef.current.style.width = pct;
    if (thumbRef.current) thumbRef.current.style.left = pct;
  };

  const paintBufferRatio = () => {
    const audio = audioRef.current;
    if (!audio || !bufferRef.current) return;
    const r = maxBufferedEndRatio(audio);
    bufferRef.current.style.width = `${Math.max(0, Math.min(1, r)) * 100}%`;
  };

  const ratioFromClientX = (clientX: number) => {
    const track = trackRef.current;
    const d = durationRef.current;
    if (!track || d <= 0) return 0;
    const { left, width } = track.getBoundingClientRect();
    if (width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - left) / width));
  };

  const updateLabel = (t: number) => {
    const sec = Math.floor(t);
    if (sec !== lastLabelSecRef.current) {
      lastLabelSecRef.current = sec;
      setDisplayTime(t);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    durationRef.current = 0;
    setDuration(0);
    setDisplayTime(0);
    lastLabelSecRef.current = -1;
    paintRatio(0);
    if (bufferRef.current) bufferRef.current.style.width = "0%";

    const syncDuration = () => {
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      durationRef.current = d;
      setDuration(d);
      paintBufferRatio();
    };

    let rafId = 0;
    const loop = () => {
      if (!seekingRef.current && durationRef.current > 0) {
        const t = audio.currentTime || 0;
        paintRatio(t / durationRef.current);
        updateLabel(t);
      }
      paintBufferRatio();
      if (!audio.paused && !audio.ended) {
        rafId = requestAnimationFrame(loop);
      }
    };

    const onPlay = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    };
    const onPause = () => {
      cancelAnimationFrame(rafId);
      if (durationRef.current > 0) {
        const t = audio.currentTime || 0;
        paintRatio(t / durationRef.current);
        setDisplayTime(t);
        lastLabelSecRef.current = Math.floor(t);
      }
    };
    const onSeeked = onPause;

    const onProgress = () => {
      paintBufferRatio();
    };

    syncDuration();
    onPause();
    paintBufferRatio();
    audio.addEventListener("loadedmetadata", syncDuration);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("ended", onPause);
    if (!audio.paused) onPlay();

    return () => {
      cancelAnimationFrame(rafId);
      audio.removeEventListener("loadedmetadata", syncDuration);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("ended", onPause);
    };
  }, [audioRef, trackId]);

  const applySeek = (ratio: number, commit: boolean) => {
    paintRatio(ratio);
    const t = ratio * durationRef.current;
    setDisplayTime(t);
    lastLabelSecRef.current = Math.floor(t);
    if (!commit) {
      const now = performance.now();
      if (now - lastSeekAtRef.current < 150) return;
      lastSeekAtRef.current = now;
    } else {
      lastSeekAtRef.current = 0;
    }
    onSeek(ratio);
  };

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!durationRef.current || e.button !== 0) return;
    seekingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    applySeek(ratioFromClientX(e.clientX), false);
  };

  const onTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekingRef.current) return;
    applySeek(ratioFromClientX(e.clientX), false);
  };

  const endSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!seekingRef.current) return;
    seekingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const ratio = ratioFromClientX(e.clientX);
    applySeek(ratio, true);
    const audio = audioRef.current;
    if (audio && durationRef.current > 0) {
      const t = audio.currentTime || 0;
      paintRatio(t / durationRef.current);
      setDisplayTime(t);
    }
  };

  return (
    <div className="timeline">
      <span>{fmtTime(displayTime)}</span>
      <div
        ref={trackRef}
        className="timeline-track"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={displayTime}
        aria-label="Позиция в треке"
        tabIndex={0}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={endSeek}
        onPointerCancel={endSeek}
        onKeyDown={(e) => {
          if (!durationRef.current) return;
          const step = e.shiftKey ? 0.05 : 0.01;
          let ratio = (audioRef.current?.currentTime ?? 0) / durationRef.current;
          if (e.key === "ArrowRight") ratio = Math.min(1, ratio + step);
          else if (e.key === "ArrowLeft") ratio = Math.max(0, ratio - step);
          else return;
          e.preventDefault();
          applySeek(ratio, true);
        }}
      >
        <div ref={bufferRef} className="timeline-buffer" aria-hidden />
        <div ref={fillRef} className="timeline-fill" />
        <div ref={thumbRef} className="timeline-thumb" />
      </div>
      <span>{fmtTime(duration)}</span>
    </div>
  );
}
