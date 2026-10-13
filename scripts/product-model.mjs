/**
 * The single owner of how an accepted Switchboard publication becomes an
 * English or Arabic landing page. The sync renderer and the standalone site
 * checker both consume these directives so their contract cannot drift.
 */

import { extname } from "node:path";

export const siteOrigin = "https://switchboard.azzuwayed.com";
export const expectedProductId = "switchboard";

export const legacyDisplayNames = {
  en: "Switchboard",
  ar: "سويتش بورد",
};

export const localePages = {
  en: {
    page: "index.html",
    prefix: "",
    canonical: `${siteOrigin}/`,
    ogLocale: "en_US",
    ogAlternate: "ar_SA",
  },
  ar: {
    page: "ar/index.html",
    prefix: "../",
    canonical: `${siteOrigin}/ar/`,
    ogLocale: "ar_SA",
    ogAlternate: "en_US",
  },
};

export const LOCALES = ["en", "ar"];

export function byCodeUnit(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => byCodeUnit(left, right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mimeType(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  throw new Error(`unsupported media type: ${path}`);
}

/**
 * Read intrinsic dimensions without adding an image dependency.
 *
 * Frozen counterpart of `imageMetadata` in the source repo's
 * `scripts/product-publication.mjs`, which is authoritative and additionally
 * validates chunk framing, extension-vs-magic-byte agreement, and opacity. The
 * two repos cannot share a module, so both parsers must agree on width and
 * height for every accepted asset — the published page metadata is only correct
 * if they do. Change one side and re-check the other against the shipped media;
 * `validateManifest` pins the expected dimensions as a cheap standing check.
 */
export function imageDimensions(bytes, path) {
  if (
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (bytes.length >= 30 && bytes.toString("ascii", 0, 4) === "RIFF") {
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8L" && bytes[20] === 0x2f) {
      return {
        width: 1 + (bytes[21] | ((bytes[22] & 0x3f) << 8)),
        height:
          1 +
          ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10)),
      };
    }
    if (
      chunk === "VP8 " &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: bytes.readUInt16BE(offset + 7),
          height: bytes.readUInt16BE(offset + 5),
        };
      }
      offset += 2 + length;
    }
  }

  throw new Error(`cannot read image dimensions: ${path}`);
}

function descriptorEntries(manifest) {
  return [
    ...(manifest.media?.hero
      ? [{ role: "hero", item: manifest.media.hero }]
      : []),
    ...(Array.isArray(manifest.media?.screenshots)
      ? manifest.media.screenshots.map((item) => ({
          role: "screenshot",
          item,
        }))
      : []),
    ...(manifest.schemaVersion === 3 && manifest.media?.socialCard
      ? [{ role: "socialCard", item: manifest.media.socialCard }]
      : []),
  ];
}

export function descriptorKey(entry) {
  if (entry.item?.key) return entry.item.key;
  if (entry.role === "hero") return "hero";
  throw new Error(`${entry.role} media descriptor is missing a key`);
}

function validSourcePath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("product/media/") ||
    value.includes("\\") ||
    value.includes("//")
  ) {
    return false;
  }
  const segments = value.split("/");
  return !segments.some(
    (segment, index) =>
      index > 1 && (!segment || segment === "." || segment === ".."),
  );
}

export function sourceMediaPath(manifest, item, locale = "en") {
  const value =
    manifest.schemaVersion === 1
      ? item?.path
      : (item?.paths?.[locale] ?? item?.paths?.default);
  if (!validSourcePath(value)) {
    throw new Error(`invalid product media path: ${String(value)}`);
  }
  return value;
}

/** Every distinct source byte sequence named by the manifest, in digest order. */
export function mediaPaths(manifest) {
  const paths = new Set();
  for (const { item } of descriptorEntries(manifest)) {
    if (manifest.schemaVersion === 1) {
      paths.add(sourceMediaPath(manifest, item));
      continue;
    }
    for (const locale of LOCALES) {
      paths.add(sourceMediaPath(manifest, item, locale));
    }
  }
  return [...paths].sort(byCodeUnit);
}

export function mediaAlt(item, locale, fallback = "") {
  if (typeof item?.alt === "string") return item.alt;
  if (typeof item?.alt?.[locale] === "string") return item.alt[locale];
  return fallback;
}

export function localizedLink(value, locale) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value[locale];
}

export function publishedMediaPath(contentRevision, sourcePath) {
  return `assets/product/${contentRevision}/${sourcePath.slice("product/media/".length)}`;
}

