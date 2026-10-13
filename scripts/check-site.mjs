import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  contentRevisionInput,
  escapeRegExp,
  expectedProductId,
  imageDimensions,
  localePages,
  mediaPaths,
  mimeType,
  pageDirectives,
  publishedMediaPath,
  siteOrigin,
  validateManifest,
  verifyPage,
} from "./product-model.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const referencedLocalFiles = new Set();

function walkHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules")
        return [];
      return walkHtml(fullPath);
    }
    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

function relative(file) {
  return path.relative(root, file);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function collect(label, run) {
  try {
    return run();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    return undefined;
  }
}

function tagWithAttribute(html, tagName, marker, value) {
  return html.match(
    new RegExp(
      `<${tagName}\\b(?=[^>]*\\b${escapeRegExp(marker)}="${escapeRegExp(value)}")[^>]*>`,
      "i",
    ),
  )?.[0];
}

function tagAttribute(tag, attribute) {
  return tag?.match(new RegExp(`\\b${attribute}="([^"]*)"`, "i"))?.[1];
}

function checkLocalTarget(file, value) {
  if (/^(?:mailto:|#|data:)/.test(value)) return;
  let localValue = value;
  if (/^https?:/.test(value)) {
    if (!value.startsWith(`${siteOrigin}/`)) return;
    localValue = new URL(value).pathname.slice(1);
  }
  localValue = localValue.split("#")[0].split("?")[0];
  if (!localValue) localValue = "index.html";

  const target = path.resolve(
    /^https?:/.test(value) ? root : path.dirname(file),
    localValue,
  );
  const resolved = localValue.endsWith("/")
    ? path.join(target, "index.html")
    : target;
  if (!fs.existsSync(resolved)) {
    failures.push(`${relative(file)}: missing local target ${value}`);
  } else if (fs.statSync(resolved).isFile()) {
    referencedLocalFiles.add(resolved);
  }
}

function publicationMedia(product) {
  const paths = collect("product.json", () => mediaPaths(product.manifest));
  const media = [];
  for (const sourcePath of paths ?? []) {
    const relativePath = publishedMediaPath(
      product.contentRevision,
      sourcePath,
    );
    const file = path.join(root, relativePath);
    if (!fs.existsSync(file)) {
      failures.push(`missing revisioned product media ${relativePath}`);
      continue;
    }
    referencedLocalFiles.add(file);
    const bytes = fs.readFileSync(file);
    if (bytes.length === 0) {
      failures.push(`empty revisioned product media ${relativePath}`);
      continue;
    }
    const shape = collect(`product.json: ${sourcePath}`, () => ({
      mimeType: mimeType(sourcePath),
      ...imageDimensions(bytes, sourcePath),
    }));
    if (!shape) continue;
    media.push({
      path: sourcePath,
      relativePath,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      ...shape,
    });
  }
  return media;
}

function validUpdater(manifest) {
  const version = manifest?.version;
  const dmg = manifest?.macos?.universal?.dmg;
  return (
    manifest?.schemaVersion === 1 &&
    /^\d+\.\d+\.\d+$/.test(version ?? "") &&
    manifest.latest === version &&
    /^\d+(?:\.\d+){1,2}$/.test(manifest.minimumSystemVersion ?? "") &&
    Object.keys(dmg ?? {})
      .sort()
      .join(",") === "sha256,sizeBytes,url" &&
    /^[0-9a-f]{64}$/.test(dmg?.sha256 ?? "") &&
    Number.isSafeInteger(dmg?.sizeBytes) &&
    dmg.sizeBytes > 0 &&
    dmg.url ===
      `https://github.com/azzuwayed/switchboard-website/releases/download/v${version}/Switchboard-v${version}-macos-universal.dmg`
  );
}

async function resolvedDownload(script, updater) {
  const fallback =
    "https://github.com/azzuwayed/switchboard-website/releases/latest";
  const link = {
    dataset: { updatesUrl: "updates.json" },
    href: fallback,
  };
  const chip = { textContent: "" };
  const document = {
    querySelectorAll: (selector) =>
      selector === "[data-switchboard-download]" ? [link] : [chip],
  };
  new vm.Script(script, { filename: "download.js" }).runInNewContext({
    document,
    fetch: async () => ({ ok: true, json: async () => updater }),
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { href: link.href, chip: chip.textContent };
}

let product;
try {
  product = JSON.parse(read(path.join(root, "product.json")));
  if (
    product.schemaVersion !== 1 ||
    product.productId !== expectedProductId ||
    product.manifest?.productId !== product.productId ||
    !/^[a-f0-9]{64}$/.test(product.contentRevision)
  ) {
    failures.push("product.json: invalid publication envelope");
  }
} catch (error) {
  failures.push(`product.json: invalid JSON: ${error.message}`);
}

const media = product?.manifest ? publicationMedia(product) : [];
if (product?.manifest) {
  for (const problem of collect("product.json", () =>
    validateManifest(product.manifest, media),
  ) ?? []) {
    failures.push(`product.json: ${problem}`);
  }
  if (media.length === mediaPaths(product.manifest).length) {
    const revision = createHash("sha256")
      .update(contentRevisionInput(product.manifest, media))
      .digest("hex");
    if (revision !== product.contentRevision) {
      failures.push(
        "product.json: revision does not match the manifest and published media",
      );
    }
  }

  const download = product.manifest.links?.download;
  const validFallbacks = new Set([
    `${siteOrigin}`,
    `${siteOrigin}/`,
    "https://github.com/azzuwayed/switchboard-website/releases/latest",
  ]);
  if (
    download?.manifestUrl !== `${siteOrigin}/updates.json` ||
    !validFallbacks.has(download?.fallbackUrl) ||
    !download?.allowedUrlPrefixes?.includes(
      "https://github.com/azzuwayed/switchboard-website/releases/download/",
    )
  ) {
    failures.push(
      "product.json: download discovery, fallback, or URL allowlist is invalid",
    );
  }
}

const htmlFiles = walkHtml(root);
for (const file of htmlFiles) {
  const html = read(file);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    checkLocalTarget(file, match[1]);
  }
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of match[1].split(",")) {
      checkLocalTarget(file, candidate.trim().split(/\s+/)[0]);
    }
  }

  const ids = new Set();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    if (ids.has(match[1]))
      failures.push(`${relative(file)}: duplicate id ${match[1]}`);
    ids.add(match[1]);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt="[^"]*"/i.test(match[0])) {
      failures.push(`${relative(file)}: image is missing alt text`);
    }
  }
  for (const match of html.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>/gi)) {
    const relValue = match[0].match(/\brel="([^"]*)"/i)?.[1] ?? "";
    if (!relValue.split(/\s+/).includes("noopener")) {
      failures.push(
        `${relative(file)}: target=_blank link is missing rel=noopener`,
      );
    }
  }
  for (const match of html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      failures.push(`${relative(file)}: invalid JSON-LD: ${error.message}`);
    }
  }
}

