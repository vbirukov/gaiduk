import { useLayoutEffect, useState } from "react";
import {
  FEED_GRID_DESKTOP_MIN_PX,
  isFeedGridDesktop,
} from "../lib/gridColumns";

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
