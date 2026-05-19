import { useEffect, useState } from "react";
import { Icon } from "./icons/Icon";

const SHOW_AFTER_PX = 480;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      className={visible ? "scroll-top scroll-top--visible" : "scroll-top"}
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
