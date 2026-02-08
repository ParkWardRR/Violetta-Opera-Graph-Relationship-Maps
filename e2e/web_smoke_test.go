package e2e

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/playwright-community/playwright-go"
)

func getenv(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func ensureDir(t *testing.T, dir string) {
	t.Helper()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatalf("mkdir %s: %v", dir, err)
	}
}

func TestWebSmoke(t *testing.T) {
	// This test expects the dev server to be running (see Makefile target `test-web`).
	baseURL := getenv("VIOLETTA_BASE_URL", "http://127.0.0.1:5173/")
	artifactsDir := getenv("ARTIFACTS_DIR", filepath.Join("..", ".context", "playwright"))
	ensureDir(t, artifactsDir)

	// Installing is safe to call repeatedly; it will no-op if already installed.
	if err := playwright.Install(&playwright.RunOptions{Browsers: []string{"chromium"}}); err != nil {
		t.Fatalf("playwright install: %v", err)
	}

	pw, err := playwright.Run()
	if err != nil {
		t.Fatalf("playwright run: %v", err)
	}
	defer func() {
		_ = pw.Stop()
	}()

	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true),
	})
	if err != nil {
		t.Fatalf("launch chromium: %v", err)
	}
	defer func() {
		_ = browser.Close()
	}()

	context, err := browser.NewContext(playwright.BrowserNewContextOptions{
		Viewport: &playwright.Size{Width: 1400, Height: 900},
	})
	if err != nil {
		t.Fatalf("new context: %v", err)
	}
	defer func() {
		_ = context.Close()
	}()

	page, err := context.NewPage()
	if err != nil {
		t.Fatalf("new page: %v", err)
	}

	var consoleErrors []string
	page.OnConsole(func(msg playwright.ConsoleMessage) {
		if msg.Type() == "error" {
			consoleErrors = append(consoleErrors, msg.Text())
		}
	})
	page.OnPageError(func(err error) {
		consoleErrors = append(consoleErrors, err.Error())
	})

	failWithDiagnostics := func(msg string, cause error) {
		t.Helper()
		png := filepath.Join(artifactsDir, "web_smoke_failure.png")
		_, _ = page.Screenshot(playwright.PageScreenshotOptions{
			Path:     playwright.String(png),
			FullPage: playwright.Bool(true),
		})
		bodyText, _ := page.Locator("body").InnerText()
		rootText, _ := page.Evaluate("() => document.getElementById('root')?.innerText || ''")
		t.Fatalf(
			"%s: %v\nconsole/page errors (%d):\n- %s\nbody text:\n%s\nroot text:\n%v\n(screenshot: %s)",
			msg,
			cause,
			len(consoleErrors),
			strings.Join(consoleErrors, "\n- "),
			bodyText,
			rootText,
			png,
		)
	}

	if _, err := page.Goto(baseURL, playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateDomcontentloaded,
		Timeout:   playwright.Float(30_000),
	}); err != nil {
		t.Fatalf("goto %s: %v", baseURL, err)
	}

	// Ensure root exists so diagnostics are meaningful.
	if _, err := page.WaitForSelector("#root", playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(10_000),
	}); err != nil {
		failWithDiagnostics("root element missing", err)
	}

	// The App only renders the header after graph.json has loaded successfully.
	// If the app fails to load, it renders an error banner. Check for that as well.
	if _, err := page.WaitForSelector("text=Violetta Opera Graph", playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(30_000),
	}); err != nil {
		if _, err2 := page.WaitForSelector("text=Failed to load graph data", playwright.PageWaitForSelectorOptions{
			Timeout: playwright.Float(1_000),
		}); err2 == nil {
			failWithDiagnostics("app error state", err)
		}
		failWithDiagnostics("app did not reach loaded state (header missing)", err)
	}

	// Give WebGL a moment; sigma initializes asynchronously.
	time.Sleep(1 * time.Second)

	// Sanity check: sigma should have created at least one canvas.
	canvasCount, err := page.Locator("canvas").Count()
	if err != nil {
		t.Fatalf("count canvas: %v", err)
	}
	if canvasCount == 0 {
		p := filepath.Join(artifactsDir, "web_smoke_no_canvas.png")
		_, _ = page.Screenshot(playwright.PageScreenshotOptions{
			Path:     playwright.String(p),
			FullPage: playwright.Bool(true),
		})
		t.Fatalf("expected at least 1 canvas (sigma WebGL), got 0 (screenshot: %s)", p)
	}

	// Fail fast on runtime errors (helps debug "blank page" reports).
	if len(consoleErrors) > 0 {
		failWithDiagnostics("console/page errors present", fmt.Errorf("- %s", strings.Join(consoleErrors, "\n- ")))
	}

	// Snapshot the happy path too.
	p := filepath.Join(artifactsDir, "web_smoke_ok.png")
	if _, err := page.Screenshot(playwright.PageScreenshotOptions{
		Path:     playwright.String(p),
		FullPage: playwright.Bool(true),
	}); err != nil {
		t.Fatalf("screenshot: %v", err)
	}
}
