package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

// controller starts/stops the Next.js server as a child process.
type controller struct {
	port         string
	root         string
	disableTypes string
	proc         *exec.Cmd
}

func (c *controller) start() error {
	c.stop()
	cmd := exec.Command(bunPath(), "run", "start", "--", "-p", c.port)
	cmd.Dir = c.root
	if c.disableTypes != "" {
		cmd.Env = append(os.Environ(), "ENTHYMIO_DISABLED_TYPES="+c.disableTypes)
	}
	hideConsole(cmd)
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("could not start server (is Bun installed?): %w", err)
	}
	c.proc = cmd
	go func() { _ = cmd.Wait() }()
	return c.waitReady()
}

func (c *controller) stop() {
	if c.proc == nil || c.proc.Process == nil {
		return
	}
	_ = c.proc.Process.Kill()
	_, _ = c.proc.Process.Wait()
	c.proc = nil
}

func (c *controller) restart() error {
	return c.start()
}

// bunPath finds the Bun binary: PATH first, then the default install location.
func bunPath() string {
	if p, err := exec.LookPath("bun"); err == nil {
		return p
	}
	name := "bun"
	if runtime.GOOS == "windows" {
		name = "bun.exe"
	}
	if home, err := os.UserHomeDir(); err == nil {
		for _, cand := range []string{
			filepath.Join(home, ".bun", "bin", name),
			filepath.Join(home, "AppData", "Local", "Programs", "bun", name),
		} {
			if _, err := os.Stat(cand); err == nil {
				return cand
			}
		}
	}
	return "bun" // let exec fail with a clear error
}

func (c *controller) waitReady() error {
	url := "http://localhost:" + c.port + "/api/items"
	client := &http.Client{Timeout: 3 * time.Second}
	for i := 0; i < 60; i++ {
		if res, err := client.Get(url); err == nil {
			_ = res.Body.Close()
			if res.StatusCode == 200 {
				return nil
			}
		}
		time.Sleep(time.Second)
	}
	return fmt.Errorf("server did not become ready on port %s", c.port)
}
