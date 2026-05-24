import type { ReactNode } from "react";
import { Icon } from "./icons/Icon";

type Props = {
  folder: string;
  onShare?: () => void;
  offlineActions?: ReactNode;
  onFilterOnly?: () => void;
  filterActive?: boolean;
};

export function CatalogFolderHeading({
  folder,
  onShare,
  offlineActions,
  onFilterOnly,
  filterActive = false,
}: Props) {
  return (
    <h3 className="catalog-folder-heading">
      <span className="catalog-folder-heading__label">{folder}</span>
      <span className="catalog-folder-heading__actions">
        {offlineActions}
        {onFilterOnly && !filterActive ? (
          <button
            type="button"
            className="ghost catalog-folder-heading__filter"
            onClick={onFilterOnly}
          >
            <Icon name="list-plus" size={16} aria-hidden />
            <span>Только эта серия</span>
          </button>
        ) : null}
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
