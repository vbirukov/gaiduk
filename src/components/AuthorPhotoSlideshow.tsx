import { useState } from "react";
import { AUTHOR_PHOTOS, randomAuthorPhotoIndex } from "../lib/authorPhotos";

export function AuthorPhotoSlideshow() {
  const [index] = useState(randomAuthorPhotoIndex);

  return (
    <div className="hero-art" aria-hidden="true">
      <img
        src={AUTHOR_PHOTOS[index]}
        alt=""
        className="hero-art-slide is-visible"
        decoding="async"
        fetchPriority="low"
      />
    </div>
  );
}
