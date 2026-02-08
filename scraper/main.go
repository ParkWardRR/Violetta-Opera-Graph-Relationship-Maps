package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/playwright-community/playwright-go"
	"gopkg.in/yaml.v3"
)

// CustomSource tracks a user-provided URL that was scraped
type CustomSource struct {
	URL        string `json:"url"`
	Label      string `json:"label"`
	ScrapedAt  string `json:"scraped_at"`
	EventCount int    `json:"event_count"`
}

type Config struct {
	Scraping struct {
		Navigation struct {
			MinDelayMs int `yaml:"min_delay_ms"`
			MaxDelayMs int `yaml:"max_delay_ms"`
		} `yaml:"navigation"`
		HardCaps struct {
			MaxPagesPerDomainPerRun int `yaml:"max_pages_per_domain_per_run"`
			MaxTotalPagesPerRun     int `yaml:"max_total_pages_per_run"`
		} `yaml:"hard_caps"`
		Retry struct {
			StrikesPerDomainStop int `yaml:"strikes_per_domain_stop"`
		} `yaml:"retry"`
		Cache struct {
			TTLHours int `yaml:"ttl_hours"`
		} `yaml:"cache"`
		RobotsRespect bool `yaml:"robots_respect"`
	} `yaml:"scraping"`
	RegionalVenues struct {
		Enabled bool           `yaml:"enabled"`
		Regions []RegionConfig `yaml:"regions"`
	} `yaml:"regional_venues"`
}

type RegionConfig struct {
	Name   string        `yaml:"name"`
	Code   string        `yaml:"code"`
	Venues []VenueConfig `yaml:"venues"`
}

type VenueConfig struct {
	Name         string `yaml:"name"`
	Code         string `yaml:"code"`
	OfficialURL  string `yaml:"official_url"`
	CalendarURL  string `yaml:"calendar_url"`
	OperabaseURL string `yaml:"operabase_url"`
	City         string `yaml:"city"`
	State        string `yaml:"state"`
}

type PerformanceEvent struct {
	EventID   string   `json:"event_id"`
	VenueCode string   `json:"venue_code"`
	Region    string   `json:"region"`
	Title     string   `json:"opera_title"`
	Composer  string   `json:"composer"`
	Dates     []string `json:"dates"`
	VenueName string   `json:"venue_name"`
	City      string   `json:"city"`
	State     string   `json:"state"`
	SourceURL string   `json:"source_url"`
	ScrapedAt string   `json:"scraped_at"`
}

// DomainLimiter enforces per-domain rate limiting
type DomainLimiter struct {
	mu         sync.Mutex
	lastAccess map[string]time.Time
	strikes    map[string]int
	minDelay   time.Duration
	maxDelay   time.Duration
	maxStrikes int
}

func NewDomainLimiter(cfg Config) *DomainLimiter {
	return &DomainLimiter{
		lastAccess: make(map[string]time.Time),
		strikes:    make(map[string]int),
		minDelay:   time.Duration(cfg.Scraping.Navigation.MinDelayMs) * time.Millisecond,
		maxDelay:   time.Duration(cfg.Scraping.Navigation.MaxDelayMs) * time.Millisecond,
		maxStrikes: cfg.Scraping.Retry.StrikesPerDomainStop,
	}
}

func (dl *DomainLimiter) Wait(domain string) error {
	dl.mu.Lock()
	defer dl.mu.Unlock()

	if dl.strikes[domain] >= dl.maxStrikes {
		return fmt.Errorf("domain %s has %d strikes, skipping", domain, dl.strikes[domain])
	}

	if last, ok := dl.lastAccess[domain]; ok {
		jitter := dl.minDelay + time.Duration(rand.Int63n(int64(dl.maxDelay-dl.minDelay)))
		elapsed := time.Since(last)
		if elapsed < jitter {
			time.Sleep(jitter - elapsed)
		}
	}

	dl.lastAccess[domain] = time.Now()
	return nil
}

