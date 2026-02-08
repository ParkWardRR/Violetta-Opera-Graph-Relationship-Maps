STATIC_DIR := $(HOME)/Violetta-Opera-Graph-Relationship-Maps
REPO_DIR   := $(shell pwd)
UNAME_S    := $(shell uname -s)

# Playwright's `--with-deps` is intended for Linux package managers.
PLAYWRIGHT_INSTALL_ARGS := chromium
ifeq ($(UNAME_S),Linux)
PLAYWRIGHT_INSTALL_ARGS := --with-deps chromium
endif

.PHONY: setup setup-dirs setup-swift setup-go setup-web setup-scripts \
        fetch fetch-apis scrape-regional process \
        embed run-embeddings compute-projections \
        build dev test-web all clean \
        scrape-socal scrape-norcal scrape-nm scrape-atl scrape-regional-all

# ── Setup ──────────────────────────────────────────────────────────────

setup: setup-dirs setup-swift setup-go setup-web setup-scripts

setup-dirs:
	@mkdir -p $(STATIC_DIR)/data/raw/html
	@mkdir -p $(STATIC_DIR)/data/raw/regional/socal
	@mkdir -p $(STATIC_DIR)/data/raw/regional/norcal
	@mkdir -p $(STATIC_DIR)/data/raw/regional/nm
	@mkdir -p $(STATIC_DIR)/data/raw/regional/atl
	@mkdir -p $(STATIC_DIR)/data/processed
	@mkdir -p $(STATIC_DIR)/static/models
	@mkdir -p $(STATIC_DIR)/static/cache
	@echo "Static directories ready at $(STATIC_DIR)"

setup-swift:
	cd $(REPO_DIR)/data_fetch && swift build
	cd $(REPO_DIR)/embeddings && swift build

setup-go:
	cd $(REPO_DIR)/scraper && go mod download
	cd $(REPO_DIR)/scraper && go run github.com/playwright-community/playwright-go/cmd/playwright@latest install $(PLAYWRIGHT_INSTALL_ARGS)

setup-web:
	cd $(REPO_DIR)/web && npm install

setup-scripts:
	cd $(REPO_DIR)/scripts && npm install

# ── Fetch ──────────────────────────────────────────────────────────────

fetch: fetch-apis scrape-regional process

fetch-apis:
	cd $(REPO_DIR)/data_fetch && swift run opera-fetch all --data-dir $(STATIC_DIR)

scrape-regional: scrape-socal scrape-norcal scrape-nm scrape-atl

scrape-socal:
	cd $(REPO_DIR)/scraper && go run . --config $(REPO_DIR)/config.yaml --data-dir $(STATIC_DIR) --region socal

scrape-norcal:
	cd $(REPO_DIR)/scraper && go run . --config $(REPO_DIR)/config.yaml --data-dir $(STATIC_DIR) --region norcal

scrape-nm:
	cd $(REPO_DIR)/scraper && go run . --config $(REPO_DIR)/config.yaml --data-dir $(STATIC_DIR) --region nm

scrape-atl:
	cd $(REPO_DIR)/scraper && go run . --config $(REPO_DIR)/config.yaml --data-dir $(STATIC_DIR) --region atl

scrape-regional-all: scrape-socal scrape-norcal scrape-nm scrape-atl

process:
	cd $(REPO_DIR)/data_fetch && swift run opera-fetch process --data-dir $(STATIC_DIR)

# ── Embed ──────────────────────────────────────────────────────────────

embed: run-embeddings compute-projections

run-embeddings:
	cd $(REPO_DIR)/embeddings && swift run opera-embed \
		--input $(STATIC_DIR)/data/processed/graph.json \
		--output $(STATIC_DIR)/data/processed/embeddings.json \
		--models-dir $(STATIC_DIR)/static/models

compute-projections:
	cd $(REPO_DIR)/scripts && node compute-projections.mjs $(STATIC_DIR)

# ── Web ────────────────────────────────────────────────────────────────

build:
	cd $(REPO_DIR)/web && VITE_DATA_DIR=$(STATIC_DIR)/data/processed npm run build

dev:
	cd $(REPO_DIR)/web && VITE_DATA_DIR=$(STATIC_DIR)/data/processed npm run dev -- --host 127.0.0.1 --port 5173

# End-to-end smoke test of the web UI using Playwright-Go.
# Spins up the Vite dev server temporarily, then runs `go test` in ./e2e.
test-web:
	@set -e; \
	  export VITE_DATA_DIR="$(STATIC_DIR)/data/processed"; \
	  ARTIFACTS_DIR="$(REPO_DIR)/.context/playwright"; \
	  mkdir -p "$$ARTIFACTS_DIR"; \
	  echo "Starting Vite dev server (artifacts: $$ARTIFACTS_DIR)"; \
	  (cd "$(REPO_DIR)/web" && npm run dev -- --host 127.0.0.1 --port 5173 --strictPort >"$$ARTIFACTS_DIR/vite-dev.log" 2>&1 & echo $$! >"$$ARTIFACTS_DIR/vite-dev.pid"); \
	  PID=$$(cat "$$ARTIFACTS_DIR/vite-dev.pid"); \
	  trap 'kill $$PID >/dev/null 2>&1 || true' EXIT; \
	  i=0; \
	  until curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; do \
	    i=$$((i+1)); \
	    if [ $$i -gt 80 ]; then echo "Timed out waiting for dev server. See $$ARTIFACTS_DIR/vite-dev.log"; exit 1; fi; \
	    sleep 0.25; \
	  done; \
	  echo "Running Playwright-Go tests..."; \
	  (cd "$(REPO_DIR)/e2e" && ARTIFACTS_DIR="$$ARTIFACTS_DIR" VIOLETTA_BASE_URL="http://127.0.0.1:5173/" go test ./... -v)

# ── All ────────────────────────────────────────────────────────────────

all: setup fetch embed build
	@echo "Pipeline complete. Run 'make dev' to start the web UI."

# ── Clean ──────────────────────────────────────────────────────────────

clean:
	cd $(REPO_DIR)/data_fetch && swift package clean
	cd $(REPO_DIR)/embeddings && swift package clean
	rm -rf $(REPO_DIR)/web/dist $(REPO_DIR)/web/node_modules
	rm -rf $(REPO_DIR)/scripts/node_modules
	@echo "Cleaned build artifacts. Static data at $(STATIC_DIR) preserved."
