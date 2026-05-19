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

export function randomAuthorPhotoIndex(): number {
  return Math.floor(Math.random() * AUTHOR_PHOTOS.length);
}
