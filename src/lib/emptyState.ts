import type { LibraryView } from "../types/user";

type Args = {
  view: LibraryView;
  selectedFolder: string | null;
  selectedPlaylist: string | null;
  playlistName: string;
};

export function emptyStateCopy({
  view,
  selectedFolder,
  selectedPlaylist,
  playlistName,
}: Args): { title: string; hint: string } {
  if (selectedFolder) {
    return {
      title: "В этой серии пусто",
      hint: `В разделе «${selectedFolder}» пока нет треков или они не попали в индекс.`,
    };
  }
  if (view === "resume") {
    return {
      title: "Нечего продолжать",
      hint: "Здесь появятся сказки, которые вы слушали больше 15 секунд и не дослушали до конца.",
    };
  }
  if (view === "liked") {
    return {
      title: "Лайков пока нет",
      hint: "Отмечайте понравившиеся сказки лайком — они соберутся в этом разделе.",
    };
  }
  if (view === "playlist" && selectedPlaylist) {
    return {
      title: playlistName ? `«${playlistName}» пуст` : "Плейлист пуст",
      hint: "Добавляйте треки кнопками «+ название» на карточках в каталоге.",
    };
  }
  return {
    title: "Каталог пуст",
    hint: "Обновите каталог или проверьте доступ к папке на Яндекс.Диске.",
  };
}
