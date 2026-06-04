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
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR);
const STYLE_PATH = join(REPO_ROOT, "style.css");
const CHECK_ONLY = process.argv.includes("--check");

// Pages that reference style.css and therefore need their cache-buster kept
// in sync. New localized pages go here.
const HTML_PAGES = [
  "index.html",
  "privacy.html",
  "pricing.html",
  "checkout.html",
  "success.html",
  "ar/index.html",
  "ar/privacy.html",
  "ar/pricing.html",
  "ar/checkout.html",
  "ar/success.html",
];

function fail(message, code = 1) {
  console.error(`bump-css-cache: ${message}`);
  process.exit(code);
}

const styleBytes = readFileSync(STYLE_PATH);
const hash = createHash("sha256").update(styleBytes).digest("hex").slice(0, 10);
const linkRe = /(style\.css\?v=)([0-9a-f]+)/;

let staleCount = 0;
const rewrites = [];

for (const rel of HTML_PAGES) {
  const path = join(REPO_ROOT, rel);
  const before = readFileSync(path, "utf8");
  const match = linkRe.exec(before);
  if (!match) {
    fail(`could not find 'style.css?v=<hash>' in ${rel}`);
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
