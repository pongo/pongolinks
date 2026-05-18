#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "bootstrap-ubuntu.sh must run as root" >&2
  exit 1
fi

DOMAIN="${1:-}"
APP_USER="pongolinks"
APP_GROUP="pongolinks"
APP_ROOT="/opt/pongolinks"
RELEASES_DIR="$APP_ROOT/releases"
REPO_DIR="$APP_ROOT/repo"
DATA_DIR="/var/lib/pongolinks"
ETC_DIR="/etc/pongolinks"
ENV_FILE="$ETC_DIR/pongolinks.env"
SERVICE_FILE="/etc/systemd/system/pongolinks.service"
CADDY_SNIPPET="$ETC_DIR/caddy-pongolinks.conf"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
ENV_TEMPLATE="$TEMPLATES_DIR/pongolinks.env.template"
SERVICE_TEMPLATE="$TEMPLATES_DIR/pongolinks.service.template"
CADDY_TEMPLATE="$TEMPLATES_DIR/caddy-pongolinks.template"

install_packages() {
  apt-get update
  apt-get install -y git curl unzip sqlite3 caddy
}

install_bun() {
  if command -v bun >/dev/null 2>&1; then
    return
  fi

  local installer
  installer="$(mktemp)"
  curl -fsSL https://bun.sh/install -o "$installer"
  bash "$installer"
  rm -f "$installer"

  if [[ -x /root/.bun/bin/bun && ! -e /usr/local/bin/bun ]]; then
    ln -sf /root/.bun/bin/bun /usr/local/bin/bun
  fi
}

ensure_user() {
  if ! getent group "$APP_GROUP" >/dev/null; then
    groupadd --system "$APP_GROUP"
  fi

  if ! id -u "$APP_USER" >/dev/null 2>&1; then
    useradd --system --gid "$APP_GROUP" --home-dir "/home/$APP_USER" --create-home --shell /bin/bash "$APP_USER"
  fi
}

ensure_dirs() {
  install -d -o "$APP_USER" -g "$APP_GROUP" "$APP_ROOT" "$RELEASES_DIR" "$DATA_DIR"
  install -d -o root -g root "$ETC_DIR"
}

ensure_templates() {
  local templates=("$ENV_TEMPLATE" "$SERVICE_TEMPLATE" "$CADDY_TEMPLATE")
  for template in "${templates[@]}"; do
    if [[ ! -f "$template" ]]; then
      echo "Template is missing: $template" >&2
      exit 1
    fi
  done
}

ensure_env_template() {
  if [[ -f "$ENV_FILE" ]]; then
    return
  fi

  cp "$ENV_TEMPLATE" "$ENV_FILE"

  chmod 640 "$ENV_FILE"
  chown root:"$APP_GROUP" "$ENV_FILE"
}

install_service_file() {
  cp "$SERVICE_TEMPLATE" "$SERVICE_FILE"
}

write_caddy_snippet() {
  local host="${DOMAIN:-example.com}"
  sed "s/<domain>/$host/g" "$CADDY_TEMPLATE" >"$CADDY_SNIPPET"

  chmod 644 "$CADDY_SNIPPET"

  if [[ -n "$DOMAIN" ]]; then
    echo "Caddy snippet written to $CADDY_SNIPPET for domain: $DOMAIN"
  else
    echo "Caddy snippet written to $CADDY_SNIPPET with placeholder domain."
  fi
  echo "Review and include this snippet in your Caddy config."
}

main() {
  install_packages
  install_bun
  ensure_user
  ensure_dirs
  ensure_templates
  ensure_env_template
  install_service_file
  write_caddy_snippet

  systemctl daemon-reload
  systemctl enable pongolinks.service

  echo "Bootstrap completed. Next steps:"
  echo "1) Edit $ENV_FILE"
  echo "2) Clone repository into $REPO_DIR as user $APP_USER"
  echo "3) Run deploy script as user $APP_USER"
}

main "$@"
