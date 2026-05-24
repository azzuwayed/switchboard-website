# Switchboard website

Public marketing + download site for [Switchboard](https://github.com/azzuwayed/switchboard-website/releases). The application source code lives in a separate private repo during the unsigned-beta phase.

## Contents

- `index.html`, `style.css` — single-page landing site.
- `assets/` — screenshots and icon.
- `updates.json` — manifest the running app fetches to detect new versions.
- GitHub Releases — host the `.dmg`, `.zip`, and `.sha256` artifacts.

## Hosting

Served via GitHub Pages from `main`, root directory.

URL: `https://azzuwayed.github.io/switchboard-website/`
Manifest: `https://azzuwayed.github.io/switchboard-website/updates.json`

## Issues

Bug reports and feature requests welcome here. The source repo is private; triaged issues that need code changes get mirrored internally.

## How releases reach this repo

The private Switchboard repo's release workflow pushes each tagged release to this repo:

1. Tag `v1.0.0-beta.N` in the private repo.
2. Private workflow builds `.dmg` + `.zip` + `.sha256` files.
3. After uploading to the private repo's GitHub Release, the workflow uses a fine-grained PAT (`WEBSITE_PUBLISH_TOKEN`) to:
   - Create a matching release on this repo with the same assets.
   - Commit an updated `updates.json` to `main`.
4. GitHub Pages picks up the new manifest within ~1 minute.

The PAT is fine-grained, scoped to `Contents: read+write` on this repo only, with a 1-year expiry.
