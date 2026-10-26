/* ==========================================================================
   Carregador de dades
   --------------------------------------------------------------------------
   · Web publicada (http/https): llig dades.xlsx del servidor. Si no el pot
     llegir o té errors greus, usa la còpia de seguretat (js/dades.js).
   · Web oberta amb doble clic (file://): el navegador no deixa llegir l'Excel
     automàticament. Es mostra una franja per a arrossegar-hi dades.xlsx i
     previsualitzar els canvis. L'Excel arrossegat es recorda en aquest navegador.
   No cal editar aquest fitxer.
   ========================================================================== */
(function () {
  "use strict";

  var ARXIU = "dades.xlsx";
  var CLAU = "emprenAlqueria.dadesLocals";
  var esLocal = location.protocol === "file:";
  var iniciat = false;

  function aplica(d) { Object.keys(d).forEach(function (k) { window[k] = d[k]; }); }
  function arrenca() { if (iniciat) return; iniciat = true; window.iniciaApp(); }
  function llig(buf) { return window.EmprenLlibre.aDades(window.XLSX.read(buf, { type: "array" }), window.XLSX); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- Avisos de l'Excel (només en mode revisió o en local) ---------- */
  function mostraProblemes(errors, avisos, origen) {
    if (!errors.length && !avisos.length) return;
    var revisio = window.CONFIG && window.CONFIG.modeRevisio;
    if (!revisio && !esLocal) { if (window.console) console.warn("dades.xlsx:", errors, avisos); return; }
    var div = document.createElement("div");
    div.className = "avis-dades" + (errors.length ? " avis-dades--error" : "");
    div.setAttribute("role", "status");
    div.innerHTML = '<div class="amplada"><strong>' +
      (errors.length ? "L'Excel té errors i no s'ha pogut usar. Es mostra l'última còpia bona." : "L'Excel s'ha carregat amb avisos.") +
      "</strong><ul>" + (errors.length ? errors : avisos).slice(0, 12).map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul></div>";
    var revisioBand = document.getElementById("avis-revisio");
    if (revisioBand) revisioBand.parentNode.insertBefore(div, revisioBand.nextSibling);
    else document.body.insertBefore(div, document.body.firstChild);
  }

  /* ================= WEB PUBLICADA ================= */
  if (!esLocal) {
    var temps = setTimeout(arrenca, 6000);   // si el servidor tarda massa, es mostra la còpia
    fetch(ARXIU + "?v=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(function (buf) {
        var res = llig(buf);
        if (!res.errors.length) aplica(res.dades);
        clearTimeout(temps); arrenca();
        mostraProblemes(res.errors, res.avisos);
      })
      .catch(function (e) {
        if (window.console) console.warn("No s'ha pogut llegir " + ARXIU + "; s'usa la còpia de seguretat.", e);
        clearTimeout(temps); arrenca();
      });
    return;
  }

  /* ================= WEB OBERTA AMB DOBLE CLIC ================= */
  function desa(obj) {
    var t = JSON.stringify(obj);
    try { localStorage.setItem(CLAU, t); return true; } catch (e) {}
    try { window.name = CLAU + t; return true; } catch (e) {}
    return false;
  }
  function recupera() {
    try { var t = localStorage.getItem(CLAU); if (t) return JSON.parse(t); } catch (e) {}
    try { if (window.name.indexOf(CLAU) === 0) return JSON.parse(window.name.slice(CLAU.length)); } catch (e) {}
    return null;
  }
  function oblida() {
    try { localStorage.removeItem(CLAU); } catch (e) {}
    try { if (window.name.indexOf(CLAU) === 0) window.name = ""; } catch (e) {}
  }

  var guardat = recupera();
  if (guardat && guardat.dades) aplica(guardat.dades);
  arrenca();
  if (guardat && guardat.avisos) mostraProblemes([], guardat.avisos);

  // Franja inferior
  var barra = document.createElement("div");
  barra.className = "local-barra";
  barra.setAttribute("role", "region");
  barra.setAttribute("aria-label", "Vista local de la web");
  function pinta(missatgeError) {
    var estat = guardat
      ? "Dades de <strong>" + esc(guardat.nom) + "</strong> (carregat el " + esc(guardat.hora) + ")"
      : "Dades de la <strong>còpia de seguretat</strong>";
    barra.innerHTML =
      '<div class="local-barra__text"><span class="local-barra__eti">Vista local</span> ' + estat +
      '. Per a veure els canvis del teu Excel, arrossega <strong>' + ARXIU + "</strong> damunt de la pàgina.</div>" +
      '<div class="local-barra__accions">' +
        '<label class="local-boto local-boto--principal">Tria l\'Excel<input type="file" accept=".xlsx" id="local-arxiu" hidden></label>' +
        (guardat ? '<button type="button" class="local-boto" id="local-baixa">Descarrega la còpia de seguretat</button>' +
                   '<button type="button" class="local-boto" id="local-oblida">Torna a la còpia</button>' : "") +
        '<button type="button" class="local-boto local-boto--x" id="local-amaga" aria-label="Amaga">×</button>' +
      "</div>" +
      (missatgeError ? '<div class="local-barra__error">' + missatgeError + "</div>" : "");
    barra.querySelector("#local-arxiu").addEventListener("change", function (e) { if (e.target.files[0]) carrega(e.target.files[0]); });
    var b = barra.querySelector("#local-baixa"); if (b) b.addEventListener("click", baixa);
    var o = barra.querySelector("#local-oblida"); if (o) o.addEventListener("click", function () { oblida(); location.reload(); });
    barra.querySelector("#local-amaga").addEventListener("click", function () { barra.hidden = true; });
  }
  pinta();
  document.body.appendChild(barra);

  function carrega(arxiu) {
    if (!/\.xlsx$/i.test(arxiu.name)) { pinta("L'arxiu ha de ser un Excel (.xlsx)."); return; }
    var lector = new FileReader();
    lector.onload = function () {
      var res;
      try { res = llig(new Uint8Array(lector.result)); }
      catch (e) { pinta("No s'ha pogut llegir l'arxiu. Comprova que és un Excel (.xlsx) i que no està obert amb errors."); return; }
      if (res.errors.length) {
        pinta("<strong>L'Excel té errors i no es pot usar:</strong><ul>" + res.errors.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ul>");
        return;
      }
      var ara = new Date();
      var hora = ara.toLocaleDateString("ca") + " a les " + ara.toLocaleTimeString("ca", { hour: "2-digit", minute: "2-digit" });
      if (desa({ dades: res.dades, nom: arxiu.name, hora: hora, avisos: res.avisos })) location.reload();
      else pinta("Aquest navegador no permet guardar la previsualització. Prova amb Chrome o Edge.");
    };
    lector.readAsArrayBuffer(arxiu);
  }

  function baixa() {
    var text = window.EmprenLlibre.aDadesJs(guardat.dades, guardat.nom);
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    a.download = "dades.js";
    document.body.appendChild(a); a.click(); a.remove();
    pinta("S'ha descarregat <strong>dades.js</strong>. Substitueix amb ell l'arxiu <strong>js/dades.js</strong> de la carpeta perquè la còpia de seguretat tinga les mateixes dades que l'Excel.");
  }

  // Arrossegar i deixar anar
  var capa = document.createElement("div");
  capa.className = "local-capa"; capa.hidden = true;
  capa.innerHTML = "<div>Deixa anar <strong>" + ARXIU + "</strong> per a veure la web amb aquestes dades</div>";
  document.body.appendChild(capa);
  var comptador = 0;
  window.addEventListener("dragenter", function (e) { e.preventDefault(); comptador++; capa.hidden = false; });
  window.addEventListener("dragleave", function () { if (--comptador <= 0) { comptador = 0; capa.hidden = true; } });
  window.addEventListener("dragover", function (e) { e.preventDefault(); });
  window.addEventListener("drop", function (e) {
    e.preventDefault(); comptador = 0; capa.hidden = true;
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) { barra.hidden = false; carrega(f); }
  });
})();
