# Testing

## Web UI (manual)

Prereqs:
- `make setup`
- Ensure you have data at `~/Violetta-Opera-Graph-Relationship-Maps/data/processed/graph.json` (run `make fetch` or at least `make process`)

Run:

```bash
make dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Web UI (Playwright-Go smoke test)

This is a fast check that the app loads, successfully fetches `graph.json`, and renders a WebGL canvas.

```bash
make test-web
```

Artifacts:
- Screenshots and the Vite dev log are written to `.context/playwright/`.

