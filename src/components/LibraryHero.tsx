import { AuthorPhotoSlideshow } from "./AuthorPhotoSlideshow";
import type { Catalog } from "../types/catalog";
import type { UserState } from "../types/user";

type Props = {
  catalog: Catalog;
  user: UserState;
  resumeCount: number;
  query: string;
  collapsed: boolean;
  onQueryChange: (q: string) => void;
  onCollapse: () => void;
  onExpand: () => void;
  onQuickView: (view: "resume" | "favorites" | "liked") => void;
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
}: Props) {
  const playlistCount = user.playlists.filter((p) => !p.system).length;

  return (
    <section className={collapsed ? "hero hero--compact" : "hero"}>
      <div className="hero-main">
        <div className="hero-head">
          {!collapsed ? (
            <>
              <div className="eyebrow">Библиотека вместо архива</div>
              <h2>Удобное прослушивание с прогрессом, избранным и плейлистами.</h2>
              <p>
                Приложение подгружает каталог из публичной папки Яндекс.Диска и
                превращает его в аккуратную медиатеку с сохранением места
                остановки.
              </p>
            </>
          ) : null}
          <button
            type="button"
            className="ghost hero-toggle"
            onClick={collapsed ? onExpand : onCollapse}
          >
            {collapsed ? "О приложении" : "Свернуть"}
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
          <button type="button" className="chip" onClick={() => onQuickView("resume")}>
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
