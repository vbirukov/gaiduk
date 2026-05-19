import type { CSSProperties } from "react";

type Props = {
  active: boolean;
};

const PLUMES = [
  { x: "14%", w: "36%", drift: "-14px", delay: "0s", dur: "13s" },
  { x: "28%", w: "40%", drift: "16px", delay: "-2s", dur: "15s" },
  { x: "40%", w: "32%", drift: "-10px", delay: "-3.5s", dur: "16s" },
  { x: "50%", w: "48%", drift: "-8px", delay: "-5s", dur: "14s" },
  { x: "58%", w: "38%", drift: "14px", delay: "-6.5s", dur: "15s" },
  { x: "68%", w: "42%", drift: "12px", delay: "-8s", dur: "16s" },
  { x: "78%", w: "36%", drift: "-18px", delay: "-9.5s", dur: "12s" },
  { x: "86%", w: "34%", drift: "-20px", delay: "-11s", dur: "17s" },
  { x: "34%", w: "30%", drift: "10px", delay: "-12.5s", dur: "18s" },
] as const;

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
