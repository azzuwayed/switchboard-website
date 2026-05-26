# Changelog

User-visible changes to Switchboard, written for people running the app.
Internal refactors, test changes, and dependency bumps are intentionally
omitted — those live in the development repo's changelog.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
Switchboard uses [SemVer](https://semver.org/). Pre-1.0 builds ship as
`1.0.0-beta.<n>`.

## [1.0.0-beta.11] - 2026-05-26

### Added

- **Unified Logs screen.** A new **Logs** view in the sidebar streams every
  configured log source — services with a `logs:` block, manual files you add,
  and Switchboard's own activity log — into one scrolling timeline. Sidebar
  multi-select picks which sources contribute; the toolbar adds pause/resume,
  free-text search, and a follow-tail toggle that disengages on manual scroll.
  Newest line stays at the top. Configurable from Settings → Logs (ring size,
  poll interval, include-activity toggle). Built for triaging live issues, not
  browsing history — bump the ring size if you need more scrollback.
- **Action-failure notifications.** When a Start / Stop / Restart / Update
  action you trigger fails (non-zero exit, timeout, or a runner error),
  Switchboard now sends a native macOS notification with the service name and
  the reason. Fires for both the in-app dashboard and the tray menu, so a
  tray-resident user with the main window hidden actually notices. Approval
  prompts and "service is busy" errors do not notify (those surface inline
  inside the app). Honors the same Settings → Monitoring → "Notify on service
  transitions" toggle.
- **Notification permission visibility.** Settings → Monitoring now warns
  inline if macOS has denied notification permission for Switchboard, with a
  link to System Settings → Notifications. Toggling notifications on triggers
  the macOS prompt instead of failing silently. The warning clears
  automatically the moment you grant permission and return to the app.
- **Onboarding.** A fresh install now lands on a guided setup flow instead of
  the empty dashboard. Pick monitored services, set defaults
  (Launch at login / notifications / redact output), and the next launch opens
  the What's New tab so you see what shipped in this version.

### Changed

- **Fixed the laptop overheating during normal use.** Out of the box,
  Switchboard no longer runs the optional observer scans (discovery + resource
  monitoring) — both are off by default; opt in from Settings → Monitoring.
  When they are on, scans run on the longer cadence the system needs (10 min
  discovery, 1 min resource sampling). Frontend animations and timers pause
  while the window is hidden. The tray icon and menu skip redundant macOS
  redraws. Net effect: near-zero idle CPU with the window hidden, and a much
  lighter foreground footprint when monitoring is enabled.
- **Notification text follows the app language.** Service-down / recovered
  notifications, observer alerts ("New local service", "Process needs
  attention", "Port conflict detected"), and action-failure notifications are
  all now translated into Arabic when the app is set to Arabic. (Observer
  summary bodies remain English for now — a future release.)
- **Notifications use the service's friendly name.** "API Gateway is running
  again" instead of "api-gw is running again".
- **Tray command center.** A new attention-focused tray panel groups the
  services that need a look (degraded, stopped, blocked actions) with one-click
  Restart / Start / Review actions. The previous flat per-service tray menu is
  still there as a fallback.
- **About window.** A refreshed brand-forward About tab plus a structured
  What's New renderer that reads the bundled release notes for the running
  build.

### Fixed

- **Observer notifications no longer get lost while the toggle is off.**
  Toggling observer notifications off used to silently consume any
  observations that crossed their debounce threshold during that window —
  toggling them back on never recovered those. Fixed.
- **System-notification dispatch failures now log to the activity log**
  instead of failing silently, so "I turned notifications on and nothing
  happens" is diagnosable.
- **What's New shows after onboarding and after an OTA install** — the
  trigger no longer pre-empties on About-window mount.
- **Skipping onboarding** no longer drops the settings you toggled, and the
  Launch-at-login LaunchAgent is now registered / unregistered in sync.
- 24h background update checks no longer re-emit for versions you already
  dismissed.

### Notes

- macOS Gatekeeper may still prompt on the first launch of an OTA-installed
  build until Apple Developer ID signing and notarization land. The update
  flow itself is unchanged.

## [1.0.0-beta.10] - 2026-05-25

### Changed

- **Redesigned About window.** The About window is now a tabbed dialog with
  three tabs: **About** (version, build, system, update check, and a single
  "Check for updates automatically" toggle), **What's New** (release notes for
  the running build, rendered offline), and **Privacy** (summary + link to the
  full privacy statement on the website). The previous separate "Open About…"
  and "Updates" rows in **Settings** are gone — both now live in this one
  place.
- **No more in-window toast.** Clicking "Check for updates" used to fire a
  toast that rendered _inside_ the About window. Update feedback is now an
  inline status row right under the button (up to date / version X.Y.Z is
  available + Install / downloading / error + retry).
- **About auto-opens after an update or on first launch.** When you install an
  in-place update, the next launch opens the About window on the **What's New**
  tab so you can see what changed. A fresh install opens it on the **About**
  tab. After that, it stays out of your way unless you ask for it.

### Added

- **Privacy & trust page** on the website at
  [`/privacy.html`](https://azzuwayed.github.io/switchboard-website/privacy.html),
  linked from the new **Privacy** tab in the About dialog and from the website's
  primary nav. The page documents that the app does not collect telemetry, does
  not have a cloud account, and has exactly one outbound network request (the
  update-manifest check, which the new in-About toggle can disable).

### Notes

- macOS Gatekeeper may still prompt on the first launch of an OTA-installed
  build until Apple Developer ID signing and notarization land. The update flow
  itself is unchanged from beta.9 — the new About window just wraps it.

## [1.0.0-beta.9] - 2026-05-25

No user-facing app changes. This release modernizes the entire core stack — Vite 8
(new Rolldown/Oxc bundler), TypeScript 6, ESLint 10, lucide-react 1, plus the
Rust side's `gray_matter` 0.3, `toml` 1.x, `reqwest` 0.13 (now using the
`aws-lc-rs` TLS provider with `rustls-platform-verifier` for system roots), and
`sha2` 0.11. SHA-256 fingerprints on command approvals are byte-identical across
the `sha2` bump, so existing `approvals.json` files on user machines remain
valid and no migration runs. Behavior, UI, and on-disk data are unchanged from
beta.8.

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
