/* =====================================================================
   perks – FELLES FOOTER  (tilbakemeldingsskjema + informasjon)
   ---------------------------------------------------------------------
   Dette er den ENE footeren for hele nettstedet. Endrer du noe her,
   endres footeren på ALLE sider samtidig (forside + alle undersider).

   Slik bruker du den på en side:
     1) Legg  <div id="site-footer"></div>  nederst i <body>
     2) Legg  <script src="/footer.js" defer></script>  nederst i <body>

   Fargene/fontene er de samme som i src/theme.js – endrer du dem der,
   oppdater her.
   ===================================================================== */
(function () {
  var INK = "#0d0c22";      // tekst
  var ACCENT = "#d76e98";   // rosa signatur – knapp og lenker
  var SURFACE = "#ffffff";  // bakgrunn i tilbakemeldingskortet
  var SERIF = "'Schibsted Grotesk', system-ui, sans-serif"; // overskrift
  var SANS = "'Hanken Grotesk', system-ui, sans-serif";     // brødtekst
  var CONTACT_EMAIL = "hei@perks.no"; // «Send inn» åpner e-post hit

  /* ---------- Fonter (samme som forsiden) ---------- */
  if (!document.querySelector('link[href*="Hanken+Grotesk"]')) {
    var fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap";
    document.head.appendChild(fontLink);
  }

  /* ---------- Stil ---------- */
  if (!document.getElementById("pf-styles")) {
    var style = document.createElement("style");
    style.id = "pf-styles";
    style.textContent =
      "#site-footer .pf-inner{box-sizing:content-box;max-width:720px;margin:0 auto;padding:20px 16px 44px;border-top:1px solid rgba(0,0,0,0.10);font-family:" + SANS + ";font-size:12.5px;line-height:1.65}" +
      ".pf-card{background:" + SURFACE + ";border:1px solid rgba(0,0,0,0.09);border-radius:13px;padding:16px;margin-bottom:18px}" +
      ".pf-card-title{font-family:" + SERIF + ";font-size:16px;font-weight:600;color:" + INK + "}" +
      ".pf-card-text{margin:5px 0 11px;color:" + INK + ";opacity:0.72;line-height:1.5}" +
      ".pf-textarea{width:100%;box-sizing:border-box;padding:11px 12px;font-size:14px;font-family:" + SANS + ";border:1.5px solid rgba(0,0,0,0.18);border-radius:9px;background:#fff;color:" + INK + ";outline:none;resize:vertical;line-height:1.45}" +
      ".pf-send{margin-top:12px;border:none;background:" + ACCENT + ";color:#fff;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:700;font-family:" + SANS + ";cursor:pointer;transition:filter .13s ease}" +
      ".pf-send:hover{filter:brightness(1.08)}" +
      ".pf-p{margin:0 0 10px;color:" + INK + ";opacity:0.62}" +
      ".pf-p strong{opacity:0.85}" +
      ".pf-link{margin:0 0 10px}" +
      ".pf-link a{color:" + ACCENT + ";text-decoration:none}" +
      ".pf-fine{margin:0 0 4px;color:" + INK + ";opacity:0.5}";
    document.head.appendChild(style);
  }

  var mount = document.getElementById("site-footer");
  if (!mount) return;

  mount.innerHTML =
    '<div class="pf-inner">' +
      '<div class="pf-card">' +
        '<div class="pf-card-title">Fant du en feil, eller har du et tips?</div>' +
        '<p class="pf-card-text">Vi jobber stadig med å holde oversikten oppdatert. Ser du likevel noe som er utdatert, feil, eller en fordel som mangler, setter vi stor pris på et hint.</p>' +
        '<textarea class="pf-textarea" rows="3" placeholder="Skriv her – f.eks. «Rabatten hos … ser ut til å ha endret seg»"></textarea>' +
        '<button class="pf-send" type="button">Send inn</button>' +
      '</div>' +
      '<p class="pf-p"><strong>perks</strong> er en uavhengig oversikt over medlemsfordeler i Norge.</p>' +
      '<p class="pf-p">Vi bruker ingen sporings-cookies. Melder du deg på nyhetsbrevet, lagrer vi e-postadressen din – kun for å sende deg nyhetsbrevet, og du kan melde deg av når som helst.</p>' +
      '<p class="pf-link"><a href="/personvern.html">Personvernerklæring</a></p>' +
      '<p class="pf-fine">Rabatter og vilkår kan endres – vi tar forbehold om feil og utdaterte tilbud. Sjekk alltid det som gjelder hos tilbyderen. Sist undersøkt juni 2026.</p>' +
    '</div>';

  var textarea = mount.querySelector(".pf-textarea");
  var sendBtn = mount.querySelector(".pf-send");
  sendBtn.addEventListener("click", function () {
    var t = (textarea.value || "").trim();
    if (!t) return;
    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Tips/feil – perks.no") +
      "&body=" + encodeURIComponent(t);
  });
})();
