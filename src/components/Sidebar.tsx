import type { AppSkin } from "../themes";
import { BrandLogo } from "./BrandLogo";
import { Icon } from "./icons/Icon";
import { IconButtonIcon } from "./IconButton";
import { ThemeSwitcher } from "./ThemeSwitcher";
import type { Catalog } from "../types/catalog";
import type { LibraryView, UserState } from "../types/user";

type Props = {
  skin: AppSkin;
  onSkinChange: (skin: AppSkin) => void;
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
  onDeletePlaylist: (playlistId: string) => void;
};

export function Sidebar({
  skin,
  onSkinChange,
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
  onDeletePlaylist,
}: Props) {
  const likeCount = Object.keys(user.likes).length;
  const extraViews = [
    resumeCount > 0 ? (["resume", `Продолжить · ${resumeCount}`] as const) : null,
    likeCount > 0 ? (["liked", `Лайки · ${likeCount}`] as const) : null,
  ].filter((item): item is readonly ["resume" | "liked", string] => item != null);

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
        <div className="sidebar-theme">
          <ThemeSwitcher skin={skin} onSkinChange={onSkinChange} compact />
        </div>
        <div className="brand">
          <BrandLogo className="logo-box" />
          <h1>Haiduk</h1>
          <IconButtonIcon
            className="sidebar-close"
            icon="close"
            iconSize={22}
            onClick={onClose}
            aria-label="Закрыть меню"
          />
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
          {extraViews.map(([id, label]) => (
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
                <div key={pl.id} className="nav-item nav-item--playlist">
                  <button
                    type="button"
                    className={selectedPlaylist === pl.id ? "nav active" : "nav"}
                    onClick={() => onSelectPlaylist(pl.id)}
                  >
                    {pl.name} <span>{pl.trackIds.length}</span>
                  </button>
                  <button
                    type="button"
                    className="nav-item__delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist(pl.id);
                    }}
                    aria-label={`Удалить плейлист «${pl.name}»`}
                    title="Удалить плейлист"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </div>
              ))}
          </div>
        </section>
      </aside>
    </>
  );
}
