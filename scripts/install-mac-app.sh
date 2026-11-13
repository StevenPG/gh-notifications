#!/bin/bash
# Builds "GH Notifications.app" in ~/Applications (or the dir given as $1).
# Drag the resulting app to your Dock. It starts the server if needed and opens the page.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$HOME/Applications}"
APP="$DEST/GH Notifications.app"
PORT="${PORT:-4777}"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>GH Notifications</string>
  <key>CFBundleDisplayName</key><string>GH Notifications</string>
  <key>CFBundleIdentifier</key><string>local.gh-notifications</string>
  <key>CFBundleExecutable</key><string>launch</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSUIElement</key><false/>
</dict>
</plist>
PLIST

cat > "$APP/Contents/MacOS/launch" <<LAUNCH
#!/bin/bash
REPO="$REPO"
PORT="$PORT"
URL="http://localhost:\$PORT"

if ! curl -s -o /dev/null "\$URL/"; then
  # A login+interactive shell picks up node (fnm/nvm/brew) and gh from your normal PATH.
  cd "\$REPO" && PORT="\$PORT" nohup /bin/zsh -lic 'exec node server.js' >/tmp/gh-notifications.log 2>&1 &
  for _ in \$(seq 1 40); do
    curl -s -o /dev/null "\$URL/" && break
    sleep 0.25
  done
fi
open "\$URL"
LAUNCH

chmod +x "$APP/Contents/MacOS/launch"
echo "Created: $APP"
echo "Drag it to your Dock. Server log: /tmp/gh-notifications.log"
