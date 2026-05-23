export const AUTHOR_PHOTOS = [
  "/gaiduk/gaiduk.jpg",
  "/gaiduk/gaiduk1.jpg",
  "/gaiduk/gaiduk2.jpg",
  "/gaiduk/gaiduk3.jpg",
  "/gaiduk/gaiduk4.jpg",
  "/gaiduk/gaiduk5.jpg",
  "/gaiduk/gaiduk6.jpg",
  "/gaiduk/gaiduk7.jpg",
  "/gaiduk/gaiduk8.jpg",
  "/gaiduk/gaiduk9.jpg",
  "/gaiduk/gaiduk10.jpg",
  "/gaiduk/gaiduk11.jpg",
] as const;

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
  return shuffledIndices(AUTHOR_PHOTOS.length);
}
