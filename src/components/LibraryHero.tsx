import { AuthorPhotoSlideshow } from "./AuthorPhotoSlideshow";
import type { Catalog } from "../types/catalog";
import type { UserState } from "../types/user";

type QuickView = "resume" | "favorites" | "liked";

type Props = {
  catalog: Catalog;
  user: UserState;
  resumeCount: number;
  query: string;
  collapsed: boolean;
  onQueryChange: (q: string) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onQuickView: (view: QuickView) => void;
  onResumeContinue?: () => void;
};

export function LibraryHero({
  catalog,
  user,
  resumeCount,
  query,
  collapsed,
  onQueryChange,
  onCollapse,
  onExpand,
  onQuickView,
  onResumeContinue,
}: Props) {
  const playlistCount = user.playlists.filter((p) => !p.system).length;

  return (
    <section className={collapsed ? "hero hero--compact" : "hero"}>
      <div className="hero-main">
        <div className="hero-head">
          {!collapsed ? (
            <>
              <div className="eyebrow">Об авторе</div>
              <h2>Дмитрий Гайдук</h2>
              <p className="hero-author-bio">
                Дмитрий Гайдук — автор и рассказчик, который умеет превращать
                сказку в живое, душевное и очень человеческое пространство. В его
                историях чувствуется любовь к свободе, юмору, странствиям и
                мудрости народной речи. Он пишет так, будто ведёт неспешный,
                доверительный разговор у костра: легко, ярко, с иронией и теплом.
                Его сказки запоминаются особой интонацией — немного озорной,
                немного волшебной, но всегда искренней и близкой читателю.
              </p>
            </>
          ) : null}
          <button
            type="button"
            className="ghost hero-toggle"
            onClick={collapsed ? onExpand : onCollapse}
          >
            {collapsed ? "Об авторе" : "Свернуть"}
          </button>
        </div>
        <div className="hero-actions">
          <div className="search-wrap">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Поиск по названию, серии или имени файла"
            />
          </div>
          <button
            type="button"
            className="chip"
            onClick={() =>
              onResumeContinue ? onResumeContinue() : onQuickView("resume")
            }
          >
            Продолжить
          </button>
          <button type="button" className="chip" onClick={() => onQuickView("favorites")}>
            Избранное
          </button>
          <button type="button" className="chip" onClick={() => onQuickView("liked")}>
            Лайки
          </button>
        </div>
        {collapsed ? (
          <div className="hero-compact-stats mini-text">
            <span>{catalog.tracks.length} треков</span>
            <span aria-hidden="true">·</span>
            <span>{resumeCount} продолжить</span>
          </div>
        ) : null}
      </div>
      <div className="hero-side">
        <div className="hero-author-block">
          <p className="hero-catalog-label">Каталог аудиосказок</p>
          <AuthorPhotoSlideshow />
          <a
            className="hero-author-link"
            href="https://vk.com/haidux"
            target="_blank"
            rel="noopener noreferrer"
          >
            Дмитрий Гайдук
          </a>
        </div>
        {!collapsed ? (
          <div className="stats-grid">
            <div className="stat">
              <span>Разделов</span>
              <strong>{catalog.folders.length}</strong>
            </div>
            <div className="stat">
              <span>Треков</span>
              <strong>{catalog.tracks.length}</strong>
            </div>
            <div className="stat">
              <span>Продолжить</span>
              <strong>{resumeCount}</strong>
            </div>
            <div className="stat">
              <span>Плейлистов</span>
              <strong>{playlistCount}</strong>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
