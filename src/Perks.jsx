/* =====================================================================
   perks – APP-LOGIKK + KOMPONENT
   ---------------------------------------------------------------------
   Du trenger normalt IKKE endre denne fila.
   - Innhold (katalog, aktuelt, meny)  -> src/content.js
   - Farger og fonter                  -> src/theme.js
   - Ikon-regler                       -> src/icons.js
   ===================================================================== */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Tag } from "lucide-react";
import { CATEGORIES, CAT_LABEL, CATALOG, ORG_RANK, POPULAR, AUTO_VALUE, GUIDES, ARTICLES, MENU, SITE } from "./content.js";
import { CAT_ICON, iconOf, iconByName } from "./icons.js";
import { ink, paper, accent, surface, pop, fonts, googleFontsUrl } from "./theme.js";
import { storage } from "./storage.js";

/* ---------- nøkler + avledet ---------- */
const SEL_KEY = "perks:selected:v2";
const SUB_KEY = "perks:subscribed:v1";
const ALL_IDS = CATALOG.map((m) => m.id);
/* Visnings­rekkefølge for organisasjoner (grunnet juni 2026).
   Ekte medlemsorganisasjoner/paraplyer øverst (LO, OBOS, NAF, Unio), deretter de store
   forbruker­programmene Coop (~2,7 mill) og Trumf (~3 mill), så resten etter størrelse.
   Midtre/nedre sjikt er omtrentlig og enkelt å justere – endre bare denne lista.
   Styrer både velgeren og «Viser:»-rekkefølgen. Ukjente id-er havner bakerst. */

/* ---------- hjelpefunksjoner (sortering, verdi, søk) ---------- */
const rankOf = (id) => { const i = ORG_RANK.indexOf(id); return i < 0 ? 999 : i; };

const byRank = (a, b) => rankOf(a.id) - rankOf(b.id);

const scoreOf = (note) => {
  if (!note) return -1;
  const nums = (note.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => parseFloat(n.replace(",", ".")));
  return nums.length ? Math.max(...nums) : 0;
};

/* Kjente forbruker­merker som løftes først i lista (kuratert, grov to-tier).
   Delstrenger, små bokstaver – matchet mot merchant-navn. Bare merker som faktisk
   finnes i katalogen er med; utvid lista når nye stormerker legges til. */

const popRank = (merchant) => {
  if (!merchant) return 1;
  const m = merchant.toLowerCase();
  return POPULAR.some((k) => m.includes(k)) ? 0 : 1;
};
/* Sorteringsnøkkel: kjente merker først, deretter høyest rabatt */

const byComposite = (a, z) => a.pop - z.pop || z.score - a.score;

/* Aktør-nøkkel: kjente kjeder kollapses til sitt POPULAR-nøkkelord (så «Esso» og
   «Esso Mastercard» teller som samme aktør); ukjente bruker fullt, normalisert navn. */

const brandKey = (merchant) => {
  const m = (merchant || "").toLowerCase().trim();
  return POPULAR.find((k) => m.includes(k)) || m;
};

/* Sprer viste tilbud over flest mulig av valgte medlemskap (round-robin i popularitets-
   rekkefølge), OG unngår at samme aktør gjentas blant de første: runde 1 plukker kun
   tilbud fra en aktør vi ikke alt har vist (faller tilbake på neste aktør i forbundet).
   Eventuelle duplikat-aktører legges bakerst (synes først ved «Vis alle»). Resultat: de
   fire første er fra ulike forbund OG ulike, helst kjente, aktører. Bevarer rows.length. */

function diversify(rows) {
  const buckets = new Map();
  for (const r of rows) {
    if (!buckets.has(r.m.id)) buckets.set(r.m.id, []);
    buckets.get(r.m.id).push(r);
  }
  for (const arr of buckets.values()) arr.sort(byComposite);
  const order = [...buckets.keys()].sort((a, z) => rankOf(a) - rankOf(z));
  const seen = new Set();
  const out = [];
  // Runde 1: round-robin, men hopp over aktører som alt er vist
  let added = true;
  while (added) {
    added = false;
    for (const id of order) {
      const arr = buckets.get(id);
      const idx = arr.findIndex((r) => !seen.has(brandKey(r.b.merchant)));
      if (idx !== -1) {
        const [r] = arr.splice(idx, 1);
        seen.add(brandKey(r.b.merchant));
        out.push(r);
        added = true;
      }
    }
  }
  // Runde 2: gjenværende duplikat-aktører bakerst, fortsatt round-robin
  added = true;
  while (added) {
    added = false;
    for (const id of order) {
      const arr = buckets.get(id);
      if (arr.length) { out.push(arr.shift()); added = true; }
    }
  }
  return out;
}

