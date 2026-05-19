import type { CSSProperties } from "react";

type Props = {
  active: boolean;
};

const PLUMES = [
  { x: "18%", w: "36%", drift: "-14px", delay: "0s", dur: "13s" },
  { x: "34%", w: "44%", drift: "18px", delay: "-2.5s", dur: "15s" },
  { x: "50%", w: "48%", drift: "-8px", delay: "-5s", dur: "14s" },
  { x: "66%", w: "40%", drift: "12px", delay: "-7s", dur: "16s" },
  { x: "82%", w: "34%", drift: "-20px", delay: "-9.5s", dur: "12s" },
  { x: "42%", w: "32%", drift: "10px", delay: "-11s", dur: "17s" },
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
