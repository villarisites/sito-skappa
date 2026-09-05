import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadCatalog() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ["data/destinations.js", "data/categorie.js", "js/catalog.js"]) {
    vm.runInContext(await readFile(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return context.window;
}

async function loadHome() {
  return readFile(path.join(ROOT, "index.html"), "utf8");
}

function oblo(page) {
  return Array.from(page.matchAll(/<a class="volo-oblo"[^>]*>/g), (match) => match[0]);
}

test("cabina_haUnFinestrinoPerMetaInEvidenza", async () => {
  // Arrange — nella cabina non entrano tutte le mete: al passo dei finestrini
  // 27 farebbero una scena larga quasi ventimila pixel. Le altre restano
  // raggiungibili dalle categorie.
  const { SkappaCatalog } = await loadCatalog();
  const page = await loadHome();

  // Act
  const finestrini = Array.from(page.matchAll(/<a class="presa"[^>]*data-meta="([^"]+)"/g), (m) => m[1]);

  // Assert
  assert.ok(finestrini.length > 0, "nessun finestrino generato");
  assert.ok(finestrini.length <= SkappaCatalog.tutte().length);
  // Array.from e non .map(): tutte() nasce dentro il contesto vm, cioe' in un
  // altro realm, e deepStrictEqual confronta anche il prototipo — due array con
  // gli stessi valori risultano diversi.
  const attesi = Array.from(SkappaCatalog.tutte(), (d) => d.id).slice(0, finestrini.length);
  assert.deepEqual(finestrini, attesi, "i finestrini non seguono l'ordine del catalogo");
});

test("cabina_iFinestrinoSonoLinkVeriEFunzionanoSenzaJavaScript", async () => {
  // Arrange — senza JS la scena non si accende e restano i link, che devono
  // portare comunque alla meta ed essere leggibili dai motori di ricerca.
  const { SkappaCatalog } = await loadCatalog();
  const page = await loadHome();

  // Act
  const hrefs = Array.from(page.matchAll(/<a class="presa"[^>]*href="([^"]+)"/g), (m) => m[1]);
  const attesi = Array.from(SkappaCatalog.tutte(), (d) => SkappaCatalog.urlDettaglio(d)).slice(0, hrefs.length);

  // Assert
  assert.deepEqual(hrefs, attesi);
});

test("volo_portholeCarriesNameAndPriceLabel", async () => {
  // Arrange
  const page = await loadHome();

  // Act
  const portholes = oblo(page);

  // Assert
  for (const porthole of portholes) {
    assert.match(porthole, /data-nome="[^"]+"/);
    assert.match(porthole, /data-prezzo="(Da \d+€|Su richiesta)"/);
    assert.match(porthole, /data-hero="[^"]+"/);
  }
});

test("cabina_leMeteSonoUnaSolaVerita", async () => {
  // Arrange — js/cabina.js NON ha un elenco di mete: le legge dai link generati.
  // Due elenchi da tenere allineati a mano e' il modo in cui, nel prototipo,
  // cinque destinazioni sono rimaste senza link.
  const script = await readFile(path.join(ROOT, "js", "cabina.js"), "utf8");

  // Assert
  assert.match(script, /querySelectorAll\('\.presa'\)/,
    "cabina.js non legge le mete dai link");
  assert.doesNotMatch(script, /var METE = \[\s*\{/,
    "cabina.js ha di nuovo un elenco di mete scritto a mano");
});

test("volo_heroTextStaysInTheStaticHtml", async () => {
  // Arrange — il testo dell'hero non deve dipendere dal JS, e' l'LCP
  const page = await loadHome();

  // Assert
  assert.match(page, /scritta skappa\.webp/);
  assert.match(page, /id="heroPriceMin"/);
  assert.match(page, /class="hero volo"/);
});

test("cabina_scriptsAndStylesAreWiredIn", async () => {
  // Arrange
  const page = await loadHome();

  // Assert
  assert.match(page, /href="css\/cabina\.css"/);
  assert.match(page, /src="js\/cabina\.js"/);
  // GSAP e Flip sono vendorizzati: la CSP del progetto vieta i CDN
  assert.match(page, /src="js\/vendor\/gsap\.min\.js"/);
  assert.match(page, /src="js\/vendor\/Flip\.min\.js"/);
  // il canvas del shader deve avere un contenitore suo: si dimensiona sul
  // genitore, e con la cabina dentro la sezione diventava alto quanto tutto
  assert.match(page, /class="hero-testata"/);
});

test("volo_respectsReducedMotion", async () => {
  // Arrange
  const css = await readFile(path.join(ROOT, "css", "volo.css"), "utf8");
  const script = await readFile(path.join(ROOT, "js", "volo.js"), "utf8");

  // Assert
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(script, /prefers-reduced-motion: reduce/);
});

test("volo_heroNonPromettePrezziCheIlCatalogoNonHa", async () => {
  // Arrange — quello che conta e' l'HTML SERVITO: e' quello che leggono i motori
  // di ricerca e chi ha JavaScript lento. Il claim era scritto a mano e diceva
  // "DA 169€" mentre tutte le mete dicevano "Su richiesta".
  const catalogo = (await loadCatalog()).SkappaCatalog;
  const conPrezzo = catalogo.tutte()
    .map((d) => Number(d.prezzo))
    .filter((n) => Number.isFinite(n) && n > 0);
  const home = await loadHome();
  const hero = home.slice(home.indexOf("<!--#prezzo inizio-->"), home.indexOf("<!--#prezzo fine-->"));

  // Assert
  assert.notEqual(hero.length, 0, "marcatori #prezzo assenti: il claim non e' generato");
  if (conPrezzo.length === 0) {
    assert.doesNotMatch(hero, /\d+\s*€/, "l'hero promette un prezzo che nessuna meta ha");
    assert.doesNotMatch(hero, /a partire/i, '"a partire" davanti a nessun prezzo');
  } else {
    assert.match(hero, new RegExp(`DA\s*${Math.min(...conPrezzo)}`),
      "l'hero non mostra il minimo vero del catalogo");
  }
});

test("volo_ilClaimDellHeroNonSiRicalcolaAncheARuntime", async () => {
  // Arrange — due verita' diverse per lo stesso dato significa che una e' sbagliata,
  // e quella nell'HTML e' proprio quella che finisce ai motori di ricerca.
  const home = await loadHome();

  // Assert
  assert.doesNotMatch(home, /heroPriceMin'\)[\s\S]{0,200}textContent\s*=/,
    "il prezzo dell'hero viene ancora sovrascritto a runtime");
});
