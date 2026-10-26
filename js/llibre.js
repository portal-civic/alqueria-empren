/* ==========================================================================
   Conversor dades.xlsx → dades de la web
   --------------------------------------------------------------------------
   Llig les pestanyes de l'Excel i construeix les mateixes dades que usa la web
   (CONFIG, RECURSOS, SECCIONS…). Comprova l'estructura i retorna:
     { dades: {...}, errors: [...], avisos: [...] }
   Si hi ha errors greus, la web no usa l'Excel i continua amb la còpia de
   seguretat (js/dades.js).
   NO cal editar aquest fitxer per a actualitzar continguts: editeu dades.xlsx.
   ========================================================================== */
(function (arrel) {
  "use strict";

  // Noms de les pestanyes i de les columnes (han de coincidir amb l'Excel)
  var F = {
    config: "Configuració", contacte: "Contacte", xifres: "Xifres", categories: "Categories",
    fitxes: "Fitxes", empreses: "Empreses", seccions: "Seccions", grups: "Grups",
    necessitats: "Què necessites", destacades: "Destacades", itinerari: "Itinerari"
  };

  var COL_FITXES = {
    "Codi": "id", "Publicar (sí/no)": "_publicar", "Categoria": "categoria", "Nom": "nom", "Estat": "estat",
    "Resum": "resum", "Què és?": "queEs", "A qui s'adreça?": "perAQui",
    "Situació actual (una línia per punt)": "situacio", "Què ofereix? (una línia per punt)": "ofereix",
    "Com accedir-hi?": "acces", "Entitat": "entitat", "Adreça": "adreca", "Telèfon": "telefon",
    "Correu": "correu", "Horari": "horari", "Web": "web",
    "Enllaços útils (Text | adreça, un per línia)": "enllacos",
    "Latitud": "lat", "Longitud": "lng", "Al mapa (sí/no)": "_mapa", "Servei gratuït (sí/no)": "gratuit",
    "Validada (sí/no)": "validat", "Què falta (etiqueta groga)": "pendent", "Font": "font",
    "Icona": "icona", "Foto": "foto", "Enquadrament de la foto": "fotoPosicio"
  };
  var OBLIG_FITXES = ["Codi", "Categoria", "Nom", "Resum"];

  var CONFIG_CLAUS = {
    "Mode revisió (sí/no)": "modeRevisio",
    "Data d'actualització": "dataActualitzacio",
    "Mapa · latitud del centre": "mapaLat",
    "Mapa · longitud del centre": "mapaLng",
    "Mapa · zoom inicial": "mapaZoom",
    "Foto de portada": "fotoPortada",
    "Foto per defecte de les fitxes": "fotoFitxa",
    "Font de les xifres de portada": "fontXifres",
    "Font de les xifres d'Oportunitats": "fontSectors"
  };
  var CONTACTE_CLAUS = {
    "Nom de l'àrea": "area", "Adreça": "adreca", "Telèfon": "telefon",
    "Correu (rep les consultes)": "correu", "Horari": "horari", "Web municipal": "web",
    "Seu electrònica": "seu", "Política de privacitat (enllaç)": "privacitat"
  };

  /* ---------- Utilitats ---------- */
  function txt(v) {
    if (v == null) return "";
    if (typeof v === "number") return String(v);
    return String(v).replace(/\r\n?/g, "\n").trim();
  }
  function linies(v) { return txt(v).split("\n").map(function (l) { return l.replace(/^[-•·]\s*/, "").trim(); }).filter(Boolean); }
  function llista(v) { return txt(v).split(/[,;\n]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function siNo(v, perDefecte) {
    var t = txt(v).toLowerCase();
    if (!t) return perDefecte;
    return t === "sí" || t === "si" || t === "s" || t === "yes" || t === "true" || t === "1";
  }
  function num(v) {
    if (typeof v === "number") return v;
    var t = txt(v).replace(",", ".");
    if (!t) return null;
    var n = Number(t);
    return isFinite(n) ? n : NaN;
  }

  // Llig una pestanya amb capçalera a la fila 1 → llista d'objectes {capçalera: valor}
  function taula(wb, XLSX, nom, errors, columnesOblig) {
    var ws = wb.Sheets[nom];
    if (!ws) { errors.push("Falta la pestanya «" + nom + "»."); return null; }
    var files = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
    if (!files.length) { errors.push("La pestanya «" + nom + "» està buida."); return null; }
    var cap = files[0].map(txt);
    (columnesOblig || []).forEach(function (c) {
      if (cap.indexOf(c) < 0) errors.push("A la pestanya «" + nom + "» falta la columna «" + c + "».");
    });
    var res = [];
    for (var i = 1; i < files.length; i++) {
      var f = files[i];
      if (!f.some(function (x) { return txt(x) !== ""; })) continue;   // fila buida
      var o = { _fila: i + 1 };
      cap.forEach(function (c, j) { if (c) o[c] = f[j]; });
      res.push(o);
    }
    return res;
  }
  // Pestanya de tipus «Clau | Valor»
  function claus(wb, XLSX, nom, mapa, errors) {
    var t = taula(wb, XLSX, nom, errors, ["Clau", "Valor"]);
    var o = {};
    (t || []).forEach(function (r) { var k = mapa[txt(r["Clau"])]; if (k) o[k] = r["Valor"]; });
    return o;
  }

  function aDades(wb, XLSX) {
    var errors = [], avisos = [];

    /* Configuració */
    var cf = claus(wb, XLSX, F.config, CONFIG_CLAUS, errors);
    var ct = claus(wb, XLSX, F.contacte, CONTACTE_CLAUS, errors);

    /* Categories */
    var CATEGORIES = {};
    (taula(wb, XLSX, F.categories, errors, ["Codi", "Nom", "Color", "Icona"]) || []).forEach(function (r) {
      var k = txt(r["Codi"]); if (!k) return;
      CATEGORIES[k] = { nom: txt(r["Nom"]), color: txt(r["Color"]) || "#158a8c", icona: txt(r["Icona"]) || "circle-check" };
    });
    if (!Object.keys(CATEGORIES).length) errors.push("No hi ha cap categoria a la pestanya «" + F.categories + "».");

    /* Xifres */
    var xifres = [], sectors = [];
    (taula(wb, XLSX, F.xifres, errors, ["Bloc", "Xifra", "Text"]) || []).forEach(function (r) {
      var x = { valor: txt(r["Xifra"]), text: txt(r["Text"]) };
      if (!x.valor) return;
      (/oportunitat/i.test(txt(r["Bloc"])) ? sectors : xifres).push(x);
    });

    /* Fitxes */
    var RECURSOS = [], vistos = {};
    var tf = taula(wb, XLSX, F.fitxes, errors, OBLIG_FITXES) || [];
    tf.forEach(function (r) {
      var o = {};
      Object.keys(COL_FITXES).forEach(function (c) { if (c in r) o[COL_FITXES[c]] = r[c]; });
      var id = txt(o.id);
      if (!id) { if (txt(o.nom)) avisos.push("Fitxes, fila " + r._fila + ": no té codi i no es publica."); return; }
      if (!siNo(o._publicar, true)) return;
      if (vistos[id]) { errors.push("Fitxes: el codi «" + id + "» està repetit (files " + vistos[id] + " i " + r._fila + ")."); return; }
      vistos[id] = r._fila;
      if (!/^[a-z0-9-]+$/.test(id)) avisos.push("Fitxes: el codi «" + id + "» hauria de tindre només minúscules, números i guions.");
      var cat = txt(o.categoria);
      if (!CATEGORIES[cat]) { errors.push("Fitxes, fila " + r._fila + " («" + id + "»): la categoria «" + cat + "» no existeix."); return; }

      var f = { id: id, categoria: cat, nom: txt(o.nom), resum: txt(o.resum) };
      ["estat", "queEs", "perAQui", "acces", "entitat", "adreca", "telefon", "correu", "horari", "web", "pendent", "font", "icona", "foto", "fotoPosicio"]
        .forEach(function (k) { var v = txt(o[k]); if (v) f[k] = v; });
      var sit = linies(o.situacio); if (sit.length) f.situacio = sit;
      f.ofereix = linies(o.ofereix);
      var enl = linies(o.enllacos).map(function (l) {
        var p = l.split("|"); return p.length > 1 ? { text: p[0].trim(), url: p.slice(1).join("|").trim() } : { text: l, url: l };
      }); if (enl.length) f.enllacos = enl;
      var lat = num(o.lat), lng = num(o.lng);
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) { f.lat = lat; f.lng = lng; }
      else if (lat != null || lng != null) avisos.push("Fitxes («" + id + "»): les coordenades no són vàlides i no ix al mapa.");
      if (!siNo(o._mapa, true)) f.mapa = false;
      f.gratuit = siNo(o.gratuit, false);
      f.validat = siNo(o.validat, false);
      RECURSOS.push(f);
    });
    if (!RECURSOS.length) errors.push("No hi ha cap fitxa publicada a la pestanya «" + F.fitxes + "».");
    function existeix(id) { return !!vistos[id]; }

    /* Empreses → dins de la fitxa de la seua àrea */
    (taula(wb, XLSX, F.empreses, errors, ["Àrea (codi de fitxa)", "Empresa", "Activitat"]) || []).forEach(function (r) {
      var area = txt(r["Àrea (codi de fitxa)"]), nom = txt(r["Empresa"]);
      if (!nom) return;
      var f = RECURSOS.filter(function (x) { return x.id === area; })[0];
      if (!f) { avisos.push("Empreses, fila " + r._fila + ": l'àrea «" + area + "» no és cap fitxa publicada."); return; }
      var e = { nom: nom, activitat: txt(r["Activitat"]) };
      var lat = num(r["Latitud"]), lng = num(r["Longitud"]);
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) { e.lat = lat; e.lng = lng; }
      (f.empreses = f.empreses || []).push(e);
    });

    /* Seccions i grups */
    var SECCIONS = [];
    (taula(wb, XLSX, F.seccions, errors, ["Secció", "Pàgina", "Menú", "Icona", "Títol", "Introducció"]) || []).forEach(function (r) {
      var id = txt(r["Secció"]); if (!id) return;
      SECCIONS.push({ id: id, pagina: txt(r["Pàgina"]), menu: txt(r["Menú"]), icona: txt(r["Icona"]), titol: txt(r["Títol"]), intro: txt(r["Introducció"]), grups: [] });
    });
    (taula(wb, XLSX, F.grups, errors, ["Secció", "Codi del grup", "Títol", "Estil", "Fitxes (codis separats per comes)"]) || []).forEach(function (r) {
      var s = SECCIONS.filter(function (x) { return x.id === txt(r["Secció"]); })[0];
      if (!s) { avisos.push("Grups, fila " + r._fila + ": la secció «" + txt(r["Secció"]) + "» no existeix."); return; }
      var ids = llista(r["Fitxes (codis separats per comes)"]).filter(function (id) {
        if (existeix(id)) return true;
        avisos.push("Grups («" + txt(r["Codi del grup"]) + "»): la fitxa «" + id + "» no existeix o no es publica.");
        return false;
      });
      if (!ids.length) return;
      var g = { id: txt(r["Codi del grup"]) || ("grup-" + r._fila), titol: txt(r["Títol"]), estil: txt(r["Estil"]) || "normal", ids: ids };
      if (txt(r["Text"])) g.text = txt(r["Text"]);
      if (txt(r["Enllaç · adreça"])) g.enllac = { text: txt(r["Enllaç · text"]) || txt(r["Enllaç · adreça"]), url: txt(r["Enllaç · adreça"]) };
      s.grups.push(g);
    });

    /* Portada: Què necessites i destacades */
    var NECESSITATS = (taula(wb, XLSX, F.necessitats, errors, ["Títol", "Text", "Icona", "Enllaç"]) || [])
      .filter(function (r) { return txt(r["Títol"]); })
      .map(function (r) { return { titol: txt(r["Títol"]), text: txt(r["Text"]), icona: txt(r["Icona"]) || "circle-check", href: txt(r["Enllaç"]) || "#" }; });
    var DESTACADES = (taula(wb, XLSX, F.destacades, errors, ["Fitxa (codi)"]) || [])
      .map(function (r) { return txt(r["Fitxa (codi)"]); })
      .filter(function (id) { if (!id) return false; if (existeix(id)) return true; avisos.push("Destacades: la fitxa «" + id + "» no existeix o no es publica."); return false; });

    /* Itinerari */
    var ITINERARI = (taula(wb, XLSX, F.itinerari, errors, ["Títol", "Icona", "Text curt (portada)", "Text llarg (pàgina Començar)"]) || [])
      .filter(function (r) { return txt(r["Títol"]); })
      .map(function (r) {
        return {
          titol: txt(r["Títol"]), icona: txt(r["Icona"]) || "circle-check",
          text: txt(r["Text curt (portada)"]), detall: txt(r["Text llarg (pàgina Començar)"]),
          enllac: { text: txt(r["Enllaç · text"]), href: txt(r["Enllaç · adreça"]) },
          fitxes: llista(r["Fitxes relacionades"]).filter(existeix)
        };
      });

    var lat = num(cf.mapaLat), lng = num(cf.mapaLng), zoom = num(cf.mapaZoom);
    var dades = {
      CONFIG: {
        modeRevisio: siNo(cf.modeRevisio, false),
        municipi: "l'Alqueria d'Asnar",
        dataActualitzacio: txt(cf.dataActualitzacio),
        mapa: { lat: isFinite(lat) && lat != null ? lat : 38.7733, lng: isFinite(lng) && lng != null ? lng : -0.4252, zoom: isFinite(zoom) && zoom != null ? zoom : 17 },
        contacte: {
          area: txt(ct.area), adreca: txt(ct.adreca), telefon: txt(ct.telefon), correu: txt(ct.correu),
          horari: txt(ct.horari), web: txt(ct.web), seu: txt(ct.seu), privacitat: txt(ct.privacitat)
        },
        xifres: xifres,
        fontXifres: txt(cf.fontXifres)
      },
      CATEGORIES: CATEGORIES,
      NECESSITATS: NECESSITATS,
      SECCIONS: SECCIONS,
      XIFRES_SECTORS: sectors,
      FONT_SECTORS: txt(cf.fontSectors),
      DESTACADES: DESTACADES,
      FOTOS: { portada: txt(cf.fotoPortada), fitxaPerDefecte: txt(cf.fotoFitxa) },
      RECURSOS: RECURSOS,
      ITINERARI: ITINERARI
    };
    return { dades: dades, errors: errors, avisos: avisos };
  }

  // Genera el text de js/dades.js (còpia de seguretat) a partir de les dades
  function aDadesJs(d, origen) {
    var cap = "/* ==========================================================================\n" +
      "   CÒPIA DE SEGURETAT DE LES DADES — generada automàticament a partir de " + (origen || "dades.xlsx") + "\n" +
      "   No l'editeu a mà: editeu dades.xlsx. La web usa aquest fitxer només quan\n" +
      "   no pot llegir l'Excel (per exemple, en obrir-la amb doble clic).\n" +
      "   ========================================================================== */\n";
    return cap + Object.keys(d).map(function (k) { return "window." + k + " = " + JSON.stringify(d[k], null, 2) + ";\n"; }).join("\n");
  }

  var api = { aDades: aDades, aDadesJs: aDadesJs, FULLS: F };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else arrel.EmprenLlibre = api;
})(typeof window !== "undefined" ? window : this);
