//go:build windows

package main

import (
	"os/exec"
	"syscall"
)

// hideConsole keeps the server child from opening its own console window.
func hideConsole(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