export function contentRevisionInput(manifest, media) {
  return [
    canonicalJson(manifest),
    ...media
      .slice()
      .sort((left, right) => byCodeUnit(left.path, right.path))
      .map(
        (item) => `${item.path}:${item.sha256}:${item.bytes}:${item.mimeType}`,
      ),
  ].join("\n");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Contract rules shared by source sync and committed-publication checks. */
export function validateManifest(manifest, media) {
  const problems = [];
  if (!manifest || typeof manifest !== "object") {
    return ["manifest must be an object"];
  }
  if (![1, 2, 3].includes(manifest.schemaVersion)) {
    problems.push("schemaVersion must equal 1, 2, or 3");
  }
  if (manifest.productId !== expectedProductId) {
    problems.push(`productId must equal ${expectedProductId}`);
  }
  if (!manifest.media?.hero || !Array.isArray(manifest.media?.screenshots)) {
    problems.push("manifest media must include hero and screenshots");
  }
  if (!manifest.locales?.en || !manifest.locales?.ar) {
    problems.push("manifest must include English and Arabic content");
    return problems;
  }

  for (const locale of LOCALES) {
    const content = manifest.locales[locale];
    for (const field of ["tag", "overview", "audience", "accountSummary"]) {
      if (!isNonEmptyString(content[field])) {
        problems.push(`${locale} ${field} is required`);
      }
    }
    if (!Array.isArray(content.highlights) || content.highlights.length !== 3) {
      problems.push(`${locale} must include exactly three highlights`);
    }
    if (manifest.schemaVersion === 3) {
      if (
        !isNonEmptyString(content.displayName) ||
        !isNonEmptyString(content.seo?.title) ||
        !isNonEmptyString(content.seo?.description)
      ) {
        problems.push(
          `schema 3 ${locale} displayName and SEO fields are required`,
        );
      }
    }
  }

  const enHighlightKeys = (manifest.locales.en.highlights ?? []).map(
    (item) => item.key,
  );
  const arHighlightKeys = (manifest.locales.ar.highlights ?? []).map(
    (item) => item.key,
  );
  if (
    new Set(enHighlightKeys).size !== enHighlightKeys.length ||
    canonicalJson(enHighlightKeys) !== canonicalJson(arHighlightKeys)
  ) {
    problems.push("localized highlight keys must be unique and identical");
  }

  if (manifest.schemaVersion === 3 && !manifest.media?.socialCard) {
    problems.push("schema 3 socialCard is required");
  }

  const entries = descriptorEntries(manifest);
  if (entries.length * LOCALES.length > 30) {
    problems.push("manifest exceeds 30 localized media descriptors");
  }
  const keys = [];
  for (const entry of entries) {
    let key;
    try {
      key = descriptorKey(entry);
      keys.push(key);
    } catch (error) {
      problems.push(error.message);
    }
    // Same shape the source repo's validator enforces, so a manifest cannot
    // pass `pnpm product:check` and then fail here at release time.
    if (manifest.schemaVersion !== 1 && !/^[a-z][a-z0-9-]*$/.test(key ?? "")) {
      problems.push(`${entry.role} media key is invalid`);
    }
    for (const locale of LOCALES) {
      try {
        sourceMediaPath(manifest, entry.item, locale);
      } catch (error) {
        problems.push(`${locale} ${error.message}`);
      }
      if (!isNonEmptyString(mediaAlt(entry.item, locale))) {
        problems.push(`${locale} ${key ?? entry.role} media alt is required`);
      }
    }
  }
  if (new Set(keys).size !== keys.length) {
    problems.push("media descriptor keys must be unique");
  }

  if (manifest.schemaVersion === 3 && manifest.media?.socialCard && media) {
    for (const locale of LOCALES) {
      try {
        const path = sourceMediaPath(
          manifest,
          manifest.media.socialCard,
          locale,
        );
        const card = media.find((item) => item.path === path);
        if (!card) {
          problems.push(`${locale} social card bytes are missing`);
        } else if (card.width !== 1200 || card.height !== 630) {
          problems.push(`${locale} social card must be 1200x630`);
        }
      } catch {
        // The path error is already reported above.
      }
    }
  }

  // Gallery captures are produced at one fixed size by the source repo's ingest
  // command. Pinning it here also keeps `imageDimensions` honest: if this
  // parser ever disagreed with the source parser, these would stop matching.
  if (manifest.schemaVersion === 3 && media) {
    for (const item of manifest.media?.screenshots ?? []) {
      for (const locale of LOCALES) {
        try {
          const path = sourceMediaPath(manifest, item, locale);
          const shot = media.find((candidate) => candidate.path === path);
          if (shot && (shot.width !== 3084 || shot.height !== 1968)) {
            problems.push(`${locale} ${path} must be 3084x1968`);
          }
        } catch {
          // The path error is already reported above.
        }
      }
    }
  }

  if (manifest.links?.appStore) {
    for (const locale of LOCALES) {
      const url = localizedLink(manifest.links.appStore, locale);
      if (!validHttpsUrl(url)) {
        problems.push(`${locale} App Store link must use HTTPS`);
      }
    }
  }

  return problems;
}

function mediaMetadata(media, sourcePath, locale) {
  const item = media.find((candidate) => candidate.path === sourcePath);
  if (!item)
    throw new Error(`${locale} media metadata is missing: ${sourcePath}`);
  return item;
}

export function buildPageModel(product, media, locale) {
  const { manifest, contentRevision } = product;
  const config = localePages[locale];
  const content = manifest.locales[locale];
  const displayName = content.displayName ?? legacyDisplayNames[locale];
  const alternateLocale = locale === "en" ? "ar" : "en";
  const alternateName =
    manifest.locales[alternateLocale].displayName ??
    legacyDisplayNames[alternateLocale];
  const title = content.seo?.title ?? `${displayName} — ${content.tag}`;
  const description =
    content.seo?.description ?? content.accountSummary ?? content.overview;

  const socialDescriptor = manifest.media.socialCard ?? manifest.media.hero;
  const socialSourcePath = sourceMediaPath(manifest, socialDescriptor, locale);
  const socialMetadata = mediaMetadata(media, socialSourcePath, locale);
  const socialRelativePath = publishedMediaPath(
    contentRevision,
    socialSourcePath,
  );

  const mediaByKey = new Map();
  for (const entry of descriptorEntries(manifest).filter(
    ({ role }) => role !== "socialCard",
  )) {
    const key = descriptorKey(entry);
    const sourcePath = sourceMediaPath(manifest, entry.item, locale);
    const metadata = mediaMetadata(media, sourcePath, locale);
    const relativePath = publishedMediaPath(contentRevision, sourcePath);
    mediaByKey.set(key, {
      src: `${config.prefix}${relativePath}`,
      absoluteSrc: `${siteOrigin}/${relativePath}`,
      alt: mediaAlt(
        entry.item,
        locale,
        entry.role === "hero" ? (content.heroAlt ?? displayName) : displayName,
      ),
      width: metadata.width,
      height: metadata.height,
      type: metadata.mimeType,
      role: entry.role,
    });
  }

  const screenshots = [...mediaByKey.values()]
    .filter((item) => item.role === "screenshot")
    .map((item) => item.absoluteSrc);

  return {
    config,
    content,
    displayName,
    title,
    description,
    social: {
      src: `${siteOrigin}/${socialRelativePath}`,
      alt: mediaAlt(socialDescriptor, locale, content.heroAlt ?? displayName),
      width: socialMetadata.width,
      height: socialMetadata.height,
      type: socialMetadata.mimeType,
    },
    mediaByKey,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: displayName,
      alternateName,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS 12 or later",
      url: config.canonical,
      description,
      image: `${siteOrigin}/${socialRelativePath}`,
      ...(screenshots.length > 0 ? { screenshot: screenshots } : {}),
      inLanguage: locale,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: config.canonical,
      },
    },
  };
}

