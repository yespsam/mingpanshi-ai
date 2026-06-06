#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/mingpanshi-ai}"
DOMAIN="${DOMAIN:-mingpanshi.example.com}"
REPO_URL="${REPO_URL:-https://github.com/yespsam/mingpanshi-ai.git}"

if [[ "$DOMAIN" == "mingpanshi.example.com" ]]; then
  echo "Set DOMAIN before running, for example:"
  echo "DOMAIN=mingpanshi.com bash deploy/vps-ubuntu-setup.sh"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git gnupg

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null 2>&1; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi

cd "$APP_DIR"
npm ci --omit=dev
mkdir -p "$APP_DIR/.data"
chown -R www-data:www-data "$APP_DIR"

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env. Fill OPENAI_API_KEY before starting the service."
fi

cp "$APP_DIR/deploy/mingpanshi.service.example" /etc/systemd/system/mingpanshi.service
sed "s/mingpanshi.example.com/$DOMAIN/g" "$APP_DIR/deploy/Caddyfile.example" > /etc/caddy/Caddyfile

systemctl daemon-reload
systemctl enable mingpanshi
systemctl restart caddy

echo "Setup prepared. Fill $APP_DIR/.env, then run:"
echo "systemctl restart mingpanshi"
