#!/bin/bash
# Weekly copy of the live database (D1 wishdrop-db) to this computer, outside
# Cloudflare: ~/Backups/wishdrop/wishdrop-YYYY-MM-DD.sql.gz, the last 12 kept.
# Photos have their own daily copy in R2 (src/lib/backup.ts).
#
# Runs from launchd (scripts/backup-install.sh) with this Mac's wrangler login.
# A failed run shows a macOS notification and is logged in backup.log.
#
# Restore into a database (an empty one, or after checking what you overwrite):
#   gunzip -k wishdrop-YYYY-MM-DD.sql.gz
#   npx wrangler d1 execute <database> --remote --file=wishdrop-YYYY-MM-DD.sql
set -euo pipefail

DIR="${WISHDROP_BACKUP_DIR:-$HOME/Backups/wishdrop}"
KEEP=12
REPO="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y-%m-%d)"
TMP="$DIR/.wishdrop-$STAMP.sql"
OUT="$DIR/wishdrop-$STAMP.sql.gz"

umask 077 # the dump holds emails and password hashes: readable by this user only
mkdir -p "$DIR"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$DIR/backup.log"; }
fail() {
  log "FAILED: $1"
  rm -f "$TMP"
  osascript -e "display notification \"$1\" with title \"WishDrop backup failed\"" 2>/dev/null || true
  exit 1
}
trap 'fail "export error (see $DIR/launchd.log)"' ERR

cd "$REPO"
CI=true npx wrangler d1 export wishdrop-db --remote --output "$TMP" < /dev/null
grep -q 'CREATE TABLE.*users' "$TMP" || fail "the export has no users table"
gzip -9 -c "$TMP" > "$OUT"
rm -f "$TMP"

# Keep the newest $KEEP copies.
ls -1t "$DIR"/wishdrop-*.sql.gz | tail -n +$((KEEP + 1)) | while read -r old; do rm -f -- "$old"; done

log "ok $(basename "$OUT") $(du -h "$OUT" | cut -f1)"
