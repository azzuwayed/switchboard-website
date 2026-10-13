# Assets

## App icon

The brand mark in the page header and the browser favicon both use the
Switchboard app icon — a dark squircle with two toggles connected by a blue
"S"-shaped cable. Source artwork lives in
[`src-tauri/icons/`](https://github.com/azzuwayed/switchboard/tree/main/src-tauri/icons)
in the app repo. Regenerate from a 1024×1024 source by the pipeline in
[`docs/reference/icons.md`](https://github.com/azzuwayed/switchboard/blob/main/docs/reference/icons.md).

| File           | Source                                  | Use                            |
| -------------- | --------------------------------------- | ------------------------------ |
| `icon-32.png`  | `src-tauri/icons/32x32.png` (32×32)     | classic browser favicon        |
| `icon-128.png` | `src-tauri/icons/128x128.png` (128²)    | favicon hi-dpi + brand mark 1x |
| `icon-256.png` | `src-tauri/icons/128x128@2x.png` (256²) | brand mark 2x, apple-touch, OG |

Refresh after an icon revision by re-copying from `src-tauri/icons/`:

```sh
cp ../switchboard/src-tauri/icons/32x32.png      assets/icon-32.png
cp ../switchboard/src-tauri/icons/128x128.png    assets/icon-128.png
cp ../switchboard/src-tauri/icons/128x128@2x.png assets/icon-256.png
```

## Product media

The app repository owns the hero, localized social cards, and localized gallery
captures in `product/media/`. `pnpm sync:product` validates their manifest,
copies the accepted bytes into `assets/product/<content-revision>/`, and points
the English and Arabic pages at those immutable paths. Revision directories are
script-owned and must not be edited by hand.

The gallery contract uses these fixed keys: `services`, `background-items`,
`agent-briefing`, `observer`, `ports`, and `stream`. The app's capture command
produces the final 3084×1968 WebP for each locale. Product media must contain
only fictional services, paths, ports, logs, and account details; `agent-briefing`
and `stream` visibly identify Pro access.

`assets/screenshots/install-dmg.png` and its WebP sibling remain static because
the installer walkthrough is not product-manifest media. The legacy stable
product screenshots remain only until the first schema-3 sync, which removes
them after both pages and `product.json` point at the complete revisioned set.
