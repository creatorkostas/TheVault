// vault-save: CLI clipper for TheVault. Stdlib only, no dependencies.
//
// Examples:
//
//	vault-save --url https://example.com --title "Example"
//	vault-save --file ./photo.jpg --tags "clipped,photo"
//	vault-save --type note --content - < note.txt        # stdin
//	vault-save --url-file page.url                       # Windows .url shortcut
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
)

const defaultVault = "http://localhost:3000"

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "vault-save:", err)
		os.Exit(1)
	}
}

func run() error {
	vault := flag.String("vault", envOr("VAULT_URL", defaultVault), "Vault base URL")
	typ := flag.String("type", "auto", "Item type: auto, bookmark, website, note, image, video, audio, youtube")
	title := flag.String("title", "", "Item title")
	url := flag.String("url", "", "URL to save")
	urlFile := flag.String("url-file", "", "Windows .url shortcut file to extract the URL from")
	content := flag.String("content", "", "Note text (use - to read stdin)")
	tags := flag.String("tags", "", "Comma-separated tags")
	collection := flag.String("collection", "", "Collection name")
	file := flag.String("file", "", "Local file to upload (image/video/audio)")
	token := flag.String("token", envOr("VAULT_TOKEN", ""), "API token (Settings in the vault)")
	flag.Parse()

	if *urlFile != "" {
		u, err := parseURLFile(*urlFile)
		if err != nil {
			return err
		}
		*url = u
	}
	if *content == "-" {
		b, err := io.ReadAll(os.Stdin)
		if err != nil {
			return err
		}
		*content = string(b)
	}

	base := strings.TrimRight(*vault, "/")
	authToken := *token
	payload := map[string]any{
		"tags": splitTags(*tags),
	}

	switch {
	case *file != "":
		kind := detectFileType(*file)
		if kind == "" {
			return fmt.Errorf("unsupported file type: %s", *file)
		}
		mediaPath, err := uploadFile(base, authToken, *file)
		if err != nil {
			return err
		}
		payload["type"] = kind
		payload["title"] = firstNonEmpty(*title, filepath.Base(*file))
		payload["mediaPath"] = mediaPath
		payload["collection"] = *collection
	case *url != "":
		t := *typ
		if t == "auto" {
			t = detectURLType(*url)
		}
		payload["type"] = t
		payload["title"] = firstNonEmpty(*title, *url)
		payload["url"] = *url
		payload["content"] = emptyToNil(*content)
		payload["collection"] = *collection
	default:
		payload["type"] = "note"
		if *typ != "auto" {
			payload["type"] = *typ
		}
		text := strings.TrimSpace(*content)
		if text == "" {
			return fmt.Errorf("nothing to save: give --file, --url, or --content")
		}
		payload["title"] = firstNonEmpty(*title, truncate(text, 60))
		payload["content"] = text
		payload["collection"] = *collection
	}

	saved, err := postJSON(base+"/api/items", authToken, payload)
	if err != nil {
		return err
	}
	fmt.Printf("saved %v %v\n", saved["id"], saved["title"])
	return nil
}

func uploadFile(base, authToken, path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	h := textproto.MIMEHeader{}
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, escapeQuotes(filepath.Base(path))))
	h.Set("Content-Type", mimeTypeOf(path))
	part, err := w.CreatePart(h)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(part, f); err != nil {
		return "", err
	}
	if err := w.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", base+"/api/upload", &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	setAuth(req, authToken)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	var out map[string]any
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return "", err
	}
	if res.StatusCode >= 300 {
		return "", fmt.Errorf("upload failed: %v", out["error"])
	}
	mp, _ := out["mediaPath"].(string)
	if mp == "" {
		return "", fmt.Errorf("upload returned no mediaPath")
	}
	return mp, nil
}

func postJSON(endpoint, authToken string, payload map[string]any) (map[string]any, error) {
	buf, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequest("POST", endpoint, bytes.NewReader(buf))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	setAuth(req, authToken)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(res.Body, 512))
		return nil, fmt.Errorf("vault responded %d: %s", res.StatusCode, strings.TrimSpace(string(b)))
	}
	var out map[string]any
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, err
	}
	item, _ := out["item"].(map[string]any)
	return item, nil
}

func setAuth(req *http.Request, token string) {
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
}

func parseURLFile(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	for _, line := range strings.Split(string(b), "\n") {
		line = strings.TrimSpace(line)
		if rest, ok := strings.CutPrefix(line, "URL="); ok && rest != "" {
			return rest, nil
		}
	}
	return "", fmt.Errorf("no URL= entry in %s", path)
}

var fileKinds = map[string]string{
	".jpg": "image", ".jpeg": "image", ".png": "image", ".gif": "image",
	".webp": "image", ".svg": "image", ".bmp": "image", ".ico": "image", ".avif": "image",
	".mp4": "video", ".webm": "video", ".mov": "video", ".mkv": "video", ".avi": "video",
	".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".m4a": "audio", ".flac": "audio", ".opus": "audio",
}

func detectFileType(path string) string {
	return fileKinds[strings.ToLower(filepath.Ext(path))]
}

func mimeTypeOf(path string) string {
	if mt := mime.TypeByExtension(strings.ToLower(filepath.Ext(path))); mt != "" {
		return strings.Split(mt, ";")[0]
	}
	if kind := detectFileType(path); kind != "" {
		return kind + "/octet-stream"
	}
	return "application/octet-stream"
}

func escapeQuotes(s string) string {
	return strings.ReplaceAll(s, `"`, "_")
}

func detectURLType(url string) string {
	l := strings.ToLower(url)
	if strings.Contains(l, "youtube.com/") || strings.Contains(l, "youtu.be/") {
		return "youtube"
	}
	return "bookmark"
}

func splitTags(raw string) []string {
	var out []string
	for _, t := range strings.Split(raw, ",") {
		if t = strings.TrimSpace(t); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func emptyToNil(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
