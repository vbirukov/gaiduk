import { useCallback, useEffect, useMemo, useRef } from "react";
import { IconButton, PlayPauseIcon } from "./components/IconButton";
import { PlayerTimeline } from "./components/PlayerTimeline";
import { TrackCover } from "./components/TrackCover";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useCatalog } from "./hooks/useCatalog";
import { useEmbedUserState } from "./hooks/useEmbedUserState";
import { parseEmbedParams } from "./lib/embed";
import { ymGoal } from "./lib/metrika";
import { sharePageUrl, resolveSiteOrigin } from "./lib/shareOg";

const catalogFilters = {
  view: "all" as const,
  selectedFolder: null,
  selectedPlaylist: null,
  feedListenFilter: "all" as const,
};

export function EmbedApp() {
  const { trackId, startAtSec, autoplay } = parseEmbedParams();
  const [user, setUser] = useEmbedUserState();
  const autoplayDone = useRef(false);

  const { catalog, catalogLoading, trackMap, patchTrackUrl } = useCatalog(
    user,
    catalogFilters,
  );

  const track = trackId ? trackMap.get(trackId) ?? null : null;
  const tracks = useMemo(() => (track ? [track] : []), [track]);
  const trackIds = useMemo(() => (track ? [track.id] : []), [track]);
  const queue = trackIds;

  const pushToast = useCallback(() => {}, []);

  const player = useAudioPlayer({
    catalog,
    patchTrackUrl,
    user,
    setUser,
    tracks,
    trackIds,
    queue,
    trackMap,
    pushToast,
  });

  useEffect(() => {
    if (catalogLoading || !track || autoplayDone.current) return;
    autoplayDone.current = true;
    if (!autoplay) return;
    void player.playTrack(track, { startAtSec });
  }, [autoplay, catalogLoading, player, startAtSec, track]);

  const openHref =
    track != null
      ? sharePageUrl(
          track.id,
          resolveSiteOrigin(),
          player.audioRef.current?.currentTime,
        )
      : resolveSiteOrigin();

  if (!trackId) {
    return (
      <div className="embed-root">
        <p className="embed-state">Укажите трек: ?track=…</p>
      </div>
    );
  }

  if (catalogLoading) {
    return (
      <div className="embed-root">
        <p className="embed-state">Загрузка…</p>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="embed-root">
        <p className="embed-state">Сказка не найдена</p>
      </div>
    );
  }

  const onTogglePlay = () => {
    if (!player.currentTrackId) {
      void player.playTrack(track, { startAtSec });
      ymGoal("embed_play");
      return;
    }
    void player.togglePlay();
    if (!player.isPlaying) ymGoal("embed_play");
  };

  return (
    <div className="embed-root">
      <article className="embed-card" aria-label={`Плеер: ${track.title}`}>
        <div className="embed-row">
          <TrackCover track={track} size="md" />
          <div className="embed-meta">
            <h1 className="embed-title">{track.title}</h1>
            {track.folder ? (
              <p className="embed-folder">{track.folder}</p>
            ) : null}
          </div>
          <div className="embed-actions">
            <IconButton
              variant="primary"
              size="play"
              onClick={onTogglePlay}
              disabled={player.audioBusy}
              aria-label={player.playButtonLabel}
            >
              <PlayPauseIcon
                playing={player.isPlaying}
                iconSize={28}
                busy={player.audioBusy}
              />
            </IconButton>
          </div>
        </div>
        <PlayerTimeline
          audioRef={player.audioRef}
          trackId={player.currentTrackId}
          onSeek={player.seek}
        />
        <audio ref={player.bindAudioRef} preload="metadata" />
        <footer className="embed-footer">
          <a
            className="embed-open"
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть в Haiduk
          </a>
        </footer>
      </article>
    </div>
  );
}
