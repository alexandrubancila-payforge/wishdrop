#!/bin/bash
# Schedules scripts/backup-db.sh every Sunday at 10:00 on this Mac (launchd).
# A Mac that is asleep then runs it when it wakes. Run again to update;
# remove with:  launchctl bootout gui/$(id -u)/site.wishdrop.db-backup
set -euo pipefail

LABEL="site.wishdrop.db-backup"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DIR="$HOME/Backups/wishdrop"
NODE_BIN="$(dirname "$(command -v npx)")"
mkdir -p "$DIR" "$(dirname "$PLIST")"
touch "$DIR/launchd.log" && chmod 600 "$DIR/launchd.log" # wrangler prints a short-lived download link there

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$REPO/scripts/backup-db.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>0</integer><key>Hour</key><integer>10</integer><key>Minute</key><integer>0</integer></dict>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$NODE_BIN:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>StandardOutPath</key><string>$DIR/launchd.log</string>
  <key>StandardErrorPath</key><string>$DIR/launchd.log</string>
</dict>
</plist>
PLIST

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Scheduled: every Sunday 10:00 → $DIR"
