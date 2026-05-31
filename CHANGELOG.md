# Changelog

User-visible changes to Switchboard, written for people running the app.
Internal refactors, test changes, and dependency bumps are intentionally
omitted — those live in the development repo's changelog.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
Switchboard uses [SemVer](https://semver.org/). Pre-1.0 builds ship as
`1.0.0-beta.<n>`.

## [Unreleased]

## [1.0.0-beta.20] - 2026-05-31

### Added

- **Tray dev-port console.** The Command Center now shows local dev-server
  ports directly in the tray with quick actions to copy the port, open frontend
  URLs, or stop the owning process.
- **Curated free-port reference.** Common frontend, database, service, and
  debug ports are available from a collapsed Free ports section when you need a
  quick "what can I start on?" check.
- **Dev-port conflict notifications.** Port conflict alerts now focus on common
  development ports and have their own setting.

### Changed

- **The tray is more control-focused.** Running and degraded dev servers are
  prioritized, active/free dev-port counts are split, and free-port chips are
  passive labels instead of copy buttons.

### Fixed

- **The menu-bar count refreshes more reliably.** The running-service number now
  updates after liveness scans instead of waiting for a tray rebuild.
- **Port-stop errors are clearer.** Structured backend failures now show their
  readable message instead of `[object Object]`.

## [1.0.0-beta.19] - 2026-05-31

### Added

- **New branded macOS installer window.** The DMG now opens with a polished
  Switchboard install background, clear app-to-Applications drop zones, and a
  sharper Retina-ready layout.

### Changed

- **The app is branded as Switchboard.** Menus, tray labels, update banners,
  About, the README, and the website now use "Switchboard by Azzuwayed" for the
  public product name.
- **The DMG install flow is more reliable.** Release builds now use a custom
  dmgbuild layout so the Finder window is cleaner and less dependent on
  Tauri's default DMG metadata.

## [1.0.0-beta.18] - 2026-05-29

### Added

- **Health checks are editable in the service editor.** Services can now use
  none, HTTP, command, Homebrew, or Docker health probes, including
  monitor-only services that do not have start/stop commands.

### Changed

- **Active monitoring is the default for new setups and resets.** Fresh installs
  now start with proactive discovery, resource monitoring, faster checks, and
  denser unified-log polling enabled.
- **Service groups are easier to edit.** The fixed group picker is now an
  editable suggestions field, so custom group names and ungrouped services are
  preserved.
- **Setup and Add Service flows are clearer.** Onboarding, empty-dashboard,
  tray, Docs, and manual-log surfaces now point more consistently toward
  detecting services first, then reviewing what to add.

### Fixed

- **The native tray menu no longer rebuilds on every status-count update.** An
  open right-click tray menu now stays open instead of being recreated while
  service counts change.
- **Removed the ineffective Activity Monitor reveal buttons.** Observer, Ports,
  tray, and failure-dialog actions no longer show a button that only opened
  Activity Monitor without selecting the process.

## [1.0.0-beta.17] - 2026-05-28

### Added

- **Unified Add Service flow.** Detection, listening ports, presets, YAML import,
  and custom services now open through one Add Service path. Presets are reviewed
  in the editor before they are saved, so you can adjust names, commands, health
  checks, and logs first.
- **Observer Ignore Forever.** Observer findings now have Ignore and Unignore
  actions, plus an Ignored view. Switchboard remembers smart fingerprints for
  noisy local processes, including resource anomalies whose PIDs change over
  time.

### Changed

- **First-run setup starts with detection.** Onboarding now leads with local
  service detection, offers presets/import/restore/manual setup as secondary
  paths, includes monitoring power modes, and finishes by taking you straight to
  the dashboard.
- **Templates are now Presets.** The old Templates navigation has been folded
  into Add Service as reviewed starting points. Existing `/templates` links still
  land in the preset picker.
- **App identity and storage path updated.** The macOS bundle identifier and
  displayed config/log paths now use `com.azzuwayed.switchboard`.
- **Product copy is clearer about what Switchboard is for.** The app and docs now
  emphasize forgotten local services, AI-created port sprawl, unified logs, and
  safe local automation.

## [1.0.0-beta.16] - 2026-05-27

Major release — the post-audit rebuild. Adds the controls that were missing
when a service misbehaved (mute, ceilings, revoke, approve-once), centralizes
rogue-process actions, and finally lets you restore from a backup at first run.

### Added

- **Per-service mute / snooze.** Right-click a service (kebab menu) →
  Mute for 1h / 4h / until tomorrow / forever. Muted services stop generating
  attention badges, transition notifications, and tray attention entries until
  you unmute them. Use it when a service is known-quirky and you don't want
  the noise training you to ignore the badge.
- **Per-service resource ceilings.** Service editor → Resource ceilings.
  Override the global observer sensitivity for one service: `cpu: 20%` makes
  Switchboard alert sooner on a small helper that shouldn't be hot, or
  `cpu: 400%` lets a local LLM run hard without warnings. CPU and memory
  thresholds can be set independently.
- **Approve once.** Approval review now has an "Approve once" button next to
  "Approve selected". The approval is consumed on the next successful run, so
  the run after that prompts again. Useful for "try this flaky update one time"
  without giving the command standing approval.
- **Approval revoke.** Each approved command in the review surface now has a
  Revoke action with a double-confirm. The audit-trail entry stays; only the
  approved flag flips so the next run reprompts.
- **Fingerprint-change diff prompt.** When you edit a command's cmd/args/cwd,
  the approval review row now shows a "Previously approved" diff card with the
  old version struck through, so the re-approval is informed.
- **Inline approval panel in Settings.** Settings → Security now renders the
  full approval list inline (the old modal-launching button is gone).
- **Pending approvals badge.** The sidebar Settings icon and tray attention
  tile now surface the global pending-approvals count.
- **Port intelligence on action failures.** When a `start` fails because a
  port is held, the failure dialog now inlines the owner process + Kill /
  Reveal controls so you can resolve it without leaving the dialog. This is
  the canonical "AI agent walked to the next port" scenario the app exists
  to catch.
- **Running-action strip.** Actions in flight past 2 seconds render a
  one-line indicator below the action buttons with elapsed time and a
  "Tail in /logs" link.
- **Tray "Stop all running" button.** One click stops every running service
  with a direct stop action. Confirms first.
- **Tray port Kill / Reveal inline.** Port rows in the tray now expose
  Kill / Reveal directly — no need to open the main window.
- **Settings → Updates.** Auto-check toggle, last-checked timestamp, snooze
  countdown, and manifest URL override moved out of About into a proper
  Settings panel. The banner state machine and the panel share state.
- **Bulk action result sheet.** Bulk start/stop/restart used to flash an
  aggregate toast; now it opens a sheet listing every service's outcome
  with a retry-failed button.
- **Activity log export.** Export everything to JSON or CSV. Redaction-aware;
  CSV is safe against formula-injection.
- **Logs viewer polish.** Export the visible buffer to NDJSON, color-dot
  legend when the source sidebar is collapsed, clearer search placeholder.
- **Docs viewer polish.** Broken internal links now show an indicator, and
  a Refresh index button reloads the docs tree without restarting the app.
- **Service detail — recent activity.** Top 10 activity entries for the
  current service render below the controls, with "View all" deep-linking
  to `/activity` pre-filtered.
- **Onboarding — Restore from backup.** New fourth path on the path-choice
  step for returning-after-reset users. Lists the latest backup of each
  target file (services, commands, settings, approvals) and restores them
  as a coherent set. The current state is saved as a fresh backup first.
- **Onboarding — Detect heuristic explanation.** Hover the
  Recommended / Other split on the detect step to see what the heuristic
  matched on.
- **Onboarding — Confirm step shows services.** Replaces the "you're
  monitoring N services" count with the actual service list (name + kind).
- **Service editor — Logs section.** Pick a log source per service
  (file tail, command output, or none) directly from the editor. The
  unified Logs viewer used to require hand-editing YAML for any
  custom-built service; that gate is gone.
- **Service editor — Description / notes.** Optional notes field per
  service, surfaced as a subtitle on dashboard cards and at the top of
  service detail. Three months from now, "redis" finally says which redis.
- **Service editor — Duplicate.** Kebab menu item that opens the editor
  pre-filled from the source service.
- **Logs and Observer reachable from every nav surface.** `/logs` is in
  the command palette, the keyboard shortcuts include both `/observer`
  and `/logs`, and the tray footer promotes them above About.
- **Resource consumption profiles.** New Battery / Balanced / Active
  profiles in Settings → Monitoring tune the background polling cadences
  across status, observer, and unified-logs at once. Manual advanced
  edits show a Custom state.

### Changed

- **Service liveness is now one source of truth.** Dashboard cards, tray
  rows, and the status feed all reflect changes at the same time. The
  separate background poller is gone; the observer scan owns liveness.
- **One log viewer, not two.** The service-detail logs tab now opens the
  unified Logs view pre-filtered to that service.
- **Stable dashboard sort.** Cards no longer reshuffle on every status
  flip. Initial sort locks on load; explicit refresh re-sorts.
- **Rogue-process actions are consistent across surfaces.** Observer
  inbox, ports inspector, and service-detail discovered services now
  share one row of actions (Adopt / Reveal / Stop / Snooze / Dismiss /
  Copy) instead of three slightly-different variants.

### Fixed

- **Mute didn't survive an edit.** Saving a service from the editor used
  to silently clear its mute state. Mute now round-trips through the
  editor save.
- **Attention surfaces ignored mute.** Muted services were still counted
  in sidebar chips and the tray Attention tab. They aren't anymore.
- **Restoring one backup file at a time could fail.** Restoring services
  and commands separately tripped the cross-file validation on the
  intermediate state. The onboarding Restore path now writes every file
  before validating once, and rolls back the whole batch if anything
  fails (including deleting files that didn't exist before, so a
  partial restore can't strand orphan config).

## [1.0.0-beta.15] - 2026-05-27

### Added

- **Runtime diagnostics in support exports.** Switchboard now writes a bounded
  runtime log for backend warnings and includes a redacted recent tail when you
  copy diagnostics. This gives support/debug sessions useful context without
  flooding the export with dependency noise.

### Changed

- **Main window size and placement stick.** The main Switchboard window now
  restores its saved size, position, and maximized state instead of reopening
  across the full monitor work area every time.

### Fixed

- **Startup window no longer gets shoved around.** The About/What's New window
  now waits for the main window handoff to finish, so it is less likely to jump,
  animate twice, or appear behind the app during launch and tray reopen.

## [1.0.0-beta.14] - 2026-05-27

### Added

- **Stop process button on forgotten dev servers.** When Switchboard auto-detects
  an HTTP service (the kind that walks to the next available port without
  killing the previous instance), the detail panel now has a "Stop process"
  button next to "Open". One click opens a confirmation showing the exact
  `kill -15 <pid>` and the port + process name, then sends SIGTERM if you
  agree. This is the missing affordance for the core forgotten-server case
  the app exists to catch.
- **Custom service actions are editable in the GUI.** If a service has actions
  beyond the four standard ones — `status`, `clear-logs`, `fail`, anything you
  defined — the Edit modal now renders an editable row for each one with the
  same cmd / args / cwd layout as Start / Stop / Restart / Update. Previously
  these only showed on the read-only command-mapping panel and you had to drop
  into `commands.yaml` to change them.
- **"Discovered" pill on auto-detected services.** Services Switchboard
  detected for you (Docker containers, launchd jobs, port observations) now
  carry a small Discovered chip next to the kind chip on the dashboard card
  and detail header. Distinguishes them from services you configured by hand,
  without relying on the description text.
- **Launchd services get real logs.** Discovered launchd jobs used to render
  the Logs tab as "No log output" — Switchboard wasn't reading the plist's
  `StandardOutPath` / `StandardErrorPath`. Now it parses both during
  discovery and tails the configured file. Picks stdout first, falls back to
  stderr.
- **Arabic translation of the website.** The landing page and privacy
  statement are now available in Arabic with a right-to-left layout. A
  language toggle in the header switches between English and Arabic; deep
  links to sections (`#features`, `#install`, `#faq`, ...) work in both
  locales.

### Changed

- **Health summary stops calling everything "errors".** The detail panel's
  health rollup used to read `~5 ms avg · 100% errors` whether the service
  was stopped on purpose (Redis you hadn't started) or returning HTTP 404
  (reachable but degraded). Both produced false alarm. The summary now
  breaks down by health state — `~5 ms avg · 60% stopped · 40% degraded` —
  with zero-percent buckets dropped. The word "errors" is gone; each
  bucket names its own state.
- **Status-only services get a real action button.** Services with only a
  `status` command (typical for launchd agents) used to collapse the entire
  action row to a single hidden-overflow dropdown. The lone action is now
  rendered as a primary button so you can see and click it without opening
  a menu.
- **Edit modal: empty command rows collapse.** "Update" (or any unused
  primary action slot) no longer renders as three permanently-visible
  empty inputs. Collapses to a single "+ Add update command" button that
  expands when clicked. The `args` field also got more room — long
  `launchctl list com.foo.bar` style commands no longer truncate past the
  first word.
- **Less noise on the dashboard.** Project group cards drop a redundant
  "{count} services" chip (the summary line already carries the count).
  Single-service grid cards drop the small response-time sparkline at the
  bottom (it only showed up on some cards, making the dashboard feel
  uneven). The detail panel keeps its larger sparkline.
- **Less noise in the detail panel.** Last-check timestamps drop seconds.
  Probe lines no longer give the auto-generated command id ("redis-health-3")
  equal visual weight with the probe type — the id stays visible but
  smaller and muted below the type. The status pill moves to the left of
  the service name, matching every dashboard card. The two ellipsis
  controls that used to sit ~30px apart in the header (one for action
  overflow, one for the management menu) now use distinct icons. The
  overflow trigger itself drops the redundant word "More" alongside the
  three-dot glyph.
- **Forgotten-pin state.** Pinning a service to the Command Center now
  fills the pin icon, not just tints it — easy to see at a glance which
  services are pinned vs. not.
- **Dashboard grid stops leaving an empty cell.** When a group has an odd
  number of cards in a two-column layout, the last row used to render a
  visible empty cell on the right. The grid now stretches present cards
  to fill, no more gap.
- **Row layout doesn't sprawl on wide monitors.** Caps row width around
  1600px and centers it so each row stays readable on 4K displays.
- **Detail timeline has guidance when empty.** The "No command runs or
  status changes recorded yet" copy now points at how to populate it:
  "Run Start, Stop, or Restart from above to populate this timeline."
- **Default display scale is 125%.** New installs feel less cramped out
  of the box. (Existing settings are unchanged.)
- **Docs viewer: tighter rail, subfolder grouping, reliable highlighter.**
  Documents in subfolders group under their folder name. The side rail
  uses tighter padding so more docs fit at once. The TOC scroll-spy used
  to lag one heading behind or freeze entirely; now the active heading
  highlights as you scroll through it.
- **Settings backups list stays tidy.** Old backups auto-prune so the
  list doesn't accumulate forever, and rows render more compactly.
- **Settings sidebar follows the scroll.** Previously the section nav
  rail could freeze at the top while the content scrolled past; now they
  stay in sync.

### Fixed

- **i18n: "key '...status' returned an object instead of string" no longer
  appears anywhere.** Services declaring a `status` action used to display
  an i18next error string in place of the button label because the
  translation key clashed with a sub-namespace. Resolved at the structural
  level — action labels now live in their own leaf namespace and can never
  collide with sub-namespaces again.

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