if (product?.manifest && media.length > 0) {
  for (const [locale, config] of Object.entries(localePages)) {
    const problems = collect(config.page, () =>
      verifyPage(
        read(path.join(root, config.page)),
        pageDirectives(product, media, locale),
      ),
    );
    failures.push(...(problems ?? []));
  }
}

const publicMetadata = {
  "contact.html": {
    canonical: `${siteOrigin}/contact.html`,
    locale: "en_US",
    alternate: "ar_SA",
  },
  "ar/contact.html": {
    canonical: `${siteOrigin}/ar/contact.html`,
    locale: "ar_SA",
    alternate: "en_US",
  },
  "privacy.html": {
    canonical: `${siteOrigin}/privacy.html`,
    locale: "en_US",
    alternate: "ar_SA",
  },
  "ar/privacy.html": {
    canonical: `${siteOrigin}/ar/privacy.html`,
    locale: "ar_SA",
    alternate: "en_US",
  },
};
for (const [file, expected] of Object.entries(publicMetadata)) {
  const html = read(path.join(root, file));
  const values = [
    ["link", "rel", "canonical", "href", expected.canonical],
    ["meta", "property", "og:url", "content", expected.canonical],
    ["meta", "property", "og:locale", "content", expected.locale],
    ["meta", "property", "og:locale:alternate", "content", expected.alternate],
  ];
  for (const [tagName, marker, markerValue, attribute, value] of values) {
    const tag = tagWithAttribute(html, tagName, marker, markerValue);
    if (tagAttribute(tag, attribute) !== value) {
      failures.push(`${file}: ${markerValue} does not match ${value}`);
    }
  }
}