/* søkbar tekst = butikk + notat + kategorinavn + synonymer */
// Søk treffer butikk + beskrivelse + valgfrie søkeord (kw) per tilbud.
// Slik blir «fly» → Ving/SAS uten å dra inn hoteller. Utvid kw ved behov.

const haystackOf = (b) => (b.merchant + " " + b.note + " " + (b.kw ? b.kw.join(" ") : "")).toLowerCase();

/* hex → rgba med alpha, for rolige fargetoner */

const tint = (hex, a) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

/* ─── Verdilag ───────────────────────────────────────────────────────────
   Vi tallfester BEVISST kun goder med en reell, automatisk årsverdi som ikke
   avhenger av forbruk – f.eks. innboforsikring som følger med medlemskapet.
   Rabatter som krever at du faktisk handler, tallfestes IKKE; de telles som
   «tilbud du kan bruke». Alle kronetall er grove anslag og bør etterprøves.
   Utvid AUTO_VALUE etter hvert som du verifiserer flere tall. */

const krFmt = (n) => n.toLocaleString("no-NO") + " kr";

const estimateValue = (memberships) => {
  let auto = 0;
  const autoItems = [];
  let offerCount = 0;
  for (const m of memberships) {
    offerCount += m.benefits.length;
    const rules = AUTO_VALUE[m.id];
    if (!rules) continue;
    for (const b of m.benefits) {
      for (const r of rules) {
        if (r.re.test((b.merchant || "").toLowerCase())) {
          auto += r.value;
          autoItems.push({ label: r.label, value: r.value, color: m.color, short: m.short });
          break;
        }
      }
    }
  }
  return { auto, autoItems, offerCount };
};

/* Verdi-badge: kun reelle prosenttall fra noten (ingen kr/coverage-tall, for å unngå villedende badge). */

