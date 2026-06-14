/* =====================================================================
   perks – BASEINNHOLD FOR MEDLEMSKAPSSIDER  (src/seo-pages.js)
   ---------------------------------------------------------------------
   Her bor den redaksjonelle teksten til de auto-genererte, søkeoptimaliserte
   medlemskapssidene (scripts/build-pages.mjs lager dem fra src/content.js).

   ÉN side per organisasjon, med ekte tilbud i HTML (lesbart for ALLE
   søkemotorer – ikke bare de som kjører JavaScript). Selve tilbudene hentes
   fra content.js; her styrer du bare tekst og URL.

   Hver nøkkel er org-id fra content.js (samme id som i CATALOG). ALT er
   valgfritt – mangler et felt, lager generatoren en fornuftig standard ut
   fra navn, antall fordeler og kategorier. Vil du finpusse en side, fyll inn:
     slug        – URL uten «.html» (f.eks. "lo-medlemsfordeler")
     title       – <title> og H1-følge (hold ~50–60 tegn)
     description – meta description (~150–160 tegn)
     intro       – ingress (vanlig tekst; <strong> er ok)
     related     – { href, label } til en relevant guide/artikkel
   ===================================================================== */
export const PAGE_SEO = {
  lo: {
    slug: "lo-medlemsfordeler",
    title: "LO-medlemsfordeler (LOfavør) – alle rabatter samlet",
    description:
      "Komplett oversikt over LOfavør-fordelene: rabatter på reise, hotell, bank, forsikring, strøm og mer – og hva de faktisk er verdt for deg som LO-medlem.",
    intro:
      "LOfavør samler medlemsfordelene for LO-forbundene. Her er hele oversikten over rabatter og fordeler du får som LO-medlem – på reise, bank og forsikring, strøm, kultur og mer. Den eneste fordelen med en fast årsverdi er innboforsikringen; resten er tilbud du kan bruke.",
    related: { href: "/er-lofavor-verdt-det.html", label: "Les også: Er LO-medlemskap verdt det?" },
  },
  obos: {
    slug: "obos-medlemsfordeler",
    title: "OBOS-medlemsfordeler – rabatter og fordeler samlet",
    description:
      "Oversikt over OBOS-fordelene: bank og boliglån, forsikring, strøm, opplevelser og mer. Se hvilke medlemsrabatter du har som OBOS-medlem.",
  },
  naf: {
    slug: "naf-medlemsfordeler",
    title: "NAF-medlemsfordeler – rabatter for bilister samlet",
    description:
      "Oversikt over NAF-fordelene: veihjelp, bil og verksted, forsikring, reise og mer. Se medlemsrabattene du har som NAF-medlem.",
  },
  unio: {
    slug: "unio-medlemsfordeler",
    title: "Unio-medlemsfordeler – rabatter og fordeler samlet",
    description:
      "Oversikt over Unio-fordelene: bank, forsikring, reise og mer for medlemmer i Unio-forbundene. Se hvilke medlemsrabatter du har.",
  },
  coop: {
    slug: "coop-medlemsfordeler",
    title: "Coop-medlemsfordeler – medlemsrabatter og kjøpeutbytte",
    description:
      "Oversikt over Coop-medlemsfordelene: kjøpeutbytte, medlemsrabatter og samarbeidstilbud. Se hva du får som Coop-medlem.",
  },
  trumf: {
    slug: "trumf-medlemsfordeler",
    title: "Trumf-fordeler – bonus og medlemsrabatter samlet",
    description:
      "Oversikt over Trumf-fordelene: Trumf-bonus, samarbeidspartnere og medlemsrabatter. Se hvordan du sparer mest med Trumf.",
  },
};
