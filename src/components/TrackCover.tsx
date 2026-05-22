import { useState } from "react";
import { coverForTrack, isDefaultCoverPath } from "../lib/cover";
import type { Track } from "../types/catalog";
import { Icon } from "./icons/Icon";

type Props = {
  track: Pick<Track, "folder" | "title"> | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  sm: "cover--sm",
  md: "cover--md",
  lg: "cover--lg",
  xl: "cover--xl",
};

export function TrackCover({ track, size = "md", className }: Props) {
  const [failed, setFailed] = useState(false);
  const src = coverForTrack(track);
  const rootClass = ["cover", sizeClass[size], className].filter(Boolean).join(" ");

  if (!track || failed) {
    return (
      <div className={rootClass} aria-hidden="true">
        <Icon name="music" size={size === "xl" ? 40 : size === "lg" ? 28 : 20} />
      </div>
    );
  }

  if (isDefaultCoverPath(src)) {
    return (
      <div className={rootClass}>
        <img
          src={src}
          alt=""
          className="cover-default-img"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
