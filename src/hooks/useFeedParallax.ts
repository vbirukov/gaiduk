import { useEffect, type RefObject } from "react";

const PARALLAX_FACTOR = 0.34;

export function useFeedParallax(
  feedRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const feed = feedRef.current;
    const layer = layerRef.current;
    if (!feed || !layer) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      if (reduced) {
        layer.style.transform = "translate3d(0, 0, 0)";
        return;
      }
      const feedTop = feed.getBoundingClientRect().top + window.scrollY;
      const offset = Math.max(0, window.scrollY - feedTop);
      layer.style.transform = `translate3d(0, ${offset * PARALLAX_FACTOR}px, 0)`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [feedRef, layerRef]);
}
