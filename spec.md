
Project
Name: Violetta Opera Graph Relationship Maps
Store non-repo static files in: ~/Violetta-Opera-Graph-Relationship-Maps keep track of them in a md file in the repo

use apple native tech where possible. I am paid member of apple dev program so lets make sure to sign/noterize this down the road. Buidl a readme.md and roadmap.md and make sure to contantly update/check off what youve done. For now constantly push and merge into main branch. I dont like python. If you can't use swift then use go. 

use this: https://blueoakcouncil.org/license/1.0.0.md

User intent
“I want to do as little as possible.”
1) Creates  ~/Violetta-Opera-Graph-Relationship-Maps and good subfolders(no manual folder wrangling).
2) Ingests opera data (Wikidata/Open Opus first; Playwright-Go scraping only where needed).
3) Runs on-device embedding via Core ML (prefer Neural Engine when available).
4) Produces TWO interactive, GPU-accelerated web visualizations:
   - Force-directed relationship network (composer↔opera↔premiere place/date, similarity edges).
   - Timeline + clustering view (decades/eras; color by cluster; linked selection with network view).

Data sources (agent must use these exact URLs)
A) Wikidata Query Service (WDQS)
- Interactive query UI: https://query.wikidata.org/   (use to test SPARQL) 
- SPARQL endpoint: https://query.wikidata.org/sparql  (use for programmatic GET/POST)
Notes: Prefer WDQS downloads (CSV/TSV/JSON) over scraping.

B) Open Opus (metadata + dumps)
- Official site: https://openopus.org
- API base: https://api.openopus.org
- Full work dump (JSON): https://api.openopus.org/work/dump.json

Scraping library (Go)
- Playwright-Go docs/package: https://pkg.go.dev/github.com/playwright-community/playwright-go
- Playwright-Go repo: https://github.com/playwright-community/playwright-go

Hard requirements
A) Project path + static assets
- The project MUST live at: ~/Violetta-Opera-Graph-Relationship-Maps
- Store all static files inside the repo:
  - Models: ~/Violetta-Opera-Graph-Relationship-Maps/static/models/
  - Large cached downloads: ~/Violetta-Opera-Graph-Relationship-Maps/static/cache/
  - Raw scraped HTML: ~/Violetta-Opera-Graph-Relationship-Maps/data/raw/html/
  - Raw API/WDQS pulls: ~/Violetta-Opera-Graph-Relationship-Maps/data/raw/
  - Processed graph files: ~/Violetta-Opera-Graph-Relationship-Maps/data/processed/
- No global installs required beyond common tooling (Xcode, Go, Node/Bun, Python). Prefer pinned local tooling.

B) Ingestion approach (do NOT over-scrape)
- Default to API pulls (WDQS CSV download + Open Opus JSON) and only scrape HTML pages when an API is unavailable.
- If scraping is needed, use Playwright-Go ONLY and obey the limits below.

C) Scraping limits (avoid IP bans; “polite crawler”)
Implement a domain-aware limiter + caching with ALL settings configurable in a single file (config.yaml or config.json), defaults:
- 1 browser context total.
- Max 1 active page per domain at a time.
- Navigation pacing per domain:
  - minDelayMs: 2500
  - maxDelayMs: 6000
  - random jitter between them for every request
- Hard caps:
  - maxPagesPerDomainPerRun: 200
  - maxTotalPagesPerRun: 500
- Retry/backoff:
  - On HTTP 429/403/503 or navigation timeouts: exponential backoff with jitter
  - strikesPerDomainStop: 5 (after 5 strikes, skip that domain for the rest of the run)
- Resource blocking (reduce load):
  - Block: images, video, audio, fonts
  - Allow: document, script, xhr/fetch as needed
- Cache-by-URL:
  - Save HTML by stable hash(url) under data/raw/html/
  - Maintain a manifest (url → filename, fetchedAt, status, domain, sha256)
  - If present and fresh (ttlHours configurable), DO NOT re-fetch
- robots.txt:
  - ROBOTS_RESPECT=true by default; if disabled, print a loud warning in console.

D) One-command workflow
Provide a Makefile:
- `make setup`
- `make fetch`
- `make build`
- `make dev` (web UI)
- `make all` (end-to-end)

E) GPU-accelerated interactive web UI (beautiful, modern)
Use:
- Vite + React + TypeScript
- Tailwind + shadcn/ui (or equivalent high-quality UI kit)

