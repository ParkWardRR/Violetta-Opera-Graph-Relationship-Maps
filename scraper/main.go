package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

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
	flag.Parse()

	cfgData, err := os.ReadFile(*configPath)
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(cfgData, &cfg); err != nil {
		log.Fatalf("Failed to parse config: %v", err)
	}

	if !cfg.RegionalVenues.Enabled {
		log.Println("Regional venue scraping is disabled in config")
		return
	}

	if cfg.Scraping.RobotsRespect {
		log.Println("robots.txt respect: ENABLED")
	} else {
		log.Println("WARNING: robots.txt respect is DISABLED")
	}

	limiter := NewDomainLimiter(cfg)

	for _, regionCfg := range cfg.RegionalVenues.Regions {
		if *region != "" && regionCfg.Code != *region {
			continue
		}

		log.Printf("Scraping region: %s (%s)", regionCfg.Name, regionCfg.Code)

		for _, venue := range regionCfg.Venues {
			events, err := scrapeVenue(venue, regionCfg.Code, limiter)
			if err != nil {
				log.Printf("[%s] Error: %v", venue.Code, err)
				continue
			}

			if len(events) == 0 {
				log.Printf("[%s] No events found", venue.Code)
				continue
			}

			outDir := filepath.Join(*dataDir, "data", "raw", "regional", regionCfg.Code)
			os.MkdirAll(outDir, 0o755)

			outFile := filepath.Join(outDir, fmt.Sprintf("%s_%s.json", venue.Code, time.Now().Format("20060102")))
			data, _ := json.MarshalIndent(events, "", "  ")
			if err := os.WriteFile(outFile, data, 0o644); err != nil {
				log.Printf("[%s] Failed to write: %v", venue.Code, err)
			} else {
				log.Printf("[%s] Saved %d events to %s", venue.Code, len(events), outFile)
			}
		}
	}
}

func scrapeVenue(venue VenueConfig, regionCode string, limiter *DomainLimiter) ([]PerformanceEvent, error) {
	targetURL := venue.CalendarURL
	if targetURL == "" {
		targetURL = venue.OfficialURL
	}

	if err := limiter.Wait(venue.Code); err != nil {
		return nil, err
	}

	// For now, use simple HTTP GET (Playwright integration comes in Phase 5 full implementation)
	// This handles venues with simple HTML calendars
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("User-Agent", "ViolettaOperaGraph/1.0 (research project)")

	resp, err := client.Do(req)
	if err != nil {
		limiter.Strike(venue.Code)
		return nil, fmt.Errorf("fetching %s: %w", targetURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 || resp.StatusCode == 403 || resp.StatusCode == 503 {
		limiter.Strike(venue.Code)
		return nil, fmt.Errorf("HTTP %d from %s", resp.StatusCode, targetURL)
	}

	// Placeholder: return empty events for now
	// Full Playwright-based HTML parsing will be implemented in Phase 5
	log.Printf("[%s] Fetched %s (HTTP %d) - parser not yet implemented", venue.Code, targetURL, resp.StatusCode)
	return []PerformanceEvent{}, nil
}
