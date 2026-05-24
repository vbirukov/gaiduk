import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  defaultFeedColumns,
  FEED_GRID_DESKTOP_MIN_PX,
  GRID_GAP_PX,
  measureFeedGridWidth,
  resolveFeedColumns,
} from "../lib/gridColumns";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  buildFeedLayoutRows,
  groupTracksByFolder,
  layoutRowForFolderHeader,
  layoutRowForTrackId,
} from "../lib/feedLayout";
import { resolveTrackProgress } from "../lib/trackProgress";
import type { LivePlayback } from "../lib/trackProgress";
import type { Track } from "../types/catalog";
import type { FeedLayout, Playlist, Progress } from "../types/user";
import { CatalogFolderHeading } from "./CatalogFolderHeading";
import { TrackCard, type TrackCardProps } from "./TrackCard";
import { TrackCardSkeleton } from "./TrackCardSkeleton";

const VIRTUALIZE_MIN = 48;
const TILE_ROW_ESTIMATE_PX = 340;
const LIST_ROW_ESTIMATE_PX = 76;
const HEADER_ROW_ESTIMATE_PX = 64;
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
  onSelectFolder?: TrackCardProps["onSelectFolder"];
  onShareFolder?: (folder: string) => void;
  renderFolderOffline?: (folder: string) => ReactNode;
  isTrackOffline?: (trackId: string) => boolean;
  isTrackDownloading?: (trackId: string) => boolean;
  onTrackOfflineAction?: (track: Track) => void;
  scrollToTrackId?: string | null;
  scrollToFolder?: string | null;
  onScrolledToTrack?: () => void;
  onScrolledToFolder?: () => void;
  feedFolderFilterActive?: boolean;
  onFilterOnlyFolder?: (folder: string) => void;
  showFolderHeaders?: boolean;
  showFolderNames?: boolean;
  feedLayout?: FeedLayout;
  nextTrackId?: string | null;
};

