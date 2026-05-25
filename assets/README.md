# Assets

## App icon

The brand mark in the page header and the browser favicon both use the
Switchboard app icon — a dark squircle with two toggles connected by a blue
"S"-shaped cable. Source artwork lives in
[`src-tauri/icons/`](https://github.com/azzuwayed/switchboard/tree/main/src-tauri/icons)
in the app repo. Regenerate from a 1024×1024 source by the pipeline in
[`docs/icons.md`](https://github.com/azzuwayed/switchboard/blob/main/docs/icons.md).

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

## Screenshots (not yet shipped)

The hero currently uses a pure-CSS mock window in `index.html`. To swap in a
real screenshot, capture from `pnpm tauri:dev` with `Cmd+Shift+4` → space →
click the window (~1800×1200), drop it at `assets/screenshot-dashboard.png`,
and replace the `.mock-window` block in `index.html` with an `<img>`.
