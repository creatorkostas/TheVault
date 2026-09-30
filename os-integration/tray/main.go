// Package main: TheVault system-tray app (Windows + Linux GUI).
//
// Double-click vault-tray(.exe): starts the Next.js server, shows a tray icon
// with Open / Restart / Quit. No console window needed on Windows.
//
// Flags: --port 3000 --root <app dir> --no-tray (console mode for testing)
package main

import (
	_ "embed"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/getlantern/systray"
)

//go:embed assets/tray.ico
var iconICO []byte

//go:embed assets/tray.png
var iconPNG []byte

var app *controller

func main() {
	port := flag.String("port", envOr("PORT", "3000"), "Port to serve the vault on")
	root := flag.String("root", "", "App root (default: exe dir, walking up to package.json)")
	disableTypes := flag.String("disable-types", "", "Comma-separated types to disable, e.g. video,audio")
	noTray := flag.Bool("no-tray", false, "Run server in console without tray icon")
	flag.Parse()

	appRoot, err := resolveRoot(*root)
	if err != nil {
		fatal(err)
	}
	app = &controller{port: *port, root: appRoot, disableTypes: *disableTypes}

	if *noTray {
		if err := app.start(); err != nil {
			fatal(err)
		}
		fmt.Printf("TheVault live at http://localhost:%s (Ctrl+C to stop)\n", *port)
		select {} // run until killed
	}
	// Start the server BEFORE the tray loop so the vault works even where
	// no system tray is available (headless sessions, minimal WMs).
	if err := app.start(); err != nil {
		fatal(err)
	}
	systray.Run(onReady, onExit)
}

func onReady() {
	systray.SetIcon(trayIcon())
	systray.SetTitle("TheVault")
	systray.SetTooltip("TheVault is starting…")

	mOpen := systray.AddMenuItem("Open TheVault", "Open in browser")
	mRestart := systray.AddMenuItem("Restart server", "Restart the vault server")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Stop the server and quit")

	go func() {
		systray.SetTooltip("TheVault — http://localhost:" + app.port)
		openBrowser("http://localhost:" + app.port)
	}()

	for {
		select {
		case <-mOpen.ClickedCh:
			openBrowser("http://localhost:" + app.port)
		case <-mRestart.ClickedCh:
			go func() {
				systray.SetTooltip("TheVault is restarting…")
				if err := app.restart(); err != nil {
					systray.SetTooltip("TheVault failed to start")
					return
				}
				systray.SetTooltip("TheVault — http://localhost:" + app.port)
			}()
		case <-mQuit.ClickedCh:
			systray.Quit()
			return
		}
	}
}

func onExit() {
	if app != nil {
		app.stop()
	}
}

func trayIcon() []byte {
	if runtime.GOOS == "windows" {
		return iconICO
	}
	return iconPNG
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	} else {
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

// resolveRoot finds the app dir: explicit flag, else exe dir walking up to package.json.
func resolveRoot(flagRoot string) (string, error) {
	if flagRoot != "" {
		return filepath.Abs(flagRoot)
	}
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	dir := filepath.Dir(exe)
	for {
		if _, err := os.Stat(filepath.Join(dir, "package.json")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("could not find app root (pass --root)")
		}
		dir = parent
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "vault-tray:", err)
	os.Exit(1)
}
