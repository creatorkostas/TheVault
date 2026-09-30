#!/usr/bin/env bash
# Installs TheVault file-manager integration on Linux:
#  - ~/.local/bin/vault-save (+ vault-save-many wrapper)
#  - Nautilus/Nemo scripts: right-click files -> Save to TheVault
#  - Dolphin service menu: right-click media -> Save to TheVault
#  - App launcher: Save clipboard note to TheVault
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
VAULT_URL="${VAULT_URL:-http://localhost:3000}"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

if [ -x "$REPO/dist/vault-save-linux" ]; then
  cp "$REPO/dist/vault-save-linux" "$BIN_DIR/vault-save"
elif command -v go >/dev/null; then
  (cd "$REPO/os-integration" && GOOS=linux go build -o "$BIN_DIR/vault-save" ./cmd/vault-save)
else
  echo "Need either dist/vault-save-linux or Go installed." >&2
  exit 1
fi
cp "$REPO/os-integration/linux/vault-save-many.sh" "$BIN_DIR/vault-save-many"
chmod +x "$BIN_DIR/vault-save" "$BIN_DIR/vault-save-many"

# Nautilus + Nemo (same script API)
for mgr in nautilus nemo; do
  dir="$HOME/.local/share/$mgr/scripts"
  mkdir -p "$dir"
  {
    echo '#!/bin/sh'
    echo '# Save to TheVault'
    echo 'printf "%s" "$NAUTILUS_SCRIPT_SELECTED_FILE_PATHS" | while IFS= read -r f; do'
    echo '  [ -f "$f" ] && vault-save --file "$f" --tags clipped || true'
    echo 'done'
    echo 'command -v notify-send >/dev/null && notify-send "TheVault" "Saved ✓"'
  } > "$dir/Save to TheVault"
  chmod +x "$dir/Save to TheVault"
done

# Dolphin
mkdir -p "$HOME/.local/share/kio/servicemenus"
cp "$REPO/os-integration/linux/kio-vault-save.desktop" "$HOME/.local/share/kio/servicemenus/"

# Clipboard-note launcher
mkdir -p "$HOME/.local/share/applications"
cp "$REPO/os-integration/linux/vault-clipboard-note.desktop" "$HOME/.local/share/applications/"
command -v update-desktop-database >/dev/null && update-desktop-database "$HOME/.local/share/applications" || true

# Tray app (optional): needs GTK3 + AppIndicator dev libraries to compile, e.g.
#   sudo apt install gcc libgtk-3-dev libayatana-appindicator3-dev   (Debian/Ubuntu)
#   sudo dnf install gcc gtk3-devel libayatana-appindicator-gtk3-devel (Fedora)
if [ -x "$REPO/dist/vault-tray-linux" ]; then
  cp "$REPO/dist/vault-tray-linux" "$BIN_DIR/vault-tray"
elif command -v go >/dev/null; then
  (cd "$REPO/os-integration/tray" && go build -o "$BIN_DIR/vault-tray" .) \
    || echo "Tray build skipped (install GTK/AppIndicator dev libs to enable it)." >&2
fi
if [ -x "$BIN_DIR/vault-tray" ]; then
  cp "$REPO/os-integration/linux/vault-tray.desktop" "$HOME/.local/share/applications/"
  mkdir -p "$HOME/.local/share/icons"
  cp "$REPO/os-integration/assets/tray.png" "$HOME/.local/share/icons/vault-tray.png"
fi

# Persist vault URL
mkdir -p "$HOME/.config"
grep -q "VAULT_URL=" "$HOME/.config/thevault.env" 2>/dev/null \
  || echo "export VAULT_URL=\"$VAULT_URL\"" >> "$HOME/.config/thevault.env"
echo "Installed. Make sure ~/.local/bin is on PATH and add 'source ~/.config/thevault.env' to your shell rc."
