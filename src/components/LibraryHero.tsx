import { useCallback, useRef } from "react";
import { useFeedGridDesktop } from "../hooks/useFeedGridDesktop";
import { useHeroParallax } from "../hooks/useHeroParallax";
import { AuthorPhotoSlideshow } from "./AuthorPhotoSlideshow";
import { AUTHOR_SUPPORT_URL, AUTHOR_VK_URL } from "../config";
import type { Catalog } from "../types/catalog";

type Props = {
  catalog: Catalog;
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
};

export function LibraryHero({
  catalog,
  collapsed,
  onCollapse,
  onExpand,
}: Props) {
  const isDesktop = useFeedGridDesktop();
  const isCompact = collapsed && !isDesktop;
  const mainRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  useHeroParallax(heroVisualRef);

  const scrollMainIntoView = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    el.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const handleToggle = useCallback(() => {
    if (isDesktop) return;
    if (collapsed) {
      onExpand();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollMainIntoView());
      });
    } else {
      onCollapse();
    }
  }, [collapsed, isDesktop, onCollapse, onExpand, scrollMainIntoView]);

  return (
    <section className={isCompact ? "hero hero--compact" : "hero"}>
      <div className="hero-main" ref={mainRef}>
        <div className="hero-head">
          <div className="hero-expandable" aria-hidden={isCompact}>
            <div className="hero-expandable-inner">
              <p className="hero-author-bio">
                Автор и рассказчик, который умеет превращать
                сказку в живое, душевное и очень человеческое пространство. В его
                историях чувствуется любовь к свободе, юмору, странствиям и
                мудрости народной речи. Он пишет так, будто ведёт неспешный,
                доверительный разговор у костра: легко, ярко, с иронией и теплом.
                Его сказки запоминаются особой интонацией — немного озорной,
                немного волшебной, но всегда искренней и близкой читателю.
              </p>
            </div>
          </div>
          {!isDesktop ? (
            <button
              type="button"
              className="hero-toggle"
              onClick={handleToggle}
            >
              {collapsed ? "Об авторе" : "Свернуть"}
            </button>
          ) : null}
        </div>
        {isCompact ? (
          <p className="hero-compact-stats mini-text">
            {catalog.tracks.length} треков
          </p>
        ) : null}
      </div>
      <div className="hero-side hero-side--parallax" ref={heroVisualRef}>
        <div className="hero-author-block">
          <p className="hero-catalog-label">Каталог аудиосказок</p>
          <AuthorPhotoSlideshow />
          <div className="hero-author-actions">
            <a
              className="hero-author-link"
              href={AUTHOR_VK_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Дмитрий Гайдук
            </a>
            <div className="hero-author-ctas">
              <a
                className="chip hero-author-cta btn-shimmer"
                href={AUTHOR_VK_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Концерты
              </a>
              <a
                className="chip hero-author-cta btn-shimmer"
                href={AUTHOR_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Поддержать автора
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
