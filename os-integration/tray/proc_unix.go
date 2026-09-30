//go:build !windows

package main

import "os/exec"

// hideConsole is a no-op on Unix (children inherit no console).
func hideConsole(_ *exec.Cmd) {}
