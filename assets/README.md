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

## Screenshots

Website screenshots live in `assets/screenshots/`. Each capture is stored as a
real PNG source plus a WebP sibling used by the landing pages through
`<picture>`:

| File                         | Use                                      |
| ---------------------------- | ---------------------------------------- |
| `services-dashboard.webp`    | Hero product screenshot                  |
| `install-dmg.webp`           | First-time install screenshot            |
| `observer-inbox.webp`        | Screenshot gallery: discovered services  |
| `ports-inspector.webp`       | Screenshot gallery: port/process view    |
| `logs-viewer.webp`           | Screenshot gallery: unified logs         |
| `detect-services.webp`       | Screenshot gallery: reviewed detection   |
| `activity.webp`              | Supporting/docs screenshot               |
| `new-service.webp`           | Supporting/docs screenshot               |
| `service-detail.webp`        | Supporting/docs screenshot               |

Regenerate from the PNG sources after recapturing:

```sh
for f in assets/screenshots/*.png; do
  base=$(basename "$f" .png)
  magick "$f" -auto-orient -strip -colorspace sRGB -depth 8 "$f"
  magick "$f" -quality 86 "assets/screenshots/$base.webp"
done
```
