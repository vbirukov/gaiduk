import { THEME_OPTIONS, type AppSkin } from "../themes";

const THEME_MARKS: Record<AppSkin, string> = {
  rastaman: "☽",
  "rastaman-light": "☀",
  jaipur: "◆",
};

type Props = {
  skin: AppSkin;
  onSkinChange: (skin: AppSkin) => void;
  compact?: boolean;
};

export function ThemeSwitcher({ skin, onSkinChange, compact }: Props) {
  return (
    <div
      className={compact ? "theme-switcher theme-switcher--compact" : "theme-switcher"}
      role="group"
      aria-label="Тема оформления"
    >
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={skin === opt.id ? "theme-switcher__btn is-active" : "theme-switcher__btn"}
          onClick={() => onSkinChange(opt.id)}
          aria-pressed={skin === opt.id}
          title={`${opt.label} — ${opt.description}`}
        >
          <span className="theme-switcher__mark" aria-hidden>
            {THEME_MARKS[opt.id]}
          </span>
          <span className="theme-switcher__label">{opt.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
