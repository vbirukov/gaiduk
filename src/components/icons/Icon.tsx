import type { ReactNode, SVGAttributes } from "react";

export type IconName =
  | "menu"
  | "close"
  | "sun"
  | "moon"
  | "shuffle"
  | "repeat"
  | "repeat-one"
  | "repeat-off"
  | "skip-back"
  | "skip-forward"
  | "play"
  | "pause"
  | "loader"
  | "heart"
  | "heart-outline"
  | "star"
  | "star-outline"
  | "wake"
  | "share"
  | "music"
  | "check"
  | "chevron-up"
  | "chevron-down"
  | "leaf"
  | "sun-portal"
  | "cloud";

type Props = SVGAttributes<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, ReactNode> = {
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />,
  shuffle: (
    <>
      <path d="M16 3h5v5" />
      <path d="M4 20l17-17" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </>
  ),
  repeat: (
    <>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  "repeat-one": (
    <>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M11 12h1v4" />
    </>
  ),
  "repeat-off": (
    <>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  "skip-back": (
    <>
      <path d="M6 5v14" />
      <path d="M16 5 9 12 16 19z" fill="currentColor" stroke="none" />
    </>
  ),
  "skip-forward": (
    <>
      <path d="M8 5 15 12 8 19z" fill="currentColor" stroke="none" />
      <path d="M18 5v14" />
    </>
  ),
  play: <path d="M8 5v14l11-7-11-7z" fill="currentColor" stroke="none" />,
  pause: (
    <path
      d="M7 6h4v12H7zm6 0h4v12h-4z"
      fill="currentColor"
      stroke="none"
    />
  ),
  loader: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
  heart: (
    <path
      d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20z"
      fill="currentColor"
      stroke="none"
    />
  ),
  "heart-outline": (
    <path d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20z" />
  ),
  star: (
    <path
      d="M12 3l2.35 5.4 5.9.5-4.45 3.85 1.35 5.75L12 15.9l-3.15 2.6 1.35-5.75-4.45-3.85 5.9-.5L12 3z"
      fill="currentColor"
      stroke="none"
    />
  ),
  "star-outline": (
    <path d="M12 3l2.35 5.4 5.9.5-4.45 3.85 1.35 5.75L12 15.9l-3.15 2.6 1.35-5.75-4.45-3.85 5.9-.5L12 3z" />
  ),
  wake: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v10" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 13H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="16" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M5 12.5 9.5 17 19 7" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  leaf: (
    <path d="M12 3c-4 5-6 8-6 12a6 6 0 0 0 12 0c0-4-2-7-6-12z" />
  ),
  "sun-portal": (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v2M12 19v2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M3 12h2M19 12h2M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
    </>
  ),
  cloud: (
    <path d="M7 17h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6-1.4A3.5 3.5 0 0 0 7 17z" />
  ),
};

export function Icon({ name, size = 20, className, ...rest }: Props) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={rest["aria-hidden"] ?? true}
      fill="none"
      stroke="currentColor"
      strokeWidth={rest.strokeWidth ?? 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
