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
http://localhost:5173/
```

If your browser says it "can’t connect", the dev server likely isn’t running anymore (closing the terminal stops it).
If you're trying to access the dev server from another device on your LAN, make sure you're using your Mac's LAN IP/hostname (not `127.0.0.1`).
Use the daemon targets to keep it running in the background:

```bash
make dev-daemon
make dev-status
make dev-logs
make dev-stop
```

## Web UI (Playwright-Go smoke test)

This is a fast check that the app loads, successfully fetches `graph.json`, and renders a WebGL canvas.

```bash
make test-web
```

Artifacts:
- Screenshots and the Vite dev log are written to `.context/playwright/`.
