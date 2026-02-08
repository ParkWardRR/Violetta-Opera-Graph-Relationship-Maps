package main

import (
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/temoto/robotstxt"
)

type RobotsGuard struct {
	mu      sync.Mutex
	groups  map[string]*robotstxt.Group
	client  *http.Client
	enabled bool
}

func NewRobotsGuard(enabled bool) *RobotsGuard {
	return &RobotsGuard{
		groups:  make(map[string]*robotstxt.Group),
		client:  &http.Client{Timeout: 10 * time.Second},
		enabled: enabled,
	}
}

func (rg *RobotsGuard) IsAllowed(userAgent, targetURL string) bool {
	if !rg.enabled {
		return true
	}

	u, err := url.Parse(targetURL)
	if err != nil {
		log.Printf("Error parsing URL %s: %v", targetURL, err)
		return false
	}

	host := u.Scheme + "://" + u.Host
	rg.mu.Lock()
	group, ok := rg.groups[host]
	rg.mu.Unlock()

	if !ok {
		robotsURL := host + "/robots.txt"
		log.Printf("Fetching robots.txt from %s...", robotsURL)
		resp, err := rg.client.Get(robotsURL)
		if err != nil {
			log.Printf("Error fetching robots.txt: %v. Assuming allowed.", err)
			return true
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			log.Printf("robots.txt not found (HTTP %d). Assuming allowed.", resp.StatusCode)
			// Create a permissive group to avoid re-fetching
			robots, _ := robotstxt.FromBytes([]byte("User-agent: *\nAllow: /"))
			group = robots.FindGroup(userAgent)
		} else {
			robots, err := robotstxt.FromResponse(resp)
			if err != nil {
				log.Printf("Error parsing robots.txt: %v. Assuming allowed.", err)
				return true
			}
			group = robots.FindGroup(userAgent)
		}

		rg.mu.Lock()
		rg.groups[host] = group
		rg.mu.Unlock()
	}

	return group.Test(u.Path)
}
