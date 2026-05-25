# Changelog

User-visible changes to Switchboard, written for people running the app.
Internal refactors, test changes, and dependency bumps are intentionally
omitted — those live in the development repo's changelog.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
Switchboard uses [SemVer](https://semver.org/). Pre-1.0 builds ship as
`1.0.0-beta.<n>`.

## [1.0.0-beta.8] - 2026-05-25

No user-facing app changes. This release rolls up internal refactors, developer
tooling, and dependency bumps (React 19.2.6, i18next 26, react-markdown 10,
Tailwind 4.3, and patch-level updates across linting and formatting). Behavior,
UI, and on-disk data are unchanged from beta.7.

## [1.0.0-beta.7] - 2026-05-25

### Added

- **New app icon.** Switchboard now uses the switch-cable wordmark across the
  app bundle, installer, and generated platform icons.

### Changed

- **Richer About experience.** The About window now includes public website,
  support, changelog, and trust links; the tray command center also links there.
  The standard macOS "About Switchboard" menu item now opens the same rich
  Switchboard About window.

### Fixed

- **Template health and log commands.** Adding templates now correctly remaps
  health-check and log command IDs when they collide with existing commands, so
  imported templates keep their health and log actions wired to the right
  command.
- **Approval review coverage.** Command-backed health checks and command-backed
  logs now participate in the approval review flow before they execute.
- **Safer backup restores.** Restoring from backup now stops if Switchboard
  cannot create the pre-restore safety backup, avoiding partial or unsafe
  restore attempts.

## [1.0.0-beta.6] - 2026-05-25

No user-facing app changes. This release corrected the beta release pipeline
after the first OTA-capable build and kept the app behavior from beta.5 intact.

## [1.0.0-beta.5] - 2026-05-25

### Changed

- **In-place updates.** The update banner now installs new versions
  directly: click Install and Switchboard downloads the new build,
  verifies its signature, swaps the bundle, and restarts. The previous
  "open the download page" path stays as a fallback. macOS Gatekeeper
  will still prompt you to confirm a freshly-installed build the first
  time you open it, until the app gets Apple Developer ID signing +
  notarization (post-1.0).

  **Note for existing users:** this is the first release that can
  update in place, so v1.0.0-beta.4 installs need to download and
  install this `.dmg` once manually. Every release after this can
  update from the banner.

### Added

- **About panel.** Reachable three ways: the tray menu
  ("About Switchboard"), Settings → About, and the standard macOS app
  menu ("Switchboard → About Switchboard…", which opens Apple's native
  panel). Shows the app version, build SHA + date, your macOS version
  and architecture, the underlying Tauri / React / TypeScript versions,
  and link buttons for GitHub, the issue tracker, the public docs, and
  the MIT license. Includes a "Check for updates" button.
- **Standard macOS menu bar.** Switchboard now registers the usual
  Switchboard / Edit / Window menus so the keyboard shortcuts you
  expect (Cmd-Q, Cmd-H, Cmd-W, undo/redo/cut/copy/paste/select-all,
  minimize/close) work consistently.
- **Snooze the update banner.** A new "Later" dropdown on the banner
  defers the notice for a day, three days, or a week. Snooze is tied
  to a specific version, so a newer release during the snooze window
  still surfaces. Dismissing the banner clears any active snooze.

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

[1.0.0-beta.7]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.7
[1.0.0-beta.6]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.6
[1.0.0-beta.5]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.5
[1.0.0-beta.4]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.4
[1.0.0-beta.3]: https://github.com/azzuwayed/switchboard-website/releases/tag/v1.0.0-beta.3
