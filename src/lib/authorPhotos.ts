const authorPhotoModules = import.meta.glob(
  "../public/gaiduk/*.{jpg,jpeg,webp,png,JPG,JPEG,WEBP,PNG}",
  { eager: true },
);

function publicAuthorPhotoPath(globKey: string): string {
  const name = globKey.split("/").pop() ?? globKey;
  return `/gaiduk/${name}`;
}

/** Список синхронизирован с файлами в public/gaiduk (пересборка при добавлении/удалении). */
export const AUTHOR_PHOTOS: readonly string[] = Object.keys(authorPhotoModules)
  .map(publicAuthorPhotoPath)
  .sort((a, b) =>
    a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" }),
  );

export const AUTHOR_SLIDE_MS = 5200;

const preloaded = new Set<string>();

/** Прогрев кэша — повторные показы без повторной загрузки. */
export function preloadAuthorPhotos(): void {
  if (typeof window === "undefined") return;
  for (const src of AUTHOR_PHOTOS) {
    if (preloaded.has(src)) continue;
    preloaded.add(src);
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

function shuffledIndices(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

export function createAuthorSlideOrder(): number[] {
  if (AUTHOR_PHOTOS.length === 0) return [];
  return shuffledIndices(AUTHOR_PHOTOS.length);
}