export default function Perks() {
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState([]);
  const [picking, setPicking] = useState(false);
  const [pickQuery, setPickQuery] = useState("");
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("alle");
  const [expandedCats, setExpandedCats] = useState([]); // kategorier utvidet i «Alle»-visningen
  const fontInjected = useRef(false);
  const guidesRef = useRef(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (fontInjected.current) return;
    fontInjected.current = true;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = googleFontsUrl;
    document.head.appendChild(l);
    const s = document.createElement("style");
    s.textContent = `
      .btn-pink{ transition: background .13s ease, color .13s ease, border-color .13s ease; }
      .btn-pink:hover{ background: ${accent}; color: #fff; border-color: ${accent}; }
      .btn-solid{ transition: filter .13s ease; }
      .btn-solid:hover{ filter: brightness(1.08); }
      .perk-card{ transition: transform .13s ease, box-shadow .13s ease, border-color .13s ease; }
      .perk-card:hover{ transform: translateY(-1px); box-shadow: 0 6px 22px rgba(13,12,34,.10); border-color: rgba(215,110,152,.42); }
      .perk-featured{ transition: transform .13s ease, box-shadow .13s ease; }
      .perk-featured:hover{ transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,12,34,.13); }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get(SEL_KEY);
        const ids = res && res.value ? JSON.parse(res.value) : null;
        // Standard = ingenting valgt (= vis alle). Gammelt lagret «alt valgt» tolkes også som vis alle.
        let use = ids && ids.length && ids.length < ALL_IDS.length ? ids : [];
        setSelected(use); setDraft(use);
      } catch { setSelected([]); setDraft([]); }
    })();
  }, []);

  const saveSelection = async (ids) => {
    const norm = ids.length >= ALL_IDS.length ? [] : ids; // alle valgt = vis alt = tomt utvalg
    setSelected(norm); setDraft(norm); setPicking(false); setActiveCat("alle"); setQuery("");
    try { await storage.set(SEL_KEY, JSON.stringify(norm)); } catch {}
  };

  const selMemberships = useMemo(() => {
    if (!selected) return [];
    if (selected.length === 0) return [...CATALOG].sort(byRank); // tomt utvalg = vis alle medlemskap
    const ids = new Set(selected);
    for (const id of selected) {
      const m = CATALOG.find((x) => x.id === id);
      if (m && m.parent) ids.add(m.parent);
    }
    return CATALOG.filter((m) => ids.has(m.id)).sort(byRank);
  }, [selected]);

  const flat = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [];
    for (const m of selMemberships)
      for (const b of m.benefits) {
        if (activeCat !== "alle" && !b.cats.includes(activeCat)) continue;
        if (q && !haystackOf(b).includes(q)) continue;
        rows.push({ m, b, score: scoreOf(b.note), pop: popRank(b.merchant) });
      }
    rows.sort(byComposite);
    return rows;
  }, [selMemberships, query, activeCat]);

  const presentCats = useMemo(() => {
    const set = new Set();
    selMemberships.forEach((m) => m.benefits.forEach((b) => b.cats.forEach((c) => set.add(c))));
    return CATEGORIES.filter((c) => set.has(c.id));
  }, [selMemberships]);

  const grouped = useMemo(() => {
    return presentCats.map((c) => {
      const rows = [];
      selMemberships.forEach((m) => m.benefits.forEach((b) => { if (b.cats.includes(c.id)) rows.push({ m, b, score: scoreOf(b.note), pop: popRank(b.merchant) }); }));
      return { cat: c, rows: diversify(rows) };
    }).filter((g) => g.rows.length);
  }, [selMemberships, presentCats]);

  const valueEst = useMemo(() => estimateValue(selMemberships), [selMemberships]);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(SUB_KEY); if (r && r.value) setSubscribed(true); } catch {}
    })();
  }, []);

  const subscribe = async () => {
    const e = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return;
    setSubscribed(true);
    try { await storage.set(SUB_KEY, e); } catch {}
    // Send til EmailOctopus hvis skjema-URL er satt i content.js (SITE.emailoctopusFormAction).
    // mode:"no-cors" -> vi kan ikke lese svaret, men påmeldingen registreres. Skru på
    // dobbel opt-in i EmailOctopus, så får brukeren en bekreftelses-e-post.
      if (SITE.emailoctopusFormAction) {
       try {
         const r = await fetch(SITE.emailoctopusFormAction, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ email: e }),
         });
         if (!r.ok) console.error("Påmelding feilet:", await r.text());
       } catch (err) { console.error(err); }
     }
  };

  /* styling – farger/fonter kommer fra theme.js */
  const serif = fonts.serif, sans = fonts.sans;
  const wrap = { maxWidth: 720, margin: "0 auto", padding: "0 16px" };

  // Lar den felles headeren (public/header.js) styre forsidens navigasjon
  useEffect(() => {
    const onNav = (e) => {
      const target = e.detail && e.detail.target;
      setPicking(false);
      setTimeout(() => {
        if (target === "guider") {
          const el = document.getElementById("guider");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 80);
    };
    window.addEventListener("perks:nav", onNav);
    if (window.location.hash === "#guider") {
      setTimeout(() => {
        const el = document.getElementById("guider");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
    return () => window.removeEventListener("perks:nav", onNav);
  }, []);

  if (selected === null)
    return <div style={{ minHeight: "100vh", background: paper, fontFamily: sans, display: "flex", alignItems: "center", justifyContent: "center", color: ink }}>Laster…</div>;

  /* ---------- Velg medlemskap (avkrysning) ---------- */
  if (picking) {
    const toggle = (id) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
    const pq = pickQuery.trim().toLowerCase();
    const shownList = CATALOG.filter((m) => {
      if (!pq) return true;
      const hay = [m.name, m.short, m.sub, ...(m.aliases || [])].join(" ").toLowerCase();
      return hay.includes(pq);
    }).sort(byRank);
    return (
      <div style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: sans, padding: "0 0 110px" }}>
        <div style={{ ...wrap, paddingTop: 36 }}>
          <button onClick={() => setPicking(false)} style={{ border: "none", background: "none", color: ink, opacity: 0.6, fontSize: 15, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Tilbake</button>
          <h1 style={{ fontFamily: serif, fontSize: 32, lineHeight: 1.07, margin: "0 0 6px", fontWeight: 600 }}>Velg medlemskap og fordelsprogram</h1>
          <p style={{ margin: "0 0 14px", fontSize: 15.5, opacity: 0.7 }}>Huk av alle du har. Du ser bare fordeler fra dem du velger.</p>
          <input value={pickQuery} onChange={(e) => setPickQuery(e.target.value)}
            placeholder="Søk opp forbundet eller foreningen din…"
            style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, border: "1.5px solid rgba(0,0,0,0.18)", padding: "13px 15px", fontSize: 15.5, fontFamily: sans, background: surface, color: ink, marginBottom: 14, outline: "none" }} />
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <button onClick={() => setDraft(ALL_IDS)} style={linkBtn(accent)}>Velg alle</button>
            <button onClick={() => setDraft([])} style={{ ...linkBtn(ink), opacity: 0.7 }}>Nullstill</button>
          </div>
          {shownList.length === 0 ? (
            <p style={{ fontSize: 14.5, opacity: 0.6, padding: "8px 2px" }}>Fant ingen treff på «{pickQuery.trim()}». Prøv et annet navn, eller bla i hele lista ved å tømme søket.</p>
          ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {shownList.map((m) => {
              const on = draft.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggle(m.id)}
                  style={{ textAlign: "left", cursor: "pointer", borderRadius: 12, padding: "14px 13px", minHeight: 78, background: on ? surface : "rgba(255,255,255,0.5)", border: on ? `2px solid ${m.color}` : "2px solid rgba(0,0,0,0.10)", boxShadow: on ? "0 4px 14px rgba(0,0,0,0.07)" : "none", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 12, background: m.color, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, lineHeight: 1.12, wordBreak: "break-word" }}>{m.short}</span>
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: 8, lineHeight: 1.3 }}>
                    {m.sub ? m.sub + " · " : ""}{m.benefits.length} fordeler{m.cost ? ` · ${m.cost} kr/år` : ""}
                    {m.parent ? <span style={{ display: "block", marginTop: 2, fontStyle: "italic", opacity: 0.85 }}>+ {(CATALOG.find((x) => x.id === m.parent) || {}).short}-fordeler følger med</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, " + paper + " 32%)", padding: "26px 16px 18px" }}>
          <div style={wrap}>
            <button onClick={() => saveSelection(draft)} className="btn-pink"
              style={{ width: "100%", background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "16px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: sans }}>
              {draft.length ? `Vis fordelene mine (${draft.length})` : "Vis alle medlemskap"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Forside ---------- */
  const showAll = selected.length === 0;
  const showGrouped = activeCat === "alle" && !query.trim();

  const Row = ({ m, b, badge }) => {
    const link = b.url || m.url;
    const Icon = iconOf(b);
    return (
    <div className="perk-card" onClick={() => link && window.open(link, "_blank", "noopener,noreferrer")}
      style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "14px 15px", marginBottom: 10, borderRadius: 14, background: surface, border: "1px solid rgba(0,0,0,0.085)", cursor: link ? "pointer" : "default" }}>
      <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: tint(m.color, 0.15), display: "flex", alignItems: "center", justifyContent: "center" }}>
        {Icon && React.createElement(Icon, { size: 20, strokeWidth: 1.9, color: tint(ink, 0.62) })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: 17, fontFamily: serif, fontWeight: 600, lineHeight: 1.18, color: ink, minWidth: 0 }}>{b.merchant}</div>
          <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: ink, opacity: 0.62, whiteSpace: "nowrap", marginTop: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: 7, background: m.color, flexShrink: 0 }} />
            {m.tag || m.short}
          </span>
        </div>
        {b.note && <div style={{ fontSize: 13.5, opacity: 0.74, marginTop: 4, lineHeight: 1.4 }}>{b.note}</div>}
        {badge && b.cats.length > 1 && (
          <div style={{ fontSize: 11.5, opacity: 0.45, marginTop: 6 }}>{b.cats.map((c) => CAT_LABEL[c]).join(" · ")}</div>
        )}
      </div>
    </div>
    );
  };

  const chip = (active) => ({
    cursor: "pointer", whiteSpace: "nowrap", borderRadius: 30, padding: "8px 15px", fontSize: 13.5, fontWeight: 600,
    fontFamily: sans, border: `1.5px solid ${active ? ink : "rgba(0,0,0,0.18)"}`,
    background: active ? ink : "transparent", color: active ? "#fff" : ink,
  });

  /* Nyhetsbrev-kort – egen blokk i tabellen (mellom «Reise & fly» og «Bank & forsikring»).
     Følger verdikortets lyse design: hvit bakgrunn med rosa venstrekant. Alltid synlig,
     uavhengig av valgte medlemskap. */
  const renderNewsletter = () => (
    <section style={{ borderRadius: 16, padding: "20px", margin: "20px 0", background: surface, border: "1px solid rgba(0,0,0,0.09)", borderLeft: `4px solid ${accent}`, position: "relative", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", right: -24, top: -16, transform: "rotate(-12deg)", opacity: 0.06, color: accent, pointerEvents: "none" }}>
        {React.createElement(Tag, { size: 150, strokeWidth: 1.4 })}
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: accent, marginBottom: 8 }}>Nyhetsbrev</div>
        {subscribed ? (
          <div style={{ fontSize: 13.5, opacity: 0.85 }}> ✓ Du er på lista – vi sier fra når det lønner seg.
            <button onClick={() => { setSubscribed(false); setEmail(""); }}
              style={{ display: "block", marginTop: 8, padding: 0, border: "none", background: "none", color: accent, fontSize: 13, fontFamily: sans, cursor: "pointer", textDecoration: "underline" }}>
              Meld på en annen e-post
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13.5, opacity: 0.8, marginBottom: 12, lineHeight: 1.4, maxWidth: 460 }}>
              Få tips når det lønner seg å bruke fordelene – vi lover å ikke sende for mye.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 200px" }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") subscribe(); }}
                  type="email" placeholder="din@epost.no"
                  style={{ width: "100%", boxSizing: "border-box", padding: "11px 38px 11px 13px", borderRadius: 9, border: "1px solid rgba(0,0,0,0.15)", fontSize: 14.5, fontFamily: sans, background: "#fff", color: ink, outline: "none" }} />
                {email && (
                  <button type="button" onClick={() => setEmail("")} aria-label="Tøm feltet"
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.08)", color: ink, fontSize: 15, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                    ×
                  </button>
                )}
              </div>
              <button onClick={subscribe} className="btn-pink"
                style={{ padding: "11px 18px", borderRadius: 9, border: "none", background: accent, color: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: sans, cursor: "pointer", whiteSpace: "nowrap" }}>
                Meld meg på
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );

  /* Nyhetsbrev-kortet plasseres mellom de to øverste kategoriene i den grupperte
     tabellen – uavhengig av hvilke kategorier som er synlige. Med bare én kategori
     havner det rett etter den (håndteres av trailing-renderingen under). */
  const newsletterIdx = Math.min(1, grouped.length);
  /* I flat visning (valgt kategori eller søk) vises kortet etter dette antallet
     tilbud – eller til slutt hvis det er færre treff, så det alltid er synlig. */
  const NEWSLETTER_AFTER_FLAT = 6;

  return (
    <div style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: sans, padding: "0 0 34px" }}>
      {/* Header (logo + meny) ligger nå i public/header.js – felles for hele nettstedet */}

      <div style={{ ...wrap, paddingTop: 18 }}>

        {/* Toppen: lys hero ved «vis alle», svart verdikort så snart noe er valgt
           (uansett meny). Drives synkront av utvalget = rask oppdatering. */}
        {!showAll ? (
          <div style={{ borderRadius: 16, padding: "20px", marginBottom: 18, background: ink, color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.55, marginBottom: 8 }}>Din fordelsverdi</div>
            {valueEst.auto > 0 ? (
              <>
                <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 34, lineHeight: 1, letterSpacing: -0.5, color: pop }}>
                  ~{krFmt(valueEst.auto)}<span style={{ fontSize: 16, opacity: 0.7, fontWeight: 600 }}> / år</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.78, marginTop: 7, lineHeight: 1.4 }}>
                  får du automatisk{valueEst.autoItems.length ? ` – ${valueEst.autoItems.map((i) => i.label.toLowerCase()).join(", ")}` : ""}. Pluss <strong style={{ color: pop }}>{valueEst.offerCount}</strong> rabattavtaler du kan bruke.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 34, lineHeight: 1, letterSpacing: -0.5, color: pop }}>
                  {valueEst.offerCount} <span style={{ fontSize: 16, opacity: 0.7, fontWeight: 600 }}>tilbud</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.78, marginTop: 7, lineHeight: 1.4 }}>
                  tilgjengelig gjennom medlemskapene dine. Bla nedover for å se hvor du sparer.
                </div>
              </>
            )}
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8, lineHeight: 1.4 }}>
              Anslag – faktisk verdi avhenger av din situasjon og hvor mye du bruker fordelene.
            </div>
            {/* Kontroller på kortet – fylt rosa knapp, «Vis alle» i lys tekst pga. mørk bakgrunn */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
              <button onClick={() => { setDraft(selected); setPicking(true); }} className="btn-pink"
                style={{ borderRadius: 8, padding: "9px 15px", fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: "pointer", border: "none", background: accent, color: "#fff" }}>
                Endre medlemskap
              </button>
              <button onClick={() => saveSelection([])}
                style={{ border: "none", background: "none", color: "#fff", opacity: 0.7, fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                Vis alle
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderRadius: 16, padding: "22px 20px", marginBottom: 18, background: surface, border: "1px solid rgba(0,0,0,0.09)", borderLeft: `4px solid ${accent}`, position: "relative", overflow: "hidden" }}>
            <div aria-hidden="true" style={{ position: "absolute", right: -24, top: -16, transform: "rotate(-12deg)", opacity: 0.06, color: accent, pointerEvents: "none" }}>
              {React.createElement(Tag, { size: 150, strokeWidth: 1.4 })}
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: accent, marginBottom: 8 }}>Få oversikt</div>
              <h1 style={{ fontSize: 22, fontFamily: serif, fontWeight: 600, lineHeight: 1.12, margin: 0, letterSpacing: -0.2, maxWidth: 430 }}>Se fordelene du allerede har</h1>
              <p style={{ fontSize: 13, opacity: 0.7, margin: "9px 0 14px", maxWidth: 400, lineHeight: 1.45 }}>Velg medlemskapene dine, så anslår vi verdien og viser {"hvor du faktisk får rabatt."}</p>
              <button onClick={() => { setDraft(selected); setPicking(true); }} className="btn-pink"
                style={{ border: `1.5px solid ${accent}`, background: "transparent", color: accent, borderRadius: 8, padding: "10px 18px", fontSize: 14.5, fontWeight: 700, fontFamily: sans, cursor: "pointer" }}>
                Regn ut verdien min →
              </button>
              <p style={{ fontSize: 11, opacity: 0.5, margin: "12px 0 0", maxWidth: 400, lineHeight: 1.4 }}>Rabatter og vilkår kan endres – vi tar forbehold om feil og utdaterte tilbud.</p>
            </div>
          </div>
        )}

        {/* Aktuelt – tidsriktige artikler som visuelt blikkfang (erstatter «Populære»).
            Skjules automatisk når ARTICLES er tom (se src/content.js). */}
        {ARTICLES.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.5 }}>Aktuelt nå</div>
          </div>
          <div style={{ display: "flex", gap: 11, overflowX: "auto", padding: "2px 2px 6px", margin: "0 -2px", WebkitOverflowScrolling: "touch" }}>
            {ARTICLES.map((a, i) => {
              const live = a.url && a.url !== "#";
              return (
                <div key={i} onClick={() => live && window.open(a.url, "_blank", "noopener,noreferrer")} className="perk-featured"
                  style={{ flex: "0 0 auto", width: 232, textAlign: "left", border: "1px solid rgba(0,0,0,0.10)", borderRadius: 14, background: surface, cursor: live ? "pointer" : "default", padding: 0, overflow: "hidden" }}>
                  <div style={{ height: 72, background: tint(a.color, 0.16), display: "flex", alignItems: "flex-end", padding: "10px 12px", position: "relative", overflow: "hidden" }}>
                    <div aria-hidden="true" style={{ position: "absolute", right: -8, top: -10, opacity: 0.2, color: a.color }}>
                      {React.createElement(iconByName(a.icon) || Tag, { size: 78, strokeWidth: 1.5 })}
                    </div>
                    <span style={{ position: "relative", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: a.color, borderRadius: 5, padding: "3px 8px" }}>{a.tag}</span>
                  </div>
                  <div style={{ padding: "12px 13px 14px" }}>
                    <div style={{ fontFamily: serif, fontSize: 15.5, fontWeight: 600, lineHeight: 1.25, color: ink }}>{a.title}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: accent, marginTop: 9 }}>Les mer →</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Kompakte kontroller – dominerer ikke skjermen */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <button onClick={() => { setDraft(selected); setPicking(true); }} className="btn-pink"
            style={{ borderRadius: 8, padding: "9px 15px", fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: "pointer",
              ...(showAll
                ? { border: "none", background: accent, color: "#fff" }
                : { border: `1.6px solid ${accent}`, background: "transparent", color: accent }) }}>
            {showAll ? "Velg medlemskap" : "Endre medlemskap"}
          </button>
          {!showAll && (
            <button onClick={() => saveSelection([])}
              style={{ border: "none", background: "none", color: ink, opacity: 0.7, fontSize: 14, fontWeight: 600, fontFamily: sans, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Vis alle
            </button>
          )}
        </div>

        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 14 }}>
          {showAll ? `Viser alle medlemskap` : `Viser: ${selMemberships.map((m) => m.short).join(", ")}`}
        </div>

        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Søk etter butikk eller tilbud – f.eks. Esso, Thon, lading…"
          style={{ width: "100%", boxSizing: "border-box", padding: "15px 16px", fontSize: 16, fontFamily: sans, border: `1.5px solid ${ink}`, borderRadius: 10, background: surface, color: ink, outline: "none" }} />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0 10px", WebkitOverflowScrolling: "touch" }}>
          <button onClick={() => setActiveCat("alle")} style={chip(activeCat === "alle")}>Alle</button>
          {presentCats.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={chip(activeCat === c.id)}>{c.label}</button>
          ))}
        </div>

        {flat.length === 0 ? (
          <div style={{ padding: "24px 2px", opacity: 0.65, fontSize: 16 }}>
            Ingen treff{query ? ` på «${query}»` : ""}{activeCat !== "alle" ? " i denne kategorien" : ""}.
          </div>
        ) : showGrouped ? (
          <>
          {grouped.map(({ cat, rows }, gi) => {
            const open = expandedCats.includes(cat.id);
            return (
            <React.Fragment key={cat.id}>
            {gi === newsletterIdx && renderNewsletter()}
            <section style={{ marginBottom: 20 }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontFamily: serif, letterSpacing: -0.2, color: ink, margin: "22px 0 11px", fontWeight: 600 }}>
                {CAT_ICON[cat.id] && React.createElement(CAT_ICON[cat.id], { size: 18, strokeWidth: 2, color: accent })}
                {cat.label}
              </h2>
              {(open ? rows : rows.slice(0, 4)).map((r, i) => <Row key={cat.id + i} m={r.m} b={r.b} />)}
              {rows.length > 4 && (
                <button onClick={() => setExpandedCats((e) => e.includes(cat.id) ? e.filter((x) => x !== cat.id) : [...e, cat.id])}
                  style={{ border: "none", background: "none", color: ink, opacity: 0.5, fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: sans, padding: "9px 2px 2px" }}>
                  {open ? "Vis færre ↑" : `Vis alle ${rows.length} →`}
                </button>
              )}
            </section>
            </React.Fragment>
            );
          })}
          {newsletterIdx >= grouped.length && renderNewsletter()}
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 4 }}>{flat.length} {flat.length === 1 ? "treff" : "treff"}</div>
            {flat.map((r, i) => (
              <React.Fragment key={i}>
                <Row m={r.m} b={r.b} badge />
                {i === Math.min(NEWSLETTER_AFTER_FLAT, flat.length) - 1 && renderNewsletter()}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Diskré inngang til kommende innhold – konkurrerer aldri med søket */}
        <section ref={guidesRef} id="guider" style={{ marginTop: 34, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.10)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <h2 style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, margin: 0 }}>Guider</h2>
            <span style={{ fontSize: 12, opacity: 0.45 }}>kommer snart</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {GUIDES.map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, background: surface, border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer" }}>
                <div style={{ width: 56, height: 56, borderRadius: 9, flexShrink: 0, background: g.tint }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25 }}>{g.title}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.5, marginTop: 3 }}>Artikkel</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: ink, opacity: 0.38, whiteSpace: "nowrap" }}>Snart</span>
              </div>
            ))}
          </div>
        </section>
        {/* Footer (skjema + info) ligger nå i public/footer.js – felles for hele nettstedet */}
      </div>
    </div>
  );
}

const linkBtn = (color) => ({ border: "none", background: "none", color, fontWeight: 600, cursor: "pointer", fontSize: 14, padding: 0, textDecoration: "underline", fontFamily: fonts.sans });
