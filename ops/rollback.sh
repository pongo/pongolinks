#!/usr/bin/env bash
set -euo pipefail

APP_USER="pongolinks"
APP_ROOT="/opt/pongolinks"
RELEASES_DIR="$APP_ROOT/releases"
CURRENT_LINK="$APP_ROOT/current"
PREVIOUS_LINK="$APP_ROOT/previous"
SERVICE_NAME="pongolinks.service"
DATABASE_PATH="/var/lib/pongolinks/pongolinks.sqlite"
DB_PRE_MIGRATE="/var/lib/pongolinks/pongolinks.sqlite.pre-migrate"

require_user() {
  local current_user
  current_user="$(id -un)"
  if [[ "$current_user" != "$APP_USER" ]]; then
    echo "rollback.sh must run as $APP_USER (current: $current_user)" >&2
    exit 1
  fi
}

resolve_release_dir() {
  local link_path="$1"
  if [[ ! -L "$link_path" ]]; then
    return 1
  fi

  local target
  target="$(readlink -f "$link_path")"

  if [[ -z "$target" || ! -d "$target" ]]; then
    return 1
  fi

  case "$target" in
    "$RELEASES_DIR"/*) ;;
    *)
      echo "Symlink target escapes releases dir: $link_path -> $target" >&2
      exit 1
      ;;
  esac

  printf '%s\n' "$target"
}

main() {
  require_user

  if [[ ! -f "$DB_PRE_MIGRATE" ]]; then
    echo "Missing pre-migrate database snapshot: $DB_PRE_MIGRATE" >&2
    exit 1
  fi

  local previous_target
  previous_target="$(resolve_release_dir "$PREVIOUS_LINK" || true)"
  if [[ -z "$previous_target" ]]; then
    echo "Missing or invalid previous symlink: $PREVIOUS_LINK" >&2
    exit 1
  fi

  sudo systemctl stop "$SERVICE_NAME"
  cp "$DB_PRE_MIGRATE" "$DATABASE_PATH"

  local current_target
  current_target="$(resolve_release_dir "$CURRENT_LINK" || true)"
  if [[ -n "$current_target" ]]; then
    ln -sfn "$current_target" "$PREVIOUS_LINK"
  fi

  ln -sfn "$previous_target" "$CURRENT_LINK"
  sudo systemctl start "$SERVICE_NAME"

  echo "Rollback completed. Current release: $previous_target"
}

main "$@"
