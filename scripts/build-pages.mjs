/* =====================================================================
   perks – BYGG MEDLEMSKAPSSIDER  (scripts/build-pages.mjs)
   ---------------------------------------------------------------------
   Genererer ÉN statisk, søkeoptimalisert side per organisasjon i katalogen
   (src/content.js). Tilbudene skrives som EKTE HTML (ikke JS-hentet), så de
   leses av alle søkemotorer – ikke bare de som kjører JavaScript.

   Kjøres automatisk ETTER bygget via "postbuild" i package.json, og skriver
   ferdige filer rett i dist/ (de committes ikke – de regenereres hver bygging
   fra content.js, så det er ÉN kilde og null vedlikehold av duplikater).

   Redaksjonell tekst per side: src/seo-pages.js (valgfritt – ellers standard).
   Stil: public/pages.css. Header/footer/nyhetsbrev: de delte /*.js-filene.
   ===================================================================== */
import { CATEGORIES, CAT_LABEL, CATALOG, POPULAR, AUTO_VALUE } from "../src/content.js";
import { iconOf, CAT_ICON } from "../src/icons.js";
import { PAGE_SEO } from "../src/seo-pages.js";
import { FAQ } from "../src/faq.js";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const SITE = "https://perks.no";
const TODAY = new Date().toISOString().slice(0, 10);
const MIN_OFFERS = 5; // færre enn dette = for tynn side, hopp over (unngå «thin content»)

/* ---------- hjelpere (samme sortering/verdi som forsiden) ---------- */
const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const scoreOf = (note) => {
  if (!note) return -1;
  const n = (note.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => parseFloat(x.replace(",", ".")));
  return n.length ? Math.max(...n) : 0;
};
const popRank = (m) => (m && POPULAR.some((k) => m.toLowerCase().includes(k)) ? 0 : 1);
const valueFor = (orgId, merchant) => {
  for (const r of (AUTO_VALUE[orgId] || [])) if (r.re.test((merchant || "").toLowerCase())) return r.value;
  return null;
};
const tint = (hex, a) => {
  const h = (hex || "#d76e98").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
};
const slugify = (s) => s.toLowerCase()
  .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const svgOf = (el, size) => renderToStaticMarkup(createElement(el, { width: size, height: size, strokeWidth: size > 19 ? 1.9 : 2 }));

/* ---------- ett tilbudskort som statisk HTML ---------- */
function cardHtml(org, b) {
  const url = b.url || org.url || "#";
  const value = valueFor(org.id, b.merchant);
  const valueHtml = value != null
    ? `<span class="card-value">≈ ${value.toLocaleString("no-NO")} kr/år inkludert</span>` : "";
  return `<a class="card" href="${esc(url)}" target="_blank" rel="nofollow noopener">`
    + `<span class="card-ic" aria-hidden="true" style="background:${tint(org.color, 0.15)};color:rgba(13,12,34,0.62)">${svgOf(iconOf(b), 20)}</span>`
    + `<div class="card-body">`
      + `<div class="card-top"><span class="card-merch">${esc(b.merchant)}</span><span class="card-cat">${esc(CAT_LABEL[b.cats[0]] || "Andre tilbud")}</span></div>`
      + `<div class="card-note">${esc(b.note || "")}</div>`
      + valueHtml
    + `</div></a>`;
}