Two linked GPU views in the same web app:
1) Network graph (relationships)
- sigma.js + graphology (WebGL), with ForceAtlas2 (incremental) layout so UI stays responsive.
- Interactions: pan/zoom, hover tooltips, click details, search, filters (composer, era, decade range, country), lasso/box select if feasible.
- Visual encoding: color by era_bucket, size by degree, edge thickness by weight/type.

2) Timeline + clustering
- deck.gl (GPU accelerated) to render:
  - X: premiere year
  - Y: cluster id OR embedding projection (UMAP/TSNE precomputed)
  - Color: cluster/era
- Brushing/selection in timeline must highlight nodes/edges in the sigma view and vice versa.
- Provide a toggle between:
  - (A) decade “stripe” aggregation and
  - (B) raw year scatter

Exports
- PNG/SVG snapshot export for each view
- graph.json export (nodes/edges + attributes)

F) Core ML on-device embeddings (Apple Silicon)
- Convert a permissively-licensed sentence embedding model to Core ML (mlpackage) and store it in static/models/.
- Provide a Swift module that loads the model with:
  - MLModelConfiguration().computeUnits = .all
- Batch embeddings; cache by (node_id + model_version_hash).

Storage layout (up to u)

Implementation details to include
- WDQS:
  - Store SPARQL queries under data_fetch/queries/*.sparql
  - `fetch_wikidata.py` runs those queries against https://query.wikidata.org/sparql and saves CSV to data/raw/
- Open Opus:
  - `fetch_openopus.py` pulls https://api.openopus.org/work/dump.json (with caching) to data/raw/openopus_work_dump.json
- Data modeling:
  - Build nodes/edges, compute decade/era buckets, generate embeddings + similarity edges, compute 2D projection for timeline scatter.
- Web:
  - Two tabs: “Network” and “Timeline”
  - Shared filter bar; linked selection state between both views.

Now output:
1) The complete file tree.
2) All source code (runnable, not pseudocode).
3) Exact commands for macOS Apple Silicon.
4) Any assumptions you made (clearly labeled).



```markdown
# ADDENDUM: Additional Data Sources & Regional Performance Discovery

Add this section to your project requirements after the existing "Data sources" section.

---

## Extended Data Sources (Global Coverage)

### Additional Authority & Metadata APIs

**C) RISM Online** (Répertoire International des Sources Musicales)
- Search API: https://rism.online/search
- REST API docs: https://rism.online/docs/
- Data: 1.5M+ musical sources, composer authority records with VIAF/Wikidata IDs, work relationships
- License: Open data (CC-BY-SA)
- Rate limit: Unspecified, implement polite defaults

**D) MusicBrainz**
- API base: https://musicbrainz.org/ws/2/
- Works endpoint: https://musicbrainz.org/ws/2/work
- Data: Opera work hierarchy (acts/scenes/numbers), composer-librettist relationships, recordings
- License: CC0/CC-BY-SA (various)
- Rate limit: 1 request/second, MUST include User-Agent header

**E) IMSLP** (International Music Score Library Project)
- API base: https://imslp.org/api.php
- API docs: https://imslp.org/wiki/IMSLP:API
- Community wrapper: https://github.com/josefleventon/imslp-api
- Data: 159K+ works, 18K+ composers, score metadata
- License: Public domain + CC licenses
- Rate limit: Reasonable use (implement exponential backoff)

### Pre-Cleaned Datasets

**F) Kaggle Opera Performance Dataset**
- Direct download: https://www.kaggle.com/datasets/thedevastator/world-s-largest-database-of-opera-performances
- Data: Historical city-level performance data (composer, work, venue, dates)
- Format: CSV
- License: CC0 1.0 (public domain)
- No API, static download only

**G) Bachtrack Classical Music Statistics**
- Annual reports (PDF): https://cdn.bachtrack.com/files/409805-Annual%20classical%20music%20statistics%202024.pdf
- Data: Most performed operas/composers, trend analysis, geographical breakdowns
- Use for: Popularity metrics, "most performed" node annotations
- Manual download, no API

### Live Performance Discovery (Scraping Required)

**H) Operabase** (requires Playwright-Go scraping)
- Base URL: https://www.operabase.com
- Structure docs: https://help.operabase.com/knowledge/en/understanding-operabase-website-structure
- Sitemaps:
  - Artists: https://www.operabase.com/sitemap_artists.xml
  - Organizations: https://www.operabase.com/sitemap_organizations.xml
- Data: Current/future performances worldwide, artist-production relationships, venue networks
- Scraping strategy: Use sitemap for discovery, then individual page scraping

---

## Regional Performance Data (SoCal/NorCal/New Mexico/Atlanta)

**Agent must implement geo-configurable venue scraping with these exact sources:**

### Configuration Structure

```yaml
# config.yaml - add new section
regional_venues:
  enabled: true
  regions:
    - name: "Southern California"
      code: "socal"
      venues: [...]
    - name: "Northern California"
      code: "norcal"
      venues: [...]
    - name: "New Mexico"
      code: "nm"
      venues: [...]
    - name: "Atlanta"
      code: "atl"
      venues: [...]
  # User can easily add more regions here
```

### Southern California Venues

**LA Opera**
- Official site: https://www.laopera.org
- Calendar API/scrape target: https://www.laopera.org/whats-on/by-date
- Operabase page: https://www.operabase.com/la-opera-o11398/en
- Venue: Dorothy Chandler Pavilion, Los Angeles CA
- Data: Mainstage season, Off Grand programming, concerts/recitals

**Long Beach Opera**
- Official site: https://www.longbeachopera.org
- News/schedule: https://www.longbeachopera.org/news
- Venues: Various (Warner Grand Theatre, site-specific locations)
- Data: Experimental/contemporary opera, site-specific productions

**Pacific Opera Project**
- Official site: https://www.pacificoperaproject.com
- Venues: Occidental College (Thorne Hall), Aratani Theatre (Little Tokyo)
- Data: Accessible contemporary productions, parody/updated classics

**San Diego Opera**
- Official site: https://www.sdopera.org
- Season page: https://www.sdopera.org/season/
- Operabase page: https://www.operabase.com/san-diego-opera-o13281/en
- Venues: San Diego Civic Theatre, Balboa Theatre
- Data: 4-opera season packages, traditional repertoire

**Mission Opera** (Santa Clarita)
- Official site: https://www.missionopera.com
- Venue: Santa Clarita CA (serves San Fernando Valley)
- Data: Educational programming, monthly performances

**Pacific Symphony Opera Initiative** (Orange County)
- Official site: https://www.pacificsymphony.org/opera-vocal-initiative
- Venue: Segerstrom Center for the Arts, Costa Mesa CA
- Data: Semi-staged opera productions

### Northern California Venues

**San Francisco Opera**
- Official site: https://www.sfopera.com
- Season info: https://www.sfcv.org/articles/music-news/practical-guide-sf-operas-2025-2026-season
- Operabase page: https://www.operabase.com/san-francisco-opera-o13234/en
- Archive database: https://archive.sfopera.com/search
- Venue: War Memorial Opera House, San Francisco CA
- Data: 6-opera mainstage season, Opera in the Park, Ring Cycle programming

**Opera San José**
- Official site: https://www.operasj.org
- Venue: California Theatre, San Jose CA
- Data: 4 mainstage productions annually, resident artist company, digital streaming

### New Mexico Venues

**Santa Fe Opera**
- Official site: https://www.santafeopera.org
- Company info: https://www.santafeopera.org/company/
- Apprentice program: https://www.santafeopera.org/company/singers/singers-application-info/
- Venue: Santa Fe Opera House, Santa Fe NM
- Data: 5-opera summer repertory season, apprentice program, world premieres
- Special: Outdoor venue, June-August season

### Atlanta Venues

**The Atlanta Opera**
- Official site: https://www.atlantaopera.org
- Tickets/schedule: https://www.atlantaopera.org/tickets/
- Operabase page: https://www.operabase.com/atlanta-opera-o10163/en
- Season overview: https://atlanta-ga.events/opera/
- Venue: Cobb Energy Performing Arts Centre, Atlanta GA
- Data: 6 productions per season, Ring Cycle completion (2025-26), Alliance Theatre collaborations

---

## Implementation Requirements for Regional Discovery

### Scraping Module Structure

```go
// data_fetch/scrape_regional.go
package main

type VenueConfig struct {
    Name          string   `yaml:"name"`
    Code          string   `yaml:"code"`
    OfficialURL   string   `yaml:"official_url"`
    CalendarURL   string   `yaml:"calendar_url"`
    OperabaseURL  string   `yaml:"operabase_url"`
    City          string   `yaml:"city"`
    State         string   `yaml:"state"`
    Region        string   `yaml:"region"`
}

type RegionalConfig struct {
    Enabled bool           `yaml:"enabled"`
    Regions []RegionConfig `yaml:"regions"`
}

type RegionConfig struct {
    Name    string         `yaml:"name"`
    Code    string         `yaml:"code"`
    Venues  []VenueConfig  `yaml:"venues"`
}

// User can add new regions/venues by editing config.yaml
```

### Data Priorities

**Primary:** Official venue calendar pages (structured HTML scraping)
**Secondary:** Operabase venue pages (backup/enrichment)
**Tertiary:** Arts event aggregators (atlanta-ga.events, los-angeles-theatre.com)

### Output Schema

```json
{
  "event_id": "laopera_barber_20260213",
  "venue_code": "laopera",
  "region": "socal",
  "opera_title": "The Barber of Seville",
  "composer": "Gioachino Rossini",
  "dates": ["2026-02-13", "2026-02-15", "2026-02-20"],
  "venue_name": "Dorothy Chandler Pavilion",
  "city": "Los Angeles",
  "state": "CA",
  "latitude": 34.0559,
  "longitude": -118.2467,
  "source_url": "https://www.laopera.org/...",
  "scraped_at": "2026-02-07T17:58:00Z"
}
```

### Storage Convention

```
data/raw/regional/
├── socal/
│   ├── laopera_YYYYMMDD.json
│   ├── longbeachopera_YYYYMMDD.json
│   ├── sandiegoopera_YYYYMMDD.json
│   └── ...
├── norcal/
│   ├── sfopera_YYYYMMDD.json
│   └── operasj_YYYYMMDD.json
├── nm/
│   └── santafeopera_YYYYMMDD.json
└── atl/
    └── atlantaopera_YYYYMMDD.json
```

### Makefile Targets

```makefile
# Add these regional scraping targets
scrape-socal:
	go run data_fetch/scrape_regional.go --region socal

scrape-norcal:
	go run data_fetch/scrape_regional.go --region norcal

scrape-nm:
	go run data_fetch/scrape_regional.go --region nm

scrape-atl:
	go run data_fetch/scrape_regional.go --region atl

scrape-regional-all: scrape-socal scrape-norcal scrape-nm scrape-atl

# Update main fetch target
fetch-all: fetch-wikidata fetch-openopus fetch-rism fetch-musicbrainz fetch-imslp fetch-kaggle scrape-operabase scrape-regional-all
```

### UI Integration

**Add regional filter to web UI:**
- Checkbox/dropdown: "Show performances near me"
- Region selector: Southern CA | Northern CA | New Mexico | Atlanta | [User adds more]
- Distance slider (if geocoding implemented)
- Date range filter (upcoming performances only)

**Timeline view enhancement:**
- Color code by region
- "Local performances" highlight track
- Tooltip shows venue + ticket link

---

## Easy Region Addition Instructions

**For users to add new regions later:**

1. Edit `config.yaml` and add new region block:

```yaml
regional_venues:
  regions:
    - name: "Pacific Northwest"  # Your new region
      code: "pnw"
      venues:
        - name: "Seattle Opera"
          code: "seattleopera"
          official_url: "https://www.seattleopera.org"
          calendar_url: "https://www.seattleopera.org/whats-on/"
          city: "Seattle"
          state: "WA"
          region: "pnw"
        # Add more venues...
```

2. Run: `make scrape-regional-all` (automatically picks up new config)

3. New region appears in UI filter dropdown automatically

---

## Authority Reconciliation Strategy

Use these ID mappings to merge regional performance data with core graph:

```
Regional Performance → Opera Work:
  1. Match by title + composer name (fuzzy)
  2. Lookup Wikidata ID via SPARQL (opera title + composer)
  3. Link to existing graph node
  4. Enrich with: performance_count, upcoming_dates[], venues[]

Example:
  "The Barber of Seville" (LA Opera 2026) →
    Wikidata Q181885 (Il barbiere di Siviglia) →
    Graph node: composer=Q9726 (Rossini) →
    Add edge: performed_at → venue_node (Dorothy Chandler Pavilion)
```

---

## Notes

- All regional venues provide public schedule information (no authentication required)
- Scraping must respect rate limits in main `config.yaml` (domain-aware limiter applies)
- Some venues (Long Beach Opera, Pacific Opera Project) use non-traditional repertoire—include for network analysis even if not in Wikidata
- Santa Fe Opera has unique summer-only season (June-August outdoor performances)
- Atlanta Opera completing first-ever Ring Cycle in southern US (historic milestone for graph annotation)

```
