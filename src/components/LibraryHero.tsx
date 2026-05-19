import { AuthorPhotoSlideshow } from "./AuthorPhotoSlideshow";
import { AUTHOR_CONCERTS_URL, AUTHOR_VK_URL } from "../config";
import type { Catalog } from "../types/catalog";
import type { UserState } from "../types/user";

type Props = {
  catalog: Catalog;
  user: UserState;
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
};

export function LibraryHero({
  catalog,
  user,
  collapsed,
  onCollapse,
  onExpand,
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
        {collapsed ? (
          <p className="hero-compact-stats mini-text">
            {catalog.tracks.length} треков
          </p>
        ) : null}
      </div>
      <div className="hero-side">
        <div className="hero-author-block">
          <p className="hero-catalog-label">Каталог аудиосказок</p>
          <AuthorPhotoSlideshow />
          <div className="hero-author-actions">
            <a
              className="hero-author-link"
              href={AUTHOR_VK_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Дмитрий Гайдук
            </a>
            <a
              className="chip hero-author-cta"
              href={AUTHOR_CONCERTS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Концерты
            </a>
          </div>
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
              <span>Плейлистов</span>
              <strong>{playlistCount}</strong>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
