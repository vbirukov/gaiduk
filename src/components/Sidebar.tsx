import { PUBLIC_KEY } from "../config";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./icons/Icon";
import type { Catalog } from "../types/catalog";
import type { LibraryView, UserState } from "../types/user";

type Props = {
  navOpen: boolean;
  onClose: () => void;
  catalog: Catalog;
  user: UserState;
  view: LibraryView;
  selectedFolder: string | null;
  selectedPlaylist: string | null;
  resumeCount: number;
  onSelectView: (view: LibraryView) => void;
  onSelectFolder: (folder: string) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenPlaylistModal: () => void;
};

export function Sidebar({
  navOpen,
  onClose,
  catalog,
  user,
  view,
  selectedFolder,
  selectedPlaylist,
  resumeCount,
  onSelectView,
  onSelectFolder,
  onSelectPlaylist,
  onOpenPlaylistModal,
}: Props) {
  return (
    <>
      <button
        type="button"
        className={navOpen ? "nav-backdrop is-open" : "nav-backdrop"}
        aria-hidden={!navOpen}
        tabIndex={navOpen ? 0 : -1}
        onClick={onClose}
      />
      <aside className={navOpen ? "sidebar is-open" : "sidebar"}>
        <div className="brand">
          <BrandLogo className="logo-box" />
          <div>
            <h1>Haiduk</h1>
            <p>аудиосказки · React player</p>
          </div>
          <button
            type="button"
            className="ghost round sidebar-close"
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <section className="side-section">
          <h2>Разделы</h2>
          <button
            type="button"
            className={view === "all" ? "nav active" : "nav"}
            onClick={() => onSelectView("all")}
          >
            Весь каталог{" "}
            <span className="nav-sublabel">
              ({catalog.tracks.length} треков)
            </span>
          </button>
          {(
            [
              ["resume", `Продолжить · ${resumeCount}`],
              [
                "favorites",
                `Избранное · ${Object.keys(user.favorites).length}`,
              ],
              ["liked", `Лайки · ${Object.keys(user.likes).length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "nav active" : "nav"}
              onClick={() => onSelectView(id)}
            >
              {label}
            </button>
          ))}
        </section>
        <section className="side-section">
          <h2>Коллекция</h2>
          <div className="side-list">
            {catalog.folders.map((folder) => (
              <button
                key={folder}
                className={selectedFolder === folder ? "nav active" : "nav"}
                onClick={() => onSelectFolder(folder)}
              >
                {folder}
              </button>
            ))}
          </div>
        </section>
        <section className="side-section">
          <div className="side-head">
            <h2>Плейлисты</h2>
            <button className="ghost round" onClick={onOpenPlaylistModal}>
              ＋
            </button>
          </div>
          <div className="side-list">
            {user.playlists.filter((p) => !p.system).length === 0 ? (
              <div className="mini-text">Пока нет пользовательских плейлистов</div>
            ) : null}
            {user.playlists
              .filter((p) => !p.system)
              .map((pl) => (
                <button
                  key={pl.id}
                  className={selectedPlaylist === pl.id ? "nav active" : "nav"}
                  onClick={() => onSelectPlaylist(pl.id)}
                >
                  {pl.name} <span>{pl.trackIds.length}</span>
                </button>
              ))}
          </div>
        </section>
        <p className="mini-text source sidebar-source">
          Источник: {PUBLIC_KEY}
        </p>
      </aside>
    </>
  );
}
