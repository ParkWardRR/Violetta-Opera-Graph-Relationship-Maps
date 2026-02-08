package main

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"
)

type VenueParser func(htmlContent []byte) ([]PerformanceEvent, error)

func GetParser(venueCode string) VenueParser {
	switch venueCode {
	case "laopera":
		return ParseLAOpera
	default:
		// Fall back to generic parser for unknown venues
		return func(htmlContent []byte) ([]PerformanceEvent, error) {
			events, _ := ParseGenericEvents(htmlContent, "")
			return events, nil
		}
	}
}

func ParseLAOpera(htmlContent []byte) ([]PerformanceEvent, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(htmlContent)))
	if err != nil {
		return nil, err
	}

	var events []PerformanceEvent
	seen := make(map[string]bool)

	doc.Find(".calendar__event-item").Each(func(i int, s *goquery.Selection) {
		dateStr, _ := s.Attr("data-date")
		titleSel := s.Find(".uppercase.text-sm.font-bold a")
		title := strings.TrimSpace(titleSel.Text())
		link, _ := titleSel.Attr("href")
		timeStr := strings.TrimSpace(s.Find(".uppercase.text-xs.font-medium").Text())

		if title == "" {
			return
		}

		id := fmt.Sprintf("%s|%s|%s", dateStr, title, timeStr)
		if seen[id] {
			return
		}
		seen[id] = true

		if strings.HasPrefix(link, "/") {
			link = "https://www.laopera.org" + link
		}

		fullDate := dateStr
		if timeStr != "" {
			fullDate = fmt.Sprintf("%s %s", dateStr, timeStr)
		}

		events = append(events, PerformanceEvent{
			VenueCode: "laopera",
			Title:     title,
			Dates:     []string{fullDate},
			SourceURL: link,
			ScrapedAt: time.Now().Format(time.RFC3339),
			City:      "Los Angeles",
			State:     "CA",
			VenueName: "Dorothy Chandler Pavilion",
		})
	})

	if len(events) == 0 {
		doc.Find(".calendar__grid-event").Each(func(i int, s *goquery.Selection) {
			parent := s.Closest(".calendar__grid-item")
			dateStr, _ := parent.Attr("data-key")
			titleSel := s.Find(".uppercase.text-sm.font-bold a")
			title := strings.TrimSpace(titleSel.Text())
			link, _ := titleSel.Attr("href")
			timeStr := strings.TrimSpace(s.Find(".uppercase.text-xs.font-medium").Text())

			if title == "" {
				return
			}

			if strings.HasPrefix(link, "/") {
				link = "https://www.laopera.org" + link
			}

			fullDate := dateStr
			if timeStr != "" {
				fullDate = fmt.Sprintf("%s %s", dateStr, timeStr)
			}

			events = append(events, PerformanceEvent{
				VenueCode: "laopera",
				Title:     title,
				Dates:     []string{fullDate},
				SourceURL: link,
				ScrapedAt: time.Now().Format(time.RFC3339),
				City:      "Los Angeles",
				State:     "CA",
				VenueName: "Dorothy Chandler Pavilion",
			})
		})
	}

	return events, nil
}

// --- Smart Generic Parser (multi-strategy, local-only) ---

// ParseGenericEvents uses 3 ranked strategies to extract events from any HTML page.
// Returns events and the strategy name that produced them.
func ParseGenericEvents(htmlContent []byte, sourceURL string) ([]PerformanceEvent, string) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(htmlContent)))
	if err != nil {
		return nil, "error"
	}

	// Strategy 1: JSON-LD / Schema.org structured data (gold standard)
	if events := parseJSONLD(doc, sourceURL); len(events) > 0 {
		return events, "json-ld"
	}

	// Strategy 2: Heuristic DOM extraction
	if events := parseHeuristicDOM(doc, sourceURL); len(events) > 0 {
		return events, "heuristic"
	}

	// Strategy 3: Meta tag fallback (page-level only)
	if events := parseMetaFallback(doc, sourceURL); len(events) > 0 {
		return events, "meta"
	}

	return nil, "none"
}

