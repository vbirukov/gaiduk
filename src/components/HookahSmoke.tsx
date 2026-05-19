import type { CSSProperties } from "react";

type Props = {
  active: boolean;
};

const PLUMES = [
  { x: "10%", w: "32%", drift: "-12px", delay: "0s", dur: "13s" },
  { x: "18%", w: "36%", drift: "14px", delay: "-1s", dur: "14s" },
  { x: "26%", w: "38%", drift: "-16px", delay: "-2s", dur: "15s" },
  { x: "34%", w: "30%", drift: "10px", delay: "-3s", dur: "16s" },
  { x: "42%", w: "44%", drift: "18px", delay: "-4s", dur: "14s" },
  { x: "50%", w: "48%", drift: "-8px", delay: "-5s", dur: "15s" },
  { x: "56%", w: "34%", drift: "12px", delay: "-6s", dur: "16s" },
  { x: "62%", w: "40%", drift: "-14px", delay: "-7s", dur: "13s" },
  { x: "70%", w: "42%", drift: "16px", delay: "-8.5s", dur: "17s" },
  { x: "78%", w: "36%", drift: "-18px", delay: "-10s", dur: "12s" },
  { x: "86%", w: "34%", drift: "-20px", delay: "-11.5s", dur: "18s" },
  { x: "92%", w: "28%", drift: "8px", delay: "-13s", dur: "14s" },
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
