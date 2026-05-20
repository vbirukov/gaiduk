type Props = {
  folder: string;
};

export function CatalogFolderHeading({ folder }: Props) {
  return (
    <h3 className="catalog-folder-heading">
      <span className="catalog-folder-heading__label">{folder}</span>
    </h3>
  );
}
