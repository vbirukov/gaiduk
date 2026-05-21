import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./icons/Icon";
import type { Playlist } from "../types/user";

type Props = {
  trackId: string;
  playlists: Playlist[];
  onSelect: (playlistId: string, trackId: string) => void;
};

export function CardPlaylistMenu({ trackId, playlists, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (playlists.length === 0) return null;

  const handlePick = (playlistId: string) => {
    onSelect(playlistId, trackId);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`card-playlist-menu${open ? " is-open" : ""}`}
    >
      <button
        type="button"
        className="ghost card-playlist-menu__trigger"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        title="Добавить в плейлист"
      >
        <Icon name="star-outline" size={18} aria-hidden />
        <span className="card-playlist-menu__label">В плейлист</span>
        <Icon
          name="chevron-down"
          size={16}
          className="card-playlist-menu__chevron"
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          id={listId}
          className="card-playlist-menu__list"
          role="listbox"
          aria-label="Выберите плейлист"
        >
          {playlists.map((pl) => {
            const inList = pl.trackIds.includes(trackId);
            return (
              <li key={pl.id} role="none">
                <button
                  type="button"
                  role="option"
                  className="card-playlist-menu__item"
                  aria-selected={inList}
                  disabled={inList}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePick(pl.id);
                  }}
                >
                  <span className="card-playlist-menu__item-name">{pl.name}</span>
                  {inList ? (
                    <Icon name="check" size={14} aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
