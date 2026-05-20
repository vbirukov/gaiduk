import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icons/Icon";

type Variant = "ghost" | "primary";

type Size = "sm" | "md" | "lg" | "play";

const sizeClass: Record<Size, string> = {
  sm: "icon-button--sm",
  md: "icon-button--md",
  lg: "icon-button--lg",
  play: "icon-button--play",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  active?: boolean;
};

export function IconButton({
  variant = "ghost",
  size = "md",
  active = false,
  className,
  children,
  type = "button",
  ...rest
}: Props) {
  const cls = [
    "icon-button",
    "round",
    variant,
    sizeClass[size],
    active ? "active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

type PlayPauseProps = {
  playing: boolean;
  busy: boolean;
  iconSize: number;
};

export function PlayPauseIcon({ playing, busy, iconSize }: PlayPauseProps) {
  return (
    <span className="icon-swap" aria-hidden>
      {busy ? (
        <Icon
          name="loader"
          size={iconSize}
          className="icon-swap__item is-visible"
        />
      ) : (
        <>
          <Icon
            name="pause"
            size={iconSize}
            className={`icon-swap__item${playing ? " is-visible" : ""}`}
          />
          <Icon
            name="play"
            size={iconSize}
            className={`icon-swap__item${!playing ? " is-visible" : ""}`}
          />
        </>
      )}
    </span>
  );
}

type NamedProps = Omit<Props, "children"> & {
  icon: IconName;
  iconSize?: number;
  iconClassName?: string;
};

export function IconButtonIcon({
  icon,
  iconSize = 20,
  iconClassName,
  ...rest
}: NamedProps) {
  return (
    <IconButton {...rest}>
      <Icon
        name={icon}
        size={iconSize}
        className={iconClassName}
      />
    </IconButton>
  );
}
