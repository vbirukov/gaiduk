import { useEffect, useState } from "react";

function isSlowConnection(): boolean {
  const c = navigator.connection as
    | { saveData?: boolean; effectiveType?: string }
    | undefined;
  if (!c) return false;
  if (c.saveData) return true;
  return c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

/** Видеофон — после window.load и idle, чтобы не конкурировать с UI-картинками. */
export function useDeferredVideoLoad(motionOk: boolean): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!motionOk) {
      setReady(false);
      return;
    }
    if (isSlowConnection()) return;

    let cancelled = false;

    const enable = () => {
      if (!cancelled) setReady(true);
    };

    let cancelSchedule: (() => void) | undefined;

    const schedule = () => {
      if (typeof requestIdleCallback === "function") {
        const id = requestIdleCallback(enable, { timeout: 4000 });
        cancelSchedule = () => cancelIdleCallback(id);
      } else {
        const t = window.setTimeout(enable, 2000);
        cancelSchedule = () => window.clearTimeout(t);
      }
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      const onLoad = () => schedule();
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", onLoad);
        cancelSchedule?.();
        setReady(false);
      };
    }

    return () => {
      cancelled = true;
      cancelSchedule?.();
    };
  }, [motionOk]);

  return ready;
}