const handoffs = {
  "checkout.html": "https://azzuwayed.com/en/products/switchboard",
  "success.html": "https://azzuwayed.com/en/account/billing",
  "recover.html": "https://azzuwayed.com/en/account/billing",
  "reset.html": "https://azzuwayed.com/en/account/support/new",
  "ar/checkout.html": "https://azzuwayed.com/ar/products/switchboard",
  "ar/success.html": "https://azzuwayed.com/ar/account/billing",
  "ar/recover.html": "https://azzuwayed.com/ar/account/billing",
  "ar/reset.html": "https://azzuwayed.com/ar/account/support/new",
};
for (const [file, expected] of Object.entries(handoffs)) {
  const html = read(path.join(root, file));
  const refresh = html.match(/content="0; url=([^"]+)"/i)?.[1];
  const canonicalTag = html.match(/<link[^>]+rel="canonical"[^>]*>/i)?.[0];
  const canonical = canonicalTag?.match(/href="([^"]+)"/i)?.[1];
  if (
    refresh !== expected ||
    canonical !== expected ||
    !html.includes('<meta name="robots" content="noindex" />')
  ) {
    failures.push(
      `${file}: localized noindex handoff does not match ${expected}`,
    );
  }
}
for (const file of ["pricing.html", "ar/pricing.html"]) {
  if (
    !read(path.join(root, file)).includes(
      '<meta name="robots" content="noindex" />',
    )
  ) {
    failures.push(`${file}: pricing handoff must remain noindex`);
  }
}

for (const [file, locale] of [
  ["contact.html", "en"],
  ["ar/contact.html", "ar"],
]) {
  const html = read(path.join(root, file));
  const scripts = [
    ...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi),
  ].map((match) => match[1]);
  try {
    for (const source of scripts) new vm.Script(source, { filename: file });
  } catch (error) {
    failures.push(`${file}: inline script does not parse: ${error.message}`);
  }
  if (!html.includes(`locale: "${locale}"`)) {
    failures.push(`${file}: contact payload does not send locale ${locale}`);
  }
  for (const expected of [
    'name="name"',
    'maxlength="200"',
    'name="email"',
    'maxlength="320"',
    'typeof data.reference === "string"',
    "doneSection.focus()",
  ]) {
    if (!html.includes(expected))
      failures.push(`${file}: contact contract is missing ${expected}`);
  }
}

const promoBanner = read(path.join(root, "promo-banner.js"));
try {
  new vm.Script(promoBanner, { filename: "promo-banner.js" });
} catch (error) {
  failures.push(`promo-banner.js: does not parse: ${error.message}`);
}
for (const [file, script] of [
  ["index.html", "promo-banner.js"],
  ["ar/index.html", "../promo-banner.js"],
]) {
  if (!read(path.join(root, file)).includes(`src="${script}"`)) {
    failures.push(`${file}: featured-promo banner script is missing`);
  }
}
// The banner is the only Hub-driven surface on this static site; nothing else
// exercises these endpoints, so pin the integration it depends on.
for (const expected of [
  "https://azzuwayed.com/api/v1/apps/switchboard/featured-promo",
  "https://azzuwayed.com/en/products/switchboard",
  "https://azzuwayed.com/ar/products/switchboard",
  "encodeURIComponent(promo.code)",
  "sb-promo-dismissed",
]) {
  if (!promoBanner.includes(expected)) {
    failures.push(
      `promo-banner.js: featured-promo integration is missing ${expected}`,
    );
  }
}

let updater;
try {
  updater = JSON.parse(read(path.join(root, "updates.json")));
  if (!validUpdater(updater))
    failures.push("updates.json: invalid trusted DMG pointer");
} catch (error) {
  failures.push(`updates.json: invalid JSON: ${error.message}`);
}

const downloadScriptPath = path.join(root, "download.js");
if (!fs.existsSync(downloadScriptPath)) {
  failures.push("missing download.js");
} else if (updater) {
  const script = read(downloadScriptPath);
  try {
    new vm.Script(script, { filename: "download.js" });
    const accepted = await resolvedDownload(script, updater);
    if (
      accepted.href !== updater.macos.universal.dmg.url ||
      accepted.chip !== `v${updater.version}`
    ) {
      failures.push("download.js: did not resolve the trusted updater DMG");
    }
    const rejected = await resolvedDownload(script, {
      ...updater,
      macos: {
        ...updater.macos,
        universal: {
          dmg: {
            ...updater.macos.universal.dmg,
            url: "https://example.test/Switchboard.dmg",
          },
        },
      },
    });
    if (
      rejected.href !==
      "https://github.com/azzuwayed/switchboard-website/releases/latest"
    ) {
      failures.push(
        "download.js: did not retain fallback for an untrusted URL",
      );
    }
  } catch (error) {
    failures.push(`download.js: ${error.message}`);
  }
}

