import { feedListenFilterLabel } from "./listenStatus";
import type { FeedListenFilter, LibraryView } from "../types/user";

type Args = {
  view: LibraryView;
  feedFolderFilter: string[];
  selectedPlaylist: string | null;
  playlistName: string;
  feedListenFilter: FeedListenFilter;
};

export function emptyStateCopy({
  view,
  feedFolderFilter,
  selectedPlaylist,
  playlistName,
  feedListenFilter,
}: Args): { title: string; hint: string } {
  if (
    feedListenFilter !== "all" &&
    view !== "resume" &&
    feedListenFilter in feedListenFilterLabel
  ) {
    const label = feedListenFilterLabel[feedListenFilter as keyof typeof feedListenFilterLabel];
    return {
      title: `Нет сказок: «${label}»`,
      hint: "Смените фильтр или откройте другой раздел каталога.",
    };
  }
  if (feedFolderFilter.length === 1) {
    return {
      title: "В этой серии пусто",
      hint: `В разделе «${feedFolderFilter[0]}» пока нет треков или они не попали в индекс.`,
    };
  }
  if (feedFolderFilter.length > 1) {
    return {
      title: "В выборке пусто",
      hint: "Нет треков по выбранным сериям с текущим фильтром прослушивания.",
    };
  }
  if (view === "resume") {
    return {
      title: "Нечего продолжать",
      hint: "Здесь сказки, которые вы начали слушать (от минуты) и ещё не дослушали до конца.",
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
