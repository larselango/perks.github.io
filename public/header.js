/* =====================================================================
   perks – FELLES HEADER  (logo + hamburgermeny)
   ---------------------------------------------------------------------
   Dette er den ENE headeren for hele nettstedet. Endrer du noe her,
   endres headeren på ALLE sider samtidig (forside + alle undersider).

   Slik bruker du den på en side:
     1) Legg  <div id="site-header"></div>  øverst i <body>
     2) Legg  <script src="/header.js" defer></script>  nederst i <body>

   Menyvalg redigeres i MENU-lista litt lenger ned.
   Fargene er de samme som i src/theme.js – endrer du dem der, oppdater her.
   ===================================================================== */
(function () {
  var INK = "#0d0c22";      // tekst
  var ACCENT = "#d76e98";   // rosa signatur (punktum i logoen)
  var SURFACE = "#ffffff";  // bakgrunn i baren

  /* ---------- Menyvalg (rediger her) ----------
     { label: "...", target: "guider", href: "/#guider" } -> hopper til Guider-seksjonen
     { label: "...", soon: true }                          -> grått «Snart», ikke klikkbart */
  var MENU = [
    { label: "Guider og artikler", target: "guider", href: "/#guider" },
    { label: "Andre medlemsfordeler", soon: true },
    { label: "Medlemsorganisasjoner", soon: true },
  ];

  /* ---------- Logo-fonten ----------
     Logoen «perks.» bruker system-fonten (bold, tett tracking) – samme uttrykk
     som lasteskjermen i index.html, så overgangen ved innlasting blir sømløs. */

  /* ---------- Stil ---------- */
  if (!document.getElementById("ph-styles")) {
    var style = document.createElement("style");
    style.id = "ph-styles";
    style.textContent =
      "#site-header{position:sticky;top:0;z-index:30}" +
      ".ph-bar{background:" + SURFACE + ";border-bottom:1px solid rgba(0,0,0,0.12)}" +
      ".ph-inner{box-sizing:content-box;max-width:720px;margin:0 auto;padding:13px 16px;display:flex;align-items:center;justify-content:space-between}" +
      ".ph-logo{font-family:system-ui,sans-serif;font-size:30px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:" + INK + ";text-decoration:none}" +
      ".ph-logo span{color:" + ACCENT + "}" +
      ".ph-burger{border:none;background:none;cursor:pointer;padding:8px;margin-right:-8px;display:flex;flex-direction:column;gap:5px}" +
      ".ph-burger span{display:block;width:23px;height:2px;background:" + INK + ";border-radius:2px}" +
      ".ph-menu{display:none;background:" + SURFACE + "}" +
      ".ph-menu.open{display:block}" +
      ".ph-menu-inner{max-width:720px;margin:0 auto;padding:4px 16px 10px}" +
      ".ph-item{width:100%;box-sizing:border-box;text-align:left;border:none;background:none;cursor:pointer;font-family:'Hanken Grotesk',system-ui,sans-serif;font-size:15.5px;font-weight:500;color:" + INK + ";padding:13px 2px;display:flex;justify-content:space-between;align-items:center;text-decoration:none}" +
      ".ph-menu-inner > .ph-item + .ph-item{border-top:1px solid rgba(0,0,0,0.06)}" +
      ".ph-item-soon{cursor:default}" +
      ".ph-soon{font-size:10px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;opacity:0.4}";
    document.head.appendChild(style);
  }

  var mount = document.getElementById("site-header");
  if (!mount) return;

  // På forsiden finnes React-appen (#root). Da styrer vi navigasjonen inni appen
  // via en hendelse i stedet for å laste siden på nytt. På vanlige HTML-sider er
  // lenkene helt ordinære (logo -> "/", Guider -> "/#guider").
  var isApp = !!document.getElementById("root");

  var itemsHtml = MENU.map(function (m) {
    if (m.soon) {
      return '<span class="ph-item ph-item-soon">' + m.label +
             '<span class="ph-soon">Snart</span></span>';
    }
    return '<a class="ph-item" href="' + m.href + '" data-target="' +
           (m.target || "") + '">' + m.label + '</a>';
  }).join("");

  mount.innerHTML =
    '<div class="ph-bar">' +
      '<div class="ph-inner">' +
        '<a class="ph-logo" href="/" data-logo>perks<span>.</span></a>' +
        '<button class="ph-burger" type="button" aria-label="Meny" aria-expanded="false">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
      '<div class="ph-menu">' +
        '<div class="ph-menu-inner">' + itemsHtml + '</div>' +
      '</div>' +
    '</div>';

  // Eksponer den synlige bar-høyden som CSS-variabel (--ph-h), så elementer på
  // forsiden (f.eks. det sticky søkefeltet) kan feste seg rett under headeren.
  var bar = mount.querySelector(".ph-bar");
  function setHeaderHeightVar() {
    if (bar) document.documentElement.style.setProperty("--ph-h", bar.offsetHeight + "px");
  }
  setHeaderHeightVar();
  window.addEventListener("resize", setHeaderHeightVar);

  var menu = mount.querySelector(".ph-menu");
  var burger = mount.querySelector(".ph-burger");

  function closeMenu() {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  mount.querySelector("[data-logo]").addEventListener("click", function (e) {
    if (isApp) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("perks:nav", { detail: { target: "home" } }));
    }
    closeMenu();
  });

  mount.querySelectorAll("a.ph-item").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = a.getAttribute("data-target");
      if (isApp && target) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("perks:nav", { detail: { target: target } }));
      }
      closeMenu();
    });
  });
})();