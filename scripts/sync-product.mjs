#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as prettier from "prettier";

import {
  canonicalJson,
  contentRevisionInput,
  expectedProductId,
  imageDimensions,
  localePages,
  mediaPaths,
  mimeType,
  pageDirectives,
  publishedMediaPath,
  renderPage,
  validateManifest,
  verifyPage,
} from "./product-model.mjs";

const websiteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const websiteName = basename(websiteRoot);
if (websiteName !== `${expectedProductId}-website`) {
  throw new Error(`sync-product: unexpected website directory ${websiteName}`);
}

const argv = process.argv.slice(2);
const checkOnly = argv.includes("--check");
const dryRun = argv.includes("--dry-run");
const sourceParity = argv.includes("--source-parity");
const sourceArg = argv.indexOf("--source-root");
if (sourceArg >= 0 && !argv[sourceArg + 1]) {
  throw new Error("sync-product: --source-root requires a path");
}
const sourceRoot = resolve(
  sourceArg >= 0
    ? argv[sourceArg + 1]
    : join(websiteRoot, "..", expectedProductId),
);
const sourceManifest = join(sourceRoot, "product", "manifest.json");

function fail(message) {
  throw new Error(`sync-product: ${message}`);
}

async function readSourceMedia() {
  const manifest = JSON.parse(await readFile(sourceManifest, "utf8"));
  const media = [];
  for (const path of mediaPaths(manifest)) {
    const bytes = await readFile(join(sourceRoot, path));
    media.push({
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
      mimeType: mimeType(path),
      ...imageDimensions(bytes, path),
    });
  }
  return { manifest, media };
}

async function sourcePublication() {
  const { manifest, media } = await readSourceMedia();
  const problems = validateManifest(manifest, media);
  if (problems.length > 0) fail(problems.join("; "));
  const product = {
    schemaVersion: 1,
    productId: manifest.productId,
    contentRevision: createHash("sha256")
      .update(contentRevisionInput(manifest, media))
      .digest("hex"),
    manifest,
  };
  return { product, media };
}

async function committedPublication() {
  const product = JSON.parse(
    await readFile(join(websiteRoot, "product.json"), "utf8"),
  );
  if (
    product.schemaVersion !== 1 ||
    product.productId !== expectedProductId ||
    product.manifest?.productId !== product.productId ||
    !/^[a-f0-9]{64}$/.test(product.contentRevision)
  ) {
    fail("product.json publication envelope is invalid");
  }

  const media = [];
  for (const path of mediaPaths(product.manifest)) {
    const publishedPath = publishedMediaPath(product.contentRevision, path);
    // Revision directories are script-owned, so a gap here means the sync never
    // ran (or ran for a different revision) rather than a corrupt checkout.
    const bytes = await readFile(join(websiteRoot, publishedPath)).catch(() =>
      fail(`missing published media ${publishedPath}; run pnpm sync:product`),
    );
    media.push({
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
      mimeType: mimeType(path),
      ...imageDimensions(bytes, path),
    });
  }

  const problems = validateManifest(product.manifest, media);
  if (problems.length > 0) fail(problems.join("; "));
  const revision = createHash("sha256")
    .update(contentRevisionInput(product.manifest, media))
    .digest("hex");
  if (revision !== product.contentRevision) {
    fail("product.json revision does not match its published media");
  }
  return { product, media };
}

async function verifyRenderedPages(product, media) {
  const problems = [];
  for (const [locale, config] of Object.entries(localePages)) {
    const html = await readFile(join(websiteRoot, config.page), "utf8");
    problems.push(...verifyPage(html, pageDirectives(product, media, locale)));
  }
  if (problems.length > 0) fail(`\n${problems.join("\n")}`);
}

async function check() {
  const committed = await committedPublication();
  await verifyRenderedPages(committed.product, committed.media);

  if (sourceParity) {
    const source = await sourcePublication();
    if (canonicalJson(committed.product) !== canonicalJson(source.product)) {
      fail(
        "committed publication does not match the source manifest and media",
      );
    }
  }

  process.stdout.write(
    `${committed.product.productId} ${committed.product.contentRevision}${
      sourceParity ? " (source parity verified)" : ""
    }\n`,
  );
}

async function pruneRevisions(keep) {
  const productAssets = join(websiteRoot, "assets", "product");
  let entries;
  try {
    entries = await readdir(productAssets, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === keep) continue;
    await rm(join(productAssets, entry.name), { recursive: true, force: true });
  }
}

async function pruneLegacyProductScreenshots() {
  const screenshotRoot = join(websiteRoot, "assets", "screenshots");
  for (const stem of [
    "services-dashboard",
    "observer-inbox",
    "ports-inspector",
    "logs-viewer",
  ]) {
    for (const extension of ["png", "webp"]) {
      await rm(join(screenshotRoot, `${stem}.${extension}`), { force: true });
    }
  }
}

// Render both locales in memory. Missing markers must leave the current
// complete publication untouched rather than updating only one language.
async function renderLocalePages(product, media) {
  const rendered = [];
  for (const [locale, config] of Object.entries(localePages)) {
    const page = join(websiteRoot, config.page);
    const directives = pageDirectives(product, media, locale);
    const html = renderPage(await readFile(page, "utf8"), directives);
    // Format with the pinned Prettier so a fresh sync passes `pnpm check`
    // as written; the page verifier tolerates its whitespace reflow.
    const formatted = await prettier.format(html, {
      ...(await prettier.resolveConfig(page)),
      filepath: page,
    });
    const problems = verifyPage(formatted, directives);
    if (problems.length > 0) fail(`\n${problems.join("\n")}`);
    rendered.push([page, formatted]);
  }
  return rendered;
}

// Prove the source manifest renders into both pages without writing anything.
// The release cutter runs this before its tag publishes the manifest to the
// Hub, so a renamed or added media key fails there instead of mid-release.
async function dryRunSync() {
  const { product, media } = await sourcePublication();
  await renderLocalePages(product, media);
  process.stdout.write(
    `${product.productId} ${product.contentRevision} (dry run: both pages render)\n`,
  );
}

async function sync() {
  const { product, media } = await sourcePublication();
  for (const item of media) {
    const target = join(
      websiteRoot,
      publishedMediaPath(product.contentRevision, item.path),
    );
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(sourceRoot, item.path), target);
  }

  const rendered = await renderLocalePages(product, media);
  for (const [page, html] of rendered) {
    await writeFile(page, html);
  }
  await writeFile(
    join(websiteRoot, "product.json"),
    `${JSON.stringify(product, null, 2)}\n`,
  );

  await check();
  await pruneRevisions(product.contentRevision);
  if (product.manifest.schemaVersion === 3) {
    await pruneLegacyProductScreenshots();
  }
}

(checkOnly ? check() : dryRun ? dryRunSync() : sync()).catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
