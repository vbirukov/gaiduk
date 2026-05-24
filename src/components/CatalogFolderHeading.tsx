import type { ReactNode } from "react";
import { Icon } from "./icons/Icon";

type Props = {
  folder: string;
  onShare?: () => void;
  offlineActions?: ReactNode;
};

export function CatalogFolderHeading({ folder, onShare, offlineActions }: Props) {
  return (
    <h3 className="catalog-folder-heading">
      <span className="catalog-folder-heading__label">{folder}</span>
      <span className="catalog-folder-heading__actions">
        {offlineActions}
        {onShare ? (
          <button
            type="button"
            className="ghost catalog-folder-heading__share"
            onClick={onShare}
          >
            <Icon name="share" size={16} aria-hidden />
            <span>Поделиться</span>
          </button>
        ) : null}
      </span>
    </h3>
  );
}
