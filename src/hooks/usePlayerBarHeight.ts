import { useEffect } from "react";

function measurePlayerBarHeight(): void {
  const root = document.documentElement;
  const collapsed = root.classList.contains("player-bar-collapsed");
  const restore = document.querySelector<HTMLElement>(".player-bar-restore");
  const bar = document.querySelector<HTMLElement>(".player-bar");
  const el = collapsed && restore ? restore : bar;
  if (!el) {
    root.style.removeProperty("--player-bar-height");
    return;
  }
  root.style.setProperty(
    "--player-bar-height",
    `${Math.ceil(el.getBoundingClientRect().height)}px`,
  );
}

export function usePlayerBarHeight(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      document.documentElement.style.removeProperty("--player-bar-height");
      return;
    }

    const ro = new ResizeObserver(() => measurePlayerBarHeight());
    const attach = () => {
      ro.disconnect();
      for (const el of document.querySelectorAll<HTMLElement>(
        ".player-bar, .player-bar-restore",
      )) {
        ro.observe(el);
      }
      measurePlayerBarHeight();
    };

    attach();
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("resize", measurePlayerBarHeight);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measurePlayerBarHeight);
      document.documentElement.style.removeProperty("--player-bar-height");
    };
  }, [enabled]);
}
