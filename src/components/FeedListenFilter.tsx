import { feedListenFilterLabel } from "../lib/listenStatus";
import type { FeedListenFilter } from "../types/user";

const OPTIONS: { id: FeedListenFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "unstarted", label: feedListenFilterLabel.unstarted },
  { id: "in-progress", label: feedListenFilterLabel["in-progress"] },
  { id: "completed", label: feedListenFilterLabel.completed },
];

type Props = {
  value: FeedListenFilter;
  onChange: (value: FeedListenFilter) => void;
};

export function FeedListenFilter({ value, onChange }: Props) {
  return (
    <div
      className="feed-listen-filter"
      role="group"
      aria-label="Фильтр по прослушиванию"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={
            value === opt.id
              ? "chip feed-listen-filter__chip is-active"
              : "chip feed-listen-filter__chip"
          }
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
