import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const referencedLocalFiles = new Set();

function walkHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        return [];
      }
      return walkHtml(fullPath);
    }
    return entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function walkFiles(directory) {
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

function checkLocalTarget(file, value) {
  if (/^(?:https?:|mailto:|#|data:)/.test(value)) return;

  const localValue = value.split("#")[0].split("?")[0];
  if (!localValue) return;

  const target = path.resolve(path.dirname(file), localValue);
  const resolved = localValue.endsWith("/")
    ? path.join(target, "index.html")
    : target;
  if (!fs.existsSync(resolved)) {
    failures.push(`${relative(file)}: missing local target ${value}`);
  } else if (fs.statSync(resolved).isFile()) {
    referencedLocalFiles.add(resolved);
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
    if (ids.has(match[1])) {
      failures.push(`${relative(file)}: duplicate id ${match[1]}`);
    }
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

  const isArabic = relative(file).startsWith(`ar${path.sep}`);
  const wrongLocale = isArabic
    ? "https://azzuwayed.com/en/"
    : "https://azzuwayed.com/ar/";
  if (html.includes(wrongLocale)) {
    failures.push(`${relative(file)}: contains wrong-locale account link`);
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
  if (refresh !== expected || canonical !== expected) {
    failures.push(`${file}: account handoff does not match ${expected}`);
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
    for (const source of scripts) {
      new vm.Script(source, { filename: file });
    }
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
    if (!html.includes(expected)) {
      failures.push(`${file}: contact contract is missing ${expected}`);
    }
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
    "internal implementation detail",
    /serviceId|tokio::process|commands\.yaml|approvals\.json|بصمة الجهاز|device hash/,
  ],
];

for (const [file, content] of activeCopy) {
  for (const [label, pattern] of retiredPatterns) {
    if (pattern.test(content)) failures.push(`${file}: contains ${label}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `site check passed: ${htmlFiles.length} HTML files, links/assets, localized account handoffs, contact contracts, and retired references`,
);
