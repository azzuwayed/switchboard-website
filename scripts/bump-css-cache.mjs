#!/usr/bin/env node
//
// Bump the ?v=<hash> cache-buster on the <link rel="stylesheet"> in
// index.html so a fresh style.css doesn't get served from a stale CDN/
// browser cache.
//
// Why this exists locally: .github/workflows/version-css.yml used to do this
// on every push to main. The workflow is paused while the parent project's
// CI quota is restored; this script is the local equivalent. Run it after
// editing style.css and before committing.
//
// Usage:
//   node scripts/bump-css-cache.mjs           # bump if needed, exit 0 either way
//   node scripts/bump-css-cache.mjs --check   # exit non-zero if a bump is needed
//                                             (use as a pre-commit/pre-push gate)
//
// Idempotent: if the current hash already matches style.css, this is a no-op.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR);
const INDEX_PATH = join(REPO_ROOT, "index.html");
const STYLE_PATH = join(REPO_ROOT, "style.css");
const CHECK_ONLY = process.argv.includes("--check");

function fail(message, code = 1) {
  console.error(`bump-css-cache: ${message}`);
  process.exit(code);
}

const styleBytes = readFileSync(STYLE_PATH);
const hash = createHash("sha256").update(styleBytes).digest("hex").slice(0, 10);

const indexBefore = readFileSync(INDEX_PATH, "utf8");
const linkRe = /(style\.css\?v=)([0-9a-f]+)/;
const match = linkRe.exec(indexBefore);
if (!match) {
  fail(`could not find 'style.css?v=<hash>' in ${INDEX_PATH}`);
}

if (match[2] === hash) {
  console.log(`bump-css-cache: already at v=${hash}; nothing to do.`);
  process.exit(0);
}

if (CHECK_ONLY) {
  fail(
    `stale cache-buster: index.html has v=${match[2]}, style.css hashes to v=${hash}. Run \`node scripts/bump-css-cache.mjs\` and commit.`,
    2,
  );
}

const indexAfter = indexBefore.replace(linkRe, `$1${hash}`);
writeFileSync(INDEX_PATH, indexAfter);
console.log(`bump-css-cache: v=${match[2]} -> v=${hash} in index.html`);
