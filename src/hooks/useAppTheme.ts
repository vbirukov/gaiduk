import { useCallback, useEffect, useState } from "react";
import {
  APPEARANCE_STORAGE_KEY,
  SKIN_STORAGE_KEY,
  applyDocumentTheme,
  readStoredAppearance,
  readStoredSkin,
  type Appearance,
  type AppSkin,
} from "../themes";

export function useAppTheme() {
  const [skin, setSkin] = useState<AppSkin>(readStoredSkin);
  const [appearance, setAppearance] = useState<Appearance>(readStoredAppearance);

  useEffect(() => {
    applyDocumentTheme(skin, appearance);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, skin);
      if (skin === "rastaman") {
        localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
      }
    } catch {
      /* quota */
    }
  }, [skin, appearance]);

  const toggleAppearance = useCallback(() => {
    setAppearance((a) => (a === "dark" ? "light" : "dark"));
  }, []);

  const setSkinAndPersist = useCallback((next: AppSkin) => {
    setSkin(next);
  }, []);

  return {
    skin,
    appearance,
    setSkin: setSkinAndPersist,
    toggleAppearance,
    isJaipur: skin === "jaipur",
    showAppearanceToggle: skin === "rastaman",
  };
}
