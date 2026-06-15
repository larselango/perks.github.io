/* =====================================================================
   perks – FAQ  (src/faq.js)
   ---------------------------------------------------------------------
   Spørsmål og svar som vises nederst på forsiden OG brukes til å bygge
   FAQPage-strukturdata (JSON-LD) i index.html ved bygging. ÉN kilde, så
   den synlige FAQ-en og strukturdataene alltid stemmer overens (et krav
   fra Google).

   Skrevet for søk: spørsmålene speiler hva folk faktisk googler om norske
   medlemsfordeler, og svarene er korte, ærlige og nøkkelord-rike.
   Rediger fritt – både siden og strukturdataene oppdateres ved neste bygg.
   ===================================================================== */
export const FAQ = [
  {
    q: "Hva er perks?",
    a: "perks er en gratis, uavhengig oversikt over norske medlemsfordeler. Du velger medlemskapene og fordelsprogrammene dine – som LO (LOfavør), OBOS, NAF, Unio, Coop og Trumf – og ser samlet hvilke rabatter og fordeler du faktisk har, og hva de er verdt.",
  },
  {
    q: "Er perks gratis å bruke?",
    a: "Ja, perks er helt gratis. Du trenger ingen innlogging eller konto, og vi bruker ingen sporings-cookies. Medlemskapene du velger lagres kun lokalt i din egen nettleser.",
  },
  {
    q: "Hvilke medlemskap og fordelsprogrammer dekkes?",
    a: "Vi dekker over 700 medlemsfordeler fra 18 organisasjoner, blant andre LO/LOfavør, OBOS, NAF, Unio, Coop, Trumf, DNT, YS, Tekna og NITO. Oversikten utvides jevnlig med nye medlemskap og tilbud.",
  },
  {
    q: "Hvordan vet jeg hva medlemsfordelene er verdt?",
    a: "Vi tallfester bevisst kun goder med en reell, automatisk kroneverdi – for eksempel innboforsikring som følger med medlemskapet. Rabatter du må handle for å bruke, omtaler vi som «tilbud du kan bruke», ikke penger. Alle kronebeløp er anslag.",
  },
  {
    q: "Er medlemsrabattene unike for medlemmer?",
    a: "Mange er gode, men ikke alltid unike. Flere rabatter finnes også uten medlemskap, og noen ganger får du like god pris ved å bytte leverandør selv. Sammenlign alltid mot et reelt alternativ før du regner en rabatt som «spart».",
  },
  {
    q: "Lagrer perks personopplysninger om meg?",
    a: "Nei. Vi bruker ingen sporings-cookies, og medlemskapene du velger lagres kun i din egen nettleser. Melder du deg på nyhetsbrevet, lagrer vi e-postadressen din – kun for å sende deg nyhetsbrevet. Se personvernerklæringen for detaljer.",
  },
];
