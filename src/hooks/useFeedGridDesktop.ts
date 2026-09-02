import { useLayoutEffect, useState } from "react";

/**
 * Локальная копия логики сетки (вместо внутреннего импорта
 * @vbirukov/player/lib/gridColumns, которого нет в публичном API 0.4.4).
 * Значение порога совпадает с движком (721px).
 */
export const FEED_GRID_DESKTOP_MIN_PX = 721;

export function isFeedGridDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${FEED_GRID_DESKTOP_MIN_PX}px)`).matches;
}

export function useFeedGridDesktop() {
  const [desktop, setDesktop] = useState(isFeedGridDesktop);

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${FEED_GRID_DESKTOP_MIN_PX}px)`);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktop;
}
