# Violetta Opera Graph Relationship Maps

Interactive, GPU-accelerated visualization of opera relationships: composers, works, premieres, librettists, and regional performances.

## Architecture

```
Repo (source code)              ~/Violetta-Opera-Graph-Relationship-Maps/ (data)
├── data_fetch/  (Swift CLI)  ──→  data/raw/       (API responses)
├── embeddings/  (Swift CLI)  ──→  data/processed/  (graph.json, embeddings)
├── scraper/     (Go CLI)     ──→  data/raw/regional/ (venue scrapes)
├── scripts/     (Node.js)    ──→  data/processed/  (UMAP projections)
└── web/         (React+TS)   ←──  data/processed/  (reads graph.json)
```

**Two linked GPU views:**
1. **Network graph** - sigma.js + graphology (WebGL) with ForceAtlas2 layout
2. **Timeline + clustering** - deck.gl (GPU accelerated) scatterplot

## Prerequisites

- macOS 15+ on Apple Silicon
- Xcode 26+ (includes Swift 6.2+)
- Go 1.25+ (`brew install go`)
- Node.js 20+ (`brew install node`)
- GNU Make

## Quick Start

```bash
make setup  # install all dependencies (Swift, Go, Node)
make fetch  # pull data from Wikidata, Open Opus, MusicBrainz, IMSLP
make dev    # start web UI at localhost:5173
```

Or run the full pipeline:

```bash
make all    # setup + fetch + embed + build
```

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make setup` | Install all dependencies |
| `make fetch` | Pull data from APIs + scrape venues |
| `make embed` | Generate Core ML embeddings + UMAP projections |
| `make build` | Build web UI for production |
| `make dev` | Start Vite dev server |
| `make all` | Full pipeline end-to-end |
| `make scrape-socal` | Scrape Southern California venues only |
| `make clean` | Remove build artifacts (preserves data) |

## Data Sources

- [Wikidata](https://query.wikidata.org/) - Opera metadata via SPARQL
- [Open Opus](https://openopus.org) - Composer and work metadata
- [RISM Online](https://rism.online) - Musical source records
- [MusicBrainz](https://musicbrainz.org) - Work hierarchy and recordings
- [IMSLP](https://imslp.org) - Score metadata
- Regional venue calendars (configurable in `config.yaml`)

## Configuration

All scraping limits, rate limits, and regional venue configs are in `config.yaml`. See `STATIC_FILES.md` for the data directory layout.

## Adding Regional Venues

Edit `config.yaml` and add a new region/venue block. Run `make scrape-regional-all` to pick up new venues automatically.

## License

[Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
