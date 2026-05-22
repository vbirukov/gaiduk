const RIPPLE_SELECTOR =
  "button.icon-button.primary, button.icon-button.card-play, .card-social > button.ghost.round, button.feed-toolbar__reset";

export function initButtonRipple() {
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el = (e.target as HTMLElement).closest(RIPPLE_SELECTOR);
      if (!el || !(el instanceof HTMLElement) || el.disabled) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--ripple-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--ripple-y", `${e.clientY - rect.top}px`);
      el.classList.remove("is-rippling");
      void el.offsetWidth;
      el.classList.add("is-rippling");
    },
    true,
  );

  document.addEventListener(
    "animationend",
    (e) => {
      const el = (e.target as HTMLElement).closest?.(RIPPLE_SELECTOR);
      if (el instanceof HTMLElement && el.classList.contains("is-rippling")) {
        el.classList.remove("is-rippling");
      }
    },
    true,
  );
}
