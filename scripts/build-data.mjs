/* =====================================================================
   perks – BYGG LOFAVØR-DATA  (scripts/build-data.mjs)
   ---------------------------------------------------------------------
   Leser katalogen i src/content.js, plukker ut LOfavør (id: "lo"),
   sorterer den NØYAKTIG som forsiden (kjente merker først, så høyest
   rabatt) og skriver resultatet til public/data/lofavor.json.

   Artikkelsiden (er-lofavor-verdt-det.html) leser den fila. Dermed er
   det ÉN kilde til dataene – content.js – og oversikten i artikkelen
   holder seg automatisk i takt med forsiden.

   Slik kjøres den:
   - Automatisk før hver bygging via "prebuild" i package.json:
         "prebuild": "node scripts/build-data.mjs"
     (npm kjører "prebuild" av seg selv rett før "build".)
   - Eller manuelt:  node scripts/build-data.mjs

   MERK: content.js må kunne importeres i Node (ren data, ingen import av
   nettleser-/React-ting). Det er den i dag. Importerer den senere noe
   slikt, flytt dataene som trengs til en egen datafil.
   ===================================================================== */
import { CATALOG, CAT_LABEL, POPULAR, AUTO_VALUE } from "../src/content.js";
import { writeFileSync, mkdirSync } from "node:fs";

const lo = CATALOG.find((o) => o.id === "lo");
if (!lo) { console.error("Fant ikke LOfavør (id: 'lo') i CATALOG."); process.exit(1); }

/* Samme hjelpere som src/Perks.jsx bruker, så rekkefølgen blir lik forsiden. */
const scoreOf = (note) => {
  if (!note) return -1;
  const n = (note.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => parseFloat(x.replace(",", ".")));
  return n.length ? Math.max(...n) : 0;
};
const popRank = (m) => {
  if (!m) return 1;
  const s = m.toLowerCase();
  return POPULAR.some((k) => s.includes(k)) ? 0 : 1;
};
const rules = (AUTO_VALUE && AUTO_VALUE.lo) || [];
/* BUGFIX: match årsverdien mot BUTIKKNAVNET (slik Perks.jsx gjør), ikke mot
   rabatt-teksten – ellers får innboforsikringen aldri kroneverdien sin. */
const valueFor = (merchant) => {
  for (const r of rules) if (r.re.test((merchant || "").toLowerCase())) return r.value;
  return null;
};

const items = lo.benefits
  .map((b) => {
    const cats = b.cats && b.cats.length ? b.cats : ["andre"];
    const v = valueFor(b.merchant);
    const row = {
      merchant: b.merchant,
      note: b.note,
      cats,
      catLabel: CAT_LABEL[cats[0]] || "Andre tilbud",
      url: b.url || lo.url,
      _pop: popRank(b.merchant),
      _score: scoreOf(b.note),
    };
    if (v != null) row.value = v;
    return row;
  })
  .sort((a, z) => a._pop - z._pop || z._score - a._score)
  .map(({ _pop, _score, ...rest }) => rest);

/* Etiketter for kategorifiltrene (kun de kategoriene som faktisk finnes). */
const catLabels = {};
items.forEach((it) => it.cats.forEach((c) => { catLabels[c] = CAT_LABEL[c] || c; }));

mkdirSync("public/data", { recursive: true });
writeFileSync("public/data/lofavor.json", JSON.stringify({ catLabels, items }));
console.log("✓ public/data/lofavor.json skrevet med", items.length, "LOfavør-fordeler.");
