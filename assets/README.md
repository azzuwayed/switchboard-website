# Assets

The landing page currently uses an inline SVG favicon and a CSS placeholder for the hero image, so you can ship the page before adding screenshots. When you have screenshots, replace the placeholders.

## Screenshots

Capture these from a running build via `pnpm tauri:dev`. Use `Cmd+Shift+4` then space then click the window. Recommended size: 1800×1200 (will scale down).

- `screenshot-dashboard.png` — Switchboard dashboard with a few services running.
- `screenshot-templates.png` — templates browser.
- `screenshot-ports.png` — port inspector.

To wire `screenshot-dashboard.png` into the hero: in `index.html`, replace the `<div class="hero-art hero-placeholder">` block with the original `<img>` tag pattern.

## Favicon

A blue rounded-square "S" SVG is inlined into `index.html` via a data URI. To use a custom PNG instead, drop it at `assets/icon.png` and change the `<link rel="icon">` tag back to `href="assets/icon.png" type="image/png"`.
