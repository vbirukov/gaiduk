import { useEffect, useState } from "react";
import { usePlayerBarHeight } from "../hooks/usePlayerBarHeight";
import { Icon } from "./icons/Icon";

const SHOW_AFTER_PX = 480;

type Props = {
  hasPlayer?: boolean;
};

export function ScrollToTop({ hasPlayer = false }: Props) {
  const [visible, setVisible] = useState(false);

  usePlayerBarHeight(hasPlayer);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={
        visible
          ? "scroll-top scroll-top--visible icon-button ghost round icon-button--md"
          : "scroll-top icon-button ghost round icon-button--md"
      }
      onClick={() => {
        const instant = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
      }}
      aria-label="Наверх"
      title="Наверх"
    >
      <Icon name="chevron-up" size={22} />
    </button>
  );
}
