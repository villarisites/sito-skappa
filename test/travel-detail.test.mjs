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
  const page = await readFile(path.join(ROOT, "viaggio.html"), "utf8");

  assert.match(page, /src="js\/travel-detail\.js"/);
  assert.match(page, /SkappaTravel\.priceLabel\(dest\)/);
  assert.match(page, /SkappaTravel\.priceMarkup\(dest\)/);
  assert.match(page, /SkappaTravel\.createOffer\(dest, pageUrl\)/);
  assert.doesNotMatch(page, /dest\.prezzo\s*\+\s*['"]€['"]/);
  assert.doesNotMatch(page, /String\(dest\.prezzo\)/);
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
