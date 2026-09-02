export type MediaKind = "audio" | "video" | "text";

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
  /** Раздел плеера (фильтр/группировка движка). */
  section?: string;
  /** Тип медиа: аудио / видео / текст. */
  kind?: MediaKind;
};

export type Catalog = {
  sourceTitle: string;
  /** Разделы каталога (секции движка). */
  sections: string[];
  folders: string[];
  tracks: Track[];
  loaded: boolean;
};
