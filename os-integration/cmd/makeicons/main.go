// makeicons: generates tray.png + tray.ico (PNG-compressed) from the repo
// icon.png when present, otherwise draws a fallback mark.
// Stdlib only: `go run ./cmd/makeicons` (from repo root or os-integration/)
package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
	"os"
	"path/filepath"
)

const size = 256

var (
	red   = color.RGBA{0xCA, 0x50, 0x3D, 0xFF}
	white = color.RGBA{0xFF, 0xFF, 0xFF, 0xFF}
	clear = color.RGBA{0, 0, 0, 0}
)

func main() {
	out := outDir()
	if err := os.MkdirAll(out, 0o755); err != nil {
		fatal(err)
	}
	var pngBuf bytes.Buffer
	if src, ok := findIcon(); ok {
		b, err := os.ReadFile(src)
		if err != nil {
			fatal(err)
		}
		if !isPNG(b) {
			fatal(fmt.Errorf("%s is not a PNG", src))
		}
		pngBuf.Write(b)
		fmt.Println("source:", src)
	} else {
		drawFallback(&pngBuf)
		fmt.Println("source: drawn fallback mark")
	}
	if err := os.WriteFile(filepath.Join(out, "tray.png"), pngBuf.Bytes(), 0o644); err != nil {
		fatal(err)
	}
	if err := os.WriteFile(filepath.Join(out, "tray.ico"), makeICO(pngBuf.Bytes()), 0o644); err != nil {
		fatal(err)
	}
	fmt.Println("wrote", out+"/tray.png + tray.ico")
}

// findIcon locates the repo icon.png from common working directories.
func findIcon() (string, bool) {
	for _, c := range []string{"icon.png", "../icon.png", "../../icon.png"} {
		if st, err := os.Stat(c); err == nil && !st.IsDir() {
			return c, true
		}
	}
	return "", false
}

func isPNG(b []byte) bool {
	return len(b) > 8 && b[0] == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
}

func drawFallback(pngBuf *bytes.Buffer) {
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	roundRect(img, 8, 8, size-8, size-8, 56, red)
	// White "E": vertical bar + top/mid/bottom arms
	thickLine(img, 92, 70, 92, 186, 32, white)
	thickLine(img, 92, 70, 178, 70, 32, white)
	thickLine(img, 92, 128, 164, 128, 30, white)
	thickLine(img, 92, 186, 178, 186, 32, white)
	if err := png.Encode(pngBuf, img); err != nil {
		fatal(err)
	}
}

func roundRect(img *image.RGBA, x0, y0, x1, y1, r int, c color.Color) {
	for y := y0; y < y1; y++ {
		for x := x0; x < x1; x++ {
			dx := max(x0+r-x, 0) + max(x-(x1-r), 0)
			dy := max(y0+r-y, 0) + max(y-(y1-r), 0)
			if dx == 0 || dy == 0 || dx*dx+dy*dy <= r*r {
				img.Set(x, y, c)
			} else {
				img.Set(x, y, clear)
			}
		}
	}
}

func thickLine(img *image.RGBA, x0, y0, x1, y1, w int, c color.Color) {
	dx, dy := float64(x1-x0), float64(y1-y0)
	length := math.Hypot(dx, dy)
	radius := float64(w) / 2
	steps := int(length * 2)
	for i := 0; i <= steps; i++ {
		t := float64(i) / float64(steps)
		disc(img, float64(x0)+dx*t, float64(y0)+dy*t, radius, c)
	}
}

func disc(img *image.RGBA, cx, cy, r float64, c color.Color) {
	ri := int(math.Ceil(r))
	for y := int(cy) - ri; y <= int(cy)+ri; y++ {
		for x := int(cx) - ri; x <= int(cx)+ri; x++ {
			ddx, ddy := float64(x)-cx, float64(y)-cy
			if ddx*ddx+ddy*ddy <= r*r {
				img.Set(x, y, c)
			}
		}
	}
}

// makeICO wraps a 256px PNG in an ICO container (Vista+ compatible).
func makeICO(pngData []byte) []byte {
	var buf bytes.Buffer
	binary.Write(&buf, binary.LittleEndian, uint16(0)) // reserved
	binary.Write(&buf, binary.LittleEndian, uint16(1)) // type: icon
	binary.Write(&buf, binary.LittleEndian, uint16(1)) // count
	buf.WriteByte(0)                                   // width 256
	buf.WriteByte(0)                                   // height 256
	buf.WriteByte(0)                                   // colors
	buf.WriteByte(0)                                   // reserved
	binary.Write(&buf, binary.LittleEndian, uint16(1)) // planes
	binary.Write(&buf, binary.LittleEndian, uint16(32))
	binary.Write(&buf, binary.LittleEndian, uint32(len(pngData)))
	binary.Write(&buf, binary.LittleEndian, uint32(6+16))
	buf.Write(pngData)
	return buf.Bytes()
}

// outDir works whether run from the repo root or os-integration/.
func outDir() string {
	if _, err := os.Stat(filepath.Join("cmd", "makeicons")); err == nil {
		return "assets"
	}
	return filepath.Join("os-integration", "assets")
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "makeicons:", err)
	os.Exit(1)
}
