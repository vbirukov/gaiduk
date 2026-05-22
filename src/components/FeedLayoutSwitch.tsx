import { Icon } from "./icons/Icon";
import { IconButton } from "./IconButton";
import type { FeedLayout } from "../types/user";

type Props = {
  value: FeedLayout;
  onChange: (layout: FeedLayout) => void;
};

export function FeedLayoutSwitch({ value, onChange }: Props) {
  const isTiles = value === "tiles";
  const next: FeedLayout = isTiles ? "rows" : "tiles";

  return (
    <IconButton
      variant="ghost"
      size="md"
      className="feed-layout-toggle"
      onClick={() => onChange(next)}
      aria-label={isTiles ? "Показать строками" : "Показать плитками"}
      title={isTiles ? "Строки" : "Тайлы"}
    >
      <Icon name={isTiles ? "layout-grid" : "layout-rows"} size={20} />
    </IconButton>
  );
}
