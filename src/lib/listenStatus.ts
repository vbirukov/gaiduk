import type { Progress } from "../types/user";

export type ListenStatus = "unstarted" | "in-progress" | "completed";

export function listenStatus(progress: Progress): ListenStatus {
  if (progress.completed) return "completed";
  if (progress.position > 0) return "in-progress";
  return "unstarted";
}

export const listenStatusLabel: Record<ListenStatus, string> = {
  unstarted: "Не слушали",
  "in-progress": "В процессе",
  completed: "Прослушано",
};
