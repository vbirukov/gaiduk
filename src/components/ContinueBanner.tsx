import { fmtTime } from "../lib/format";
import type { Track } from "../types/catalog";
import type { Progress } from "../types/user";

type Props = {
  track: Track;
  progress: Progress;
  onContinue: (track: Track) => void;
};

export function ContinueBanner({ track, progress, onContinue }: Props) {
  return (
    <section className="continue-banner" aria-label="Продолжить прослушивание">
      <button
        type="button"
        className="continue-banner-btn"
        onClick={() => onContinue(track)}
      >
        <span className="continue-banner-kicker">Продолжить</span>
        <strong className="continue-banner-title">{track.title}</strong>
        <span className="continue-banner-meta mini-text">
          {track.folder}
          {progress.position > 0 ? ` · ${fmtTime(progress.position)}` : ""}
        </span>
      </button>
    </section>
  );
}
