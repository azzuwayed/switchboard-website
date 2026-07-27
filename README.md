# Switchboard by Azzuwayed

**The local service monitor for Mac developers.** One menu-bar app for forgotten dev servers, Homebrew services, Docker containers, launchd agents, HTTP endpoints, local AI tools, ports, and logs.

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
- **Local-first.** No background HTTP server. The only telemetry it sends is an anonymous active-install count over the update check — no identifiers, no raw IP stored, opt out in Settings → Privacy. Your config and logs live in `~/Library/Application Support/`.
- **Templates that actually work.** Postgres, MySQL, MongoDB, Redis, Docker Compose, Ollama, nginx, and more — reviewed and ready out of the box.
- **AI-agent setup help.** Everyone can preview MCP access profiles, methods, exclusions, and context cost; azzuwayed Pro or a Switchboard Lifetime license lets agents connect, run read-only guard checks, and create organized custom services from schemas and examples instead of ad-hoc shell commands.

## What's inside

- Service dashboard with running, degraded, stopped, and unknown states across every service kind.
- Health checks for Homebrew, Docker, HTTP, and command-backed services with live polling.
- Port inspector with conflict detection and service linking — no more `lsof`.
- Live log viewer for file and command-backed logs.
- Markdown docs viewer for your local runbooks.
- MCP integration for AI agents, including service inspection/control, docs lookup, guard reports, and custom-service creation helpers.
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
available through azzuwayed Pro (29.95 SAR monthly or 287.52 SAR yearly) or a
Switchboard Lifetime license ($39, with promo codes from time to time). Both
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
The gate checks formatting, the stylesheet cache key, local links and assets,
localized account handoffs, contact-form contracts, and retired references.
