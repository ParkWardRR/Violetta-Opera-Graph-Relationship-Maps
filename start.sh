#!/bin/bash

# Kill any existing processes on exit
trap 'kill 0' EXIT

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
STATIC_DIR="${HOME}/Violetta-Opera-Graph-Relationship-Maps"

echo "Starting Violetta Opera Graph..."

if [ "$1" = "--dev" ]; then
  # Development mode: two servers, hot reload
  echo "Mode: Development (hot reload)"
  echo ""
  echo "  Backend API:  http://localhost:8080"
  echo "  Web UI:       http://localhost:5173  (with hot reload)"
  echo ""
  (cd "$REPO_DIR/scraper" && go run . --server --config "$REPO_DIR/config.yaml" --data-dir "$STATIC_DIR") &
  (cd "$REPO_DIR/web" && VITE_DATA_DIR="$STATIC_DIR/data/processed" npm run dev -- --host 0.0.0.0 --port 5173 --strictPort) &
else
  # Production mode: single server
  if [ ! -d "$REPO_DIR/web/dist" ]; then
    echo "Building web UI..."
    (cd "$REPO_DIR/web" && VITE_DATA_DIR="$STATIC_DIR/data/processed" npm run build)
  fi
  echo "Mode: Production (single server)"
  echo ""
  echo "  Violetta:  http://localhost:8080"
  echo ""
  cd "$REPO_DIR/scraper" && go run . --server --config "$REPO_DIR/config.yaml" --data-dir "$STATIC_DIR" --static "$REPO_DIR/web/dist" &
fi

wait
