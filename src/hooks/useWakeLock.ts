import { useEffect, useRef } from "react";

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) {
      void sentinelRef.current?.release();
      sentinelRef.current = null;
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        await sentinelRef.current?.release();
        sentinelRef.current = sentinel;
      } catch {
        /* не поддерживается или отклонено */
      }
    };

    void acquire();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && active) void acquire();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void sentinelRef.current?.release();
      sentinelRef.current = null;
    };
  }, [active]);
}
