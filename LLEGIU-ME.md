# Emprén a l'Alqueria d'Asnar — instruccions

Eina municipal d'acollida emprenedora. Web estàtica (HTML, CSS i JavaScript), sense base de dades ni programari al servidor.

**Totes les dades de la web estan a `dades.xlsx`.** Per a actualitzar-la només cal editar aquest Excel i pujar-lo al servidor.

## Com s'actualitza la web

1. Obrir `dades.xlsx`, fer els canvis i desar-lo amb el mateix nom i en format .xlsx. La pestanya «Instruccions» de l'Excel explica cada pestanya i les normes per a no trencar res.
2. (Opcional) Previsualitzar: obrir `index.html` amb doble clic i arrossegar `dades.xlsx` damunt de la pàgina.
3. Pujar `dades.xlsx` al servidor, dins de la carpeta de la web, substituint l'anterior.

La web publicada llig l'Excel cada vegada que s'obri. No cal tocar cap altre arxiu.

### Fotografies

Pujar la imatge a la carpeta `img/` i escriure'n la ruta a la columna «Foto» de la fitxa (p. ex. `img/bar-la-llar.jpg`). Format recomanat: JPG horitzontal, mínim 1200×800 px i menys de 400 KB. Sense foto, la fitxa mostra la seua icona.

## Com funciona

| Situació | D'on agafa les dades |
|---|---|
| Web publicada en un servidor | `dades.xlsx` |
| Web publicada, però l'Excel té un error greu o no es troba | `js/dades.js` (còpia de seguretat). En mode revisió es mostra l'error |
| Web oberta amb doble clic (sense servidor) | `js/dades.js`, o l'Excel que s'hi haja arrossegat |

**Per què no llig l'Excel amb doble clic?** Els navegadors no permeten que una pàgina oberta des del disc llija altres arxius sense que l'usuari ho indique. Per això, en local apareix una franja per a arrossegar-hi l'Excel. El navegador el recorda fins que es prem «Torna a la còpia».

**Còpia de seguretat (`js/dades.js`).** No s'edita a mà. Per a actualitzar-la: arrossegar `dades.xlsx` en la vista local, prémer «Descarrega la còpia de seguretat» i substituir `js/dades.js` amb l'arxiu descarregat. Convé fer-ho cada vegada que es faça un canvi important a l'Excel.

## Contingut de la carpeta

| Ruta | Què és |
|---|---|
| `dades.xlsx` | **Totes les dades de la web.** És l'únic arxiu que cal editar |
| `index.html` | Inici |
| `comencar.html` | Començar: 5 passos, assessorament i tràmits |
| `espais.html` | Espais: locals municipals, àrees industrials i equipaments |
| `suport.html` | Suport i ajudes |
| `oportunitats.html` | Oportunitats: teixit econòmic i sectors amb potencial |
| `mapa.html` | Mapa i directori complet. Admet `?cat=espai`, `?cat=oportunitat`, etc. |
| `fitxa.html` | Plantilla de fitxa: `fitxa.html?id=codi-de-la-fitxa` |
| `recursos.html` | Redirecció a `mapa.html` (adreça antiga) |
| `js/dades.js` | Còpia de seguretat de les dades (generada; no editar) |
| `js/llibre.js` | Conversor de l'Excel a dades de la web |
| `js/carrega.js` | Decideix d'on venen les dades i gestiona la vista local |
| `js/app.js` | Lògica de les pàgines |
| `js/icones.js` | Icones (Lucide, llicència ISC) |
| `css/estils.css` | Estils, amb la tipografia Nunito Sans incrustada (llicència OFL, a `fonts/`) |
| `img/` | Escut, logo de la Diputació i fotografies |
| `vendor/leaflet/` | Llibreria del mapa (Leaflet 1.9.4, BSD-2) |
| `vendor/markercluster/` | Agrupació de marcadors (Leaflet.markercluster 1.5.3, MIT) |
| `vendor/maplibre/` | Mapes vectorials (MapLibre GL 4.7.1, BSD-3, i maplibre-gl-leaflet 0.1.3) |
| `vendor/sheetjs/` | Llibreria per a llegir Excel (SheetJS 0.18.5, Apache 2.0) |

## Com publicar

**Opció A (recomanada):** copiar la carpeta tal qual al servidor, per exemple a `https://www.lalqueriadasnar.es/emprendre/`, i enllaçar-la des del menú de la web municipal.

**Opció B:** si el gestor de continguts no permet carpetes, pujar-la a un subdomini (p. ex. `emprendre.lalqueriadasnar.es`).

Requisit del servidor: que servisca l'arxiu `.xlsx` com a arxiu estàtic (ho fan tots els servidors per defecte). Si hi ha una memòria cau agressiva, la web ja demana sempre la versió més recent de l'Excel.

## Abans de publicar

1. Omplir a l'Excel les dades pendents (pestanya «Contacte»: política de privacitat).
2. A la pestanya «Configuració», posar «Mode revisió» a **no**. Això amaga la franja de revisió i les etiquetes grogues.
3. Actualitzar la còpia de seguretat (`js/dades.js`) com s'explica més amunt.
4. Llevar de totes les pàgines HTML la línia `<meta name="robots" content="noindex, nofollow">`, que evita que els cercadors indexen la versió de revisió.

## Formulari de contacte

No envia dades a cap servidor: prepara un correu adreçat a l'adreça de la pestanya «Contacte». Si l'Ajuntament té un sistema de formularis o vol derivar a la instància genèrica de la seu electrònica, cal substituir el bloc «Contacte» de `js/app.js`.

## Mapa

Selector de tres capes, totes gratuïtes i sense clau:

- **Mapa clar** (per defecte): OpenFreeMap, estil «Liberty» (mapa vectorial amb dades d'OpenStreetMap).
- **Mapa viu**: OpenFreeMap, estil «Bright».
- **Vista aèria**: ortofoto PNOA de l'Instituto Geográfico Nacional amb els noms de carrers de l'IGN (CC BY 4.0).

Els marcadors pròxims s'agrupen en cercles amb un número (Leaflet.markercluster) i se separen en apropar el zoom. Si el navegador no pot dibuixar mapes vectorials (sense WebGL), el mapa s'obri amb la vista aèria. No s'usen Google Fonts ni cap servei de seguiment.

Nota: la capçalera, el menú i el peu són idèntics a totes les pàgines HTML. Si es canvia el menú, cal canviar-lo a totes.
