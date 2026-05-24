import { memo, useEffect, useState } from "react";
import { fmtTime } from "../lib/format";
import { isStubTrack } from "../lib/diskDownload";
import { listenStatus, listenStatusLabel } from "../lib/listenStatus";
import { Icon } from "./icons/Icon";
import { CardPlaylistMenu } from "./CardPlaylistMenu";
import { IconButton, PlayPauseIcon } from "./IconButton";
import type { Track } from "../types/catalog";
import type { Playlist, Progress } from "../types/user";

export type TrackCardProps = {
  track: Track;
  layout?: "tiles" | "rows";
  showFolderName?: boolean;
  isQueueNext?: boolean;
  progress: Progress;
  isActive: boolean;
  isPlaying: boolean;
  liked: boolean;
  playlistButtons: Playlist[];
  onPlayTrack: (track: Track) => void;
  onToggleLike: (id: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onSelectFolder?: (folder: string) => void;
  isOffline?: boolean;
  isOfflineDownloading?: boolean;
  onOfflineAction?: (track: Track) => void;
};

function CardFolderLink({
  folder,
  className,
  onSelectFolder,
}: {
  folder: string;
  className: string;
  onSelectFolder?: (folder: string) => void;
}) {
  if (!onSelectFolder) {
    return <span className={className}>{folder}</span>;
  }
  return (
    <button
      type="button"
      className={`${className} card-folder-btn`}
      onClick={(e) => {
        e.stopPropagation();
        onSelectFolder(folder);
      }}
      aria-label={`Каталог: ${folder}`}
    >
      {folder}
    </button>
  );
}

function TrackCardInner({
  track,
  layout = "tiles",
  showFolderName = false,
  isQueueNext = false,
  progress,
  isActive,
  isPlaying,
  liked,
  playlistButtons,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  onSelectFolder,
  isOffline = false,
  isOfflineDownloading = false,
  onOfflineAction,
}: TrackCardProps) {
  const status = listenStatus(progress);
  const [mobileTapPlay, setMobileTapPlay] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 720px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setMobileTapPlay(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const isRow = layout === "rows";

  const stub = isStubTrack(track);
  const showOffline = Boolean(onOfflineAction) && !stub;

  const cardClass = [
    "card",
    isRow && "card--row",
    `card-status-${status}`,
    isActive && "is-active",
    isActive && isPlaying && "is-playing",
    isOffline && "is-offline",
  ]
    .filter(Boolean)
    .join(" ");

  const progressBadgeLabel =
    progress.position > 0 ? fmtTime(progress.position) : "···";

  const progressBadge =
    isActive || status !== "in-progress" ? null : (
      <span
        className={`card-badge card-badge--progress${isRow ? "" : " card-badge--corner"}`}
        title={listenStatusLabel["in-progress"]}
        aria-label={`${listenStatusLabel["in-progress"]}, ${progressBadgeLabel}`}
      >
        {progressBadgeLabel}
      </span>
    );

  const renderStatusBadge = () => {
    if (isActive) {
      return (
        <span
          className={`card-badge card-badge--live${isPlaying ? " is-playing" : ""}`}
          aria-live="polite"
        >
          {isPlaying ? "Сейчас" : "Пауза"}
        </span>
      );
    }
    if (isQueueNext) {
      return (
        <span className="card-badge card-badge--next" title="Следующий в очереди">
          Следующий
        </span>
      );
    }
    if (status === "completed") {
      return (
        <span
          className="card-badge card-badge--completed"
          title={listenStatusLabel.completed}
          aria-label={listenStatusLabel.completed}
        >
          <Icon name="check" size={11} />
        </span>
      );
    }
    return null;
  };

  const offlinePill = isOffline ? (
    <span
      className="pill pill--offline"
      title="Скачано · доступно без сети"
    >
      Офлайн
    </span>
  ) : null;

  const playLabel = stub
    ? "Подготовлено"
    : isActive && isPlaying
      ? "Пауза"
      : isActive
        ? "Продолжить"
        : "Слушать";

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    if (!mobileTapPlay) return;
    if ((e.target as HTMLElement).closest("button, a")) return;
    onPlayTrack(track);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!mobileTapPlay) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    if ((e.target as HTMLElement).closest("button, a")) return;
    e.preventDefault();
    onPlayTrack(track);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayTrack(track);
  };

  const actions = (
    <div className="card-actions row-actions wrap">
      {isRow ? progressBadge : null}
      <div className="card-social row-actions">
        {showOffline ? (
          <button
            type="button"
            className={`ghost round card-offline-btn${isOffline ? " is-saved" : ""}`}
            disabled={isOfflineDownloading}
            onClick={(e) => {
              e.stopPropagation();
              onOfflineAction?.(track);
            }}
            aria-label={
              isOfflineDownloading
                ? "Скачивание…"
                : isOffline
                  ? "Удалить офлайн-копию"
                  : "Скачать для офлайн"
            }
            title={
              isOfflineDownloading
                ? "Скачивание…"
                : isOffline
                  ? "На устройстве · нажми, чтобы удалить"
                  : "Скачать на устройство"
            }
          >
            {isOfflineDownloading ? (
              <Icon name="loader" size={20} className="icon-spin" />
            ) : (
              <Icon name={isOffline ? "check" : "download"} size={20} />
            )}
          </button>
        ) : null}
        <button
          type="button"
          className={`ghost round${liked ? " active" : ""}`}
          onClick={() => onToggleLike(track.id)}
          aria-label={liked ? "Убрать лайк" : "Лайк"}
        >
          <Icon name={liked ? "heart" : "heart-outline"} size={20} />
        </button>
      </div>
      <IconButton
        variant="primary"
        size="md"
        className="card-play"
        onClick={handlePlayClick}
        aria-label={playLabel}
      >
        <PlayPauseIcon
          playing={isActive && isPlaying}
          busy={false}
          iconSize={22}
        />
      </IconButton>
      <CardPlaylistMenu
        trackId={track.id}
        playlists={playlistButtons}
        onSelect={onAddToPlaylist}
      />
    </div>
  );

  const statusBadge = renderStatusBadge();
  const folderAfterTitle = isRow && showFolderName;

  const main = (
    <div className="card-main">
      {isRow ? (
        <div className="card-title-line">
          <h4 className="card-title">{track.title}</h4>
          {statusBadge}
          {offlinePill}
          {folderAfterTitle ? (
            <CardFolderLink
              folder={track.folder}
              className="card-folder"
              onSelectFolder={onSelectFolder}
            />
          ) : null}
        </div>
      ) : (
        <>
          <div className="card-pills">
            {showFolderName ? (
              <CardFolderLink
                folder={track.folder}
                className="pill"
                onSelectFolder={onSelectFolder}
              />
            ) : null}
            {statusBadge}
            {offlinePill}
          </div>
          <h4 className="card-title">{track.title}</h4>
        </>
      )}
    </div>
  );

  return (
    <article
      className={cardClass}
      data-track-id={track.id}
      aria-current={isActive ? "true" : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={mobileTapPlay ? 0 : undefined}
      aria-label={`${track.title}, ${track.folder}. ${playLabel}`}
    >
      <div className="card-bg" aria-hidden>
        <div className="card-bg__shade" />
      </div>
      {isRow ? (
        <div className="card-row-inner">
          {main}
          {actions}
        </div>
      ) : (
        <>
          <div className="card-top">{main}</div>
          {actions}
        </>
      )}
      {!isRow ? progressBadge : null}
    </article>
  );
}

function progressEqual(a: Progress, b: Progress) {
  return (
    a.position === b.position &&
    a.duration === b.duration &&
    a.completed === b.completed
  );
}

export const TrackCard = memo(TrackCardInner, (prev, next) => {
  if (prev.track !== next.track) return false;
  if (prev.layout !== next.layout) return false;
  if (prev.showFolderName !== next.showFolderName) return false;
  if (prev.isQueueNext !== next.isQueueNext) return false;
  if (prev.isActive !== next.isActive) return false;
  if (prev.isPlaying !== next.isPlaying) return false;
  if (prev.liked !== next.liked) return false;
  if (prev.isOffline !== next.isOffline) return false;
  if (prev.isOfflineDownloading !== next.isOfflineDownloading) return false;
  if (!progressEqual(prev.progress, next.progress)) return false;
  if (prev.playlistButtons !== next.playlistButtons) return false;
  return (
    prev.onPlayTrack === next.onPlayTrack &&
    prev.onToggleLike === next.onToggleLike &&
    prev.onAddToPlaylist === next.onAddToPlaylist &&
    prev.onSelectFolder === next.onSelectFolder &&
    prev.onOfflineAction === next.onOfflineAction
  );
});
