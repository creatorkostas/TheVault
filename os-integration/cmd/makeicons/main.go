// makeicons: generates tray.png (256px) + tray.ico (PNG-compressed) from a
// drawn red rounded square with a white "V". Stdlib only: `go run ./cmd/makeicons`
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
	red   = color.RGBA{0xE6, 0x00, 0x23, 0xFF}
	white = color.RGBA{0xFF, 0xFF, 0xFF, 0xFF}
	clear = color.RGBA{0, 0, 0, 0}
)

func main() {
	out := outDir()
	if err := os.MkdirAll(out, 0o755); err != nil {
		fatal(err)
	}
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	roundRect(img, 8, 8, size-8, size-8, 56, red)
	// White "V": two thick strokes (left 78,70 -> 128,186 ; right 178,70 -> 128,186)
	thickLine(img, 78, 70, 128, 186, 34, white)
	thickLine(img, 178, 70, 128, 186, 34, white)

	var pngBuf bytes.Buffer
	if err := png.Encode(&pngBuf, img); err != nil {
		fatal(err)
	}
	if err := os.WriteFile(filepath.Join(out, "tray.png"), pngBuf.Bytes(), 0o644); err != nil {
		fatal(err)
	}
	if err := os.WriteFile(filepath.Join(out, "tray.ico"), makeICO(pngBuf.Bytes()), 0o644); err != nil {
		fatal(err)
	}
	fmt.Println("wrote os-integration/assets/tray.png + tray.ico")
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