// parseJSONLD extracts events from <script type="application/ld+json"> tags
func parseJSONLD(doc *goquery.Document, sourceURL string) []PerformanceEvent {
	var events []PerformanceEvent

	doc.Find(`script[type="application/ld+json"]`).Each(func(i int, s *goquery.Selection) {
		text := strings.TrimSpace(s.Text())
		if text == "" {
			return
		}

		// Try as single object
		var obj map[string]interface{}
		if err := json.Unmarshal([]byte(text), &obj); err == nil {
			if ev := extractEventFromLD(obj, sourceURL); ev != nil {
				events = append(events, *ev)
			}
			// Check for @graph array
			if graph, ok := obj["@graph"].([]interface{}); ok {
				for _, item := range graph {
					if m, ok := item.(map[string]interface{}); ok {
						if ev := extractEventFromLD(m, sourceURL); ev != nil {
							events = append(events, *ev)
						}
					}
				}
			}
			return
		}

		// Try as array
		var arr []map[string]interface{}
		if err := json.Unmarshal([]byte(text), &arr); err == nil {
			for _, obj := range arr {
				if ev := extractEventFromLD(obj, sourceURL); ev != nil {
					events = append(events, *ev)
				}
			}
		}
	})

	return events
}

func extractEventFromLD(obj map[string]interface{}, sourceURL string) *PerformanceEvent {
	typ, _ := obj["@type"].(string)

	eventTypes := map[string]bool{
		"Event": true, "MusicEvent": true, "TheaterEvent": true,
		"DanceEvent": true, "Festival": true, "ScreeningEvent": true,
	}
	if !eventTypes[typ] {
		return nil
	}

	name, _ := obj["name"].(string)
	if name == "" {
		return nil
	}

	var dates []string
	if startDate, ok := obj["startDate"].(string); ok && startDate != "" {
		dates = append(dates, startDate)
	}
	if endDate, ok := obj["endDate"].(string); ok && endDate != "" {
		dates = append(dates, endDate)
	}

	var venueName, city, state string
	if loc, ok := obj["location"].(map[string]interface{}); ok {
		venueName, _ = loc["name"].(string)
		if addr, ok := loc["address"].(map[string]interface{}); ok {
			city, _ = addr["addressLocality"].(string)
			state, _ = addr["addressRegion"].(string)
		} else if addrStr, ok := loc["address"].(string); ok {
			city = addrStr
		}
	}

	eventURL := sourceURL
	if u, ok := obj["url"].(string); ok && u != "" {
		eventURL = u
	}

	return &PerformanceEvent{
		EventID:   fmt.Sprintf("ld_%s_%s", sanitizeID(name), sanitizeID(strings.Join(dates, "_"))),
		Title:     name,
		Dates:     dates,
		VenueName: venueName,
		City:      city,
		State:     state,
		SourceURL: eventURL,
		ScrapedAt: time.Now().Format(time.RFC3339),
		Region:    "custom",
	}
}

// Date patterns for heuristic extraction
var (
	isoDateRe     = regexp.MustCompile(`\d{4}-\d{2}-\d{2}`)
	usDateRe      = regexp.MustCompile(`(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}`)
	shortDateRe   = regexp.MustCompile(`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}`)
	euroDateRe    = regexp.MustCompile(`\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}`)
	numericDateRe = regexp.MustCompile(`\d{1,2}/\d{1,2}/\d{4}`)
)

// parseHeuristicDOM scans the DOM for event-like patterns
func parseHeuristicDOM(doc *goquery.Document, sourceURL string) []PerformanceEvent {
	var events []PerformanceEvent
	seen := make(map[string]bool)

	selectors := []string{
		"[itemtype*='schema.org/Event']",
		"[class*='event']", "[class*='Event']",
		"[class*='performance']", "[class*='Performance']",
		"[class*='show']", "[class*='Show']",
		"[class*='schedule']", "[class*='Schedule']",
		"[class*='calendar']", "[class*='Calendar']",
		"[class*='season']", "[class*='Season']",
		"[class*='production']", "[class*='Production']",
		"article",
		"[data-date]",
		"[datetime]",
	}

	for _, sel := range selectors {
		doc.Find(sel).Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if len(text) < 10 || len(text) > 2000 {
				return
			}

			dates := extractDates(text)
			if len(dates) == 0 {
				if dt, exists := s.Attr("datetime"); exists {
					dates = append(dates, dt)
				}
				if dt, exists := s.Attr("data-date"); exists {
					dates = append(dates, dt)
				}
			}

			title := ""
			s.Find("h1, h2, h3, h4, h5, strong, b, .title, [class*='title'], [class*='name']").First().Each(func(_ int, t *goquery.Selection) {
				title = strings.TrimSpace(t.Text())
			})
			if title == "" {
				s.Find("a").First().Each(func(_ int, a *goquery.Selection) {
					t := strings.TrimSpace(a.Text())
					if len(t) > 3 && len(t) < 200 {
						title = t
					}
				})
			}

			if title == "" || len(dates) == 0 {
				return
			}

			id := fmt.Sprintf("%s|%s", title, strings.Join(dates, ","))
			if seen[id] {
				return
			}
			seen[id] = true

			link := sourceURL
			s.Find("a[href]").First().Each(func(_ int, a *goquery.Selection) {
				if href, exists := a.Attr("href"); exists && href != "" && href != "#" {
					if strings.HasPrefix(href, "/") && sourceURL != "" {
						parts := strings.SplitN(sourceURL, "/", 4)
						if len(parts) >= 3 {
							link = parts[0] + "//" + parts[2] + href
						}
					} else if strings.HasPrefix(href, "http") {
						link = href
					}
				}
			})

			events = append(events, PerformanceEvent{
				EventID:   fmt.Sprintf("dom_%s_%d", sanitizeID(title), i),
				Title:     title,
				Dates:     dates,
				SourceURL: link,
				ScrapedAt: time.Now().Format(time.RFC3339),
				Region:    "custom",
			})
		})

		if len(events) > 0 {
			break
		}
	}

	return events
}

