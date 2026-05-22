import { useCallback, useEffect, useState } from "react";
import {
  SKIN_STORAGE_KEY,
  applyDocumentTheme,
  readStoredSkin,
  type AppSkin,
} from "../themes";

export function useAppTheme() {
  const [skin, setSkin] = useState<AppSkin>(readStoredSkin);

  useEffect(() => {
    applyDocumentTheme(skin);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch {
      /* quota */
    }
  }, [skin]);

  const setSkinAndPersist = useCallback((next: AppSkin) => {
    setSkin(next);
  }, []);

  return {
    skin,
    setSkin: setSkinAndPersist,
    isJaipur: skin === "jaipur",
    isRastaman: skin === "rastaman",
    isRastamanLight: skin === "rastaman-light",
  };
}
