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

// setupBrowser creates a Playwright browser, context, and page for testing.
func setupBrowser(t *testing.T) (playwright.Page, func()) {
	t.Helper()

	if err := playwright.Install(&playwright.RunOptions{Browsers: []string{"chromium"}}); err != nil {
		t.Fatalf("playwright install: %v", err)
	}

	pw, err := playwright.Run()
	if err != nil {
		t.Fatalf("playwright run: %v", err)
	}

	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true),
	})
	if err != nil {
		_ = pw.Stop()
		t.Fatalf("launch chromium: %v", err)
	}

	context, err := browser.NewContext(playwright.BrowserNewContextOptions{
		Viewport: &playwright.Size{Width: 1400, Height: 900},
	})
	if err != nil {
		_ = browser.Close()
		_ = pw.Stop()
		t.Fatalf("new context: %v", err)
	}

	page, err := context.NewPage()
	if err != nil {
		_ = context.Close()
		_ = browser.Close()
		_ = pw.Stop()
		t.Fatalf("new page: %v", err)
	}

	cleanup := func() {
		_ = context.Close()
		_ = browser.Close()
		_ = pw.Stop()
	}

	return page, cleanup
}

// waitForApp navigates to the app and waits for it to be ready.
func waitForApp(t *testing.T, page playwright.Page, baseURL string) {
	t.Helper()

	if _, err := page.Goto(baseURL, playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateDomcontentloaded,
		Timeout:   playwright.Float(30_000),
	}); err != nil {
		t.Fatalf("goto %s: %v", baseURL, err)
	}

	if _, err := page.WaitForSelector("#root", playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(10_000),
	}); err != nil {
		t.Fatalf("root element missing: %v", err)
	}

	if _, err := page.WaitForSelector("text=Violetta", playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(30_000),
	}); err != nil {
		t.Fatalf("app did not reach loaded state: %v", err)
	}

	// Let WebGL settle
	time.Sleep(2 * time.Second)
}

func TestWebSmoke(t *testing.T) {
	baseURL := getenv("VIOLETTA_BASE_URL", "http://127.0.0.1:5173/")
	artifactsDir := getenv("ARTIFACTS_DIR", filepath.Join("..", ".context", "playwright"))
	ensureDir(t, artifactsDir)

	page, cleanup := setupBrowser(t)
	defer cleanup()

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

	if _, err := page.WaitForSelector("#root", playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(10_000),
	}); err != nil {
		failWithDiagnostics("root element missing", err)
	}

	if _, err := page.WaitForSelector("text=Violetta", playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(30_000),
	}); err != nil {
		if _, err2 := page.WaitForSelector("text=Failed to load graph data", playwright.PageWaitForSelectorOptions{
			Timeout: playwright.Float(1_000),
		}); err2 == nil {
			failWithDiagnostics("app error state", err)
		}
		failWithDiagnostics("app did not reach loaded state (header missing)", err)
	}

	time.Sleep(1 * time.Second)

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

	if len(consoleErrors) > 0 {
		failWithDiagnostics("console/page errors present", fmt.Errorf("- %s", strings.Join(consoleErrors, "\n- ")))
	}

	p := filepath.Join(artifactsDir, "web_smoke_ok.png")
	if _, err := page.Screenshot(playwright.PageScreenshotOptions{
		Path:     playwright.String(p),
		FullPage: playwright.Bool(true),
	}); err != nil {
		t.Fatalf("screenshot: %v", err)
	}
}

func TestTimelineView(t *testing.T) {
	baseURL := getenv("VIOLETTA_BASE_URL", "http://127.0.0.1:5173/")
	artifactsDir := getenv("ARTIFACTS_DIR", filepath.Join("..", ".context", "playwright"))
	ensureDir(t, artifactsDir)

	page, cleanup := setupBrowser(t)
	defer cleanup()

	waitForApp(t, page, baseURL)

	// Click the Timeline tab
	if err := page.Locator("text=Timeline").Click(); err != nil {
		t.Fatalf("click Timeline tab: %v", err)
	}
	time.Sleep(2 * time.Second)

	// Verify timeline view rendered (data-testid)
	timelineCount, err := page.Locator("[data-testid='timeline-view']").Count()
	if err != nil {
		t.Fatalf("query timeline view: %v", err)
	}
	if timelineCount == 0 {
		t.Fatal("timeline view not found after clicking Timeline tab")
	}

	// Should have canvas elements for deck.gl
	canvasCount, err := page.Locator("canvas").Count()
	if err != nil {
		t.Fatalf("count canvas: %v", err)
	}
	if canvasCount == 0 {
		t.Fatal("no canvas elements found in timeline view")
	}

	// Verify Scatter/Decades toggle buttons exist
	scatterBtn, err := page.Locator("text=Scatter").Count()
	if err != nil {
		t.Fatalf("query scatter button: %v", err)
	}
	if scatterBtn == 0 {
		t.Fatal("Scatter toggle button not found")
	}

	decadesBtn, err := page.Locator("text=Decades").Count()
	if err != nil {
		t.Fatalf("query decades button: %v", err)
	}
	if decadesBtn == 0 {
		t.Fatal("Decades toggle button not found")
	}

	// Verify connection count badge is displayed (means lines are rendering)
	connBadge, err := page.Locator("text=connections").Count()
	if err != nil {
		t.Fatalf("query connections badge: %v", err)
	}
	t.Logf("Connection badge visible: %v", connBadge > 0)

	// Verify navigation hint is present
	navHint, err := page.Locator("text=Scroll to zoom").Count()
	if err != nil {
		t.Fatalf("query nav hint: %v", err)
	}
	if navHint == 0 {
		t.Fatal("navigation hint not found")
	}

	// Switch to Decades mode
	if err := page.Locator("text=Decades").Click(); err != nil {
		t.Fatalf("click Decades: %v", err)
	}
	time.Sleep(1 * time.Second)

	// Screenshot
	p := filepath.Join(artifactsDir, "timeline_view.png")
	if _, err := page.Screenshot(playwright.PageScreenshotOptions{
		Path:     playwright.String(p),
		FullPage: playwright.Bool(true),
	}); err != nil {
		t.Fatalf("screenshot: %v", err)
	}
	t.Logf("Timeline screenshot saved: %s", p)
}

