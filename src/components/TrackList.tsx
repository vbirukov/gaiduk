import { useMemo } from "react";
import type { Catalog, Track } from "../types/catalog";
import type { Progress, UserState } from "../types/user";
import type { LivePlayback } from "../lib/trackProgress";
import type { TrackCardProps } from "./TrackCard";
import { VirtualTrackGrid } from "./VirtualTrackGrid";

type Props = {
  catalog: Catalog;
  user: UserState;
  tracks: Track[];
  query: string;
  onQueryChange: (q: string) => void;
  resumeCount: number;
  sectionTitle: string;
  sectionSub: string;
  activeTrackId: string | null;
  livePlayback: LivePlayback | null;
  progressOf: (id: string) => Progress;
  isLiked: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
  onPlayTrack: TrackCardProps["onPlayTrack"];
  onToggleLike: TrackCardProps["onToggleLike"];
  onToggleFavorite: TrackCardProps["onToggleFavorite"];
  onAddToPlaylist: TrackCardProps["onAddToPlaylist"];
  onQuickView: (view: "resume" | "favorites" | "liked") => void;
};

export function TrackList({
  catalog,
  user,
  tracks,
  query,
  onQueryChange,
  resumeCount,
  sectionTitle,
  sectionSub,
  activeTrackId,
  livePlayback,
  progressOf,
  isLiked,
  isFavorite,
  onPlayTrack,
  onToggleLike,
  onToggleFavorite,
  onAddToPlaylist,
  onQuickView,
}: Props) {
  const playlistButtons = useMemo(
    () => user.playlists.filter((pl) => !pl.system).slice(0, 3),
    [user.playlists],
  );

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">Библиотека вместо архива</div>
          <h2>Удобное прослушивание с прогрессом, избранным и плейлистами.</h2>
          <p>
            Приложение подгружает каталог из публичной папки Яндекс.Диска и
            превращает его в аккуратную медиатеку с сохранением места остановки.
          </p>
          <div className="hero-actions">
            <div className="search-wrap">
              <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Поиск по названию, серии или имени файла"
              />
            </div>
            <button className="chip" onClick={() => onQuickView("resume")}>
              Продолжить
            </button>
            <button className="chip" onClick={() => onQuickView("favorites")}>
              Избранное
            </button>
            <button className="chip" onClick={() => onQuickView("liked")}>
              Лайки
            </button>
          </div>
        </div>
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
            <strong>{user.playlists.filter((p) => !p.system).length}</strong>
          </div>
        </div>
      </section>
      <section className="section-head">
        <div>
          <h3>{sectionTitle}</h3>
          <p>{sectionSub}</p>
        </div>
        <div className="mini-text">{tracks.length} элементов</div>
      </section>
      {tracks.length === 0 ? (
        <section className="cards">
          <div className="empty">
            Пока ничего не найдено. Снимите фильтры или обновите каталог.
          </div>
        </section>
      ) : (
        <VirtualTrackGrid
          tracks={tracks}
          activeTrackId={activeTrackId}
          livePlayback={livePlayback}
          progressOf={progressOf}
          isLiked={isLiked}
          isFavorite={isFavorite}
          playlistButtons={playlistButtons}
          onPlayTrack={onPlayTrack}
          onToggleLike={onToggleLike}
          onToggleFavorite={onToggleFavorite}
          onAddToPlaylist={onAddToPlaylist}
        />
      )}
    </>
  );
}
