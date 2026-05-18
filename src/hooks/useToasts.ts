import { useCallback, useRef, useState } from "react";

export type Toast = {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, action?: Toast["action"]) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, action }]);
      const t = setTimeout(() => dismiss(id), action ? 12000 : 7000);
      timers.current.set(id, t);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
