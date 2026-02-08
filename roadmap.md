# Roadmap

## Phase 1: Scaffolding
- [x] Directory structure (repo + static files)
- [x] LICENSE.md (Blue Oak Council 1.0.0)
- [x] config.yaml with rate limits + regional venues
- [x] Makefile with all targets
- [x] README.md + roadmap.md + STATIC_FILES.md
- [x] .gitignore
- [x] Mock graph.json for web dev

## Phase 2: Swift Data Fetcher
- [x] SPM package (data_fetch/Package.swift)
- [x] HTTPClient actor with async/await
- [x] RateLimiter actor (domain-aware, configurable)
- [x] CacheManager (file-based, TTL)
- [x] SPARQL queries (operas, composers, relationships)
- [x] WikidataCommand
- [x] OpenOpusCommand
- [x] RISMCommand
- [x] MusicBrainzCommand
- [x] IMSLPCommand
- [x] ProcessCommand (merge + deduplicate + build graph.json)

## Phase 3: Web UI
- [x] Vite + React + TypeScript init
- [x] Tailwind setup
- [x] sigma.js network view (color/size encoding)
- [x] deck.gl timeline view (scatter + decade stripes)
- [x] Zustand stores (selection, filters, graph)
- [x] Linked selection between views
- [x] FilterBar (era, decade, search)
- [x] Node detail panel
- [x] ForceAtlas2 web worker layout
- [x] Composer multi-select filter
- [x] Export (PNG/SVG/JSON)
- [ ] shadcn/ui component polish

## Phase 4: Core ML Embeddings
- [x] SPM package (embeddings/Package.swift)
- [x] swift-embeddings integration (all-MiniLM-L6-v2) - deps build, needs runtime test
- [x] Batch embedding + cosine similarity
- [x] UMAP projection script (scripts/compute-projections.mjs)
- [x] Merge projections into graph.json

## Phase 5: Go Scraper
- [x] Go module (scraper/go.mod)
- [x] Domain-aware limiter + backoff
- [x] Regional venue scraper (Playwright + Go)
- [x] Full Playwright-Go browser setup
- [x] URL-based HTML cache + manifest
- [x] robots.txt handling
- [x] Admin UI (React + Go API)
- [ ] Operabase scraper

## Phase 6: Local Discovery & Education
- [x] Events API endpoint (`GET /api/events`) with region filtering
- [x] Smart URL scraper endpoint (`POST /api/scrape-url`) with multi-strategy extraction
- [x] Custom sources API (`GET /api/sources`) with persistence
- [x] Generic parser: JSON-LD / Schema.org structured data extraction
- [x] Generic parser: Heuristic DOM extraction (event selectors, date patterns)
- [x] Generic parser: Meta tag / OpenGraph fallback
- [x] Fuzzy title matching (Levenshtein distance) against graph.json operas
- [x] React Events view with region filtering and event cards
- [x] React Scraper page with URL input, live status, results display
- [x] Discover page: 5 guided tours (Big 5, Mozart, Italian Romance, Wagner, Contemporary)
- [x] Discover page: Opera glossary (18 terms with definitions and examples)
- [x] Discover page: Era-by-era history guide with color-coded descriptions
- [x] NodeDetail sidebar enriched with era context blurbs for opera newcomers
- [x] Dark/light theme toggle with system detection
- [x] Preferences page with display customization

## Phase 7: Integration & Deployment
- [x] End-to-end build validation (all 4 components)
- [x] Real graph.json (88 nodes, 53 edges from Wikidata + Open Opus)
- [x] Verify linked selection with real data
- [x] README with badges + mermaid diagrams
- [x] Single-binary deployment: Go server serves web UI + API on port 8080
- [x] SPA fallback routing for client-side navigation
- [x] Vite dev proxy (`/api` -> localhost:8080)
- [x] `make serve` one-command deploy target
- [x] `start.sh` with `--dev` flag for hot-reload development
- [ ] Code signing documentation (for later)

## Phase 8: Public Deployment
- [ ] Vercel or Fly.io hosting
- [ ] Custom domain setup
- [ ] SEO optimization (meta tags, sitemap, structured data)
- [ ] Performance profiling and bundle optimization
- [ ] CDN for static assets
- [ ] Analytics (privacy-respecting, e.g. Plausible)

## Phase 9: Community Features
- [ ] User accounts (sign in with Apple / GitHub)
- [ ] Favorites and personal opera lists
- [ ] User annotations and notes on nodes
- [ ] "My opera journey" progress tracking
- [ ] Share curated tours / playlists
- [ ] Community-submitted venue data sources

## Future
- [ ] iOS app (SwiftUI + Core ML on-device)
- [ ] Kaggle Opera Performance Dataset integration
- [ ] Bachtrack popularity metrics
- [ ] VisionOS spatial graph (RealityKit on Apple Vision Pro)
- [ ] MLX fine-tuning for natural-language opera Q&A
- [ ] Core ML speech-to-search
- [ ] Code signing + notarization
- [ ] App Store distribution
