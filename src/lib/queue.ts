export type RepeatMode = "off" | "all" | "one";

export function shuffleIds(ids: string[]): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickAdjacentId(
  source: string[],
  currentId: string | null,
  step: number,
  repeat: RepeatMode,
): string | null {
  if (!source.length) return null;
  const idx = currentId ? source.indexOf(currentId) : -1;
  if (step > 0) {
    if (idx >= 0 && idx < source.length - 1) return source[idx + 1] ?? null;
    if (repeat === "all" && idx === source.length - 1) return source[0] ?? null;
    if (idx < 0) return source[0] ?? null;
    return null;
  }
  if (idx > 0) return source[idx - 1] ?? null;
  if (repeat === "all" && idx === 0) return source[source.length - 1] ?? null;
  if (idx < 0) return source[source.length - 1] ?? null;
  return null;
}
