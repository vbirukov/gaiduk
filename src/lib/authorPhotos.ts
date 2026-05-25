/** Файлы в public/gaiduk — glob по public в Vite не работает. */
const AUTHOR_PHOTO_FILES = [
  "gaiduk1.jpg",
  "gaiduk2.jpg",
  "gaiduk3.jpg",
  "gaiduk4.jpg",
  "gaiduk5.jpg",
  "gaiduk6.jpg",
  "gaiduk7.jpg",
  "gaiduk8.jpg",
] as const;

function authorPhotoUrl(file: string): string {
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}gaiduk/${file}`;
}

/** Пути к фото автора (public/gaiduk). */
export const AUTHOR_PHOTOS: readonly string[] = AUTHOR_PHOTO_FILES.map(
  authorPhotoUrl,
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
