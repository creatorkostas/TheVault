#!/usr/bin/env bash
# Installs Enthymio file-manager integration on Linux:
#  - ~/.local/bin/enthymio-save (+ enthymio-save-many wrapper)
#  - Nautilus/Nemo scripts: right-click files -> Save to Enthymio
#  - Dolphin service menu: right-click media -> Save to Enthymio
#  - App launcher: Save clipboard note to Enthymio
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
ENTHYMIO_URL="${ENTHYMIO_URL:-http://localhost:3000}"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

if [ -x "$REPO/dist/enthymio-save-linux" ]; then
  cp "$REPO/dist/enthymio-save-linux" "$BIN_DIR/enthymio-save"
elif command -v go >/dev/null; then
  (cd "$REPO/os-integration" && GOOS=linux go build -o "$BIN_DIR/enthymio-save" ./cmd/enthymio-save)
else
  echo "Need either dist/enthymio-save-linux or Go installed." >&2
  exit 1
fi
cp "$REPO/os-integration/linux/enthymio-save-many.sh" "$BIN_DIR/enthymio-save-many"
chmod +x "$BIN_DIR/enthymio-save" "$BIN_DIR/enthymio-save-many"

# Nautilus + Nemo (same script API)
for mgr in nautilus nemo; do
  dir="$HOME/.local/share/$mgr/scripts"
  mkdir -p "$dir"
  {
    echo '#!/bin/sh'
    echo '# Save to Enthymio'
    echo 'printf "%s" "$NAUTILUS_SCRIPT_SELECTED_FILE_PATHS" | while IFS= read -r f; do'
    echo '  [ -f "$f" ] && enthymio-save --file "$f" --tags clipped || true'
    echo 'done'
    echo 'command -v notify-send >/dev/null && notify-send "Enthymio" "Saved ✓"'
  } > "$dir/Save to Enthymio"
  chmod +x "$dir/Save to Enthymio"
done

# Dolphin
mkdir -p "$HOME/.local/share/kio/servicemenus"
cp "$REPO/os-integration/linux/kio-enthymio-save.desktop" "$HOME/.local/share/kio/servicemenus/"

# Clipboard-note launcher
mkdir -p "$HOME/.local/share/applications"
cp "$REPO/os-integration/linux/vault-clipboard-note.desktop" "$HOME/.local/share/applications/"
command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" || true

# Tray app (optional): needs GTK3 + AppIndicator dev libraries to compile, e.g.
#   sudo apt install gcc libgtk-3-dev libayatana-appindicator3-dev   (Debian/Ubuntu)
#   sudo dnf install gcc gtk3-devel libayatana-appindicator-gtk3-devel (Fedora)
if [ -x "$REPO/dist/enthymio-tray-linux" ]; then
  cp "$REPO/dist/enthymio-tray-linux" "$BIN_DIR/enthymio-tray"
elif command -v go >/dev/null; then
  (cd "$REPO/os-integration/tray" && go build -o "$BIN_DIR/enthymio-tray" .) \
    || echo "Tray build skipped (install GTK/AppIndicator dev libs to enable it)." >&2
fi
if [ -x "$BIN_DIR/enthymio-tray" ]; then
  cp "$REPO/os-integration/linux/enthymio-tray.desktop" "$HOME/.local/share/applications/"
  mkdir -p "$HOME/.local/share/icons"
  cp "$REPO/os-integration/assets/tray.png" "$HOME/.local/share/icons/enthymio-tray.png"
fi

# Persist vault URL
mkdir -p "$HOME/.config"
grep -q "ENTHYMIO_URL=" "$HOME/.config/enthymio.env" 2>/dev/null \
  || echo "export ENTHYMIO_URL=\"$ENTHYMIO_URL\"" >> "$HOME/.config/enthymio.env"
echo "Installed. Make sure ~/.local/bin is on PATH and add 'source ~/.config/enthymio.env' to your shell rc."