for (const [file, prefix] of [
  ["index.html", ""],
  ["ar/index.html", "../"],
]) {
  const html = read(path.join(root, file));
  const links = [...html.matchAll(/<a\b[^>]*data-switchboard-download[^>]*>/g)];
  if (links.length < 2)
    failures.push(`${file}: expected primary and pricing download CTAs`);
  for (const match of links) {
    if (
      !match[0].includes(
        'href="https://github.com/azzuwayed/switchboard-website/releases/latest"',
      ) ||
      !match[0].includes(`data-updates-url="${prefix}updates.json"`)
    ) {
      failures.push(
        `${file}: download CTA lacks trusted discovery and fallback`,
      );
    }
  }
  if (!html.includes(`src="${prefix}download.js"`)) {
    failures.push(`${file}: download.js is missing`);
  }
}

for (const [file, expected] of [
  ["CNAME", "switchboard.azzuwayed.com"],
  ["robots.txt", `${siteOrigin}/sitemap.xml`],
  ["sitemap.xml", `${siteOrigin}/ar/`],
  ["sitemap.xml", `${siteOrigin}/contact.html`],
  ["sitemap.xml", `${siteOrigin}/privacy.html`],
]) {
  if (!read(path.join(root, file)).includes(expected)) {
    failures.push(`${file}: missing ${expected}`);
  }
}

const activeCopy = [
  ...htmlFiles.map((file) => [relative(file), read(file)]),
  ["README.md", read(path.join(root, "README.md"))],
];
const retiredPatterns = [
  ["retired license Worker", /switchboard-licenses\.azzuwayed\.workers\.dev/],
  ["retired recovery/reset API", /\/api\/checkout\/(?:recover|reset-devices)/],
  [
    "GitHub Issues support",
    /github\.com\/azzuwayed\/switchboard-website\/issues/,
  ],
  ["stale no-account claim", /no account in the app|بدون حساب داخل التطبيق/i],
  [
    "unsupported exact agent attribution",
    /which agent session|which agent or which editor started it|أي جلسة أداة ذكاء اصطناعي/,
  ],
  ["unsupported spawned-by claim", /AI-spawned|بدأتها أداة الذكاء الاصطناعي/],
  [
    "unsupported single-request claim",
    /One thing, and it is anonymous|The\s+one\s+thing\s+Switchboard\s+sends|شيء\s+واحد\s+فقط|الشيء\s+الوحيد\s+الذي\s+يرسله/,
  ],
  [
    "unsupported network absolute",
    /Runs\s+entirely\s+on\s+your\s+Mac|لا يتصل بالشبكة إطلاقًا|يعمل\s+بالكامل\s+على\s+جهاز/,
  ],
  [
    "internal implementation detail",
    /serviceId|tokio::process|commands\.yaml|approvals\.json|بصمة الجهاز|device hash/,
  ],
];
for (const [file, content] of activeCopy) {
  for (const [label, pattern] of retiredPatterns) {
    if (pattern.test(content)) failures.push(`${file}: contains ${label}`);
  }
}

// Every Hub account handoff must stay inside the reader's locale. The pages
// carry dozens of these links and the language toggle assumes strict parity, so
// a single copy-paste across the /ar/ boundary is easy to miss by eye.
for (const [file, content] of activeCopy) {
  if (!file.endsWith(".html")) continue;
  const wrongLocale = file.startsWith(`ar${path.sep}`)
    ? "https://azzuwayed.com/en/"
    : "https://azzuwayed.com/ar/";
  if (content.includes(wrongLocale)) {
    failures.push(`${file}: contains wrong-locale account link ${wrongLocale}`);
  }
}

for (const asset of walkFiles(path.join(root, "assets"))) {
  if (
    /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(asset) &&
    !referencedLocalFiles.has(asset)
  ) {
    failures.push(`${relative(asset)}: unreferenced public asset`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  "site check passed: committed publication, EN/AR SEO and media, trusted downloads, public metadata, handoffs, and updater host",
);
