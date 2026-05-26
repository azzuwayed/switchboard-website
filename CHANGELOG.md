# Changelog

User-visible changes to Switchboard, written for people running the app.
Internal refactors, test changes, and dependency bumps are intentionally
omitted — those live in the development repo's changelog.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
Switchboard uses [SemVer](https://semver.org/). Pre-1.0 builds ship as
`1.0.0-beta.<n>`.

## [1.0.0-beta.13] - 2026-05-26

### Added

- **Settings: backups list and one-click restore.** Switchboard already saved a
  backup of every config file before overwriting it or running a reset, but you
  had to dig into Finder to find them. The new **Backups** section in Settings
  lists every backup grouped by source file with its creation time, a Reveal in
  Finder action, and a per-row Restore. Restoring `settings.yaml` also re-syncs
  the OS Launch-at-Login registration so the toggle matches reality. Reset now
  also refreshes the section so the pre-reset backups appear immediately.
- **Settings: a real Continuous observer master toggle.** Previously the
  "Continuous observer" label was attached to the discovery toggle. There is
  now a real master switch above the observer settings that pauses both
  discovery and resource sampling at once; the discovery toggle is renamed to
  **Service discovery** so the two are no longer confused. When the master is
  off, every observer setting below it visibly grays out and refuses
  interaction (helper text spells out how to turn them back on).
- **Settings: resource anomaly sensitivity.** Two new controls under "Resource
  anomaly checks" — **CPU sensitivity** and **Memory sensitivity**, each
  Low / Normal / High. The row description swaps in the concrete threshold for
  the selected level (e.g. "Normal: alert when CPU stays above 90%"), so you
  can tune what counts as a runaway process for your machine without guessing.
- **Settings: section navigation rail.** Settings is now a two-pane layout
  with a sticky left rail listing every section (General, Monitoring, Logs,
  Security, Docs, Config, Backups, Danger zone). Click to jump; the active
  row updates as you scroll. End of the long-scroll-only Settings page.
- **Settings: gear icon in the title bar.** Quick visual signal that you're
  in Settings.

### Changed

- **Settings: unified interval pickers.** The four "how often" controls
  (service status, discovery, resource sampling, logs refresh) now share one
  widget with friendly labels — "5 sec", "1 min", "15 min". No more
  millisecond numbers in dropdowns and no more two different "Poll interval"
  controls with mismatched units.
- **Settings: Logs line cap is now a dropdown.** "Maximum lines kept in
  memory" used to be a number stepper that took 4,500 clicks to go from 500
  to 5,000. Pick from 200 / 500 / 1,000 / 5,000 / 10,000 instead.
- **Settings: display scale steps are 100% / 125% / 150%.** Cleaner spacing
  than the old 100/110/125/140 set. If you had 110 or 140 saved, the app
  picks the nearest supported step automatically on next launch — no manual
  intervention.
- **Settings: clearer notification toggles.**
  - "Notify on service transitions" → **Service state changes** ("Native
    macOS notification when a managed service starts, stops, or fails.").
  - "Observer notifications" → **New finding alerts** ("Notify when the
    observer detects a forgotten service, port conflict, or runaway process.
    Only fires after the same finding is seen twice.").
- **Settings: copy and label cleanup.** "Show Switchboard activity by
  default" → "Show Switchboard activity". The Copy diagnostics description
  now spells out that it excludes raw command output and approval
  fingerprints. The Reset all app data description enumerates every cleared
  file and points you at the Backups section for recovery.
- **Settings: visual polish.** Stronger contrast on the active option in
  segmented controls (Theme, Display scale, Sensitivity) — they were barely
  distinguishable from the inactive ones in dark mode. Docs folder paths
  collapse `$HOME` to `~` so they fit at a glance. The Indexed folders list
  now has a clear subheading separating it from the description. Import
  appears before Export, matching the "Import / export" heading.
- **All toggles now show their state by shape, not color alone.** Every
  switch in Settings (and elsewhere in the app) renders a small check or X
  glyph inside the thumb in addition to the existing green/dark color.
  Helps in light mode and for anyone who has trouble seeing the color shift.

## [1.0.0-beta.12] - 2026-05-26

### Added

- **Stale-process nudge.** Dev servers and other temporary listeners that
  have been alive for over 24 hours with measurable CPU now visibly escalate
  in the Observer inbox — the card gains a "Forgotten" badge, an inline
  "Started X ago. Still wanted?" prompt, and a native macOS notification
  titled "Forgotten local service" (localized in Arabic too). The
  escalation latches once set, so a brief lull in CPU doesn't reset the
  marker; only Adopt, Dismiss, Stop, or the process actually exiting clears
  it. Aimed at the AI-coding-agent failure mode where dev servers walk to
  the next available port and stack up four or five copies of the same
  thing, plus the classic "I forgot I started this last week."
- **Stop action on forgotten listeners.** A destructive Stop button appears
  on every forgotten temporary observation that has a live PID. It revalidates
  the PID is still bound to one of the observed ports (so a recycled PID
  doesn't get killed), sends SIGTERM, waits a few seconds, and escalates to
  SIGKILL only if the process hangs. The observation transitions to Resolved
  on success. You no longer need to flip to Activity Monitor or a terminal
  to clean up a forgotten dev server.
- **Observer activity timeline.** The Activity view now records observer
  lifecycle events — new finding, resolved, snoozed, dismissed, adopted,
  revealed — with filtering, search, and proper localized labels. You can
  trace "when did this finding first show up" and "why did it disappear"
  without leaving the app.
- **Compact / Comfortable density** toggle for the Observer inbox. The
  Standard / Advanced mode control also moved into the Observer surface
  itself so the view options live where you use them.

### Changed

- **Onboarding leads with Detect running services.** A fresh install now
  starts by scanning what's already on your machine before walking through
  templates or custom service entry — bigger payoff up front than the empty
  state was giving.
- **Observer ordering and clarity.** Active findings sort oldest-first so
  new discoveries append below existing rows rather than shuffling them.
  Skipped-source notices (e.g. "Docker Desktop is closed; container
  discovery is paused.") stay pinned long enough to read and clear on a
  healthy manual refresh instead of vanishing on the next scan tick.
- **Port stop confirmation copy.** The dialog now spells out that
  Switchboard re-checks the PID and port before sending SIGTERM, and that
  stopping a process doesn't delete service definitions or uninstall
  anything.
- **Switchboard's own dev listener no longer shows up in the inbox.** If
  you're running `pnpm tauri dev`, the Observer used to flag your own dev
  server as a finding. It doesn't anymore.

### Fixed

- **Process titles in the Observer inbox now show the real name.** macOS
  truncates the executable column it reports to 16 characters, so
  `/usr/libexec/duetexpertd` was showing up as "High CPU: **due**" and
  `corespotlightd` (under `/System/Library/...`) was showing up as "High
  CPU: **Library**". Switchboard now uses the full command path that `ps`
  also reports and renders the actual binary name.
- **Empty "/" pill next to "Resources".** System daemons that run at cwd
  "/" used to render a stray "/" evidence pill on the card; that pill is
  now suppressed for root and system paths.
- **`Select` dropdowns** no longer show always-visible scroll chevrons.
- **Internal observer and port action names** are humanized in the Activity
  filter and row labels (e.g. "Stop port process" instead of
  `stop-port-process`).

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