/* ---------- bygg én side ---------- */
function buildPage(org) {
  const seo = PAGE_SEO[org.id] || {};
  const slug = seo.slug || `${slugify(org.short || org.name)}-medlemsfordeler`;
  const url = `${SITE}/${slug}.html`;
  const count = org.benefits.length;

  // grupper per kategori i CATEGORIES-rekkefølge; sorter innad som forsiden
  const groups = CATEGORIES.map((c) => ({
    cat: c,
    rows: org.benefits.filter((b) => (b.cats || []).includes(c.id))
      .sort((a, z) => popRank(a.merchant) - popRank(z.merchant) || scoreOf(z.note) - scoreOf(a.note)),
  })).filter((g) => g.rows.length);

  const topCats = groups.slice(0, 3).map((g) => g.cat.label.toLowerCase()).join(", ");
  const title = seo.title || `${org.short}-medlemsfordeler – rabatter og fordeler`;
  const h1 = `${esc(org.name)}: medlemsfordeler og rabatter`;
  const description = seo.description
    || `Oversikt over ${org.name}-fordelene: ${topCats} og mer. Se medlemsrabattene og fordelene du får, samlet på ett sted – og hva de er verdt.`;
  const intro = seo.intro
    || `Her er oversikten over medlemsfordelene og rabattene du får gjennom ${org.name}${org.sub ? ` (${org.sub})` : ""}. Totalt ${count} fordeler, blant annet på ${topCats}. Vi anslår også hva som har en reell kroneverdi.`;
  const related = seo.related
    ? `<a class="related" href="${esc(seo.related.href)}">${esc(seo.related.label)} →</a>`
    : "";

  const sections = groups.map((g) => {
    const ic = CAT_ICON[g.cat.id] ? `<span class="cat-ic" aria-hidden="true">${svgOf(CAT_ICON[g.cat.id], 18)}</span>` : "";
    return `<h2>${ic}${esc(g.cat.label)}</h2><div class="grid">${g.rows.map((b) => cardHtml(org, b)).join("")}</div>`;
  }).join("\n");

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: title, inLanguage: "nb-NO",
        isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#organization` }, description },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "perks", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: `${org.short} medlemsfordeler` },
      ] },
    ],
  };

  return { slug, url, html: `<!doctype html>
<html lang="nb">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="theme-color" content="#f4f4f6" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="perks" />
    <meta property="og:locale" content="nb_NO" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${SITE}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE}/og-image.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" />
    <link rel="stylesheet" href="/pages.css" />
    <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
  </head>
  <body>
    <div id="site-header"></div>
    <main class="wrap">
      <p class="kicker"><a href="/">perks</a> <span>·</span> Medlemsfordeler</p>
      <h1>${h1}</h1>
      <p class="lead">${esc(intro)}</p>
      <p class="meta">${count} fordeler · sist undersøkt juni 2026</p>
      ${related}
      ${sections}
      <div data-perks-newsletter></div>
      <p class="foot"><a href="/">Se alle medlemskapene dine og regn ut verdien på forsiden →</a></p>
      <p class="fine">Rabattene er tilbud du kan bruke som medlem – ikke penger du får automatisk; kun goder med fast årsverdi (f.eks. innboforsikring) er tallfestet, og det er anslag. Rabatter og vilkår kan endres – sjekk alltid hos ${esc(org.short)} og tilbyderen. Lenker kan være annonselenker. perks er en uavhengig oversikt og er ikke tilknyttet ${esc(org.short)}.</p>
    </main>
    <div id="site-footer"></div>
    <script src="/header.js" defer></script>
    <script src="/footer.js" defer></script>
    <script src="/newsletter.js" defer></script>
  </body>
</html>
` };
}

/* ---------- kjør ---------- */
const orgs = CATALOG.filter((o) => !o.parent && o.benefits && o.benefits.length >= MIN_OFFERS);
const built = [];
for (const org of orgs) {
  const { slug, url, html } = buildPage(org);
  writeFileSync(`dist/${slug}.html`, html);
  built.push({ org, slug, url });
}
const skipped = CATALOG.filter((o) => !o.parent && (!o.benefits || o.benefits.length < MIN_OFFERS)).map((o) => o.short);

/* Sitemap (komplett: forside + medlemskapssider + faste sider). */
const staticUrls = [
  { loc: `${SITE}/`, pr: "1.0", cf: "weekly" },
  ...built.map((b) => ({ loc: b.url, pr: "0.8", cf: "monthly" })),
  { loc: `${SITE}/er-lofavor-verdt-det.html`, pr: "0.7", cf: "monthly" },
  { loc: `${SITE}/personvern.html`, pr: "0.3", cf: "yearly" },
];
writeFileSync("dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + staticUrls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${u.cf}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`).join("\n")
  + `\n</urlset>\n`);

/* Interne lenker på forsiden (crawlbart) – fyll inn placeholder i dist/index.html. */
const indexPath = "dist/index.html";
if (existsSync(indexPath)) {
  const links = built.map((b) => `<a href="/${b.slug}.html" style="color:#d76e98;font-weight:600;text-decoration:none">${esc(b.org.short)}</a>`).join(", ");
  // FAQPage-strukturdata fra samme kilde som den synlige FAQ-en (src/faq.js).
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const faqScript = `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`;
  let html = readFileSync(indexPath, "utf8");
  html = html.replace("<!--PERKS_MEMBERSHIP_LINKS-->", links)
             .replace("<!--PERKS_FAQ_JSONLD-->", faqScript);
  writeFileSync(indexPath, html);
}

console.log(`✓ ${built.length} medlemskapssider skrevet til dist/ (${built.map((b) => b.slug).join(", ")})`);
if (skipped.length) console.log(`  hoppet over (< ${MIN_OFFERS} tilbud): ${skipped.join(", ")}`);
