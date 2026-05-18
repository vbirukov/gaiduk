import { useEffect, useState } from "react";
import { fmtTime } from "../lib/format";

export function PlayerTimeline({
  audioRef,
  onSeek,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onSeek: (value: number) => void;
}) {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setTime(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("loadedmetadata", update);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("loadedmetadata", update);
    };
  }, [audioRef]);

  return (
    <div className="timeline">
      <span>{fmtTime(time)}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={duration ? time / duration : 0}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <span>{fmtTime(duration)}</span>
    </div>
  );
}
