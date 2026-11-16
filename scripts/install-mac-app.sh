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
# Always runs the current checkout: stops any running instance, then does \`npm start\`.
REPO="$REPO"
PORT="$PORT"
URL="http://localhost:\$PORT"

cd "\$REPO" || exit 1
# A login+interactive shell picks up node/npm (fnm/nvm/brew) and gh from your normal PATH.
PORT="\$PORT" /bin/zsh -lic './scripts/stop.sh' >/tmp/gh-notifications.log 2>&1
PORT="\$PORT" nohup /bin/zsh -lic 'exec npm start' >>/tmp/gh-notifications.log 2>&1 &
for _ in \$(seq 1 40); do
  curl -s -o /dev/null "\$URL/" && break
  sleep 0.25
done
open "\$URL"
LAUNCH

chmod +x "$APP/Contents/MacOS/launch"

# Build the icon from assets/icon.svg (rsvg-convert if available, else qlmanage)
build_icon() {
  local tmp png set
  tmp="$(mktemp -d)"; png="$tmp/icon.png"; set="$tmp/icon.iconset"
  if command -v rsvg-convert >/dev/null; then
    rsvg-convert -w 1024 -h 1024 "$REPO/assets/icon.svg" -o "$png"
  else
    qlmanage -t -s 1024 -o "$tmp" "$REPO/assets/icon.svg" >/dev/null 2>&1
    mv "$tmp/icon.svg.png" "$png"
  fi
  mkdir "$set"
  for s in 16 32 128 256 512; do
    sips -z $s $s "$png" --out "$set/icon_${s}x${s}.png" >/dev/null
    sips -z $((s*2)) $((s*2)) "$png" --out "$set/icon_${s}x${s}@2x.png" >/dev/null
  done
  mkdir -p "$APP/Contents/Resources"
  iconutil -c icns "$set" -o "$APP/Contents/Resources/icon.icns"
  rm -rf "$tmp"
}
build_icon && sed -i '' 's#<key>CFBundleExecutable</key>#<key>CFBundleIconFile</key><string>icon</string>\
  <key>CFBundleExecutable</key>#' "$APP/Contents/Info.plist" || echo "Icon build failed; continuing without an icon"
touch "$APP"
echo "Created: $APP"
echo "Drag it to your Dock. Server log: /tmp/gh-notifications.log"