// parseMetaFallback extracts page-level info from meta tags
func parseMetaFallback(doc *goquery.Document, sourceURL string) []PerformanceEvent {
	title := ""
	description := ""

	doc.Find(`meta[property="og:title"]`).Each(func(_ int, s *goquery.Selection) {
		if c, exists := s.Attr("content"); exists {
			title = c
		}
	})
	doc.Find(`meta[property="og:description"]`).Each(func(_ int, s *goquery.Selection) {
		if c, exists := s.Attr("content"); exists {
			description = c
		}
	})

	if title == "" {
		doc.Find("title").Each(func(_ int, s *goquery.Selection) {
			title = strings.TrimSpace(s.Text())
		})
	}
	if description == "" {
		doc.Find(`meta[name="description"]`).Each(func(_ int, s *goquery.Selection) {
			if c, exists := s.Attr("content"); exists {
				description = c
			}
		})
	}

	if title == "" {
		return nil
	}

	dates := extractDates(title + " " + description)

	return []PerformanceEvent{{
		EventID:   fmt.Sprintf("meta_%s", sanitizeID(title)),
		Title:     title,
		Dates:     dates,
		SourceURL: sourceURL,
		ScrapedAt: time.Now().Format(time.RFC3339),
		Region:    "custom",
	}}
}

// extractDates finds date-like strings in text
func extractDates(text string) []string {
	var dates []string
	seen := make(map[string]bool)

	for _, re := range []*regexp.Regexp{isoDateRe, usDateRe, shortDateRe, euroDateRe, numericDateRe} {
		for _, match := range re.FindAllString(text, 10) {
			if !seen[match] {
				seen[match] = true
				dates = append(dates, match)
			}
		}
	}

	return dates
}

// FuzzyMatchTitle matches a scraped title against known opera titles using Levenshtein distance.
func FuzzyMatchTitle(title string, knownOperas []string) (string, float64) {
	normTitle := strings.ToLower(strings.TrimSpace(title))
	bestMatch := ""
	bestScore := 0.0

	for _, opera := range knownOperas {
		normOpera := strings.ToLower(strings.TrimSpace(opera))

		if normTitle == normOpera {
			return opera, 1.0
		}

		if strings.Contains(normTitle, normOpera) || strings.Contains(normOpera, normTitle) {
			score := float64(minInt(len(normTitle), len(normOpera))) / float64(maxInt(len(normTitle), len(normOpera)))
			if score > bestScore {
				bestScore = score
				bestMatch = opera
			}
			continue
		}

		dist := levenshtein(normTitle, normOpera)
		maxLen := maxInt(utf8.RuneCountInString(normTitle), utf8.RuneCountInString(normOpera))
		if maxLen == 0 {
			continue
		}
		score := 1.0 - float64(dist)/float64(maxLen)
		if score > bestScore {
			bestScore = score
			bestMatch = opera
		}
	}

	if bestScore < 0.6 {
		return "", 0
	}
	return bestMatch, bestScore
}

func levenshtein(a, b string) int {
	la := utf8.RuneCountInString(a)
	lb := utf8.RuneCountInString(b)
	ra := []rune(a)
	rb := []rune(b)

	d := make([][]int, la+1)
	for i := range d {
		d[i] = make([]int, lb+1)
		d[i][0] = i
	}
	for j := 0; j <= lb; j++ {
		d[0][j] = j
	}

	for i := 1; i <= la; i++ {
		for j := 1; j <= lb; j++ {
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			d[i][j] = minInt(d[i-1][j]+1, minInt(d[i][j-1]+1, d[i-1][j-1]+cost))
		}
	}

	return d[la][lb]
}

func sanitizeID(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	result := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		return '_'
	}, s)
	if len(result) > 40 {
		result = result[:40]
	}
	return result
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}
