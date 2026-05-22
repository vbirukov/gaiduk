import { useEffect, useState } from "react";
import { ASSETS } from "../lib/assets";
import { SPLASH_SEEN_KEY } from "../config";

const SPLASH_MS = 1100;

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "hide" | "done">(() =>
    readSeen() ? "done" : "show",
  );

  useEffect(() => {
    if (phase !== "show") return;
    const hideTimer = window.setTimeout(() => setPhase("hide"), SPLASH_MS);
    return () => window.clearTimeout(hideTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "hide") return;
    const doneTimer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      } catch {
        /* quota */
      }
      setPhase("done");
    }, 420);
    return () => window.clearTimeout(doneTimer);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={phase === "hide" ? "splash-screen splash-screen--hide" : "splash-screen"}
      role="img"
      aria-label="Haiduk"
    >
      <img src={ASSETS.splash} alt="" />
    </div>
  );
}
