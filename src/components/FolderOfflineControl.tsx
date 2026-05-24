import { Icon } from "./icons/Icon";
import type { OfflineJob } from "../hooks/useOfflineLibrary";

type Props = {
  folder: string;
  layout?: "stacked" | "inline";
  isOffline: boolean;
  isDownloading: boolean;
  progress: { downloaded: number; total: number };
  job: OfflineJob | null;
  onDownload: () => void;
  onCancel: () => void;
  onRemove: () => void;
};

function fmtProgress(done: number, total: number) {
  if (!total) return "";
  return `${done}/${total}`;
}

export function FolderOfflineControl({
  folder,
  layout = "stacked",
  isOffline,
  isDownloading,
  progress,
  job,
  onDownload,
  onCancel,
  onRemove,
}: Props) {
  const cls =
    layout === "inline"
      ? "folder-offline folder-offline--inline ghost"
      : "folder-offline folder-offline--stacked nav-item__share--stacked";

  if (isDownloading && job?.folder === folder) {
    return (
      <button
        type="button"
        className={cls}
        onClick={onCancel}
        aria-label="Отменить скачивание"
      >
        <Icon name="loader" size={15} className="icon-spin" aria-hidden />
        <span>
          Скачивание… {fmtProgress(job.done, job.total)}
          {job.currentTitle ? ` · ${job.currentTitle}` : ""}
        </span>
      </button>
    );
  }

  if (isOffline) {
    return (
      <div className="folder-offline-pair">
        <span className="folder-offline-badge" title="Доступно без сети">
          <Icon name="check" size={14} aria-hidden />
          <span>Офлайн</span>
        </span>
        <button
          type="button"
          className={cls}
          onClick={onRemove}
          aria-label={`Удалить офлайн-копию «${folder}»`}
        >
          <span>Удалить с устройства</span>
        </button>
      </div>
    );
  }

  const partial =
    progress.downloaded > 0 && progress.downloaded < progress.total;

  return (
    <button
      type="button"
      className={cls}
      onClick={onDownload}
      aria-label={`Скачать серию «${folder}» для офлайн`}
    >
      <Icon name="download" size={15} aria-hidden />
      <span>
        {partial
          ? `Докачать (${fmtProgress(progress.downloaded, progress.total)})`
          : "Скачать серию"}
      </span>
    </button>
  );
}
