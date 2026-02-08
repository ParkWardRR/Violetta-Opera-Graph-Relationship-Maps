# Violetta Opera Graph Relationship Maps

[![License: Blue Oak 1.0.0](https://img.shields.io/badge/License-Blue%20Oak%201.0.0-2D6AA3.svg)](https://blueoakcouncil.org/license/1.0.0)
[![Swift 6.2](https://img.shields.io/badge/Swift-6.2-F05138.svg?logo=swift&logoColor=white)](https://swift.org)
[![Go 1.25](https://img.shields.io/badge/Go-1.25-00ADD8.svg?logo=go&logoColor=white)](https://go.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%2015+-000000.svg?logo=apple&logoColor=white)](https://developer.apple.com/macos/)
[![Apple Silicon](https://img.shields.io/badge/Apple%20Silicon-M1%2FM2%2FM3%2FM4-333333.svg?logo=apple&logoColor=white)](https://support.apple.com/en-us/116943)
[![sigma.js](https://img.shields.io/badge/sigma.js-3-FF6600.svg)](https://sigmajs.org)
[![deck.gl](https://img.shields.io/badge/deck.gl-9-purple.svg)](https://deck.gl)
[![Core ML](https://img.shields.io/badge/Core%20ML-Embeddings-34C759.svg?logo=apple&logoColor=white)](https://developer.apple.com/documentation/coreml)

Interactive, GPU-accelerated visualization of opera relationships: composers, works, premieres, librettists, and regional performances. Two linked WebGL views let you explore the opera world as a force-directed network graph and a chronological timeline scatter.

---

## System Architecture

```mermaid
graph TB
    subgraph Data["Data Pipeline (offline)"]
        WD["Wikidata SPARQL"]
        OO["Open Opus API"]
        MB["MusicBrainz API"]
        IM["IMSLP API"]
        RI["RISM Online"]
        VN["Regional Venues"]

        WD & OO & MB & IM & RI -->|"Swift async/await"| DF["data_fetch CLI"]
        VN -->|"Go + Playwright"| SC["scraper CLI"]

        DF -->|CSV + JSON| RAW["data/raw/"]
        SC -->|JSON| RAW

        RAW -->|"swift run opera-fetch process"| GJ["graph.json"]
        GJ -->|"swift run opera-embed"| EMB["embeddings.json"]
        EMB -->|"node compute-projections.mjs"| PROJ["projections.json"]
    end

    subgraph Web["Web UI (runtime)"]
        GJ -->|fetch /graph.json| WEB["React + Vite"]
        WEB --> SIG["sigma.js Network View"]
        WEB --> DGL["deck.gl Timeline View"]
        SIG <-->|"Zustand selectionStore"| DGL
    end

    style Data fill:#1e293b,stroke:#334155,color:#e2e8f0
    style Web fill:#0f172a,stroke:#3b82f6,color:#e2e8f0
```

## Data Flow

```mermaid
flowchart LR
    subgraph Fetch["Phase 1: Fetch"]
        A["Wikidata\n57 operas\n55 composers"] --> D["data/raw/"]
        B["Open Opus\n3.3MB dump"] --> D
        C["MusicBrainz\n2000 works"] --> D
        E["IMSLP\n500 pages"] --> D
    end

    subgraph Process["Phase 2: Process"]
        D -->|"merge + dedupe"| F["graph.json\n88 nodes\n53 edges"]
    end

    subgraph Embed["Phase 3: Embed"]
        F -->|"all-MiniLM-L6-v2\nCore ML"| G["embeddings.json\n384-dim vectors"]
        G -->|"cosine > 0.7"| H["similar_to edges"]
        G -->|"UMAP"| I["projections.json\n2D coords"]
    end

    subgraph Render["Phase 4: Render"]
        F --> J["sigma.js\nForceAtlas2"]
        I --> K["deck.gl\nScatterplot"]
    end

    style Fetch fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style Process fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style Embed fill:#2d1b4e,stroke:#8b5cf6,color:#e2e8f0
    style Render fill:#1a2e1a,stroke:#22c55e,color:#e2e8f0
```

## Web UI Component Tree

```mermaid
graph TD
    App["App"]
    App --> Header["Header + Tabs + ExportMenu"]
    App --> FB["FilterBar"]
    App --> Main["Main Content"]
    Main --> NV["NetworkView"]
    Main --> TV["TimelineView"]
    Main --> ND["NodeDetail"]

    NV --> SC["SigmaContainer"]
    SC --> GE["GraphEvents"]
    SC --> FA["ForceAtlas2Layout"]
    SC --> GF["GraphFilters"]

    TV --> DGL["DeckGL + OrthographicView"]
    DGL --> SPL["ScatterplotLayer"]

    FB --> Search["Search Input"]
    FB --> Comp["Composer Dropdown"]
    FB --> Era["Era Chips"]
    FB --> Dec["Decade Range"]

    subgraph Stores["Zustand Stores"]
        SS["selectionStore"]
        FS["filterStore"]
        GS["graphStore"]
    end

    GE <-->|"click/hover"| SS
    GF <-->|"filter state"| FS
    SC <-->|"graph instance"| GS
    SPL <-->|"click/hover"| SS
    FB <-->|"filter state"| FS
    ND <-->|"selected node"| SS

    style Stores fill:#2d1b4e,stroke:#8b5cf6,color:#e2e8f0
```

## Linked Selection Protocol

```mermaid
sequenceDiagram
    participant User
    participant NetworkView
    participant selectionStore
    participant TimelineView
    participant NodeDetail

    User->>NetworkView: Click node "La Traviata"
    NetworkView->>selectionStore: setSelected({Q1350}, 'network')
    selectionStore-->>TimelineView: selectedNodeKeys changed
    TimelineView->>TimelineView: Highlight Q1350 dot
    selectionStore-->>NodeDetail: Show La Traviata details
    selectionStore-->>NetworkView: Dim non-selected nodes

    User->>TimelineView: Click dot "Carmen"
    TimelineView->>selectionStore: setSelected({Q2226}, 'timeline')
    selectionStore-->>NetworkView: Highlight Carmen, dim others
    selectionStore-->>NodeDetail: Show Carmen details
```

## Repository Structure

```mermaid
graph LR
    subgraph Repo["Repo (machu-picchu/)"]
        DF["data_fetch/\nSwift CLI"]
        EM["embeddings/\nSwift CLI"]
        SC["scraper/\nGo CLI"]
        SR["scripts/\nNode.js"]
        WB["web/\nReact + TS"]
        MK["Makefile"]
        CF["config.yaml"]
    end

    subgraph Static["~/Violetta-Opera-Graph-Relationship-Maps/"]
        DR["data/raw/\nCSV, JSON, HTML"]
        DP["data/processed/\ngraph.json\nembeddings.json\nprojections.json"]
        SM["static/models/\nCore ML .mlpackage"]
    end

    DF -->|"writes"| DR
    SC -->|"writes"| DR
    DF -->|"reads raw, writes"| DP
    EM -->|"reads graph.json, writes"| DP
    EM -->|"downloads"| SM
    SR -->|"reads embeddings, writes"| DP
    WB -->|"serves"| DP

    style Repo fill:#1e293b,stroke:#334155,color:#e2e8f0
    style Static fill:#1a2e1a,stroke:#22c55e,color:#e2e8f0
```

## Era Color Encoding

| Era | Years | Color | Hex |
|-----|-------|-------|-----|
| Baroque | < 1750 | ![#8B5CF6](https://via.placeholder.com/12/8B5CF6/8B5CF6.png) | `#8B5CF6` |
| Classical | 1750 - 1820 | ![#06B6D4](https://via.placeholder.com/12/06B6D4/06B6D4.png) | `#06B6D4` |
| Early Romantic | 1820 - 1850 | ![#22C55E](https://via.placeholder.com/12/22C55E/22C55E.png) | `#22C55E` |
| Late Romantic | 1850 - 1910 | ![#EAB308](https://via.placeholder.com/12/EAB308/EAB308.png) | `#EAB308` |
| 20th Century | 1910 - 1975 | ![#F97316](https://via.placeholder.com/12/F97316/F97316.png) | `#F97316` |
| Contemporary | > 1975 | ![#EF4444](https://via.placeholder.com/12/EF4444/EF4444.png) | `#EF4444` |

Composer nodes use `#60A5FA` (blue). Node size encodes degree centrality (number of connections).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| macOS | 15+ (Sequoia) | -- |
| Xcode | 26+ | Mac App Store |
| Swift | 6.2+ | Included with Xcode |
| Go | 1.25+ | `brew install go` |
| Node.js | 20+ | `brew install node` |
| GNU Make | 3.81+ | Included with Xcode CLT |

## Quick Start

```bash
# Clone and enter the repo
git clone <repo-url> && cd machu-picchu

# Install all dependencies (Swift, Go, Node)
make setup

# Pull opera data from live APIs
make fetch

# Start the interactive web UI
make dev
# --> http://localhost:5173
```

Or run the full pipeline including embeddings:

```bash
make all    # setup -> fetch -> embed -> build
```

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make setup` | Install all dependencies (Swift build, Go modules, npm install) |
| `make fetch` | Pull data from all APIs + scrape regional venues |
| `make embed` | Generate Core ML sentence embeddings + UMAP 2D projections |
| `make build` | Build web UI for production (`web/dist/`) |
| `make dev` | Start Vite dev server at `localhost:5173` |
| `make all` | Full pipeline: setup -> fetch -> embed -> build |
| `make process` | Re-process raw data into `graph.json` (no re-fetching) |
| `make scrape-socal` | Scrape Southern California venues only |
| `make scrape-norcal` | Scrape Northern California venues only |
| `make scrape-nm` | Scrape New Mexico venues only |
| `make scrape-atl` | Scrape Atlanta venues only |
| `make scrape-regional-all` | Scrape all regional venues |
| `make clean` | Remove build artifacts (preserves fetched data) |

## Data Sources

| Source | Type | Rate Limit | Data |
|--------|------|------------|------|
| [Wikidata](https://query.wikidata.org/) | SPARQL | 2 req/s | Opera metadata, composers, relationships |
| [Open Opus](https://openopus.org) | REST JSON | 5 req/s | Composer bios, work catalogs |
| [MusicBrainz](https://musicbrainz.org) | REST JSON | 1 req/s | Work hierarchy, recordings, releases |
| [IMSLP](https://imslp.org) | MediaWiki API | 1 req/s | Score metadata, publication dates |
| [RISM Online](https://rism.online) | REST JSON | 2 req/s | Historical music source records |
| Regional Venues | HTML Scraping | Configurable | Upcoming performances by venue |

## Graph Schema

```mermaid
erDiagram
    OPERA {
        string key "Wikidata Q-ID"
        string label "Opera title"
        string composerId "Composer Q-ID"
        string composerName "Composer name"
        int premiereYear "Year of premiere"
        string premiereLocation "City"
        string language "Sung language"
        string genre "Opera subgenre"
        string eraBucket "Baroque|Classical|..."
        string decade "1850s|1860s|..."
        float x "Graph X position"
        float y "Graph Y position"
        float size "Node radius"
        string color "Hex color by era"
    }
    COMPOSER {
        string key "Wikidata Q-ID"
        string label "Full name"
        int birthYear "Born"
        int deathYear "Died"
        string nationality "Country"
        float x "Graph X position"
        float y "Graph Y position"
    }
    OPERA }|--|| COMPOSER : "composed_by"
    OPERA ||--o{ OPERA : "based_on"
    OPERA ||--o{ OPERA : "inspired_by"
    OPERA ||--o{ OPERA : "similar_to"
```

## Regional Venue Coverage

```mermaid
graph TD
    subgraph socal["Southern California"]
        LA["LA Opera"]
        LB["Long Beach Opera"]
        POP["Pacific Opera Project"]
        SD["San Diego Opera"]
        MO["Mission Opera"]
        PS["Pacific Symphony"]
    end

    subgraph norcal["Northern California"]
        SF["San Francisco Opera"]
        SJ["Opera San Jose"]
    end

    subgraph nm["New Mexico"]
        SANTA["Santa Fe Opera"]
    end

    subgraph atl["Atlanta"]
        ATL["The Atlanta Opera"]
    end

    style socal fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style norcal fill:#1e3a5f,stroke:#3b82f6,color:#e2e8f0
    style nm fill:#2d1b4e,stroke:#8b5cf6,color:#e2e8f0
    style atl fill:#1a2e1a,stroke:#22c55e,color:#e2e8f0
```

## Embedding Pipeline

```mermaid
flowchart TD
    A["graph.json\n88 opera nodes"] -->|"Build text repr"| B["'{title} by {composer},\n{year}, {genre}, {language}, {era}'"]
    B -->|"Batch size 32"| C["all-MiniLM-L6-v2\nCore ML Neural Engine"]
    C --> D["384-dim vectors\nper opera node"]
    D -->|"Pairwise cosine similarity"| E{"cosine > 0.7?"}
    E -->|Yes| F["similar_to edge\nwith weight"]
    E -->|No| G["No edge"]
    D -->|"UMAP projection"| H["2D coordinates\nprojX, projY"]
    H --> I["Timeline scatter\nX = premiereYear\nY = UMAP axis"]

    style C fill:#2d1b4e,stroke:#8b5cf6,color:#e2e8f0
```

## Configuration

All scraping limits, rate limits, and regional venue configs live in [`config.yaml`](config.yaml).

See [`STATIC_FILES.md`](STATIC_FILES.md) for the full data directory layout at `~/Violetta-Opera-Graph-Relationship-Maps/`.

## Adding Regional Venues

1. Edit `config.yaml` and add a new venue under the appropriate region
2. Run `make scrape-regional-all` to scrape all venues

```yaml
- name: "Your Opera Company"
  code: "youropera"
  official_url: "https://www.youropera.org"
  calendar_url: "https://www.youropera.org/events"
  city: "Your City"
  state: "ST"
```

## Exports

The web UI supports three export formats from the header menu:

| Format | Description |
|--------|-------------|
| **PNG** | Rasterized screenshot of the current sigma.js canvas |
| **SVG** | Vector graphic generated from node/edge positions |
| **JSON** | Raw `graph.json` download (Graphology format) |

## Tech Stack

```mermaid
mindmap
  root((Violetta))
    Data Ingestion
      Swift 6.2
        async/await URLSession
        Actor-based concurrency
        SPM packages
      Go 1.25
        Playwright browser automation
        Domain-aware rate limiting
    Processing
      Core ML
        all-MiniLM-L6-v2
        Neural Engine acceleration
        384-dim sentence embeddings
      UMAP
        umap-js
        2D dimensionality reduction
    Visualization
      sigma.js 3
        WebGL rendering
        ForceAtlas2 web worker
        Graphology data model
      deck.gl 9
        GPU-accelerated scatter
        OrthographicView
      React 19
        Vite 6
        TypeScript 5.7
        Zustand state management
        Tailwind CSS 4
```

## License

[Blue Oak Model License 1.0.0](https://blueoakcouncil.org/license/1.0.0)
