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
      ".pf-fine{margin:0 0 12px;color:" + INK + ";opacity:0.5}" +
      ".pf-news{background:" + SURFACE + ";border:1px solid rgba(0,0,0,0.09);border-left:4px solid " + ACCENT + ";border-radius:13px;padding:16px;margin-bottom:18px}" +
      ".pf-news-title{font-family:" + SERIF + ";font-size:16px;font-weight:600;color:" + INK + "}" +
      ".pf-news-text{margin:5px 0 12px;color:" + INK + ";opacity:0.72;line-height:1.5}" +
      ".pf-news-row{display:flex;gap:8px;flex-wrap:wrap}" +
      ".pf-news-input{flex:1 1 180px;box-sizing:border-box;padding:11px 13px;font-size:14px;font-family:" + SANS + ";border:1px solid rgba(0,0,0,0.15);border-radius:9px;background:#fff;color:" + INK + ";outline:none}" +
      ".pf-news-btn{border:none;background:" + ACCENT + ";color:#fff;border-radius:9px;padding:11px 18px;font-size:14.5px;font-weight:600;font-family:" + SANS + ";cursor:pointer;white-space:nowrap;transition:filter .13s ease}" +
      ".pf-news-btn:hover{filter:brightness(1.08)}" +
      ".pf-news-ok{font-size:13.5px;color:" + INK + ";opacity:0.88;line-height:1.5}";
    document.head.appendChild(style);
  }

  var mount = document.getElementById("site-footer");
  if (!mount) return;

  // Nyhetsbrev vises på vanlige innholdssider (artikler/undersider) – men ikke
  // på forsiden (#root), som allerede har sin egen påmelding inne i appen.
  var isApp = !!document.getElementById("root");
  var SUB_KEY = "perks:subscribed:v1"; // samme nøkkel som appen (Perks.jsx), så status deles
  // Speiler SITE.emailoctopusFormAction i src/content.js (normalisert til https).
  var NEWSLETTER_ACTION = "https://perks-nyhetsbrev.larselango.workers.dev";

  var newsHtml = isApp ? "" :
    '<div class="pf-news">' +
      '<div class="pf-news-title">Få mest ut av medlemskapene dine</div>' +
      '<p class="pf-news-text">Meld deg på nyhetsbrevet, så sier vi fra når det lønner seg å bruke fordelene – vi lover å ikke sende for mye.</p>' +
      '<div class="pf-news-body"></div>' +
    '</div>';

  mount.innerHTML =
    '<div class="pf-inner">' +
      newsHtml +
      '<div class="pf-card">' +
        '<div class="pf-card-title">Fant du en feil, eller har du et tips?</div>' +
        '<p class="pf-card-text">Vi jobber stadig med å holde oversikten oppdatert. Ser du likevel noe som er utdatert, feil, eller en fordel som mangler, setter vi stor pris på et hint.</p>' +
        '<textarea class="pf-textarea" rows="3" placeholder="Skriv her – f.eks. «Rabatten hos … ser ut til å ha endret seg»"></textarea>' +
        '<button class="pf-send" type="button">Send inn</button>' +
      '</div>' +
      '<p class="pf-fine">Rabatter og vilkår kan endres – vi tar forbehold om feil og utdaterte tilbud. Sjekk alltid det som gjelder hos tilbyderen. Sist undersøkt juni 2026.</p>' +
      '<p class="pf-p"><strong>perks</strong> er en uavhengig oversikt over medlemsfordeler i Norge.</p>' +
      '<p class="pf-p">Vi bruker ingen sporings-cookies. Melder du deg på nyhetsbrevet, lagrer vi e-postadressen din – kun for å sende deg nyhetsbrevet, og du kan melde deg av når som helst.</p>' +
      '<p class="pf-link"><a href="/personvern.html">Personvernerklæring</a></p>' +
    '</div>';

  // ----- Tilbakemeldingsskjema (åpner e-post) -----
  var textarea = mount.querySelector(".pf-textarea");
  var sendBtn = mount.querySelector(".pf-send");
  sendBtn.addEventListener("click", function () {
    var t = (textarea.value || "").trim();
    if (!t) return;
    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Tips/feil – perks.no") +
      "&body=" + encodeURIComponent(t);
  });

  // ----- Nyhetsbrev (kun innholdssider) -----
  var newsBody = mount.querySelector(".pf-news-body");
  if (newsBody) {
    var isValidEmail = function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); };
    var already = null;
    try { already = localStorage.getItem(SUB_KEY); } catch (e) {}

    function showOk() {
      newsBody.innerHTML = '<div class="pf-news-ok">✓ Du er på lista – vi sier fra når det lønner seg.</div>';
    }
    function showForm() {
      newsBody.innerHTML =
        '<div class="pf-news-row">' +
          '<input class="pf-news-input" type="email" placeholder="din@epost.no" autocomplete="email" />' +
          '<button class="pf-news-btn" type="button">Meld meg på</button>' +
        '</div>';
      var input = newsBody.querySelector(".pf-news-input");
      var btn = newsBody.querySelector(".pf-news-btn");
      function submit() {
        var e = (input.value || "").trim();
        if (!isValidEmail(e)) { input.focus(); return; }
        try { localStorage.setItem(SUB_KEY, e); } catch (err) {}
        // Send til EmailOctopus (via Cloudflare Worker). no-cors: vi kan ikke lese
        // svaret, men påmeldingen registreres. Feil svelges stille.
        if (NEWSLETTER_ACTION) {
          try {
            fetch(NEWSLETTER_ACTION, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: e }),
            }).then(function (r) { if (!r.ok) console.error("Påmelding feilet"); })
              .catch(function (err) { console.error(err); });
          } catch (err) { console.error(err); }
        }
        showOk();
      }
      btn.addEventListener("click", submit);
      input.addEventListener("keydown", function (ev) { if (ev.key === "Enter") submit(); });
    }

    if (already) showOk(); else showForm();
  }
})();
