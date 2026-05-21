# Цели Яндекс.Метрики (тип: JavaScript-событие)

Создай в интерфейсе Метрики цели с идентификатором = имени события.

| Событие | Когда |
|--------|--------|
| `play_start` | Успешный старт воспроизведения |
| `play_complete` | Дослушано ≥97% |
| `playback_error` | Ошибка загрузки/воспроизведения |
| `catalog_loaded` | Первый успешный каталог |
| `catalog_refresh_fail` | Не удалось обновить каталог |
| `nav_open` | Открыто боковое меню |
| `now_playing_open` | Открыт полноэкранный плеер |
| `pwa_install` | Установка PWA (outcome: accepted/dismissed) |
| `playlist_created` | Создан плейлист |
| `like_toggle` | Лайк вкл/выкл (liked: 0/1) |

Воронка (пример): `/app/open` → `play_start` → `play_complete`.