function useColumnCount(containerRef: RefObject<HTMLElement | null>) {
  const [cols, setCols] = useState(defaultFeedColumns);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setCols(resolveFeedColumns(measureFeedGridWidth(el)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    const target =
      (el.closest(".library-feed-content") as HTMLElement | null) ?? el;
    ro.observe(target);
    if (target !== el) ro.observe(el);
    window.addEventListener("resize", measure);
    const mq = window.matchMedia(
      `(min-width: ${FEED_GRID_DESKTOP_MIN_PX}px)`,
    );
    mq.addEventListener("change", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
    };
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
  onSelectFolder,
  onShareFolder,
  renderFolderOffline,
  isTrackOffline,
  isTrackDownloading,
  onTrackOfflineAction,
  scrollToTrackId = null,
  scrollToFolder = null,
  onScrolledToTrack,
  onScrolledToFolder,
  feedFolderFilterActive = false,
  onFilterOnlyFolder,
  showFolderHeaders = false,
  showFolderNames = false,
  feedLayout = "tiles",
  nextTrackId = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRows = feedLayout === "rows";
  const gridCols = useColumnCount(containerRef);
  const cols = isRows ? 1 : gridCols;
  const scrollMargin = useScrollMargin(containerRef);
  const rowEstimatePx = isRows ? LIST_ROW_ESTIMATE_PX : TILE_ROW_ESTIMATE_PX;
  const layoutRows = useMemo(
    () => buildFeedLayoutRows(tracks, cols, showFolderHeaders),
    [tracks, cols, showFolderHeaders],
  );
  const folderGroups = useMemo(
    () => (showFolderHeaders ? groupTracksByFolder(tracks) : []),
    [tracks, showFolderHeaders],
  );
  const useVirtual = tracks.length >= VIRTUALIZE_MIN;

  const virtualizer = useWindowVirtualizer({
    count: useVirtual ? layoutRows.length : 0,
    estimateSize: (index) =>
      layoutRows[index]?.kind === "header"
        ? HEADER_ROW_ESTIMATE_PX
        : rowEstimatePx,
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
    let cancelled = false;
    const rowIndex = layoutRowForTrackId(layoutRows, trackId);
    if (rowIndex < 0) {
      onScrolledToTrack?.();
      return;
    }

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
  }, [
    scrollToTrackId,
    tracks,
    layoutRows,
    useVirtual,
    onScrolledToTrack,
  ]);

  useLayoutEffect(() => {
    if (!scrollToFolder) return;
    const folder = scrollToFolder;
    let cancelled = false;
    const rowIndex = layoutRowForFolderHeader(layoutRows, folder);
    if (rowIndex < 0) {
      const first = tracks.find((t) => t.folder === folder);
      if (first) {
        const trackRow = layoutRowForTrackId(layoutRows, first.id);
        if (trackRow >= 0) {
          virtualizerRef.current.scrollToIndex(trackRow, {
            align: "start",
            behavior: "smooth",
          });
        }
      }
      onScrolledToFolder?.();
      return;
    }

    const finish = () => {
      if (!cancelled) onScrolledToFolder?.();
    };

    const run = (attempt: number) => {
      if (cancelled) return;
      if (useVirtual) {
        virtualizerRef.current.scrollToIndex(rowIndex, {
          align: "start",
          behavior: attempt === 0 ? "auto" : "smooth",
        });
      } else {
        const el = document.querySelector(
          `[data-folder-header="${CSS.escape(folder)}"]`,
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          finish();
          return;
        }
      }
      if (attempt < 4) {
        window.setTimeout(() => run(attempt + 1), 80);
      } else {
        finish();
      }
    };

    run(0);
    return () => {
      cancelled = true;
    };
  }, [
    scrollToFolder,
    tracks,
    layoutRows,
    useVirtual,
    onScrolledToFolder,
  ]);

  const renderCard = (track: Track) => {
    const isActive = track.id === activeTrackId;
    return (
      <TrackCard
        key={track.id}
        track={track}
        layout={feedLayout}
        showFolderName={showFolderNames}
        isQueueNext={track.id === nextTrackId}
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
        onSelectFolder={onSelectFolder}
        isOffline={isTrackOffline?.(track.id)}
        isOfflineDownloading={isTrackDownloading?.(track.id)}
        onOfflineAction={onTrackOfflineAction}
      />
    );
  };

  const feedGridStyle = {
    "--feed-cols": cols,
  } as CSSProperties;

  const feedClass = isRows
    ? "cards cards--rows"
    : cols > 1
      ? "cards"
      : "cards";

  const renderRow = (rowTracks: Track[], className: string) => (
    <div className={className}>{rowTracks.map(renderCard)}</div>
  );

  if (catalogLoading) {
    return (
      <section
        className={feedClass}
        style={feedGridStyle}
        aria-busy="true"
        aria-label="Загрузка каталога"
      >
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <TrackCardSkeleton key={i} layout={feedLayout} />
        ))}
      </section>
    );
  }

  if (!useVirtual) {
    if (showFolderHeaders) {
      return (
        <div
          ref={containerRef}
          className={isRows ? "track-feed track-feed--rows" : "track-feed"}
          style={feedGridStyle}
        >
          {folderGroups.map((group) => (
            <section
              key={group.folder}
              className="track-feed__section"
            >
              <div data-folder-header={group.folder}>
              <CatalogFolderHeading
                folder={group.folder}
                offlineActions={
                  renderFolderOffline?.(group.folder) ?? undefined
                }
                filterActive={feedFolderFilterActive}
                onFilterOnly={
                  onFilterOnlyFolder
                    ? () => onFilterOnlyFolder(group.folder)
                    : undefined
                }
                onShare={
                  onShareFolder
                    ? () => onShareFolder(group.folder)
                    : undefined
                }
              />
              </div>
              <div
                className={
                  isRows ? "cards cards--section cards--rows" : "cards cards--section"
                }
                style={feedGridStyle}
              >
                {group.tracks.map(renderCard)}
              </div>
            </section>
          ))}
        </div>
      );
    }
    return (
      <section ref={containerRef} className={feedClass} style={feedGridStyle}>
        {tracks.map(renderCard)}
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className={`${feedClass} cards--virtual`}
      style={feedGridStyle}
    >
      <div
        className="cards-virtual-spacer"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const layoutRow = layoutRows[virtualRow.index];
          if (!layoutRow) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={
                layoutRow.kind === "header"
                  ? "cards-virtual-row cards-virtual-row--header"
                  : "cards-virtual-row"
              }
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                width: "100%",
              }}
            >
              {layoutRow.kind === "header" ? (
                <div data-folder-header={layoutRow.folder}>
                <CatalogFolderHeading
                  folder={layoutRow.folder}
                  offlineActions={
                    renderFolderOffline?.(layoutRow.folder) ?? undefined
                  }
                  filterActive={feedFolderFilterActive}
                  onFilterOnly={
                    onFilterOnlyFolder
                      ? () => onFilterOnlyFolder(layoutRow.folder)
                      : undefined
                  }
                  onShare={
                    onShareFolder
                      ? () => onShareFolder(layoutRow.folder)
                      : undefined
                  }
                />
                </div>
              ) : (
                renderRow(layoutRow.tracks, "cards-row")
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}