/* =====================================================================
   perks – NYHETSBREV-MODUL  (public/newsletter.js)
   ---------------------------------------------------------------------
   ÉN kilde for nyhetsbrev-påmeldingen, slik at den ser HELT lik ut overalt
   – både på forsiden (React henter den via window.perksNewsletter.mount)
   og på statiske sider (auto-tegnes i [data-perks-newsletter]).

   Bruk på en hvilken som helst statisk side:
     1) Legg  <div data-perks-newsletter></div>  der modulen skal stå
     2) Legg  <script src="/newsletter.js" defer></script>  nederst i <body>

   Ingen sporings-cookies: e-posten huskes kun lokalt (localStorage) og sendes
   til EmailOctopus-workeren.
   ===================================================================== */
(function () {
  var INK = "#0d0c22";
  var ACCENT = "#d76e98";
  var SERIF = "'Schibsted Grotesk', system-ui, sans-serif";
  var SANS = "'Hanken Grotesk', system-ui, sans-serif";
  var SUB_KEY = "perks:subscribed:v1"; // samme nøkkel som appen, så status deles
  // Speiler SITE.emailoctopusFormAction i src/content.js (normalisert til https).
  var ACTION = "https://perks-nyhetsbrev.larselango.workers.dev";

  /* ---------- Stil (injiseres én gang). Samme uttrykk som forsiden:
       lys rosa bakgrunn, rosa venstrekant, Tag-dekor og tøm-knapp. ---------- */
  if (!document.getElementById("pn-styles")) {
    var s = document.createElement("style");
    s.id = "pn-styles";
    s.textContent =
      ".pn-card{position:relative;overflow:hidden;background:rgba(215,110,152,0.08);border:1px solid rgba(215,110,152,0.28);border-left:4px solid " + ACCENT + ";border-radius:16px;padding:22px 20px;margin:20px 0;font-family:" + SANS + "}" +
      ".pn-deco{position:absolute;right:-24px;top:-16px;transform:rotate(-12deg);opacity:0.06;color:" + ACCENT + ";pointer-events:none}" +
      ".pn-inner{position:relative}" +
      ".pn-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:" + ACCENT + ";margin:0 0 6px}" +
      ".pn-title{font-family:" + SERIF + ";font-size:19px;font-weight:600;line-height:1.15;letter-spacing:-0.2px;margin:0 0 8px;color:" + INK + "}" +
      ".pn-text{font-size:13.5px;color:" + INK + ";opacity:0.8;line-height:1.4;margin:0 0 12px;max-width:460px}" +
      ".pn-row{display:flex;gap:8px;flex-wrap:wrap}" +
      ".pn-field{position:relative;flex:1 1 200px}" +
      ".pn-input{width:100%;box-sizing:border-box;padding:11px 38px 11px 13px;border-radius:9px;border:1px solid rgba(0,0,0,0.15);font-size:14.5px;font-family:" + SANS + ";background:#fff;color:" + INK + ";outline:none}" +
      ".pn-clear{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,0.08);color:" + INK + ";font-size:15px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}" +
      ".pn-btn{padding:11px 18px;border-radius:9px;border:none;background:" + ACCENT + ";color:#fff;font-size:14.5px;font-weight:600;font-family:" + SANS + ";cursor:pointer;white-space:nowrap;transition:filter .13s ease}" +
      ".pn-btn:hover{filter:brightness(1.08)}" +
      ".pn-ok{font-size:13.5px;color:" + INK + ";opacity:0.85;line-height:1.5}" +
      ".pn-again{display:block;margin-top:8px;padding:0;border:none;background:none;color:" + ACCENT + ";font-size:13px;font-family:" + SANS + ";cursor:pointer;text-decoration:underline}";
    document.head.appendChild(s);
  }

  var DECO =
    '<svg class="pn-deco" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>' +
      '<circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>' +
    '</svg>';

  var isValid = function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); };

  function mountInto(el) {
    if (!el || el.getAttribute("data-pn-ready") === "1") return; // unngå dobbel-tegning
    el.setAttribute("data-pn-ready", "1");
    el.innerHTML =
      '<div class="pn-card">' + DECO +
        '<div class="pn-inner">' +
          '<div class="pn-label">Nyhetsbrev</div>' +
          '<div class="pn-title">Gå aldri glipp av en god deal</div>' +
          '<div class="pn-body"></div>' +
        '</div>' +
      '</div>';
    var body = el.querySelector(".pn-body");

    function showOk() {
      body.innerHTML =
        '<div class="pn-ok">✓ Du er på lista – vi sier fra når det lønner seg.' +
          '<button class="pn-again" type="button">Meld på en annen e-post</button>' +
        '</div>';
      body.querySelector(".pn-again").addEventListener("click", showForm);
    }
    function showForm() {
      body.innerHTML =
        '<p class="pn-text">Få tips når det lønner seg å bruke fordelene – vi lover å ikke sende for mye.</p>' +
        '<div class="pn-row">' +
          '<div class="pn-field">' +
            '<input class="pn-input" type="email" placeholder="din@epost.no" autocomplete="email" />' +
            '<button class="pn-clear" type="button" aria-label="Tøm feltet" style="display:none">×</button>' +
          '</div>' +
          '<button class="pn-btn" type="button">Meld meg på</button>' +
        '</div>';
      var input = body.querySelector(".pn-input");
      var clear = body.querySelector(".pn-clear");
      var btn = body.querySelector(".pn-btn");
      input.addEventListener("input", function () { clear.style.display = input.value ? "flex" : "none"; });
      clear.addEventListener("click", function () { input.value = ""; clear.style.display = "none"; input.focus(); });
      function submit() {
        var e = (input.value || "").trim();
        if (!isValid(e)) { input.focus(); return; }
        try { localStorage.setItem(SUB_KEY, e); } catch (err) {}
        // Send til EmailOctopus (via Cloudflare Worker). Feil svelges stille.
        if (ACTION) {
          try {
            fetch(ACTION, {
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

    var stored = null;
    try { stored = localStorage.getItem(SUB_KEY); } catch (e) {}
    if (stored) showOk(); else showForm();
  }

  // Eksponer for forsiden (React kaller mount på sin egen container).
  window.perksNewsletter = { mount: mountInto };

  // Auto-tegn på statiske sider.
  function init() {
    var els = document.querySelectorAll("[data-perks-newsletter]");
    for (var i = 0; i < els.length; i++) mountInto(els[i]);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
