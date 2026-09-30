# OS integration (Go helper + right-click menus)

`vault-save` is a dependency-free Go CLI that talks to the vault API.
Windows Explorer and Linux file managers call it from right-click menus.

## Build

```powershell
cd os-integration
go build -o ..\dist\vault-save.exe .\cmd\vault-save      # Windows
$env:GOOS="linux"; go build -o ..\dist\vault-save-linux .\cmd\vault-save
```

## Tray app (Windows + Linux GUI)

`vault-tray` runs the vault with a **system-tray icon**: Open TheVault,
Restart server, Quit. The server starts before the tray loop, so it also
works where no tray exists.

```powershell
cd os-integration/tray
go build -o ..\..\dist\vault-tray.exe .   # Windows (pure Go, no extra tools)
```

Double-click `dist\vault-tray.exe`. Flags: `--port 3000`, `--root <app dir>`
(auto-detected from the exe location), `--no-tray` for console mode.
Bun is located via PATH plus the default install folders.

Linux: `GOOS=linux go build` needs `gcc` + GTK3/AppIndicator headers
(see `linux/install.sh` for the `apt`/`dnf` lines), and GNOME needs an
AppIndicator extension to *display* tray icons (KDE shows them natively).
Wayland and X11 both work through the same code path.

## CLI

```
vault-save --url https://example.com --title "Example" --tags clipped
vault-save --file ./photo.jpg
vault-save --type note --content - < note.txt   # stdin
vault-save --url-file page.url                  # Windows .url shortcut
```

Vault URL: `--vault` flag or `VAULT_URL` env (default `http://localhost:3000`).

## Windows (per-user, no admin)

```powershell
.\os-integration\windows\install-context-menu.ps1            # default localhost
.\os-integration\windows\install-context-menu.ps1 -VaultUrl http://myserver:3000
.\os-integration\windows\uninstall-context-menu.ps1
```

Adds: right-click on **images/videos/audio → Save to TheVault**,
on **.url shortcuts → Save link**, on **folder background → save clipboard as note**.
Restart Explorer if entries don't appear immediately.

## Linux

```bash
VAULT_URL=http://localhost:3000 bash os-integration/linux/install.sh
```

Installs: `~/.local/bin/vault-save`, Nautilus/Nemo right-click script,
Dolphin service menu, and a "Save clipboard note" app launcher
(needs `xclip` or `wl-clipboard` + `libnotify-bin` for notifications).
