#!/usr/bin/env bash
# Установка регулярного sync на VPS (root).
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/gayduk-media-sync}"
SCRIPT_SRC="${SCRIPT_SRC:-$(dirname "$0")/../scripts/sync-disk-media.mjs}"
UNIT_SRC="${UNIT_SRC:-$(dirname "$0")}"
RUN_SRC="${RUN_SRC:-$(dirname "$0")/run-media-sync.sh}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

if [[ ! -f "$SCRIPT_SRC" ]]; then
  SCRIPT_SRC="$(dirname "$0")/sync-disk-media.mjs"
fi
if [[ ! -f "$SCRIPT_SRC" ]]; then
  echo "sync-disk-media.mjs not found. Set SCRIPT_SRC." >&2
  exit 1
fi
if [[ ! -f "$RUN_SRC" ]]; then
  RUN_SRC="$(dirname "$0")/run-media-sync.sh"
fi

NODE="$(command -v node || true)"
if [[ -z "$NODE" ]]; then
  echo "node not in PATH. Install: apt install -y nodejs" >&2
  exit 1
fi
echo "node: $NODE ($("$NODE" --version))"

install -d -m 755 "$INSTALL_DIR"
install -m 644 "$SCRIPT_SRC" "$INSTALL_DIR/sync-disk-media.mjs"
install -m 755 "$RUN_SRC" "$INSTALL_DIR/run-media-sync.sh"
sed -i "s|@NODE@|$NODE|g" "$INSTALL_DIR/run-media-sync.sh"

if ! sudo -u www-data "$NODE" -e 'process.exit(0)' 2>/dev/null; then
  echo "WARN: www-data cannot run $NODE — apt install -y nodejs" >&2
fi

install -d -m 755 /var/log/gayduk
touch /var/log/gayduk/media-sync.log
chown www-data:www-data /var/log/gayduk /var/log/gayduk/media-sync.log

touch /var/lock/gayduk-media-sync.lock
chown www-data:www-data /var/lock/gayduk-media-sync.lock

install -m 644 "$UNIT_SRC/gayduk-media-sync.service" /etc/systemd/system/
install -m 644 "$UNIT_SRC/gayduk-media-sync.timer" /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now gayduk-media-sync.timer

echo "Timer:"
systemctl list-timers gayduk-media-sync.timer --no-pager
echo ""
echo "Test: sudo -u www-data MEDIA_ROOT=/var/media $NODE $INSTALL_DIR/sync-disk-media.mjs"
echo "Run:  systemctl start gayduk-media-sync.service"
echo "Log:  tail -f /var/log/gayduk/media-sync.log"
