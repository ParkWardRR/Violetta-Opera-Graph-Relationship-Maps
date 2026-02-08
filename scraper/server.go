package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type Server struct {
	configPath string
	dataDir    string
	staticDir  string
	status     string
	mu         sync.Mutex
	browser    *BrowserManager
}

func NewServer(configPath, dataDir, staticDir string) *Server {
	return &Server{
		configPath: configPath,
		dataDir:    dataDir,
		staticDir:  staticDir,
		status:     "Idle",
	}
}

func (s *Server) Start(port int) {
	// Initialize browser for scrape-url endpoint
	bm, err := NewBrowserManager()
	if err != nil {
		log.Printf("Warning: browser manager init failed: %v (scrape-url will be unavailable)", err)
	} else {
		if err := bm.Start(true); err != nil {
			log.Printf("Warning: browser launch failed: %v (scrape-url will be unavailable)", err)
		} else {
			s.browser = bm
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/config", s.handleConfig)
	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/api/scrape", s.handleScrape)
	mux.HandleFunc("/api/scrape-url", s.handleScrapeURL)
	mux.HandleFunc("/api/events", s.handleEvents)
	mux.HandleFunc("/api/sources", s.handleSources)

	// Static file serving for SPA
	if s.staticDir != "" {
		if _, err := os.Stat(s.staticDir); err == nil {
			log.Printf("Serving static files from %s", s.staticDir)
			fs := http.FileServer(http.Dir(s.staticDir))
			mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
				// Try to serve the file directly
				path := filepath.Join(s.staticDir, r.URL.Path)
				if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
					fs.ServeHTTP(w, r)
					return
				}
				// SPA fallback: serve index.html for all non-file routes
				http.ServeFile(w, r, filepath.Join(s.staticDir, "index.html"))
			})
		} else {
			log.Printf("Warning: static dir %s not found, skipping static serving", s.staticDir)
		}
	}

	handler := corsMiddleware(mux)

	addr := fmt.Sprintf(":%d", port)
	log.Printf("Starting Violetta server on http://localhost%s", addr)
	if s.staticDir != "" {
		log.Printf("  Web UI: http://localhost%s", addr)
	}
	log.Printf("  API:    http://localhost%s/api/", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func (s *Server) handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		data, err := os.ReadFile(s.configPath)
		if err != nil {
			http.Error(w, "Failed to read config", 500)
			return
		}
		w.Header().Set("Content-Type", "application/yaml")
		w.Write(data)
	} else if r.Method == "POST" {
		http.Error(w, "Config editing via API not yet implemented", 501)
	}
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": s.status,
	})
}

func (s *Server) handleScrape(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}
	s.mu.Lock()
	if s.status == "Running" {
		s.mu.Unlock()
		http.Error(w, "Scraper already running", 409)
		return
	}
	s.status = "Running"
	s.mu.Unlock()

	go func() {
		log.Println("Scrape triggered via API")
		region := "socal"
		err := RunScrape(s.configPath, s.dataDir, region, false)

		s.mu.Lock()
		if err != nil {
			log.Printf("Scrape failed: %v", err)
			s.status = "Error"
		} else {
			s.status = "Idle"
		}
		s.mu.Unlock()
	}()

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message": "Scrape started"}`))
}

func (s *Server) handleScrapeURL(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	if s.browser == nil {
		http.Error(w, "Browser not available. Restart server to retry.", 503)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", 400)
		return
	}
	defer r.Body.Close()

	var req struct {
		URL   string `json:"url"`
		Label string `json:"label"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "Invalid JSON body", 400)
		return
	}

	if req.URL == "" {
		http.Error(w, "URL is required", 400)
		return
	}
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	s.mu.Lock()
	s.status = "Running"
	s.mu.Unlock()

	events, strategy, err := ScrapeURL(req.URL, s.browser)

	s.mu.Lock()
	s.status = "Idle"
	s.mu.Unlock()

	if err != nil {
		log.Printf("[scrape-url] Error: %v", err)
		http.Error(w, fmt.Sprintf("Scrape failed: %v", err), 500)
		return
	}

	// Save events to custom directory
	customDir := filepath.Join(s.dataDir, "data", "raw", "custom")
	os.MkdirAll(customDir, 0755)

	timestamp := time.Now().Format("20060102_150405")
	label := req.Label
	if label == "" {
		label = "custom"
	}
	safeLabel := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, label)

	eventsFile := filepath.Join(customDir, fmt.Sprintf("%s_%s.json", safeLabel, timestamp))
	data, _ := json.MarshalIndent(events, "", "  ")
	os.WriteFile(eventsFile, data, 0644)

	// Update sources.json
	sourcesFile := filepath.Join(customDir, "sources.json")
	var sources []CustomSource
	if existing, err := os.ReadFile(sourcesFile); err == nil {
		json.Unmarshal(existing, &sources)
	}
	sources = append(sources, CustomSource{
		URL:        req.URL,
		Label:      req.Label,
		ScrapedAt:  time.Now().Format(time.RFC3339),
		EventCount: len(events),
	})
	sourcesData, _ := json.MarshalIndent(sources, "", "  ")
	os.WriteFile(sourcesFile, sourcesData, 0644)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"events":   events,
		"strategy": strategy,
		"count":    len(events),
		"saved_to": eventsFile,
	})
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	regionFilter := r.URL.Query().Get("region")
	var allEvents []PerformanceEvent

	// Scan regional directories
	regionalDir := filepath.Join(s.dataDir, "data", "raw", "regional")
	if regions, err := os.ReadDir(regionalDir); err == nil {
		for _, region := range regions {
			if !region.IsDir() {
				continue
			}
			if regionFilter != "" && region.Name() != regionFilter {
				continue
			}
			regionPath := filepath.Join(regionalDir, region.Name())
			files, _ := os.ReadDir(regionPath)
			for _, f := range files {
				if !strings.HasSuffix(f.Name(), ".json") {
					continue
				}
				data, err := os.ReadFile(filepath.Join(regionPath, f.Name()))
				if err != nil {
					continue
				}
				var events []PerformanceEvent
				if err := json.Unmarshal(data, &events); err != nil {
					continue
				}
				for i := range events {
					if events[i].Region == "" {
						events[i].Region = region.Name()
					}
				}
				allEvents = append(allEvents, events...)
			}
		}
	}

	// Scan custom directory
	if regionFilter == "" || regionFilter == "custom" {
		customDir := filepath.Join(s.dataDir, "data", "raw", "custom")
		if files, err := os.ReadDir(customDir); err == nil {
			for _, f := range files {
				if f.Name() == "sources.json" || !strings.HasSuffix(f.Name(), ".json") {
					continue
				}
				data, err := os.ReadFile(filepath.Join(customDir, f.Name()))
				if err != nil {
					continue
				}
				var events []PerformanceEvent
				if err := json.Unmarshal(data, &events); err != nil {
					continue
				}
				for i := range events {
					if events[i].Region == "" {
						events[i].Region = "custom"
					}
				}
				allEvents = append(allEvents, events...)
			}
		}
	}

	if allEvents == nil {
		allEvents = []PerformanceEvent{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(allEvents)
}

func (s *Server) handleSources(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", 405)
		return
	}

	sourcesFile := filepath.Join(s.dataDir, "data", "raw", "custom", "sources.json")
	data, err := os.ReadFile(sourcesFile)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(200)
			return
		}
		next.ServeHTTP(w, r)
	})
}
