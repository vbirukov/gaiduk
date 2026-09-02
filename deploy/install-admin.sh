#!/usr/bin/env bash
# Установка админ-сервера Haiduk на VPS (root).
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/haiduk-admin}"
SCRIPT_SRC="${SCRIPT_SRC:-$(dirname "$0")/../admin-server.mjs}"
HTML_SRC="${HTML_SRC:-$(dirname "$0")/../admin/index.html}"
SERVICE_SRC="${SERVICE_SRC:-$(dirname "$0")/haiduk-admin.service}"
NGINX_SRC="${NGINX_SRC:-$(dirname "$0")/nginx-admin.location.conf}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

NODE="$(command -v node || true)"
if [[ -z "$NODE" ]]; then
  echo "node not in PATH. Install: apt install -y nodejs" >&2
  exit 1
fi
echo "node: $NODE ($("$NODE" --version))"

# Установка better-sqlite3 (нужен для admin-server.mjs)
cd "$INSTALL_DIR" 2>/dev/null || mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
if [[ ! -d node_modules/better-sqlite3 ]]; then
  echo "Installing better-sqlite3..."
  npm init -y --silent 2>/dev/null || true
  npm install better-sqlite3 --save 2>&1
fi

# Копируем файлы
install -d -m 755 "$INSTALL_DIR"
install -m 644 "$SCRIPT_SRC" "$INSTALL_DIR/admin-server.mjs"
install -d -m 755 /var/www/gayduk/admin
install -m 644 "$HTML_SRC" /var/www/gayduk/admin/index.html

# Права
mkdir -p /var/lib/haiduk-admin
chown www-data:www-data /var/lib/haiduk-admin

# Сервис
install -m 644 "$SERVICE_SRC" /etc/systemd/system/haiduk-admin.service
systemctl daemon-reload
systemctl enable --now haiduk-admin.service

# Nginx
if [[ -f "$NGINX_SRC" ]]; then
  if [[ -d /etc/nginx/sites-available ]]; then
    install -m 644 "$NGINX_SRC" /etc/nginx/sites-available/haiduk-admin.location.conf
    # Проверяем, есть ли include в основном конфиге
    if ! grep -q "haiduk-admin.location.conf" /etc/nginx/sites-available/gayduk 2>/dev/null; then
      echo "Добавь в /etc/nginx/sites-available/gayduk перед последней }:" >&2
      echo "  include /etc/nginx/sites-available/haiduk-admin.location.conf;" >&2
    fi
  fi
  echo "Nginx: проверь и перезагрузи nginx после добавления include" >&2
fi

echo ""
echo "✓ Админка установлена"
echo "  URL: https://гайдук.рф/admin/"
echo "  API: https://гайдук.рф/admin/api/sync/status"
echo ""
echo "Проверка:"
echo "  systemctl status haiduk-admin.service"
echo "  curl http://127.0.0.1:8790/api/catalog/stats"