import type { Progress } from "../types/user";

export type ListenStatus = "unstarted" | "in-progress" | "completed";

/** Минимум прослушивания для статуса «В процессе» на карточке */
export const IN_PROGRESS_MIN_SEC = 60;

export function listenStatus(progress: Progress): ListenStatus {
  if (progress.completed) return "completed";
  if (progress.position >= IN_PROGRESS_MIN_SEC) return "in-progress";
  return "unstarted";
}

export const listenStatusLabel: Record<ListenStatus, string> = {
  unstarted: "Не слушали",
  "in-progress": "В процессе",
  completed: "Прослушано",
};
