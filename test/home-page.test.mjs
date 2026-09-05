import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadCategorySlugs() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(await readFile(path.join(ROOT, "data", "categorie.js"), "utf8"), context);
  // Array.from riporta l'array nel realm del test: quelli creati dentro il vm hanno
  // un altro Array.prototype e deepStrictEqual li rifiuterebbe anche se identici.
  return Array.from(context.window.SKAPPA_CATEGORIE, (entry) => entry.slug);
}

// La home aveva tre sezioni cablate su mete-estive / fughe-in-europa / last-minute.
// La fase 2 ha rinominato le categorie e la home ha smesso di mostrare qualsiasi meta,
// senza errori in console. Questi test fanno rumore se succede di nuovo.

test("home_doesNotHardcodeCategorySlugsThatNoLongerExist", async () => {
  // Arrange
  const slugs = new Set(await loadCategorySlugs());
  const page = await readFile(path.join(ROOT, "index.html"), "utf8");

  // Act
  const referenced = Array.from(page.matchAll(/perCategoria\(\s*['"]([^'"]+)['"]\s*\)/g), (m) => m[1]);

  // Assert
  const unknown = referenced.filter((slug) => !slugs.has(slug));
  assert.deepEqual(unknown, [], `index.html cita categorie inesistenti: ${unknown.join(", ")}`);
});

test("homeCatalog_descriptionsCoverEveryCategory", async () => {
  // Arrange
  const slugs = await loadCategorySlugs();
  const script = await readFile(path.join(ROOT, "js", "home-catalog.js"), "utf8");

  // Act
  const block = script.slice(script.indexOf("var testi = {"), script.indexOf("};", script.indexOf("var testi = {")));
  const described = Array.from(block.matchAll(/'([a-z-]+)':/g), (m) => m[1]);

  // Assert
  const missing = slugs.filter((slug) => !described.includes(slug));
  assert.deepEqual(missing, [], `js/home-catalog.js non descrive: ${missing.join(", ")}`);
  const extra = described.filter((slug) => !slugs.includes(slug));
  assert.deepEqual(extra, [], `js/home-catalog.js descrive categorie inesistenti: ${extra.join(", ")}`);
});

test("home_rendersCategorySectionsFromTheCatalog", async () => {
  // Arrange
  const page = await readFile(path.join(ROOT, "index.html"), "utf8");

  // Assert — il contenitore e lo script che lo riempie devono esserci entrambi
  assert.match(page, /id="homeCategorie"/);
  assert.match(page, /src="js\/home-catalog\.js"/);
  assert.match(page, /id="offerteHomeCards"/);
});