export function pageDirectives(product, media, locale) {
  const model = buildPageModel(product, media, locale);
  const { config } = model;
  return {
    page: config.page,
    title: model.title,
    metaByName: [
      ["description", model.description],
      ["product-revision", product.contentRevision],
      ["twitter:card", "summary_large_image"],
      ["twitter:title", model.title],
      ["twitter:description", model.description],
      ["twitter:image", model.social.src],
      ["twitter:image:alt", model.social.alt],
    ],
    metaByProperty: [
      ["og:type", "website"],
      ["og:title", model.title],
      ["og:description", model.description],
      ["og:url", config.canonical],
      ["og:locale", config.ogLocale],
      ["og:locale:alternate", config.ogAlternate],
      ["og:image", model.social.src],
      ["og:image:alt", model.social.alt],
      ["og:image:width", String(model.social.width)],
      ["og:image:height", String(model.social.height)],
      ["og:image:type", model.social.type],
    ],
    links: [
      ["canonical", undefined, config.canonical],
      ["alternate", "en", localePages.en.canonical],
      ["alternate", "ar", localePages.ar.canonical],
      ["alternate", "x-default", localePages.en.canonical],
    ],
    fields: [
      ["displayName", model.displayName],
      ...["tag", "overview", "audience"].map((field) => [
        field,
        model.content[field],
      ]),
    ],
    highlights: model.content.highlights.map((item) => [item.key, item.text]),
    media: [...model.mediaByKey],
    jsonLd: model.jsonLd,
  };
}

