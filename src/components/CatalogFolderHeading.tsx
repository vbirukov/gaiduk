import { Icon } from "./icons/Icon";

type Props = {
  folder: string;
  onShare?: () => void;
};

export function CatalogFolderHeading({ folder, onShare }: Props) {
  return (
    <h3 className="catalog-folder-heading">
      <span className="catalog-folder-heading__label">{folder}</span>
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
    </h3>
  );
}
