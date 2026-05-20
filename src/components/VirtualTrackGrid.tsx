import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { chunk } from "../lib/chunk";
import { resolveTrackProgress } from "../lib/trackProgress";
import type { LivePlayback } from "../lib/trackProgress";
import type { Track } from "../types/catalog";
import type { Playlist, Progress } from "../types/user";
import { TrackCard, type TrackCardProps } from "./TrackCard";
import { TrackCardSkeleton } from "./TrackCardSkeleton";

const VIRTUALIZE_MIN = 48;
const CARD_MIN_WIDTH = 320;
const GRID_GAP_PX = 16;
const ROW_ESTIMATE_PX = 340;
const OVERSCAN_ROWS = 8;

type Props = {
  tracks: Track[];
  catalogLoading?: boolean;
  activeTrackId: string | null;
  isPlaying: boolean;
  livePlayback: LivePlayback | null;
  progressOf: (id: string) => Progress;
  isLiked: (id: string) => boolean;
  playlistButtons: Playlist[];
  onPlayTrack: TrackCardProps["onPlayTrack"];
  onToggleLike: TrackCardProps["onToggleLike"];
  onAddToPlaylist: TrackCardProps["onAddToPlaylist"];
  scrollToTrackId?: string | null;
  onScrolledToTrack?: () => void;
};

function useColumnCount(containerRef: RefObject<HTMLElement | null>) {
  const [cols, setCols] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setCols(
        Math.max(1, Math.floor((w + GRID_GAP_PX) / (CARD_MIN_WIDTH + GRID_GAP_PX))),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  return cols;
}

function useScrollMargin(containerRef: RefObject<HTMLElement | null>) {
  const [margin, setMargin] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const next = Math.round(el.getBoundingClientRect().top + window.scrollY);
      setMargin((prev) => (prev === next ? prev : next));
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const main = el.closest(".main");
    if (main) ro.observe(main);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [containerRef]);

  return margin;
}

const SKELETON_COUNT = 6;

export function VirtualTrackGrid({
  tracks,
  catalogLoading = false,
  activeTrackId,
  isPlaying,
  livePlayback,
  progressOf,
  isLiked,
  playlistButtons,
  onPlayTrack,
  onToggleLike,
  onAddToPlaylist,
  scrollToTrackId = null,
  onScrolledToTrack,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cols = useColumnCount(containerRef);
  const scrollMargin = useScrollMargin(containerRef);
  const rows = useMemo(() => chunk(tracks, cols), [tracks, cols]);
  const useVirtual = tracks.length >= VIRTUALIZE_MIN;

  const virtualizer = useWindowVirtualizer({
    count: useVirtual ? rows.length : 0,
    estimateSize: () => ROW_ESTIMATE_PX,
    gap: GRID_GAP_PX,
    overscan: OVERSCAN_ROWS,
    scrollMargin,
    enabled: useVirtual,
  });
  virtualizer.shouldAdjustScrollPositionOnItemSizeChange = () => false;

  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useLayoutEffect(() => {
    if (!scrollToTrackId) return;
    const trackId = scrollToTrackId;
    const idx = tracks.findIndex((t) => t.id === trackId);
    if (idx < 0) {
      onScrolledToTrack?.();
      return;
    }

    let cancelled = false;
    const rowIndex = Math.floor(idx / cols);

    const finish = () => {
      if (!cancelled) onScrolledToTrack?.();
    };

    const run = (attempt: number) => {
      if (cancelled) return;
      if (useVirtual) {
        virtualizerRef.current.scrollToIndex(rowIndex, {
          align: "center",
          behavior: attempt === 0 ? "auto" : "smooth",
        });
      } else {
        const el = document.querySelector(
          `[data-track-id="${CSS.escape(trackId)}"]`,
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          finish();
        } else if (attempt < 4) {
          window.setTimeout(() => run(attempt + 1), 80);
        } else {
          finish();
        }
        return;
      }
      requestAnimationFrame(() => {
        if (cancelled) return;
        const el = document.querySelector(
          `[data-track-id="${CSS.escape(trackId)}"]`,
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          finish();
          return;
        }
        if (attempt < 4) {
          window.setTimeout(() => run(attempt + 1), 80);
        } else {
          finish();
        }
      });
    };

    run(0);
    return () => {
      cancelled = true;
    };
  }, [scrollToTrackId, tracks, cols, useVirtual, onScrolledToTrack]);

  const renderCard = (track: Track) => {
    const isActive = track.id === activeTrackId;
    return (
      <TrackCard
        key={track.id}
        track={track}
        isActive={isActive}
        isPlaying={isActive && isPlaying}
        progress={resolveTrackProgress(
          track.id,
          activeTrackId,
          livePlayback,
          progressOf,
        )}
        liked={isLiked(track.id)}
        playlistButtons={playlistButtons}
        onPlayTrack={onPlayTrack}
        onToggleLike={onToggleLike}
        onAddToPlaylist={onAddToPlaylist}
      />
    );
  };

  const renderRow = (rowTracks: Track[], className: string) => (
    <div
      className={className}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {rowTracks.map(renderCard)}
    </div>
  );

  if (catalogLoading) {
    return (
      <section className="cards" aria-busy="true" aria-label="Загрузка каталога">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <TrackCardSkeleton key={i} />
        ))}
      </section>
    );
  }

  if (!useVirtual) {
    return (
      <section ref={containerRef} className="cards">
        {tracks.map(renderCard)}
      </section>
    );
  }

  return (
    <section ref={containerRef} className="cards cards--virtual">
      <div
        className="cards-virtual-spacer"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowTracks = rows[virtualRow.index];
          if (!rowTracks?.length) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="cards-virtual-row"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                width: "100%",
              }}
            >
              {renderRow(rowTracks, "cards-row")}
            </div>
          );
        })}
      </div>
    </section>
  );
}