export const CARD_MIN_WIDTH = 220;
export const GRID_GAP_PX = 16;
export const MAX_FEED_COLS = 3;

export function computeFeedColumns(width: number): number {
  if (width <= 0) return 1;
  return Math.min(
    MAX_FEED_COLS,
    Math.max(1, Math.floor((width + GRID_GAP_PX) / (CARD_MIN_WIDTH + GRID_GAP_PX))),
  );
}

export function measureFeedGridWidth(anchor: HTMLElement | null): number {
  if (!anchor) return 0;
  const feed = anchor.closest(".library-feed-content") as HTMLElement | null;
  const main = anchor.closest(".main") as HTMLElement | null;
  for (const node of [feed, main, anchor]) {
    const w = node.getBoundingClientRect().width;
    if (w > 0) return w;
  }
  return 0;
}

export function defaultFeedColumns(): number {
  if (typeof window === "undefined") return 1;
  if (!window.matchMedia("(min-width: 721px)").matches) return 1;
  const main = document.querySelector(".main");
  const w =
    main?.getBoundingClientRect().width ??
    Math.max(0, window.innerWidth - 300 - 48);
  return Math.max(2, computeFeedColumns(w));
}
