import type { FeedLayout } from "../types/user";

type Props = {
  value: FeedLayout;
  onChange: (layout: FeedLayout) => void;
};

export function FeedLayoutSwitch({ value, onChange }: Props) {
  return (
    <div className="feed-layout-switch" role="group" aria-label="Вид списка треков">
      <button
        type="button"
        className={value === "tiles" ? "feed-layout-switch__btn is-active" : "feed-layout-switch__btn"}
        aria-pressed={value === "tiles"}
        onClick={() => onChange("tiles")}
      >
        Тайлы
      </button>
      <button
        type="button"
        className={value === "rows" ? "feed-layout-switch__btn is-active" : "feed-layout-switch__btn"}
        aria-pressed={value === "rows"}
        onClick={() => onChange("rows")}
      >
        Строки
      </button>
    </div>
  );
}