func (dl *DomainLimiter) Strike(domain string) {
	dl.mu.Lock()
	defer dl.mu.Unlock()
	dl.strikes[domain]++
	log.Printf("[%s] Strike %d/%d", domain, dl.strikes[domain], dl.maxStrikes)
}

func main() {
	configPath := flag.String("config", "config.yaml", "Path to config.yaml")
	dataDir := flag.String("data-dir", filepath.Join(os.Getenv("HOME"), "Violetta-Opera-Graph-Relationship-Maps"), "Data directory")
	region := flag.String("region", "", "Region code to scrape (socal, norcal, nm, atl)")
	serverMode := flag.Bool("server", false, "Start Admin API server")
	staticDir := flag.String("static", "", "Path to static files directory for SPA serving")
	dumpHTML := flag.Bool("dump-html", false, "Dump rendered HTML to disk for debugging")
	flag.Parse()

	// Ensure absolute path for config
	absConfigPath, _ := filepath.Abs(*configPath)

	if *serverMode {
		srv := NewServer(absConfigPath, *dataDir, *staticDir)
		go srv.Start(8080)
		select {}
	}

	RunScrape(*configPath, *dataDir, *region, *dumpHTML)
}

func RunScrape(configPath, dataDir, region string, dumpHTML bool) error {
	cfgData, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("failed to read config: %v", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(cfgData, &cfg); err != nil {
		return fmt.Errorf("failed to parse config: %v", err)
	}

	if !cfg.RegionalVenues.Enabled {
		log.Println("Regional venue scraping is disabled in config")
		return nil
	}

	if cfg.Scraping.RobotsRespect {
		log.Println("robots.txt respect: ENABLED")
	} else {
		log.Println("WARNING: robots.txt respect is DISABLED")
	}

	// Initialize components
	limiter := NewDomainLimiter(cfg)

	cacheDir := filepath.Join(dataDir, "data", "raw", "html")
	os.MkdirAll(cacheDir, 0755)
	cache := NewHTMLCache(cacheDir, cfg.Scraping.Cache.TTLHours)

	robots := NewRobotsGuard(cfg.Scraping.RobotsRespect)

	browser, err := NewBrowserManager()
	if err != nil {
		return fmt.Errorf("failed to init browser manager: %v", err)
	}

	if err := browser.Start(true); err != nil {
		return fmt.Errorf("failed to launch browser: %v", err)
	}
	defer browser.Stop()

	for _, regionCfg := range cfg.RegionalVenues.Regions {
		if region != "" && regionCfg.Code != region {
			continue
		}

		log.Printf("Scraping region: %s (%s)", regionCfg.Name, regionCfg.Code)

		for _, venue := range regionCfg.Venues {
			events, err := scrapeVenue(venue, regionCfg.Code, limiter, cache, robots, browser, dumpHTML, dataDir)
			if err != nil {
				log.Printf("[%s] Error: %v", venue.Code, err)
				continue
			}

			if len(events) == 0 {
				log.Printf("[%s] No events found", venue.Code)
				continue
			}

			outDir := filepath.Join(dataDir, "data", "raw", "regional", regionCfg.Code)
			os.MkdirAll(outDir, 0755)

			outFile := filepath.Join(outDir, fmt.Sprintf("%s_%s.json", venue.Code, time.Now().Format("20060102")))
			data, _ := json.MarshalIndent(events, "", "  ")
			if err := os.WriteFile(outFile, data, 0644); err != nil {
				log.Printf("[%s] Failed to write: %v", venue.Code, err)
			} else {
				log.Printf("[%s] Saved %d events to %s", venue.Code, len(events), outFile)
			}
		}
	}
	return nil
}

func scrapeVenue(venue VenueConfig, regionCode string, limiter *DomainLimiter, cache *HTMLCache, robots *RobotsGuard, browser *BrowserManager, dumpHTML bool, dataDir string) ([]PerformanceEvent, error) {
	targetURL := venue.CalendarURL
	if targetURL == "" {
		targetURL = venue.OfficialURL
	}

	userAgent := "ViolettaOperaGraph/1.0 (research project)"

	if err := limiter.Wait(venue.Code); err != nil {
		return nil, err
	}

	if !robots.IsAllowed(userAgent, targetURL) {
		return nil, fmt.Errorf("blocked by robots.txt")
	}

	var content []byte
	var hit bool

	if content, hit = cache.Get(targetURL); hit {
		log.Printf("[%s] Cache hit for %s", venue.Code, targetURL)
	} else {
		log.Printf("[%s] Fetching %s via Playwright...", venue.Code, targetURL)

		page, err := browser.NewPage(userAgent)
		if err != nil {
			limiter.Strike(venue.Code)
			return nil, fmt.Errorf("creating page: %w", err)
		}
		defer page.Close()

		if _, err := page.Goto(targetURL, playwright.PageGotoOptions{
			Timeout:   playwright.Float(30000),
			WaitUntil: playwright.WaitUntilStateDomcontentloaded,
		}); err != nil {
			limiter.Strike(venue.Code)
			return nil, fmt.Errorf("navigating: %w", err)
		}

		// Wait for network idle to ensure JS rendered
		page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
			State: playwright.LoadStateNetworkidle,
		})

		// Extra wait for animations/rendering
		time.Sleep(2 * time.Second)

		html, err := page.Content()
		if err != nil {
			return nil, fmt.Errorf("getting content: %w", err)
		}
		content = []byte(html)

		if err := cache.Put(targetURL, content); err != nil {
			log.Printf("Failed to cache %s: %v", targetURL, err)
		}
	}

	if dumpHTML {
		dumpPath := filepath.Join(dataDir, fmt.Sprintf("debug_%s.html", venue.Code))
		if err := os.WriteFile(dumpPath, content, 0644); err != nil {
			log.Printf("Failed to dump HTML: %v", err)
		} else {
			log.Printf("Dumped HTML to %s", dumpPath)
		}
	}

	parser := GetParser(venue.Code)
	if parser == nil {
		log.Printf("[%s] No specific parser implemented, skipping parse", venue.Code)
		return []PerformanceEvent{}, nil
	}

	events, err := parser(content)
	if err != nil {
		return nil, fmt.Errorf("parsing: %w", err)
	}

	log.Printf("[%s] Parsed %d events", venue.Code, len(events))
	return events, nil
}

