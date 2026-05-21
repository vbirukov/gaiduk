import type { FeedLayout } from "../types/user";

type Props = {
  layout?: FeedLayout;
};

export function TrackCardSkeleton({ layout = "tiles" }: Props) {
  if (layout === "rows") {
    return (
      <article className="card card--row card-skeleton" aria-hidden="true">
        <div className="card-bg" aria-hidden>
          <div className="card-bg__shade" />
        </div>
        <div className="card-row-inner">
          <div className="skeleton-line skeleton-line--lg" />
          <div className="skeleton-actions">
            <div className="skeleton-line skeleton-line--btn" />
            <div className="skeleton-line skeleton-line--btn" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card card-skeleton" aria-hidden="true">
      <div className="card-bg" aria-hidden>
        <div className="card-bg__shade" />
      </div>
      <div className="skeleton-line skeleton-line--sm" />
      <div className="skeleton-line skeleton-line--lg" />
      <div className="skeleton-line skeleton-line--md" />
      <div className="skeleton-line skeleton-line--bar" />
      <div className="skeleton-actions">
        <div className="skeleton-line skeleton-line--btn" />
        <div className="skeleton-line skeleton-line--tag" />
      </div>
    </article>
  );
}
