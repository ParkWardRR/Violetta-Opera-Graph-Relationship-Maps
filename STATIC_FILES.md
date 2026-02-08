# Static Files Layout

Non-repo data and static files are stored at `~/Violetta-Opera-Graph-Relationship-Maps/`.

Run `make setup-dirs` to create this structure automatically.

```
~/Violetta-Opera-Graph-Relationship-Maps/
├── static/
│   ├── models/                  # Core ML .mlpackage files (downloaded by opera-embed)
│   └── cache/                   # Large cached API downloads
└── data/
    ├── raw/
    │   ├── html/                # Scraped HTML pages (keyed by URL hash)
    │   │   └── manifest.json    # URL -> filename mapping with timestamps
    │   ├── regional/            # Regional venue scrape results
    │   │   ├── socal/           # Southern California venues
    │   │   ├── norcal/          # Northern California venues
    │   │   ├── nm/              # New Mexico venues
    │   │   └── atl/             # Atlanta venues
    │   ├── operas.csv           # Wikidata SPARQL results
    │   ├── composers.csv        # Wikidata SPARQL results
    │   ├── relationships.csv    # Wikidata SPARQL results
    │   ├── openopus_work_dump.json
    │   ├── rism_sources.json
    │   ├── musicbrainz_works.json
    │   └── imslp_works.json
    └── processed/
        ├── graph.json           # Final Graphology-format graph (nodes + edges)
        ├── embeddings.json      # 384-dim sentence embeddings per node
        └── projections.json     # UMAP 2D coordinates per node
```

## Regenerating

- `make fetch` populates `data/raw/`
- `make embed` populates `data/processed/embeddings.json` and `projections.json`
- `opera-fetch process` builds `data/processed/graph.json` from raw data
