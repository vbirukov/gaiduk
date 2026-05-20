import type { CSSProperties } from "react";

type Props = {
  active: boolean;
};

const DRIFTS = ["-22px", "18px", "-28px", "24px", "-14px", "30px", "-20px", "16px"];
const DURS = ["18s", "20s", "22s", "19s", "21s", "23s", "17s", "24s"];

const CLOUDS = Array.from({ length: 16 }, (_, i) => ({
  x: `${6 + Math.round((i * 88) / 15)}%`,
  w: `${Math.min(38, 20 + (i % 6) * 4)}%`,
  h: `${Math.min(42, 24 + (i % 5) * 3)}%`,
  drift: DRIFTS[i % DRIFTS.length]!,
  delay: `${-(i * 0.85).toFixed(2)}s`,
  dur: DURS[i % DURS.length]!,
  opacity: 0.72 + (i % 4) * 0.06,
}));

export function JaipurClouds({ active }: Props) {
  return (
    <div
      className={active ? "jaipur-clouds is-active" : "jaipur-clouds"}
      aria-hidden
    >
      {CLOUDS.map((c, i) => (
        <span
          key={i}
          className="jaipur-clouds__cloud"
          style={
            {
              "--cloud-x": c.x,
              "--cloud-w": c.w,
              "--cloud-h": c.h,
              "--cloud-drift": c.drift,
              "--cloud-delay": c.delay,
              "--cloud-dur": c.dur,
              "--cloud-peak": c.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
