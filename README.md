# Switchboard by Azzuwayed

**The Mac command center for AI agents and developers.** One native menu-bar app for local services, ports, AI runtimes, background items, logs, and reviewed controls.

[**Download for macOS →**](https://switchboard.azzuwayed.com/) · [Changelog](https://github.com/azzuwayed/switchboard-website/releases) · [Support](https://switchboard.azzuwayed.com/contact.html)

---

## Why I built this app

I kept losing track of services I'd started. A dev server here, a database there, a tunnel for some experiment — half of them still running days later, none of them stopped, all of them quietly using CPU and battery I didn't have to spare. macOS doesn't tell you about this; Activity Monitor lists the processes but won't connect `node` to _the dev server I started last week_.

The problem got worse with AI coding agents. They're great at spinning up dev servers and not always great at stopping the previous one. Sometimes the agent is smart enough to free the port it needs; sometimes it just walks to the next available one. After a few hours of iteration you can end up with six copies of the same Vite server competing for memory, the laptop running hot, the battery draining fast, and nothing in macOS surfacing any of it.

There's another version of the problem: you build a service yourself and then forget where in your dev folders it lives. Or you're running a mix of local services and AI tooling — Claude Code, Ollama, LM Studio, [OpenClaw](https://github.com/openclaw/openclaw), your own Hermes dashboard, local LLM runtimes — each with its own log stream in its own corner of disk. Switchboard's optional Stream tool brings service logs, manual files, and Switchboard activity into one timeline, so following what your local stack is doing doesn't require five terminal panes and a good memory.

Switchboard is the thing I wanted: one place where every local service shows up, every forgotten process gets surfaced, every port flood gets named with its actual cause, and every log stream lands on one screen.

## What it gives you

- **One tray for everything you run locally.** Start, stop, restart, and inspect Postgres, Redis, MySQL, MongoDB, Docker containers, your dev servers, and launchd agents from a single menu-bar icon.
- **A memory layer for the messy local machine.** Discovered, adopted, snoozed, ignored, resolved, and still-suspicious findings survive beyond one terminal session.
- **Port context Activity Monitor does not have.** Connect `node`, `python`, `docker`, or `ollama` to the service, port, logs, and safe next action.
- **Risk-aware actions.** Every command is allowlisted and explicitly approved before it runs. No arbitrary shell from the UI.
- **Local-first control.** Service discovery and control run on your Mac with no inbound network listener. Automatic update checks can include an anonymous aggregate active-install signal; optional account, licensing, support, configured probes, and Uptime features use their stated destinations. Your config and logs live in `~/Library/Application Support/`.
- **Templates that actually work.** Postgres, MySQL, MongoDB, Redis, Docker Compose, Ollama, nginx, and more — reviewed and ready out of the box.
- **Guarded AI-agent context.** Everyone can preview MCP access profiles, methods, exclusions, and context cost; azzuwayed Pro, a Switchboard Lifetime license, or the full-feature trial lets supported agents use structured context and reviewed actions instead of a raw shell.

## What's inside

- Service dashboard with running, degraded, stopped, and unknown states across every service kind.
- Health checks for Homebrew, Docker, HTTP, and command-backed services with live polling.
- Port inspector with conflict detection and service linking — no more `lsof`.
- Live log viewer for file and command-backed logs.
- Markdown docs viewer for your local runbooks.
- Guarded MCP integration for supported external AI agents, including service inspection/control, docs lookup, guard reports, and custom-service creation helpers. MCP is unlocked by Pro, Lifetime, or the full-feature trial.
- First-run onboarding that detects what's already running on your machine.

## System requirements

macOS 12 (Monterey) or later on Apple Silicon or Intel Macs.

## Get it

→ [**switchboard.azzuwayed.com**](https://switchboard.azzuwayed.com/)

## Pricing

Switchboard stays useful for free: unlimited services, safe start/stop,
service-down alerts, new-arrival notifications, and complete free tools for
Activity, Docs, Observer, Ports, and Maintenance. Fresh installs get a 7-day
full-feature trial, then return to free use. Free use also includes a read-only
preview of MCP access profiles, methods, and context cost. Paid access is
available through azzuwayed Pro (29.99 SAR monthly or 299.99 SAR yearly) or a
Switchboard Lifetime license (146.25 SAR, about $39, with promo codes from time
to time). Both
unlock Stream, System Logs, Resources, Uptime, Numerics, and the MCP runtime.
Pro includes apps marked “Included with Pro”; a Lifetime license permanently
owns Switchboard and activates up to 3 Macs. See
[pricing](https://azzuwayed.com/en/products/switchboard).

Free use needs no account. Joining azzuwayed Pro or purchasing a Lifetime
license requires an azzuwayed.com account, which provides billing and access
history, purchase recovery, registered-device help, and private priority
support. Sign in inside Switchboard to resolve membership or owned access.
Lifetime owners may also activate manually with the emailed license key.

## Stay in the loop

- **Releases** — [Changelog](https://github.com/azzuwayed/switchboard-website/releases). The app also checks once a day and shows an in-app banner when a new release is available.
- **Bugs and ideas** — use **Send Feedback** inside Switchboard, open
  [private account support](https://azzuwayed.com/en/account/support/new), or
  use the [guest contact form](https://switchboard.azzuwayed.com/contact.html).

## Website development

This is a static GitHub Pages site. Install its pinned development dependency
with `pnpm install --frozen-lockfile`, then run `pnpm check` before committing.
The gate validates the committed publication without requiring a private sibling
checkout: formatting, revisioned media, localized SEO and JSON-LD, the stylesheet
cache key, trusted download discovery, local links, handoffs, contact contracts,
and updater boundaries.

`pnpm sync:product` accepts manifest schemas 1–3 from
`../switchboard/product/manifest.json`, copies accepted media into
`assets/product/<content-revision>/`, renders both landing pages from the shared
product model, and writes the schema-1 `product.json` publication envelope.
Schema 3 owns localized public names, SEO fields, social cards, and gallery
media. Run `pnpm check:product:source` only when explicit source parity with the
sibling checkout is required. `node scripts/sync-product.mjs --dry-run` renders
and verifies both pages from the source manifest without writing anything; the
desktop release cutter runs it before its tag publishes the manifest. The desktop release cutter keeps its drafts
unpublished until the website and Hub revisions both match.
