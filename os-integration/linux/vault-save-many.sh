#!/bin/sh
# Save selected files to Enthymio (one arg per file, file:// tolerated).
for f in "$@"; do
  case "$f" in file://*) f="${f#file://}";; esac
  if [ -f "$f" ]; then
    enthymio-save --file "$f" --tags clipped || true
  fi
done
command -v notify-send >/dev/null && notify-send "Enthymio" "Saved ✓"