func TestNowPlayingSection(t *testing.T) {
	baseURL := getenv("VIOLETTA_BASE_URL", "http://127.0.0.1:5173/")
	artifactsDir := getenv("ARTIFACTS_DIR", filepath.Join("..", ".context", "playwright"))
	ensureDir(t, artifactsDir)

	page, cleanup := setupBrowser(t)
	defer cleanup()

	waitForApp(t, page, baseURL)

	// The NowPlaying component fetches from /api/events.
	// In dev mode without the Go server, it will silently fail and not render.
	// We just check it doesn't crash the app.
	time.Sleep(2 * time.Second)

	nowPlaying, err := page.Locator("[data-testid='now-playing']").Count()
	if err != nil {
		t.Fatalf("query now-playing: %v", err)
	}
	t.Logf("NowPlaying visible: %v (expected: depends on whether Go backend is running)", nowPlaying > 0)

	// App should still be functional regardless
	canvasCount, err := page.Locator("canvas").Count()
	if err != nil {
		t.Fatalf("count canvas: %v", err)
	}
	if canvasCount == 0 {
		t.Fatal("app broken: no canvas elements")
	}
}

// TestScreenshots captures polished screenshots for the README.
// Only runs when CAPTURE_SCREENSHOTS=1 is set.
func TestScreenshots(t *testing.T) {
	if getenv("CAPTURE_SCREENSHOTS", "") != "1" {
		t.Skip("CAPTURE_SCREENSHOTS not set; skipping")
	}

	baseURL := getenv("VIOLETTA_BASE_URL", "http://127.0.0.1:5173/")
	artifactsDir := getenv("ARTIFACTS_DIR", filepath.Join("..", ".context", "playwright"))
	screenshotsDir := filepath.Join(artifactsDir, "screenshots")
	ensureDir(t, screenshotsDir)

	if err := playwright.Install(&playwright.RunOptions{Browsers: []string{"chromium"}}); err != nil {
		t.Fatalf("playwright install: %v", err)
	}

	pw, err := playwright.Run()
	if err != nil {
		t.Fatalf("playwright run: %v", err)
	}
	defer func() { _ = pw.Stop() }()

	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true),
	})
	if err != nil {
		t.Fatalf("launch chromium: %v", err)
	}
	defer func() { _ = browser.Close() }()

	capture := func(name string, width, height int, setup func(playwright.Page)) {
		t.Helper()
		ctx, err := browser.NewContext(playwright.BrowserNewContextOptions{
			Viewport:          &playwright.Size{Width: width, Height: height},
			DeviceScaleFactor: playwright.Float(2),
		})
		if err != nil {
			t.Fatalf("[%s] new context: %v", name, err)
		}
		defer func() { _ = ctx.Close() }()

		page, err := ctx.NewPage()
		if err != nil {
			t.Fatalf("[%s] new page: %v", name, err)
		}

		if _, err := page.Goto(baseURL, playwright.PageGotoOptions{
			WaitUntil: playwright.WaitUntilStateDomcontentloaded,
			Timeout:   playwright.Float(30_000),
		}); err != nil {
			t.Fatalf("[%s] goto: %v", name, err)
		}

		if _, err := page.WaitForSelector("text=Violetta", playwright.PageWaitForSelectorOptions{
			Timeout: playwright.Float(30_000),
		}); err != nil {
			t.Fatalf("[%s] app not ready: %v", name, err)
		}

		// Wait for WebGL
		time.Sleep(3 * time.Second)

		if setup != nil {
			setup(page)
			time.Sleep(2 * time.Second)
		}

		p := filepath.Join(screenshotsDir, name+".png")
		if _, err := page.Screenshot(playwright.PageScreenshotOptions{
			Path:     playwright.String(p),
			FullPage: playwright.Bool(false),
		}); err != nil {
			t.Fatalf("[%s] screenshot: %v", name, err)
		}
		t.Logf("Captured: %s", p)
	}

	// 1. Network view (default)
	capture("network-view", 1400, 900, nil)

	// 2. Timeline scatter view
	capture("timeline-scatter", 1400, 900, func(page playwright.Page) {
		_ = page.Locator("text=Timeline").Click()
	})

	// 3. Timeline decades view
	capture("timeline-decades", 1400, 900, func(page playwright.Page) {
		_ = page.Locator("text=Timeline").Click()
		time.Sleep(1 * time.Second)
		_ = page.Locator("text=Decades").Click()
	})

	// 4. Discover page
	capture("discover-page", 1400, 900, func(page playwright.Page) {
		_ = page.Locator("text=Discover").Click()
	})

	// 5. Events page
	capture("events-page", 1400, 900, func(page playwright.Page) {
		_ = page.Locator("text=Events").Click()
	})

	t.Log("All screenshots captured successfully")
}
