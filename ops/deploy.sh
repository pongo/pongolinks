#!/usr/bin/env bash
set -euo pipefail

APP_USER="pongolinks"
APP_ROOT="/opt/pongolinks"
RELEASES_DIR="$APP_ROOT/releases"
REPO_DIR="$APP_ROOT/repo"
CURRENT_LINK="$APP_ROOT/current"
PREVIOUS_LINK="$APP_ROOT/previous"
ENV_FILE="/etc/pongolinks/pongolinks.env"
SERVICE_NAME="pongolinks.service"
DATABASE_PATH="/var/lib/pongolinks/pongolinks.sqlite"
DB_PRE_MIGRATE="/var/lib/pongolinks/pongolinks.sqlite.pre-migrate"
KEEP_RELEASES="5"

require_user() {
  local current_user
  current_user="$(id -un)"
  if [[ "$current_user" != "$APP_USER" ]]; then
    echo "deploy.sh must run as $APP_USER (current: $current_user)" >&2
    exit 1
  fi
}

require_paths() {
  local required=("$APP_ROOT" "$RELEASES_DIR" "$REPO_DIR")
  for dir in "${required[@]}"; do
    if [[ ! -d "$dir" ]]; then
      echo "Required directory is missing: $dir" >&2
      exit 1
    fi
  done

  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Environment file is missing: $ENV_FILE" >&2
    exit 1
  fi
}

validate_credentials() {
  local auth_line
  auth_line="$(grep -E '^BASIC_AUTH_CREDENTIALS=' "$ENV_FILE" || true)"

  if [[ -z "$auth_line" ]]; then
    echo "BASIC_AUTH_CREDENTIALS is missing in $ENV_FILE" >&2
    exit 1
  fi

  local auth_value
  auth_value="${auth_line#BASIC_AUTH_CREDENTIALS=}"

  if [[ -z "$auth_value" || "$auth_value" == "CHANGE_ME" ]]; then
    echo "BASIC_AUTH_CREDENTIALS is placeholder or empty in $ENV_FILE" >&2
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
  require_paths
  validate_credentials

  local deploy_ref
  deploy_ref="${1:-master}"

  pushd "$REPO_DIR" >/dev/null

  git fetch --tags --prune origin
  git checkout --force "$deploy_ref"

  local commit_sha
  commit_sha="$(git rev-parse --verify HEAD)"
  local short_sha
  short_sha="$(git rev-parse --short "$commit_sha")"

  bun install --frozen-lockfile
  bun run build

  local release_id
  release_id="$(date -u +%Y%m%d%H%M%S)-$short_sha"
  if [[ -z "$release_id" ]]; then
    echo "Computed empty release id" >&2
    exit 1
  fi

  local new_release_dir="$RELEASES_DIR/$release_id"
  mkdir -p "$new_release_dir/apps/backend" "$new_release_dir/apps/frontend"

  cp -R apps/backend/dist "$new_release_dir/apps/backend/dist"
  cp -R apps/frontend/dist "$new_release_dir/apps/frontend/dist"

  sudo systemctl stop "$SERVICE_NAME"

  if [[ -f "$DATABASE_PATH" ]]; then
    cp "$DATABASE_PATH" "$DB_PRE_MIGRATE"
  fi

  DATABASE_PATH="$DATABASE_PATH" bun run db:migrate

  local old_current=""
  if old_current="$(resolve_release_dir "$CURRENT_LINK")"; then
    ln -sfn "$old_current" "$PREVIOUS_LINK"
  fi

  ln -sfn "$new_release_dir" "$CURRENT_LINK"

  sudo systemctl start "$SERVICE_NAME"

  mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort)
  local count="${#releases[@]}"
  if (( count > KEEP_RELEASES )); then
    local prune_count=$((count - KEEP_RELEASES))
    local i
    for ((i = 0; i < prune_count; i++)); do
      rm -rf -- "${releases[$i]}"
    done
  fi

  popd >/dev/null

  echo "Deploy completed: $release_id ($commit_sha)"
}

main "$@"
