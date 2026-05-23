import { AUTHOR_PHOTOS } from "../lib/authorPhotos";
import { useAuthorPhotoSlideshow } from "../hooks/useAuthorPhotoSlideshow";
import { Icon } from "./icons/Icon";

export function AuthorPhotoSlideshow() {
  const {
    order,
    pos,
    activeSrc,
    motionOk,
    next,
    prev,
    goTo,
    setPaused,
  } = useAuthorPhotoSlideshow();

  return (
    <div
      className="hero-art hero-art--slideshow"
      aria-hidden="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="hero-art__stage">
        {AUTHOR_PHOTOS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={
              src === activeSrc
                ? "hero-art-slide is-visible"
                : "hero-art-slide"
            }
            decoding="async"
            loading={i < 2 ? "eager" : "lazy"}
            draggable={false}
          />
        ))}
      </div>

      {motionOk ? (
        <>
          <button
            type="button"
            className="hero-art-nav hero-art-nav--prev"
            onClick={prev}
            tabIndex={-1}
            aria-hidden
          >
            <Icon name="chevron-down" size={20} />
          </button>
          <button
            type="button"
            className="hero-art-nav hero-art-nav--next"
            onClick={next}
            tabIndex={-1}
            aria-hidden
          >
            <Icon name="chevron-down" size={20} />
          </button>
          <div className="hero-art-dots">
            {order.map((photoIndex, i) => (
              <button
                key={AUTHOR_PHOTOS[photoIndex]}
                type="button"
                className={
                  i === pos
                    ? "hero-art-dot is-active"
                    : "hero-art-dot"
                }
                onClick={() => goTo(i)}
                tabIndex={-1}
                aria-hidden
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
