# Enthymio

Personal vault for **images, bookmarks/websites, notes, audio notes, videos, YouTube links** — Pinterest-style masonry UI (Karakeep-like save-anything spirit).

Built with **Next.js 16.3.7 + Bun + SQLite** (`node:sqlite`, no native deps). Single-user, no auth (v1).

## Quick start (Bun only — no npm/node)

```powershell
bun install
bun run db:init     # creates ./data/enthymio.db
bun run db:seed     # 2 sample items (first run)
bun run dev         # http://localhost:3000
```

Production:

```powershell
bun run build
bun run start       # http://localhost:3000
```

Typecheck: `bun run typecheck`

## Authentication (Clerk)

Sign-in protects the app and gives every user a **private vault** — items,
uploads, and files are scoped to your Clerk user id. Signed-out visitors see
a sign-in landing page.

First run: open the app and **sign up** — a welcome note is created for each
new user automatically.

### Personal API tokens (extension, CLI, scripts)

The browser extension, Go helper, and scripts can't use your browser
session, so they authenticate with a token instead:

1. Sign in → sidebar gear → **Settings** → **New token** (copy it once)
2. Extension: paste into the add-on Preferences → API token field
3. Go helper: `--token et_…` or `ENTHYMIO_TOKEN` env
4. MCP server: set `ENTHYMIO_USER_ID` to the user id shown in Settings
   (see `mcp/config.example.json`)

Revoke any time from Settings. API calls without a session or valid token
get `401`; users can never see each other's items (cross-user reads 404).

Block item types by config — enforced in file uploads (403), item API +
MCP saves (400), and hidden in the web UI sidebar, save drawer, and
extension popup:

```powershell
$env:ENTHYMIO_DISABLED_TYPES = "video,audio"   # comma-separated: image,bookmark,website,note,audio,video,youtube
bun run dev
```

Flags (set the same env for the server child):

```powershell
.\dist\vault.exe --disable-types video,audio
.\dist\enthymio-tray.exe --disable-types video,audio
docker run -e ENTHYMIO_DISABLED_TYPES=video,audio -v vault-data:/app/data -p 3000:3000 vault
```

`GET /api/config` exposes the active list for clients.

## Disabling types (uploads / saves)

## What works (Slice 1 — web app)

- Masonry grid, search (title/note/tags/url), filter by type
- Add drawer: bookmark / website / note / image / video / audio / youtube
- File upload (`POST /api/upload`, max 200MB) → stored in `./data/enthymio/`, served via `/api/files/*`
- Audio notes: in-browser recorder (MediaRecorder) or file upload
- YouTube: paste URL → embed + auto thumbnail (no download, link only)
- Uploaded videos: full file stored + `<video>` player
- REST: `GET/POST /api/items`, `GET/PATCH/DELETE /api/items/:id`, `GET /api/files/*`

## Data

- SQLite at `./data/enthymio.db` (WAL), media in `./data/enthymio/`
- No auth — bind to localhost or add auth before exposing

## Browser extension (Firefox / Zen)

Manifest V2 clipper in `extension/` — toolbar popup (YouTube auto-detect) + right-click
**Save page / link / image / selection**. See `extension/README.md`. Load via
`about:debugging#/runtime/this-firefox` → Load Temporary Add-on.

## OS integration + one-click run

- **Go clipper** (`os-integration/`, stdlib-only): `dist/enthymio-save.exe` — save URLs, files, notes, `.url` shortcuts. Windows right-click menus (`windows/install-context-menu.ps1`, per-user, no admin) + Linux Nautilus/Nemo/Dolphin/clipboard integration (`linux/install.sh`). See `os-integration/README.md`.
- **One-click run**: `dist/vault.exe` (Bun-compiled launcher, double-click, opens browser) or `packaging/build.ps1` for a full `dist/vault/` bundle. **Tray (GUI)**: `dist/enthymio-tray.exe` — system-tray icon with Open/Restart/Quit (Windows + Linux, see `os-integration/README.md`). **Host anywhere**: `Dockerfile` (`docker build -t vault .`, data persisted via `/app/data` volume).

## MCP server (for agents)

Stdio server in `mcp/` sharing the same SQLite DB. Tools: `vault_search`,
`vault_save`, `vault_get`, `vault_delete`. See `mcp/README.md`.

```powershell
bun run mcp
```

## Status

All slices complete: web app, extension, MCP, OS integration, exe + Docker.
Future ideas: extension AMO signing, multi-user auth, Postgres option, video thumbnails.
