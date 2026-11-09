#!/usr/bin/env node
/**
 * build-i18n.mjs — generate static, per-language HTML from the single templates.
 *
 * For each language (en / zh-Hant / ja) and each page (index, download, terms,
 * privacy, refund, tokushoho) it bakes the dictionary text into the HTML and
 * writes a standalone file whose <html lang>, <title>, meta description,
 * Open Graph tags, canonical and hreflang links are correct *without JS*.
 *
 * Run: node scripts/build-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATES = path.join(ROOT, "templates");

const SITE = "https://merit.zqscreen.cn";
const LANGS = ["en", "zh-Hant", "ja"];
const PAGES = ["index", "download", "terms", "privacy", "refund", "tokushoho"];
const OG_LOCALE = { en: "en_US", "zh-Hant": "zh_TW", ja: "ja_JP" };
const LAST_MOD = "2026-11-10";

// ---- load dictionary (dict.js assigns window.CCM_I18N) --------------------
const dictSrc = fs.readFileSync(path.join(ROOT, "dict.js"), "utf8");
const sandbox = {};
new Function("window", dictSrc)(sandbox);
const DICT = sandbox.CCM_I18N;
if (!DICT || !DICT.en) throw new Error("Failed to load CCM_I18N from dict.js");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const pick = (lang, key) =>
  (DICT[lang] && DICT[lang][key] !== undefined ? DICT[lang][key] : DICT.en[key]) ?? "";

const fileFor = (page) => (page === "index" ? "index.html" : `${page}.html`);
const urlFor = (lang, page) =>
  page === "index" ? `${SITE}/${lang}/` : `${SITE}/${lang}/${page}.html`;

function pageTitle(lang, page) {
  if (page === "index") return pick(lang, "meta.title");
  if (page === "download") return `${pick(lang, "download.meta.title")} — ${pick(lang, "brand.name")}`;
  return `${pick(lang, `legal.${page}.h1`)} — ${pick(lang, "brand.name")}`;
}

function pageDescription(lang, page) {
  if (page === "index") return pick(lang, "meta.description");
  if (page === "download") return pick(lang, "download.meta.description");
  return pick(lang, `legal.${page}.meta`);
}

function jsonLd(lang) {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Corporate Cattle Merit",
    alternateName: ["賽博社畜功德", "サイバー社畜功徳"],
    description: pick(lang, "meta.description"),
    url: urlFor(lang, "index"),
    image: `${SITE}/og-image.png`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11, macOS",
    inLanguage: LANGS,
    offers: [
      { "@type": "Offer", name: "Desktop client (free)", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${urlFor(lang, "index")}#pricing`, seller: { "@type": "Organization", name: "Corporate Cattle Merit" } },
      { "@type": "Offer", name: "Appearance pack (first pack)", price: "0.80", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${urlFor(lang, "index")}#pricing`, seller: { "@type": "Organization", name: "Corporate Cattle Merit" } },
      { "@type": "Offer", name: "Full Unlock (one-time)", price: "6.88", priceCurrency: "USD", availability: "https://schema.org/InStock", url: `${urlFor(lang, "index")}#pricing`, seller: { "@type": "Organization", name: "Corporate Cattle Merit" } },
    ],
  };
  return `  <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

function pageScripts(page) {
  if (page === "index") {
    return [
      '  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js" defer></script>',
      '  <script src="../motion.js" defer></script>',
    ].join("\n");
  }
  if (page === "download") {
    return [
      '  <script src="../dict.js"></script>',
      '  <script src="../download.js"></script>',
    ].join("\n");
  }
  return '  <script src="../dict.js"></script>';
}

function buildHead(lang, page) {
  const title = pageTitle(lang, page);
  const desc = pageDescription(lang, page);
  const canonical = urlFor(lang, page);
  const theme = "#F7F3EA";

  const hreflang = LANGS.map(
    (l) => `  <link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}">`
  )
    .concat(`  <link rel="alternate" hreflang="x-default" href="${urlFor("en", page)}">`)
    .join("\n");

  const ogAlt = LANGS.filter((l) => l !== lang)
    .map((l) => `  <meta property="og:locale:alternate" content="${OG_LOCALE[l]}">`)
    .join("\n");

  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="${theme}">
  <link rel="icon" href="../favicon.svg">
${hreflang}
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Corporate Cattle Merit">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${OG_LOCALE[lang]}">
${ogAlt}
  <!-- Twitter card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${SITE}/og-image.png">
  <link rel="stylesheet" href="../style.css">
${pageScripts(page)}
${page === "index" ? jsonLd(lang) : ""}
</head>`;
}

function langSwitcher(lang, page) {
  const mk = (l, label) =>
    `        <a href="../${l}/${fileFor(page)}"${l === lang ? ' aria-current="true"' : ""}>${label}</a>`;
  return `<div class="lang" role="group" aria-label="${esc(pick(lang, "aria.language"))}">
${mk("en", "EN")}
${mk("zh-Hant", "繁")}
${mk("ja", "日本語")}
      </div>`;
}

function localizeBody(body, lang, page) {
  let out = body;

  // 1. Static text for every data-i18n element (leaf text nodes only).
  out = out.replace(/data-i18n="([^"]+)"([^>]*)>([^<]*)</g, (m, key, attrs) => {
    return `data-i18n="${key}"${attrs}>${esc(pick(lang, key))}<`;
  });

  // 2. Static aria-label for data-i18n-aria elements.
  out = out.replace(
    /aria-label="[^"]*"([^>]*data-i18n-aria="([^"]+)")/g,
    (m, rest, key) => `aria-label="${esc(pick(lang, key))}"${rest}`
  );

  // 3. Static alt text for localized images.
  out = out.replace(
    /alt="[^"]*"([^>]*data-i18n-alt="([^"]+)")/g,
    (m, rest, key) => `alt="${esc(pick(lang, key))}"${rest}`
  );

  // 4. placeholder text (data-i18n-ph), if any.
  out = out.replace(
    /placeholder="[^"]*"([^>]*data-i18n-ph="([^"]+)")/g,
    (m, rest, key) => `placeholder="${esc(pick(lang, key))}"${rest}`
  );

  // 4. Language switcher -> real links to sibling language paths.
  out = out.replace(/<div class="lang"[^>]*>[\s\S]*?<\/div>/, langSwitcher(lang, page));

  // 5. Drop all local <script> tags from the body; the head supplies the right ones.
  out = out.replace(/\s*<script src="[^"]*"><\/script>/g, "");

  return out;
}

function buildPage(lang, page) {
  const template = fs.readFileSync(path.join(TEMPLATES, fileFor(page)), "utf8");
  const bodyIdx = template.indexOf("<body");
  if (bodyIdx === -1) throw new Error(`No <body> in template ${page}`);
  const body = localizeBody(template.slice(bodyIdx), lang, page);
  return `<!doctype html>
<html lang="${lang}">
${buildHead(lang, page)}
${body}`;
}

// ---- write the 18 pages ---------------------------------------------------
let count = 0;
for (const lang of LANGS) {
  const dir = path.join(ROOT, lang);
  fs.mkdirSync(dir, { recursive: true });
  for (const page of PAGES) {
    fs.writeFileSync(path.join(dir, fileFor(page)), buildPage(lang, page), "utf8");
    count++;
  }
}
console.log(`Wrote ${count} localized pages across ${LANGS.length} languages.`);

// ---- root redirect stubs for the old flat pages ---------------------------
for (const page of PAGES.filter((p) => p !== "index")) {
  const target = `/en/${page}.html`;
  const stub = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Redirecting… — Corporate Cattle Merit</title>
  <link rel="canonical" href="${SITE}/en/${page}.html">
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0; url=${target}">
</head>
<body>
  <p>This page has moved to the English version. Continue to <a href="${target}">${page}.html</a>.</p>
  <script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;
  fs.writeFileSync(path.join(ROOT, `${page}.html`), stub, "utf8");
}

// ---- sitemap.xml with hreflang (xhtml:link) ------------------------------
const smEntries = [];
function sitemapUrl(loc, page, extraLastmod) {
  const alts = LANGS.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, page)}"/>`
  )
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor("en", page)}"/>`)
    .join("\n");
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${extraLastmod || LAST_MOD}</lastmod>
${alts}
  </url>`;
}
for (const page of PAGES) {
  for (const lang of LANGS) {
    smEntries.push(sitemapUrl(urlFor(lang, page), page));
  }
}
// Note: the root "/" language landing page is intentionally NOT listed here —
// its canonical points at /en/ (x-default), so listing it would contradict that.

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${smEntries.join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
console.log(`Wrote sitemap.xml with ${smEntries.length} <url> entries (${PAGES.length} pages x ${LANGS.length} languages).`);
