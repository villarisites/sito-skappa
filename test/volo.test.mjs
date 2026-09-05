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

test("volo_hasOnePortholePerDestination", async () => {
  // Arrange
  const { SkappaCatalog } = await loadCatalog();
  const page = await loadHome();

  // Act
  const portholes = oblo(page);

  // Assert
  assert.equal(portholes.length, SkappaCatalog.tutte().length);
});

test("volo_portholesAreRealLinksSoTheyWorkWithoutJavaScript", async () => {
  // Arrange — senza JS la striscia scorre in CSS e gli oblo' restano navigabili
  const { SkappaCatalog } = await loadCatalog();
  const page = await loadHome();

  // Act
  const hrefs = Array.from(page.matchAll(/<a class="volo-oblo"[^>]*href="([^"]+)"/g), (m) => m[1]);
  const attesi = Array.from(SkappaCatalog.tutte(), (d) => SkappaCatalog.urlDettaglio(d));

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

test("volo_onlyTheFirstFiveImagesLoadEagerly", async () => {
  // Arrange — le altre sono lazy: l'LCP non deve pagare 27 foto
  const page = await loadHome();
  const blocco = page.slice(page.indexOf("<!--#volo inizio-->"), page.indexOf("<!--#volo fine-->"));

  // Act
  const immagini = Array.from(blocco.matchAll(/<img [^>]*>/g), (m) => m[0]);
  const eager = immagini.filter((img) => !img.includes('loading="lazy"'));

  // Assert
  assert.equal(eager.length, 5);
  assert.equal(immagini.length - eager.length, immagini.length - 5);
});

test("volo_heroTextStaysInTheStaticHtml", async () => {
  // Arrange — il testo dell'hero non deve dipendere dal JS, e' l'LCP
  const page = await loadHome();

  // Assert
  assert.match(page, /scritta skappa\.webp/);
  assert.match(page, /id="heroPriceMin"/);
  assert.match(page, /class="hero volo"/);
});

test("volo_scriptsAndStylesAreWiredIn", async () => {
  // Arrange
  const page = await loadHome();
  const detail = await readFile(path.join(ROOT, "viaggio.html"), "utf8");

  // Assert
  assert.match(page, /href="css\/volo\.css"/);
  assert.match(page, /src="js\/volo\.js"/);
  assert.match(page, /id="voloPorta"/);
  assert.match(page, /id="voloLampo"/);
  // la pagina meta deve sapere riconoscere l'arrivo dal volo
  assert.match(detail, /skappa_volo/);
  assert.match(detail, /volo-atterraggio/);
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
