import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadTravelHelpers() {
  const context = { window: {} };
  context.window.window = context.window;
  vm.runInNewContext(await readFile(path.join(ROOT, "js", "travel-detail.js"), "utf8"), context.window);
  return context.window.SkappaTravel;
}

test("travelDetail_missingPrice_usesQuoteCopyAndOmitsOffer", async () => {
  const helpers = await loadTravelHelpers();
  const destination = { prezzo: null, linkPagamento: null };

  assert.equal(helpers.hasPrice(destination), false);
  assert.equal(helpers.priceLabel(destination), "Su richiesta");
  assert.equal(helpers.priceMarkup(destination), "Su richiesta");
  assert.equal(helpers.createOffer(destination, "https://skappa.it/viaggio.html?id=praga"), undefined);
});

test("travelDetail_positivePrice_formatsPriceAndCreatesSchemaOffer", async () => {
  const helpers = await loadTravelHelpers();
  const destination = { prezzo: 429, linkPagamento: "https://checkout.example/skappa" };

  assert.equal(helpers.hasPrice(destination), true);
  assert.equal(helpers.priceLabel(destination), "429€");
  assert.equal(helpers.priceMarkup(destination), '<span class="pacchetto-euro">€</span>429');
  assert.deepEqual(
    { ...helpers.createOffer(destination, "https://skappa.it/viaggio.html?id=parigi") },
    {
      "@type": "Offer",
      price: "429",
      priceCurrency: "EUR",
      url: "https://checkout.example/skappa",
      availability: "https://schema.org/InStock"
    }
  );
});

test("travelDetail_templateDelegatesPriceRenderingToTheHelper", async () => {
  // La logica della pagina meta non e' piu' inline: sta in js/viaggio.js. La
  // regola pero' non cambia - il prezzo lo rende l'helper, non il template - e
  // va cercata dove il codice vive adesso.
  const page = await readFile(path.join(ROOT, "viaggio.html"), "utf8");
  const script = await readFile(path.join(ROOT, "js", "viaggio.js"), "utf8");

  assert.match(page, /src="js\/travel-detail\.js"/);
  assert.match(page, /src="js\/viaggio\.js"/);
  assert.match(script, /SkappaTravel\.priceLabel\(dest\)/);
  assert.match(script, /SkappaTravel\.priceMarkup\(dest\)/);
  assert.match(script, /SkappaTravel\.createOffer\(dest, pageUrl\)/);
  assert.doesNotMatch(script, /dest\.prezzo\s*\+\s*['"]€['"]/);
  assert.doesNotMatch(script, /String\(dest\.prezzo\)/);
});

test("viaggio_laPaginaMetaNonRimetteLogicaInline", async () => {
  // Perche' questo test esiste: gli script inline obbligano a 'unsafe-inline' in
  // script-src, che annulla quella difesa. I 26 KB di logica sono usciti in
  // js/viaggio.js; restano due blocchetti che DEVONO girare prima del primo
  // disegno (tema e id della meta) e che estratti reintrodurrebbero i flash.
  // Toglierli del tutto richiede gli hash nella CSP: e' un lavoro a parte.
  // Qui si presidia che la logica non rientri inline.
  const page = await readFile(path.join(ROOT, "viaggio.html"), "utf8");
  const inline = [...page.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1].trim());
  const totale = inline.reduce((n, c) => n + c.length, 0);

  assert.ok(totale < 3000, `script inline in viaggio.html: ${totale} caratteri, erano ~2600 dopo l'estrazione`);
  assert.ok(inline.every((c) => c.length < 2000), "un blocco inline e' cresciuto: la logica sta rientrando");
});

test("travelDetail_legacyCheckoutCannotOverrideMissingPriceOrConsultation", async () => {
  const helpers = await loadTravelHelpers();
  const legacy = { linkPagamento: 'https://checkout.example/old', acconto: 79 };
  for (const prezzo of [null, undefined, '', 0, -1, 'invalid']) {
    const destination = { ...legacy, prezzo };
    assert.equal(helpers.canCheckout(destination), false);
    assert.equal(helpers.canPayDeposit(destination), false);
    assert.equal(helpers.createOffer(destination, 'https://skappa.it/viaggio.html?id=budapest'), undefined);
  }
  assert.equal(helpers.canCheckout({ ...legacy, prezzo: 429 }), true);
  assert.equal(helpers.canCheckout({ ...legacy, prezzo: 429, soloConsulenza: true }), false);
  assert.equal(helpers.canCheckout({ prezzo: 429 }), false);
});

test("travelDetail_depositMustLeaveAPositiveBalanceAtTheSelectedPrice", async () => {
  const helpers = await loadTravelHelpers();
  const destination = { prezzo: 429, acconto: 79, linkPagamento: 'https://checkout.example/trip' };
  assert.equal(helpers.canPayDeposit(destination), true);
  for (const selectedPrice of [null, 0, 60, 79, NaN]) {
    assert.equal(helpers.canPayDeposit(destination, selectedPrice), false);
  }
  assert.equal(helpers.canPayDeposit(destination, 100), true);
  for (const acconto of [null, 0, -10, 429, 500, 'invalid']) {
    assert.equal(helpers.canPayDeposit({ ...destination, acconto }), false);
  }
});
