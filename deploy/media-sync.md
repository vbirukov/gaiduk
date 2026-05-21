# Регулярный sync `/var/media`

Скрипт `scripts/sync-disk-media.mjs` инкрементальный: существующие mp3 с верным размером пропускает, в конце атомарно обновляет `catalog.json`.

## Установка на VPS (один раз)

С Windows:

```powershell
scp c:\git\gaiduk\scripts\sync-disk-media.mjs root@109.73.201.170:/tmp/
scp c:\git\gaiduk\deploy\gayduk-media-sync.service c:\git\gaiduk\deploy\gayduk-media-sync.timer c:\git\gaiduk\deploy\install-media-sync.sh root@109.73.201.170:/tmp/
```

На сервере:

```bash
sudo bash /tmp/install-media-sync.sh
# если скрипт лежит в /tmp/sync-disk-media.mjs:
sudo SCRIPT_SRC=/tmp/sync-disk-media.mjs UNIT_SRC=/tmp bash /tmp/install-media-sync.sh
```

Права на медиа (если ещё не делал):

```bash
sudo chown -R www-data:www-data /var/media
```

## Расписание

По умолчанию: **каждый день 04:30 UTC** (≈ 07:30 МСК), случайный сдвиг до 1 ч.

Изменить:

```bash
sudo systemctl edit gayduk-media-sync.timer
# [Timer]
# OnCalendar=*-*-* 03:00:00
sudo systemctl daemon-reload
sudo systemctl restart gayduk-media-sync.timer
```

Примеры `OnCalendar`: `Mon *-*-* 05:00:00` (понедельник), `*-*-* 04:30:00` (ежедневно).

## Ручной запуск

```bash
sudo systemctl start gayduk-media-sync.service
sudo tail -f /var/log/gayduk/media-sync.log
```

Параллельный запуск блокируется `flock` (второй сразу завершится без работы).

## После обновления скрипта в репо

```bash
sudo install -m 644 /path/sync-disk-media.mjs /opt/gayduk-media-sync/sync-disk-media.mjs
```

Или повторить `install-media-sync.sh`.

## Ошибка при `systemctl start`

```bash
journalctl -u gayduk-media-sync.service -n 30 --no-pager
tail -30 /var/log/gayduk/media-sync.log
sudo -u www-data env MEDIA_ROOT=/var/media node /opt/gayduk-media-sync/sync-disk-media.mjs
```

Частые причины:
- **`status=66/NOINPUT`** — `www-data` не находит `node` (sync раньше шёл от root/nvm). Проверка: `sudo -u www-data node -v`. Лечение: `apt install -y nodejs` и переустановка unit с `run-media-sync.sh`;
- lock в `/run` — используй `/var/lock/gayduk-media-sync.lock`;
- exit 1 из‑за `FAIL` в логе — строки `FAIL` в `/var/log/gayduk/media-sync.log`.

```bash
which node
sudo -u www-data node -v
sudo apt install -y nodejs   # если вторая команда падает
```

## Мониторинг

```bash
systemctl list-timers gayduk-media-sync.timer
systemctl status gayduk-media-sync.service   # последний oneshot
journalctl -u gayduk-media-sync.service -n 50
```

Exit code 1, если были `FAIL` при скачивании — смотри лог.
