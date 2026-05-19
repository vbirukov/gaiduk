import { ASSETS } from "../lib/assets";

export function TrackCardSkeleton() {
  return (
    <article className="card card-skeleton" aria-hidden="true">
      <div className="card-bg" aria-hidden>
        <img src={ASSETS.trackBg} alt="" decoding="async" />
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
