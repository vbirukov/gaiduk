#!/bin/bash
set -euo pipefail
MEDIA_ROOT="${MEDIA_ROOT:-/var/media}"
LOCK="${LOCK_FILE:-/var/lock/gayduk-media-sync.lock}"
NODE="@NODE@"
SCRIPT="${SYNC_SCRIPT:-/opt/gayduk-media-sync/sync-disk-media.mjs}"

export MEDIA_ROOT
exec /usr/bin/flock -n "$LOCK" "$NODE" "$SCRIPT"
