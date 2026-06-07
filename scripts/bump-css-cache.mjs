#!/usr/bin/env node
//
// Bump the ?v=<hash> cache-buster on the <link rel="stylesheet"> in every
// page that references style.css so a fresh style.css doesn't get served
// from a stale CDN/browser cache.
//
// Why this exists locally: .github/workflows/version-css.yml used to do this
// on every push to main, but that made release-time website commits race each
// other. This script is the single local cache-busting path now. The source
// repo's release script runs it before committing updates.json; for standalone
// website changes, run it after editing style.css and before committing.
//
// Usage:
//   node scripts/bump-css-cache.mjs           # bump if needed, exit 0 either way
//   node scripts/bump-css-cache.mjs --check   # exit non-zero if a bump is needed
//                                             (use as a pre-commit/pre-push gate)
//
// Idempotent: if every page already matches style.css's hash, this is a no-op.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR);
const STYLE_PATH = join(REPO_ROOT, "style.css");
const CHECK_ONLY = process.argv.includes("--check");

// Every .html page in the site, discovered recursively. Auto-discovery (vs a
// hardcoded list) means a newly added page is cache-busted automatically — the
// previous static list silently skipped new pages (e.g. recover.html), leaving
// them pointed at a stale style.css hash.
function discoverHtmlPages(dir = REPO_ROOT, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...discoverHtmlPages(join(dir, entry.name), rel));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(rel);
    }
  }
  return out;
}

const HTML_PAGES = discoverHtmlPages().sort();

function fail(message, code = 1) {
  console.error(`bump-css-cache: ${message}`);
  process.exit(code);
}

const styleBytes = readFileSync(STYLE_PATH);
const hash = createHash("sha256").update(styleBytes).digest("hex").slice(0, 10);
const linkRe = /(style\.css\?v=)([0-9a-f]+)/;
const styleRefRe = /<link[^>]*href=["'][^"']*style\.css/i;

let staleCount = 0;
const rewrites = [];

for (const rel of HTML_PAGES) {
  const path = join(REPO_ROOT, rel);
  const before = readFileSync(path, "utf8");
  const match = linkRe.exec(before);
  if (!match) {
    // Pages that don't link style.css are skipped. A page that links it
    // *without* a ?v= cache-buster is an authoring gap: warn (so it's visible)
    // but don't block the release — that page just won't be cache-busted.
    if (styleRefRe.test(before)) {
      console.warn(
        `bump-css-cache: ${rel} links style.css without a ?v= cache-buster; add ?v=${hash}.`,
      );
    }
    continue;
  }
  if (match[2] === hash) continue;
  staleCount += 1;
  rewrites.push({ rel, path, before, fromHash: match[2] });
}

if (staleCount === 0) {
  console.log(`bump-css-cache: already at v=${hash}; nothing to do.`);
  process.exit(0);
}

if (CHECK_ONLY) {
  const list = rewrites.map((r) => `${r.rel} (v=${r.fromHash})`).join(", ");
  fail(
    `stale cache-buster in ${staleCount} file(s): ${list}; style.css hashes to v=${hash}. Run \`node scripts/bump-css-cache.mjs\` and commit.`,
    2,
  );
}

for (const { rel, path, before, fromHash } of rewrites) {
  const after = before.replace(linkRe, `$1${hash}`);
  writeFileSync(path, after);
  console.log(`bump-css-cache: v=${fromHash} -> v=${hash} in ${rel}`);
}