function tagByAttributes(html, tagName, attributes) {
  const lookaheads = Object.entries(attributes)
    .map(
      ([attribute, value]) =>
        `(?=[^>]*\\b${escapeRegExp(attribute)}="${escapeRegExp(value)}")`,
    )
    .join("");
  return html.match(new RegExp(`<${tagName}\\b${lookaheads}[^>]*>`, "i"))?.[0];
}

function attributeValue(tag, attribute) {
  return tag?.match(new RegExp(`\\b${escapeRegExp(attribute)}="([^"]*)"`))?.[1];
}

function elementText(html, attribute, value) {
  const pattern = new RegExp(
    `<[^>]+\\b${escapeRegExp(attribute)}="${escapeRegExp(value)}"[^>]*>([\\s\\S]*?)<\\/[^>]+>`,
  );
  return html.match(pattern)?.[1]?.replace(/\s+/g, " ").trim();
}

export function verifyPage(html, directives) {
  const problems = [];
  const { page } = directives;
  const note = (message) => problems.push(`${page}: ${message}`);

  const expectAttribute = (tagName, marker, attribute, expected) => {
    const tag = tagByAttributes(html, tagName, marker);
    if (!tag) {
      note(`missing ${tagName} ${JSON.stringify(marker)}`);
      return;
    }
    if (attributeValue(tag, attribute) !== escapeHtml(expected)) {
      note(
        `${attribute} for ${JSON.stringify(marker)} does not match product.json`,
      );
    }
  };

  if (
    html.match(/<title>([\s\S]*?)<\/title>/)?.[1] !==
    escapeHtml(directives.title)
  ) {
    note("title does not match product.json");
  }
  for (const [name, value] of directives.metaByName) {
    expectAttribute("meta", { name }, "content", value);
  }
  for (const [property, value] of directives.metaByProperty) {
    expectAttribute("meta", { property }, "content", value);
  }
  for (const [rel, hreflang, href] of directives.links) {
    expectAttribute(
      "link",
      hreflang ? { rel, hreflang } : { rel },
      "href",
      href,
    );
  }
  for (const [field, value] of directives.fields) {
    if (
      elementText(html, "data-product-field", field) !==
      escapeHtml(value).replace(/\s+/g, " ").trim()
    ) {
      note(`data-product-field=${field} does not match product.json`);
    }
  }
  for (const [key, value] of directives.highlights) {
    if (
      elementText(html, "data-product-highlight", key) !==
      escapeHtml(value).replace(/\s+/g, " ").trim()
    ) {
      note(`data-product-highlight=${key} does not match product.json`);
    }
  }
  for (const [key, item] of directives.media) {
    expectAttribute("img", { "data-product-media": key }, "src", item.src);
    expectAttribute("img", { "data-product-media": key }, "alt", item.alt);
    expectAttribute(
      "img",
      { "data-product-media": key },
      "width",
      String(item.width),
    );
    expectAttribute(
      "img",
      { "data-product-media": key },
      "height",
      String(item.height),
    );
    const source = tagByAttributes(html, "source", {
      "data-product-source": key,
    });
    // Prettier wraps a long single-candidate srcset onto its own lines.
    if (
      source &&
      attributeValue(source, "srcset")?.trim() !== escapeHtml(item.src)
    ) {
      note(`picture source ${key} does not match product.json`);
    }
    const lightbox = tagByAttributes(html, "button", {
      "data-product-lightbox": key,
    });
    if (lightbox) {
      if (
        attributeValue(lightbox, "data-lightbox-src") !==
          escapeHtml(item.src) ||
        attributeValue(lightbox, "data-lightbox-alt") !== escapeHtml(item.alt)
      ) {
        note(`lightbox ${key} does not match product.json`);
      }
      const fallback = attributeValue(lightbox, "data-lightbox-fallback");
      if (fallback !== undefined && fallback !== escapeHtml(item.src)) {
        note(`lightbox fallback ${key} does not match product.json`);
      }
    }
  }

  const jsonLdText = html.match(
    /<script\b[^>]*data-product-json-ld[^>]*>([\s\S]*?)<\/script>/,
  )?.[1];
  try {
    if (
      canonicalJson(JSON.parse(jsonLdText)) !== canonicalJson(directives.jsonLd)
    ) {
      note("JSON-LD does not match product.json");
    }
  } catch (error) {
    note(`product JSON-LD is invalid: ${error.message}`);
  }
  return problems;
}

