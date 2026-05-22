import { useCallback, useEffect, useState } from "react";
import { Icon } from "./icons/Icon";

const SHOW_AFTER_PX = 480;

function isFeedScrolled(): boolean {
  if (window.scrollY > SHOW_AFTER_PX) return true;
  const feed = document.querySelector<HTMLElement>(".library-feed-content");
  if (!feed) return false;
  return feed.getBoundingClientRect().top < -80;
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const syncVisible = useCallback(() => {
    setVisible(isFeedScrolled());
  }, []);

  useEffect(() => {
    syncVisible();
    window.addEventListener("scroll", syncVisible, { passive: true });
    window.addEventListener("resize", syncVisible);

    const mo = new MutationObserver(syncVisible);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("scroll", syncVisible);
      window.removeEventListener("resize", syncVisible);
      mo.disconnect();
    };
  }, [syncVisible]);

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
