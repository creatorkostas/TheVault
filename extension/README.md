# Enthymio Clipper (Firefox / Zen)

Save pages, YouTube videos, links, images and selected text to your Enthymio
without leaving the browser.

## Install (temporary, for personal use)

1. Start the vault: `bun run dev` (default `http://localhost:3000`)
2. Open `about:debugging#/runtime/this-firefox` (same page exists in Zen)
3. **Load Temporary Add-on…** → pick `extension/manifest.json`
4. Pin the toolbar button. Open **Preferences** on the add-on to set the
   vault URL if yours isn't `http://localhost:3000`.

## Use

- Toolbar popup: prefilled with the current tab (YouTube auto-detected) → **Save**
- Right-click: **Save page / link / image / selection** to Enthymio
- Context menu + popup both show a success/failure notification

## Notes

- Manifest V2 (Firefox + Zen compatible), no build step — plain JS + `browser.*` APIs
- Images via right-click save the source URL as a reference (full archival
  download can be added later via the upload API)