// Every substitution below uses a replacer function: a replacement *string*
// would expand `$&`, `$1`, or `$$` sequences that appear in product copy.
function replaceTagAttribute(tag, attribute, value) {
  const escaped = escapeHtml(value);
  const pattern = new RegExp(`\\s${escapeRegExp(attribute)}="[^"]*"`);
  if (pattern.test(tag)) {
    return tag.replace(pattern, () => ` ${attribute}="${escaped}"`);
  }
  return tag.replace(
    /\s*\/?>(?=\s*$)/,
    (end) => ` ${attribute}="${escaped}"${end}`,
  );
}

export function renderPage(html, directives) {
  const { page } = directives;
  const fail = (message) => {
    throw new Error(`${page} ${message}`);
  };

  const replaceTagged = (tagName, attributes, attribute, value, label) => {
    const lookaheads = Object.entries(attributes)
      .map(
        ([name, expected]) =>
          `(?=[^>]*\\b${escapeRegExp(name)}="${escapeRegExp(expected)}")`,
      )
      .join("");
    const pattern = new RegExp(`<${tagName}\\b${lookaheads}[^>]*>`, "i");
    const match = html.match(pattern)?.[0];
    if (!match) fail(`${label} marker is missing`);
    html = html.replace(match, () =>
      replaceTagAttribute(match, attribute, value),
    );
  };

  const replaceElement = (attribute, value, label) => {
    const pattern = new RegExp(
      `(<[^>]+${escapeRegExp(attribute)}[^>]*>)[\\s\\S]*?(<\\/[^>]+>)`,
    );
    if (!pattern.test(html)) fail(`${label} marker is missing`);
    html = html.replace(
      pattern,
      (_, open, close) => `${open}${escapeHtml(value)}${close}`,
    );
  };

  if (!/<title>[\s\S]*?<\/title>/.test(html)) fail("title is missing");
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    () => `<title>${escapeHtml(directives.title)}</title>`,
  );
  for (const [name, value] of directives.metaByName) {
    replaceTagged("meta", { name }, "content", value, name);
  }
  for (const [property, value] of directives.metaByProperty) {
    replaceTagged("meta", { property }, "content", value, property);
  }
  for (const [rel, hreflang, href] of directives.links) {
    replaceTagged(
      "link",
      hreflang ? { rel, hreflang } : { rel },
      "href",
      href,
      hreflang ? `${rel} ${hreflang}` : rel,
    );
  }

  const jsonLdPattern =
    /(<script\b[^>]*data-product-json-ld[^>]*>)[\s\S]*?(<\/script>)/;
  if (!jsonLdPattern.test(html)) fail("JSON-LD marker is missing");
  html = html.replace(
    jsonLdPattern,
    (_, open, close) =>
      `${open}\n${JSON.stringify(directives.jsonLd, null, 2).replaceAll("<", "\\u003c")}\n${close}`,
  );

  for (const [field, value] of directives.fields) {
    replaceElement(`data-product-field="${field}"`, value, field);
  }
  for (const [key, value] of directives.highlights) {
    replaceElement(
      `data-product-highlight="${key}"`,
      value,
      `highlight ${key}`,
    );
  }
  for (const [key, item] of directives.media) {
    for (const [attribute, value] of [
      ["src", item.src],
      ["alt", item.alt],
      ["width", String(item.width)],
      ["height", String(item.height)],
    ]) {
      replaceTagged(
        "img",
        { "data-product-media": key },
        attribute,
        value,
        `media ${key}`,
      );
    }
    const source = tagByAttributes(html, "source", {
      "data-product-source": key,
    });
    if (source) {
      html = html.replace(source, () =>
        replaceTagAttribute(source, "srcset", item.src),
      );
    }
    const lightbox = tagByAttributes(html, "button", {
      "data-product-lightbox": key,
    });
    if (lightbox) {
      let updated = replaceTagAttribute(
        lightbox,
        "data-lightbox-src",
        item.src,
      );
      updated = replaceTagAttribute(updated, "data-lightbox-alt", item.alt);
      if (/\bdata-lightbox-fallback="/.test(updated)) {
        updated = replaceTagAttribute(
          updated,
          "data-lightbox-fallback",
          item.src,
        );
      }
      html = html.replace(lightbox, () => updated);
    }
  }
  return html;
}
