import { useRef, type RefObject } from "react";
import { ASSETS } from "../lib/assets";
import { useFeedParallax } from "../hooks/useFeedParallax";

type Props = {
  feedRef: RefObject<HTMLElement | null>;
};

export function FeedParallaxBg({ feedRef }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  useFeedParallax(feedRef, layerRef);

  return (
    <div className="library-feed-bg" aria-hidden>
      <div ref={layerRef} className="library-feed-bg__track">
        <img src={ASSETS.feedBg} alt="" decoding="async" />
      </div>
    </div>
  );
}
