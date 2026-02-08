
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