// ScrapeURL fetches a URL via Playwright and parses it using the generic parser.
func ScrapeURL(targetURL string, browser *BrowserManager) ([]PerformanceEvent, string, error) {
	userAgent := "ViolettaOperaGraph/1.0 (research project)"

	u, err := url.Parse(targetURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return nil, "", fmt.Errorf("invalid URL: %s", targetURL)
	}

	log.Printf("[scrape-url] Fetching %s via Playwright...", targetURL)

	page, err := browser.NewPage(userAgent)
	if err != nil {
		return nil, "", fmt.Errorf("creating page: %w", err)
	}
	defer page.Close()

	if _, err := page.Goto(targetURL, playwright.PageGotoOptions{
		Timeout:   playwright.Float(30000),
		WaitUntil: playwright.WaitUntilStateDomcontentloaded,
	}); err != nil {
		return nil, "", fmt.Errorf("navigating to %s: %w", targetURL, err)
	}

	page.WaitForLoadState(playwright.PageWaitForLoadStateOptions{
		State: playwright.LoadStateNetworkidle,
	})

	time.Sleep(2 * time.Second)

	html, err := page.Content()
	if err != nil {
		return nil, "", fmt.Errorf("getting content: %w", err)
	}

	events, strategy := ParseGenericEvents([]byte(html), targetURL)
	log.Printf("[scrape-url] Parsed %d events from %s using strategy: %s", len(events), targetURL, strategy)

	return events, strategy, nil
}
