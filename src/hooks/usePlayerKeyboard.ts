import { useEffect, type RefObject } from "react";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

type Options = {
  onTogglePlay: () => void;
  onSeek: (deltaSec: number) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function usePlayerKeyboard(optsRef: RefObject<Options>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const opts = optsRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        opts.onTogglePlay();
        return;
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        opts.onSeek(e.shiftKey ? -30 : -10);
        return;
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        opts.onSeek(e.shiftKey ? 30 : 10);
        return;
      }
      if (e.code === "KeyN" || (e.code === "ArrowDown" && !e.shiftKey)) {
        e.preventDefault();
        opts.onNext();
        return;
      }
      if (e.code === "KeyP" || (e.code === "ArrowUp" && !e.shiftKey)) {
        e.preventDefault();
        opts.onPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [optsRef]);
}
