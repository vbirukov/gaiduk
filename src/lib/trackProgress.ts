import type { Progress } from "../types/user";

export type LivePlayback = {
  position: number;
  duration: number;
};

export function resolveTrackProgress(
  trackId: string,
  activeTrackId: string | null,
  live: LivePlayback | null,
  progressOf: (id: string) => Progress,
): Progress {
  if (trackId !== activeTrackId || !live) {
    return progressOf(trackId);
  }
  const saved = progressOf(trackId);
  const completed =
    live.duration > 0
      ? live.position / live.duration > 0.97
      : saved.completed;
  return {
    ...saved,
    position: live.position,
    duration: live.duration,
    completed,
  };
}
