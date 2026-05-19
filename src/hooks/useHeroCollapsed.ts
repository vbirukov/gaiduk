import { useCallback, useState } from "react";
import { HERO_COLLAPSED_KEY, STORAGE_KEY } from "../config";

function readReturningUser(): boolean {
  try {
    if (localStorage.getItem(HERO_COLLAPSED_KEY) === "1") return true;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as {
      progress?: Record<string, unknown>;
      likes?: Record<string, unknown>;
      favorites?: Record<string, unknown>;
    };
    return (
      Object.keys(data.progress ?? {}).length > 0 ||
      Object.keys(data.likes ?? {}).length > 0 ||
      Object.keys(data.favorites ?? {}).length > 0
    );
  } catch {
    return false;
  }
}

export function useHeroCollapsed() {
  const [collapsed, setCollapsed] = useState(readReturningUser);

  const collapse = useCallback(() => {
    setCollapsed(true);
    try {
      localStorage.setItem(HERO_COLLAPSED_KEY, "1");
    } catch {
      /* quota */
    }
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
    try {
      localStorage.removeItem(HERO_COLLAPSED_KEY);
    } catch {
      /* quota */
    }
  }, []);

  return { collapsed, collapse, expand };
}
