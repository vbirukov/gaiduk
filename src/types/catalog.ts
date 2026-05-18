export type Track = {
  id: string;
  title: string;
  fileName: string;
  folder: string;
  folderPath: string;
  path: string;
  size?: number;
  modified?: string;
  mimeType?: string;
  url?: string;
};

export type Catalog = {
  sourceTitle: string;
  folders: string[];
  tracks: Track[];
  loaded: boolean;
};
