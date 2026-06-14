/* =====================================================================
   perks – NYHETSBREV-MODUL  (public/newsletter.js)
   ---------------------------------------------------------------------
   Gjenbrukbar påmelding til nyhetsbrevet, slik at den ser HELT lik ut på
   alle sider. Samme uttrykk og logikk som påmeldingen på forsiden.

   Slik bruker du den på en hvilken som helst side:
     1) Legg  <div data-perks-newsletter></div>  der modulen skal stå
     2) Legg  <script src="/newsletter.js" defer></script>  nederst i <body>

   Modulen tegner seg selv i ALLE [data-perks-newsletter]-elementer på siden.
   Ingen sporings-cookies: e-posten huskes kun lokalt (localStorage) og sendes
   til EmailOctopus-workeren – samme som forsiden.
   ===================================================================== */
(function () {
  var INK = "#0d0c22";
  var ACCENT = "#d76e98";
  var SURFACE = "#ffffff";
  var SERIF = "'Schibsted Grotesk', system-ui, sans-serif";
  var SANS = "'Hanken Grotesk', system-ui, sans-serif";
  var SUB_KEY = "perks:subscribed:v1"; // samme nøkkel som appen (Perks.jsx), så status deles
  // Speiler SITE.emailoctopusFormAction i src/content.js (normalisert til https).
  var ACTION = "https://perks-nyhetsbrev.larselango.workers.dev";

  /* ---------- Stil (injiseres én gang) ---------- */
  if (!document.getElementById("pn-styles")) {
    var s = document.createElement("style");
    s.id = "pn-styles";
    s.textContent =
      ".pn-card{background:" + SURFACE + ";border:1px solid rgba(0,0,0,0.09);border-left:4px solid " + ACCENT + ";border-radius:16px;padding:20px 22px;margin:30px 0;font-family:" + SANS + "}" +
      ".pn-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:" + ACCENT + ";margin:0 0 6px}" +
      ".pn-title{font-family:" + SERIF + ";font-size:19px;font-weight:600;line-height:1.15;letter-spacing:-0.2px;margin:0 0 8px;color:" + INK + "}" +
      ".pn-text{font-size:13.5px;color:" + INK + ";opacity:0.8;line-height:1.4;margin:0 0 12px;max-width:460px}" +
      ".pn-row{display:flex;gap:8px;flex-wrap:wrap}" +
      ".pn-input{flex:1 1 200px;box-sizing:border-box;padding:11px 13px;font-size:14.5px;font-family:" + SANS + ";border:1px solid rgba(0,0,0,0.15);border-radius:9px;background:#fff;color:" + INK + ";outline:none}" +
      ".pn-btn{border:none;background:" + ACCENT + ";color:#fff;border-radius:9px;padding:11px 18px;font-size:14.5px;font-weight:600;font-family:" + SANS + ";cursor:pointer;white-space:nowrap;transition:filter .13s ease}" +
      ".pn-btn:hover{filter:brightness(1.08)}" +
      ".pn-ok{font-size:13.5px;color:" + INK + ";opacity:0.88;line-height:1.5}" +
      ".pn-again{display:block;margin-top:8px;padding:0;border:none;background:none;color:" + ACCENT + ";font-size:13px;font-family:" + SANS + ";cursor:pointer;text-decoration:underline}";
    document.head.appendChild(s);
  }

  var isValid = function (e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); };

  function mountInto(el) {
    if (el.getAttribute("data-pn-ready") === "1") return; // unngå dobbel-tegning
    el.setAttribute("data-pn-ready", "1");
    el.innerHTML =
      '<div class="pn-card">' +
        '<div class="pn-label">Nyhetsbrev</div>' +
        '<div class="pn-title">Gå aldri glipp av en god deal</div>' +
        '<p class="pn-text">Få tips når det lønner seg å bruke fordelene – vi lover å ikke sende for mye.</p>' +
        '<div class="pn-body"></div>' +
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
        '<div class="pn-row">' +
          '<input class="pn-input" type="email" placeholder="din@epost.no" autocomplete="email" />' +
          '<button class="pn-btn" type="button">Meld meg på</button>' +
        '</div>';
      var input = body.querySelector(".pn-input");
      var btn = body.querySelector(".pn-btn");
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
