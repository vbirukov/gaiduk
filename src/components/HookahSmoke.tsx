import type { CSSProperties } from "react";

type Props = {
  active: boolean;
};

const DRIFTS = ["-14px", "12px", "-18px", "16px", "-10px", "20px", "-16px", "10px"];
const DURS = ["13s", "14s", "15s", "16s", "12s", "17s", "18s", "14s"];

const PLUMES = Array.from({ length: 24 }, (_, i) => ({
  x: `${5 + Math.round((i * 90) / 23)}%`,
  w: `${26 + (i % 7) * 3}%`,
  drift: DRIFTS[i % DRIFTS.length]!,
  delay: `${-(i * 0.58).toFixed(2)}s`,
  dur: DURS[i % DURS.length]!,
}));

export function HookahSmoke({ active }: Props) {
  return (
    <div
      className={active ? "hookah-smoke is-active" : "hookah-smoke"}
      aria-hidden
    >
      {PLUMES.map((p, i) => (
        <span
          key={i}
          className="hookah-smoke__plume"
          style={
            {
              "--smoke-x": p.x,
              "--smoke-w": p.w,
              "--smoke-drift": p.drift,
              "--smoke-delay": p.delay,
              "--smoke-dur": p.dur,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
