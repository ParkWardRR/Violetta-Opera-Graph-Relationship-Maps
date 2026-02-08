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
- [ ] swift-embeddings integration (all-MiniLM-L6-v2) - deps build, needs runtime test
- [ ] Batch embedding + cosine similarity
- [x] UMAP projection script (scripts/compute-projections.mjs)
- [ ] Merge projections into graph.json

## Phase 5: Go Scraper
- [x] Go module (scraper/go.mod)
- [x] Domain-aware limiter + backoff
- [x] Regional venue scraper (HTTP-based, Playwright TBD)
- [ ] Full Playwright-Go browser setup
- [ ] URL-based HTML cache + manifest
- [ ] robots.txt handling
- [ ] Operabase scraper

## Phase 6: Integration
- [x] End-to-end build validation (all 4 components)
- [x] Real graph.json (88 nodes, 53 edges from Wikidata + Open Opus)
- [x] Verify linked selection with real data
- [x] README with badges + mermaid diagrams
- [ ] Code signing documentation (for later)

## Future
- [ ] Kaggle Opera Performance Dataset integration
- [ ] Bachtrack popularity metrics
- [ ] Code signing + notarization
- [ ] App Store distribution
