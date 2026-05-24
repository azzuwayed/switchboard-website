# Switchboard

**Native macOS service manager for developers.** One menu-bar app for Homebrew services, Docker containers, launchd agents, HTTP endpoints, and dev-server commands.

[**Download for macOS →**](https://azzuwayed.github.io/switchboard-website/) · [Changelog](https://github.com/azzuwayed/switchboard-website/releases) · [Support](https://github.com/azzuwayed/switchboard-website/issues)

---

## Why Switchboard

- **One tray for everything you run locally.** Start, stop, restart, and inspect Postgres, Redis, MySQL, MongoDB, Docker containers, your dev servers, and launchd agents from a single menu-bar icon.
- **Risk-aware actions.** Every command is allowlisted and explicitly approved before it runs. No arbitrary shell from the UI.
- **Local-only.** No cloud account. No telemetry. No background HTTP server. Your config and logs live in `~/Library/Application Support/`.
- **Templates that actually work.** Postgres, MySQL, MongoDB, Redis, Docker Compose, Ollama, nginx, and more — reviewed and ready out of the box.

## What's inside

- Service dashboard with running, degraded, stopped, and unknown states across every service kind.
- Health checks for Homebrew, Docker, HTTP, and command-backed services with live polling.
- Port inspector with conflict detection and service linking — no more `lsof`.
- Live log viewer for file and command-backed logs.
- Markdown docs viewer for your local runbooks.
- First-run onboarding that detects what's already running on your machine.

## System requirements

macOS 12 (Monterey) or later, Apple Silicon (arm64).

## Get it

→ [**azzuwayed.github.io/switchboard-website**](https://azzuwayed.github.io/switchboard-website/)

## Stay in the loop

- **Releases** — [Changelog](https://github.com/azzuwayed/switchboard-website/releases). The app also checks once a day and shows an in-app banner when a new release is available.
- **Bugs and ideas** — [Issues](https://github.com/azzuwayed/switchboard-website/issues).
