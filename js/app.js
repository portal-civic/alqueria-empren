/* Emprén a l'Alqueria d'Asnar — lògica comuna de totes les pàgines.
   No cal editar aquest fitxer per canviar continguts: editeu dades.xlsx.
   js/carrega.js decideix d'on venen les dades i després crida iniciaApp(). */
window.iniciaApp = function () {
  "use strict";

  var C = window.CONFIG, CAT = window.CATEGORIES, R = window.RECURSOS, SEC = window.SECCIONS || [];
  var IT = window.ITINERARI || [], NEC = window.NECESSITATS || [], DEST = window.DESTACADES || [], FOTOS = window.FOTOS || {};

  /* ---------- Utilitats ---------- */
  function $(s) { return document.querySelector(s); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ic(nom, cls) { return '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + nom + '"/></svg>'; }
  function perId(id) { for (var i = 0; i < R.length; i++) if (R[i].id === id) return R[i]; return null; }
  function seccioPerId(id) { for (var i = 0; i < SEC.length; i++) if (SEC[i].id === id) return SEC[i]; return null; }
  // La «casa» d'una fitxa: la primera secció on apareix
  function seccioDe(idFitxa) {
    for (var i = 0; i < SEC.length; i++)
      for (var j = 0; j < SEC[i].grups.length; j++)
        if (SEC[i].grups[j].ids.indexOf(idFitxa) > -1) return SEC[i];
    return null;
  }
  function param(n) { var m = new RegExp("[?&]" + n + "=([^&#]*)").exec(location.search); return m ? decodeURIComponent(m[1]) : ""; }
  function urlFitxa(id) { return "fitxa.html?id=" + encodeURIComponent(id); }
  function pendent(r) {
    return C.modeRevisio && r.validat === false
      ? '<span class="etiqueta-pendent">' + esc(r.pendent || "Pendent de validar") + "</span>" : "";
  }
  function estat(r) { return r.estat ? '<span class="estat">' + ic("clock") + esc(r.estat) + "</span>" : ""; }
  function alMapa(r) { return r.mapa !== false && typeof r.lat === "number" && typeof r.lng === "number"; }
  function provaFoto(src, cont, alt, enCas, posicio) {
    if (!src || !cont) { if (enCas) enCas(false); return; }
    var im = new Image();
    im.onload = function () {
      im.className = "foto"; im.alt = alt || ""; if (posicio) im.style.objectPosition = posicio;
      cont.appendChild(im); cont.classList.add("amb-foto"); if (enCas) enCas(true);
    };
    im.onerror = function () { if (enCas) enCas(false); };
    im.src = src;
  }

  /* ---------- Emblema: es mostra quan una fitxa no té foto ---------- */
  function emblema(r) {
    var c = CAT[r.categoria];
    return '<span class="emblema"><span class="emblema__cercle">' + ic(r.icona || c.icona) + '</span><span class="emblema__text">' + esc(c.nom) + "</span></span>";
  }

  /* ---------- Targetes ---------- */
  function targeta(r, estil) {
    var c = CAT[r.categoria];
    if (estil === "foto") {
      return '<a class="dest" style="--c:' + c.color + '" href="' + urlFitxa(r.id) + '" data-cat="' + r.categoria + '">' +
        '<div class="dest__foto" data-foto="' + esc(r.foto || "") + '" data-pos="' + esc(r.fotoPosicio || "") + '">' + emblema(r) + "</div>" +
        '<div class="dest__cos"><span class="pastilla">' + ic(c.icona) + esc(c.nom) + "</span>" +
        "<h3>" + esc(r.nom) + "</h3>" + estat(r) + "<p>" + esc(r.resum) + "</p>" + pendent(r) +
        '<span class="dest__mes">Més informació ' + ic("arrow-right") + "</span></div></a>";
    }
    var comp = estil === "compacte";
    return '<a class="recurs' + (comp ? " recurs--compacte" : "") + '" style="--c:' + c.color + '" href="' + urlFitxa(r.id) + '" data-cat="' + r.categoria + '">' +
      '<span class="recurs__ic">' + ic(c.icona) + "</span>" +
      '<div><span class="recurs__cat">' + esc(c.nom) + "</span><h3>" + esc(r.nom) + "</h3>" + estat(r) + "<p>" + esc(r.resum) + "</p></div>" +
      '<span class="recurs__peu"><span>Veure fitxa →</span>' + pendent(r) + "</span></a>";
  }
  function carregaFotos(arrel) {
    (arrel || document).querySelectorAll(".dest__foto[data-foto]").forEach(function (el) {
      var src = el.getAttribute("data-foto"); el.removeAttribute("data-foto"); provaFoto(src, el, "", null, el.getAttribute("data-pos"));
    });
  }
  function graella(estil) { return estil === "foto" ? "destacades" : "llistat" + (estil === "compacte" ? " llistat--compacte" : ""); }

  /* ---------- Comú: revisió, menú, data ---------- */
  if (C.modeRevisio && $("#avis-revisio")) $("#avis-revisio").hidden = false;
  document.querySelectorAll(".data-act").forEach(function (e) { e.textContent = C.dataActualitzacio; });

  function marcaMenu(clau) {
    var a = document.querySelector('.menu [data-menu="' + clau + '"]');
    if (a) a.setAttribute("aria-current", "page");
  }
  var pag = document.body.getAttribute("data-pagina");
  if (pag !== "fitxa") marcaMenu(pag);

  var botoMenu = $(".menu-boto"), menu = $("#menu");
  if (botoMenu) botoMenu.addEventListener("click", function () {
    var obert = menu.classList.toggle("obert");
    botoMenu.setAttribute("aria-expanded", obert ? "true" : "false");
  });
  if (menu) menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) { menu.classList.remove("obert"); botoMenu.setAttribute("aria-expanded", "false"); }
  });

  /* ================= INICI ================= */
  var fotoPortada = $("#portada-foto");
  if (fotoPortada) provaFoto(FOTOS.portada, fotoPortada, "Vista de l'Alqueria d'Asnar", function (ok) {
    if (ok) { var m = fotoPortada.querySelector(".marca-aigua"); if (m) m.remove(); }
    else if (C.modeRevisio) $("#portada-peu").hidden = false;
  });

  function pintaXifres(sel, llista, selFont, font) {
    if (!$(sel)) return;
    $(sel).innerHTML = (llista || []).map(function (x) {
      return "<li><strong>" + esc(x.valor) + "</strong><span>" + esc(x.text) + "</span></li>";
    }).join("");
    if (font && $(selFont)) $(selFont).textContent = font;
  }
  pintaXifres("#xifres", C.xifres, "#xifres-font", C.fontXifres);
  pintaXifres("#xifres-sectors", window.XIFRES_SECTORS, "#xifres-sectors-font", window.FONT_SECTORS);

  if ($("#necessitats")) {
    $("#necessitats").innerHTML = NEC.map(function (n) {
      return '<a class="targeta-ic" href="' + esc(n.href) + '"><span class="cercle-ic">' + ic(n.icona) + "</span>" +
        "<div><h3>" + esc(n.titol) + "</h3><p>" + esc(n.text) + "</p></div>" + ic("arrow-right", "fletxa") + "</a>";
    }).join("");
  }

  if ($("#passos-llista")) {
    $("#passos-llista").innerHTML = IT.map(function (p, i) {
      var e = p.enllac || {};
      return '<li class="pas"><span class="pas__num">' + (i + 1) + '</span><div class="pas__targeta">' + ic(p.icona || "circle-check") +
        "<h3>" + (i + 1) + ". " + esc(p.titol) + "</h3><p>" + esc(p.text) + "</p>" +
        '<a href="' + esc(e.href) + '"' + (/^https?:/.test(e.href || "") ? ' target="_blank" rel="noopener"' : "") + ">" + esc(e.text) + " " + ic(/^https?:/.test(e.href || "") ? "external-link" : "arrow-right") + "</a></div></li>";
    }).join("");
  }

  if ($("#destacades")) {
    $("#destacades").innerHTML = DEST.map(perId).filter(Boolean).map(function (r) { return targeta(r, "foto"); }).join("");
    carregaFotos($("#destacades"));
  }

  /* ================= PÀGINES DE SECCIÓ ================= */
  var main = document.querySelector("main[data-seccio]");
  if (main) {
    var S = seccioPerId(main.getAttribute("data-seccio"));
    document.title = S.menu + " · Emprén a l'Alqueria d'Asnar";
    $("#molla-actual").textContent = S.menu;
    $("#seccio-titol").textContent = S.titol;
    $("#seccio-intro").textContent = S.intro;
    $("#seccio-ic").innerHTML = ic(S.icona);

    var salts = [];
    if ($("#itinerari-detall")) salts.push({ href: "#passos", text: "Els 5 passos" });
    S.grups.forEach(function (g) { salts.push({ href: "#" + g.id, text: g.titol }); });
    $("#salts").innerHTML = salts.map(function (s) { return '<a href="' + s.href + '">' + esc(s.text) + "</a>"; }).join("");

    $("#grups").innerHTML = S.grups.map(function (g, i) {
      var fitxes = g.ids.map(perId).filter(Boolean);
      return '<section class="seccio grup' + (i % 2 ? " seccio--fons" : "") + '" id="' + esc(g.id) + '"><div class="amplada">' +
        '<header class="seccio__cap"><h2>' + esc(g.titol) + "</h2>" + (g.text ? "<p>" + esc(g.text) + "</p>" : "") + "</header>" +
        '<div class="' + graella(g.estil) + '">' + fitxes.map(function (r) { return targeta(r, g.estil); }).join("") + "</div>" +
        (g.enllac ? '<a class="enllac-fort grup__enllac" href="' + esc(g.enllac.url) + '" target="_blank" rel="noopener">' + esc(g.enllac.text) + " " + ic("external-link") + "</a>" : "") +
        "</div></section>";
    }).join("");
    carregaFotos($("#grups"));

    // Començar: itinerari detallat
    if ($("#itinerari-detall")) {
      $("#itinerari-detall").innerHTML = IT.map(function (p, i) {
        var rel = (p.fitxes || []).map(perId).filter(Boolean).map(function (r) {
          return '<a class="xip" href="' + urlFitxa(r.id) + '">' + ic(CAT[r.categoria].icona) + esc(r.nom) + "</a>";
        }).join("");
        return '<li class="pas-detall"><span class="pas__num">' + (i + 1) + "</span>" +
          '<div class="pas-detall__cos"><div class="pas-detall__cap">' + ic(p.icona) + "<h3>" + esc(p.titol) + "</h3></div>" +
          "<p>" + esc(p.detall || p.text) + "</p>" + (rel ? '<div class="xips">' + rel + "</div>" : "") + "</div></li>";
      }).join("");
    }
  }

  /* ================= MAPA I DIRECTORI ================= */
  var actius = {};
  var catInicial = param("cat");
  Object.keys(CAT).forEach(function (k) { actius[k] = !CAT[catInicial] || k === catInicial; });
  var marcadors = {}, empresesMapa = [], mapa = null, grupMapa = null;

  function pintarFiltres() {
    var f = $("#filtres"); if (!f) return;
    f.innerHTML = "<legend>" + ic("sliders-horizontal") + "Filtra per categoria</legend>" +
      Object.keys(CAT).map(function (k) {
        return '<label class="filtre" style="--c:' + CAT[k].color + '"><input type="checkbox" value="' + k + '"' + (actius[k] ? " checked" : "") + ">" +
          '<span class="filtre__ic">' + ic(CAT[k].icona) + '</span><span class="filtre__nom">' + esc(CAT[k].nom) + "</span></label>";
      }).join("") +
      '<button type="button" class="reinicia">' + ic("rotate-ccw") + "Reinicia filtres</button>";
    f.addEventListener("change", function (e) { actius[e.target.value] = e.target.checked; actualitzar(); });
    f.querySelector(".reinicia").addEventListener("click", function () {
      Object.keys(actius).forEach(function (k) { actius[k] = true; });
      f.querySelectorAll("input").forEach(function (i) { i.checked = true; });
      actualitzar();
    });
  }

  // Quadre del mapa: quants punts es veuen ara mateix, per categoria
  function pintarComptadors() {
    var c = $("#comptadors"); if (!c || !mapa) { if (c) c.hidden = true; return; }
    var curt = { espai: "Espais", municipal: "Ajuntament", suport: "Assessorament", oportunitat: "Oportunitats" };
    var html = Object.keys(CAT).map(function (k) {
      if (!actius[k]) return "";
      var n = Object.keys(marcadors).filter(function (id) { return perId(id).categoria === k; }).length;
      if (!n) return "";
      return '<span class="comptador" style="--c:' + CAT[k].color + '"><span class="pin-mini">' + ic(CAT[k].icona) + "</span><span><strong>" + n + "</strong>" + esc(curt[k] || CAT[k].nom) + "</span></span>";
    }).join("");
    var nEmp = empresesMapa.filter(function (x) { return actius[x.cat]; }).length;
    if (nEmp) html += '<span class="comptador" style="--c:' + CAT.espai.color + '"><span class="punt-mini"></span><span><strong>' + nEmp + "</strong>Empreses</span></span>";
    c.innerHTML = html;
    c.hidden = !html;
  }

  // Capes del selector: «Mapa clar» i «Mapa viu» (OpenFreeMap, vectorials) i
  // «Vista aèria» (ortofoto PNOA de l'IGN amb els noms de carrers).
  function capesBase() {
    var IGN = "https://www.ign.es/wmts/{capa}?layer={layer}&style=default&tilematrixset=GoogleMapsCompatible" +
      "&Service=WMTS&Request=GetTile&Version=1.0.0&Format={fmt}&TileMatrix={z}&TileCol={x}&TileRow={y}";
    var atribIGN = 'PNOA CC BY 4.0 <a href="https://www.scne.es" target="_blank" rel="noopener">scne.es</a> · Instituto Geográfico Nacional';
    var atribOFM = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
      'Dades de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    var capes = {}, perDefecte = null;

    var webgl = false;
    try { var cv = document.createElement("canvas"); webgl = !!(cv.getContext("webgl") || cv.getContext("experimental-webgl")); } catch (e) {}
    if (L.maplibreGL && webgl) {
      capes["Mapa clar"] = perDefecte = L.maplibreGL({ style: "https://tiles.openfreemap.org/styles/liberty", attribution: atribOFM });
      capes["Mapa viu"] = L.maplibreGL({ style: "https://tiles.openfreemap.org/styles/bright", attribution: atribOFM });
    }
    capes["Vista aèria"] = L.layerGroup([
      L.tileLayer(IGN, { capa: "pnoa-ma", layer: "OI.OrthoimageCoverage", fmt: "image%2Fjpeg", maxZoom: 19, attribution: atribIGN }),
      L.tileLayer(IGN, { capa: "ign-base", layer: "IGNBaseOrto", fmt: "image%2Fpng", maxZoom: 19 })
    ]);
    if (!perDefecte) perDefecte = capes["Vista aèria"];   // sense mapes vectorials, s'obri la vista aèria
    return { capes: capes, perDefecte: perDefecte };
  }

  function iniciarMapa() {
    if (!$("#mapa")) return;
    if (!window.L) { $(".mapa-caixa").hidden = true; return; }
    var base = capesBase();
    mapa = L.map("mapa", { scrollWheelZoom: false, maxZoom: 19, layers: [base.perDefecte] })
      .setView([C.mapa.lat, C.mapa.lng], C.mapa.zoom);
    L.control.layers(base.capes, null, { position: "topright", collapsed: true }).addTo(mapa);
    L.control.scale({ imperial: false }).addTo(mapa);

    // Agrupació de marcadors pròxims (Leaflet.markercluster)
    grupMapa = L.markerClusterGroup ? L.markerClusterGroup({
      maxClusterRadius: 40,
      disableClusteringAtZoom: 18,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: function (cl) {
        return L.divIcon({ className: "", iconSize: [44, 44], html: '<div class="grup-punts"><span>' + cl.getChildCount() + "</span></div>" });
      }
    }) : L.layerGroup();
    mapa.addLayer(grupMapa);

    R.filter(alMapa).forEach(function (r) {
      var c = CAT[r.categoria];
      var icona = L.divIcon({ className: "", iconSize: [40, 40], iconAnchor: [20, 42], popupAnchor: [0, -40],
        html: '<div class="pin" style="--c:' + c.color + '">' + ic(c.icona) + "</div>" });
      var m = L.marker([r.lat, r.lng], { icon: icona, title: r.nom, keyboard: true });
      m.bindPopup('<div class="popup" style="--c:' + c.color + '"><span class="popup__ic">' + ic(c.icona) + "</span><div><h3>" + esc(r.nom) + "</h3><p>" + esc(r.resum) + '</p><a class="boto boto--mari" href="' + urlFitxa(r.id) + '">Veure fitxa</a></div></div>', { maxWidth: 320 });
      marcadors[r.id] = m;
    });

    // Empreses de les àrees industrials: punts xicotets
    R.forEach(function (r) {
      (r.empreses || []).forEach(function (e) {
        if (typeof e.lat !== "number" || typeof e.lng !== "number") return;
        var c = CAT[r.categoria];
        var m = L.marker([e.lat, e.lng], { title: e.nom, keyboard: true,
          icon: L.divIcon({ className: "", iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10], html: '<span class="punt-empresa" style="--c:' + c.color + '"></span>' }) });
        m.bindTooltip(esc(e.nom), { direction: "top", offset: [0, -10] });
        m.bindPopup('<div class="popup popup--empresa"><div><span class="popup__eti">Empresa · ' + esc(r.nom) + "</span><h3>" + esc(e.nom) + "</h3><p>" + esc(e.activitat) + '</p><a class="boto boto--mari" href="' + urlFitxa(r.id) + '">Veure l\'àrea</a></div></div>', { maxWidth: 300 });
        empresesMapa.push({ m: m, cat: r.categoria });
      });
    });

    // Ajusta la vista perquè es vegen tots els punts
    var punts = Object.keys(marcadors).map(function (id) { return marcadors[id].getLatLng(); })
      .concat(empresesMapa.map(function (x) { return x.m.getLatLng(); }));
    if (punts.length > 1) mapa.fitBounds(L.latLngBounds(punts), { paddingTopLeft: [48, 48], paddingBottomRight: [48, 110], maxZoom: 17 });
  }

  // Directori agrupat per secció i grup, sense repetir fitxes
  function pintarDirectori() {
    var d = $("#directori-grups"); if (!d) return;
    var vistes = {};
    d.innerHTML = SEC.map(function (s) {
      var grups = s.grups.map(function (g) {
        var fitxes = g.ids.filter(function (id) { if (vistes[id]) return false; vistes[id] = true; return true; }).map(perId).filter(Boolean);
        if (!fitxes.length) return "";
        var estil = g.estil === "compacte" ? "compacte" : "normal";
        return '<div class="dir-grup"><h4>' + esc(g.titol) + '</h4><div class="' + graella(estil) + '">' +
          fitxes.map(function (r) { return targeta(r, estil); }).join("") + "</div></div>";
      }).join("");
      return '<section class="dir-seccio" id="dir-' + s.id + '"><header class="dir-seccio__cap"><h3>' + ic(s.icona) + esc(s.menu) + "</h3>" +
        '<a href="' + s.pagina + '">Veure la secció ' + ic("arrow-right") + "</a></header>" + grups + "</section>";
    }).join("");
    $("#salts-mapa").innerHTML = SEC.map(function (s) { return '<a href="#dir-' + s.id + '">' + esc(s.menu) + "</a>"; }).join("");
  }

  function actualitzar() {
    if (grupMapa) {
      var mostra = function (m, si) { if (si && !grupMapa.hasLayer(m)) grupMapa.addLayer(m); else if (!si && grupMapa.hasLayer(m)) grupMapa.removeLayer(m); };
      Object.keys(marcadors).forEach(function (id) { mostra(marcadors[id], actius[perId(id).categoria]); });
      empresesMapa.forEach(function (x) { mostra(x.m, actius[x.cat]); });
    }
    pintarComptadors();
    var d = $("#directori-grups");
    if (d) {
      var visibles = 0;
      d.querySelectorAll("[data-cat]").forEach(function (t) { var v = actius[t.getAttribute("data-cat")]; t.hidden = !v; if (v) visibles++; });
      d.querySelectorAll(".dir-grup").forEach(function (g) { g.hidden = !g.querySelector("[data-cat]:not([hidden])"); });
      d.querySelectorAll(".dir-seccio").forEach(function (s) {
        var buida = !s.querySelector("[data-cat]:not([hidden])"); s.hidden = buida;
        var salt = document.querySelector('#salts-mapa a[href="#' + s.id + '"]'); if (salt) salt.hidden = buida;
      });
      $("#llistat-resum").textContent = visibles + " recursos. Els filtres del mapa també filtren aquest directori.";
    }
  }

  pintarFiltres();
  iniciarMapa();
  pintarDirectori();
  actualitzar();

  /* ================= FITXA ================= */
  if ($("#fitxa-pagina")) {
    var r = perId(param("id"));
    if (!r) {
      $("#fitxa-pagina").innerHTML = '<div class="no-trobada"><h1>No hem trobat aquesta fitxa</h1><p style="margin:12px 0 20px">Pot ser que s\'haja retirat o que l\'enllaç no siga correcte.</p><a class="boto boto--mari" href="mapa.html">Veure tots els recursos</a></div>';
    } else {
      var c = CAT[r.categoria], casa = seccioDe(r.id);
      document.title = r.nom + " · Emprén a l'Alqueria d'Asnar";
      if (casa) marcaMenu(casa.id);
      $("#molles").insertAdjacentHTML("beforeend",
        (casa ? '<span>›</span><a href="' + casa.pagina + '">' + esc(casa.menu) + "</a>" : '<span>›</span><a href="mapa.html">Mapa</a>') +
        "<span>›</span><span>" + esc(r.nom) + "</span>");

      var contacte = [r.entitat, r.adreca, r.telefon && "Tel. " + r.telefon, r.correu, r.horari]
        .filter(function (x) { return x && String(x).trim(); }).map(esc).join("<br>");
      if (r.web) contacte += (contacte ? "<br>" : "") + '<a href="' + esc(r.web) + '" target="_blank" rel="noopener">' + esc(r.web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").slice(0, 60)) + " ↗</a>";

      var fila = function (icona, titol, cos) {
        return cos ? '<div class="fitxa-fila"><span class="bombolla">' + ic(icona) + "</span><div><h2>" + titol + "</h2>" + cos + "</div></div>" : "";
      };
      var esOport = r.categoria === "oportunitat";

      $("#fitxa-pagina").innerHTML =
        '<article class="fitxa-graella" style="--c:' + c.color + '">' +
          '<div class="fitxa-foto" id="fitxa-foto">' + emblema(r) + (r.gratuit ? '<span class="segell">' + ic("circle-check") + "Servei gratuït</span>" : "") + "</div>" +
          '<div class="fitxa-dades">' +
            '<header class="fitxa-cap"><span class="cercle">' + ic(c.icona) + '</span><div><span class="eyebrow">' + esc(c.nom) + '</span><h1 class="accent">' + esc(r.nom) + "</h1>" + estat(r) + pendent(r) + "</div></header>" +
            fila("info", esOport ? "Quina és l'oportunitat?" : "Què és?", "<p>" + esc(r.queEs) + "</p>") +
            fila("clock", "Situació actual", r.situacio && r.situacio.length ? "<ul>" + r.situacio.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul>" : "") +
            fila("users", "A qui s'adreça?", r.perAQui ? "<p>" + esc(r.perAQui) + "</p>" : "") +
            fila("briefcase", esOport ? "Fonament i condicions" : "Què ofereix?", r.ofereix && r.ofereix.length ? "<ul>" + r.ofereix.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul>" : "") +
            fila("factory", "Empreses instal·lades" + (r.empreses && r.empreses.length ? " (" + r.empreses.length + ")" : ""),
              r.empreses && r.empreses.length ? '<ul class="empreses">' + r.empreses.map(function (e) {
                return "<li><strong>" + esc(e.nom) + "</strong><span>" + esc(e.activitat) + "</span></li>";
              }).join("") + "</ul>" : "") +
            fila("calendar-days", "Com accedir-hi?", r.acces ? "<p>" + esc(r.acces) + "</p>" : "") +
            fila("mail", "Contacte", contacte ? "<p>" + contacte + "</p>" : "") +
            fila("external-link", "Enllaços útils", r.enllacos && r.enllacos.length ? "<ul>" + r.enllacos.map(function (e) {
              var ext = /^https?:/.test(e.url);
              return '<li><a href="' + esc(e.url) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(e.text) + (ext ? " ↗" : " →") + "</a></li>";
            }).join("") + "</ul>" : "") +
            '<div class="fitxa-accions"><a class="boto boto--turq" href="index.html?sobre=' + encodeURIComponent(r.id) + '#contacte">' + ic("mail") + "Sol·licita informació</a></div>" +
            (r.font ? '<p class="fitxa-font">Font: ' + esc(r.font) + "</p>" : "") +
          "</div></article>";

      provaFoto(r.foto || FOTOS.fitxaPerDefecte, $("#fitxa-foto"), r.nom, null, r.fotoPosicio);

      // Relacionades: les del mateix grup primer, després la mateixa categoria
      var rel = [];
      SEC.forEach(function (s) { s.grups.forEach(function (g) {
        if (g.ids.indexOf(r.id) > -1) g.ids.forEach(function (id) { if (id !== r.id && rel.indexOf(id) < 0) rel.push(id); });
      }); });
      R.forEach(function (x) { if (x.categoria === r.categoria && x.id !== r.id && rel.indexOf(x.id) < 0) rel.push(x.id); });
      rel = rel.slice(0, 3).map(perId).filter(Boolean);
      if (rel.length) { $("#relacionades-llistat").innerHTML = rel.map(function (x) { return targeta(x, "normal"); }).join(""); $("#relacionades").hidden = false; }
    }
  }

  /* ================= CONTACTE ================= */
  var k = C.contacte;
  if ($("#dades-contacte")) {
    var linia = function (icona, etiqueta, valor) {
      return '<div class="linia"><dt>' + ic(icona) + '<span class="visualment-amagat">' + etiqueta + "</span></dt><dd>" + valor + "</dd></div>";
    };
    $("#dades-contacte").innerHTML =
      linia("map-pin", "Adreça", esc(k.adreca)) +
      linia("phone", "Telèfon", esc(k.telefon)) +
      linia("mail", "Correu", esc(k.correu)) +
      linia("clock", "Horari", esc(k.horari)) +
      (k.seu ? linia("globe", "Seu electrònica", '<a href="' + esc(k.seu) + '" target="_blank" rel="noopener">Seu electrònica ↗</a>') : "");
  }

  var f = $("#formulari");
  if (f) {
    var rgpd = $("#enllac-rgpd");
    if (rgpd && k.privacitat) { rgpd.href = k.privacitat; rgpd.target = "_blank"; rgpd.rel = "noopener"; }
    var sobre = perId(param("sobre"));
    if (sobre) f.consulta.value = "Consulta sobre: " + sobre.nom + "\n\n";
    var cc = $("#comptador-car");
    var compta = function () { cc.textContent = f.consulta.value.length + " / 1000"; };
    f.consulta.addEventListener("input", compta); compta();

    // Prepara un correu adreçat a l'Ajuntament (sense servidor).
    // Si l'Ajuntament té un sistema de formularis, substituir aquest bloc.
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = $("#formulari-error");
      if (!f.checkValidity()) {
        var primer = f.querySelector(":invalid");
        err.textContent = primer && primer.id === "f-rgpd" ? "Cal acceptar la política de protecció de dades." : "Revisa els camps obligatoris (*) i el format del correu.";
        err.hidden = false; if (primer) primer.focus(); return;
      }
      err.hidden = true;
      var cos = "Nom: " + f.nom.value + "\nCorreu: " + f.correu.value + "\nTelèfon: " + (f.telefon.value || "-") + "\nNecessitat: " + f.tipus.value + "\n\n" + f.consulta.value;
      location.href = "mailto:" + encodeURIComponent(k.correu) + "?subject=" + encodeURIComponent("Emprén a l'Alqueria d'Asnar · " + f.tipus.value) + "&body=" + encodeURIComponent(cos);
    });
  }
};
