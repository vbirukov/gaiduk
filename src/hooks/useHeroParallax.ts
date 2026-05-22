import { useEffect, type RefObject } from "react";

const DESKTOP_MQ = "(min-width: 721px)";

export function useHeroParallax(targetRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const desktopMq = window.matchMedia(DESKTOP_MQ);
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = (e: MouseEvent) => {
      if (!desktopMq.matches || reduceMq.matches) {
        el.style.transform = "";
        return;
      }
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `translate(${x * 8}px, ${y * 5}px)`;
    };

    const reset = () => {
      el.style.transform = "";
    };

    const onMq = () => reset();
    desktopMq.addEventListener("change", onMq);
    reduceMq.addEventListener("change", onMq);
    window.addEventListener("mousemove", apply, { passive: true });
    window.addEventListener("mouseleave", reset);

    return () => {
      desktopMq.removeEventListener("change", onMq);
      reduceMq.removeEventListener("change", onMq);
      window.removeEventListener("mousemove", apply);
      window.removeEventListener("mouseleave", reset);
      reset();
    };
  }, [targetRef]);
}
