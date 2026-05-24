# Changelog

User-visible changes to Switchboard, written for people running the app.
Internal refactors, test changes, and dependency bumps are intentionally
omitted — those live in the development repo's changelog.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
Switchboard uses [SemVer](https://semver.org/). Pre-1.0 builds ship as
`1.0.0-beta.<n>`.

## [1.0.0-beta.4] - 2026-05-24

### Security

- Tighter input validation on the docs-folder picker. Paths that resolve
  to the filesystem root, your home directory itself, system locations
  (`/System`, `/Library`, `/usr`, etc.), or that try to escape via `..`
  or symlinks are rejected with a clear message. Existing settings are
  unaffected; the validation only fires when you change the list.

## [1.0.0-beta.3] - 2026-05-24

First public release.

### Added

- **Service dashboard.** One place to see every Homebrew service, Docker
  container, launchd agent, HTTP endpoint, and command-backed dev server
  on your machine — with running, degraded, stopped, and unknown states.
- **Risk-aware actions.** Start, stop, restart, update — every command
  is allowlisted and explicitly approved before it runs. Destructive and
  privileged commands require confirmation.
- **Health checks** for Homebrew, Docker, HTTP, and command-managed
  services with live polling.
- **Background observer.** Detects new services, common dev ports,
  resource anomalies, and port conflicts. Standard mode keeps it guided;
  Advanced mode reveals PID, command, cwd, ports, CPU/RSS, and bulk
  controls.
- **Port inspector** with conflict detection, service linking, and a
  create-service-from-port affordance.
- **Live log viewer** for both file-backed and command-backed logs.
- **Markdown docs viewer** for your local runbooks.
- **Template library.** Postgres, MySQL, MongoDB, Redis, Docker Compose,
  Ollama, nginx, and more — reviewed and ready to add in one click.
- **First-run onboarding** that detects what's already running, suggests
  templates, sets up your docs folders, and offers launch-at-login.
- **Settings → Updates.** Toggle automatic update checks, see when the
  app last checked, and manually check now. A non-modal banner shows
  when a new release is available; click through to the download page.
  Detection only — no in-place auto-install yet (waiting on Apple
  Developer ID signing).
- **Settings → Danger zone → Reset all app data.** Restores defaults
  and clears your services, commands, settings, approvals, observer
  state, and activity log. Every file is backed up before deletion so
  you can roll back individual pieces from Settings → Backups.
- **Activity log** with search, filters by service / action / status /
  time, density and follow controls, redaction badges, and JSON export
  for diagnostics.
- **Public website + download page** at
  [azzuwayed.github.io/switchboard-website](https://azzuwayed.github.io/switchboard-website/)
  with verifiable SHA-256 checksums on every release.
- **Arabic UI** with full RTL support, alongside English. Switch in
  Settings → Language.

### Security

- Command output is bounded and truncated; secret redaction is on by
  default. Opt out in Settings if you want raw output in the activity
  log.

## System requirements

macOS 12 (Monterey) or later, Apple Silicon (arm64).

[1.0.0-beta.4]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.3
