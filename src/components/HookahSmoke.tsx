import type { CSSProperties } from "react";

type Props = {
  active: boolean;
  dense?: boolean;
};

const DRIFTS = [
  "-14px",
  "12px",
  "-18px",
  "16px",
  "-10px",
  "20px",
  "-16px",
  "10px",
  "-22px",
  "18px",
];
const DURS = [
  "13s",
  "14s",
  "15s",
  "16s",
  "12s",
  "17s",
  "18s",
  "14s",
  "19s",
  "15s",
];

function buildPlumes(count: number, stagger: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: `${2 + Math.round((i * 96) / Math.max(1, count - 1))}%`,
    w: `${28 + (i % 9) * 4}%`,
    drift: DRIFTS[i % DRIFTS.length]!,
    delay: `${-(i * stagger).toFixed(2)}s`,
    dur: DURS[i % DURS.length]!,
  }));
}

export function HookahSmoke({ active, dense = false }: Props) {
  const plumes = buildPlumes(dense ? 34 : 24, dense ? 0.38 : 0.58);

  return (
    <div
      className={
        active
          ? dense
            ? "hookah-smoke hookah-smoke--dense is-active"
            : "hookah-smoke is-active"
          : dense
            ? "hookah-smoke hookah-smoke--dense"
            : "hookah-smoke"
      }
      aria-hidden
    >
      {plumes.map((p, i) => (
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
