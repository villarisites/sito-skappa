import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = [
  ["mercatini-natale", "Mercatini di Natale", "mercatini-natale.html"],
  ["europa", "Europa", "europa.html"],
  ["mare-sole", "Mare & Sole", "mare-sole.html"],
  ["intercontinentali", "Intercontinentali", "intercontinentali.html"],
  ["viaggi-di-nozze", "Viaggi di nozze", "viaggi-di-nozze.html"],
  ["crociere", "Crociere", "crociere.html"]
];

test("categorie_areTheSixOrderedSingleSourceDefinitions", async () => {
  const context = { window: {} };
  vm.runInNewContext(await readFile(path.join(ROOT, "data", "categorie.js"), "utf8"), context);
  const categories = JSON.parse(JSON.stringify(context.window.SKAPPA_CATEGORIE));

  assert.deepEqual(
    categories.map(({ slug, nome, pagina }) => [slug, nome, pagina]),
    EXPECTED
  );
  assert.deepEqual(categories.map(({ ordine }) => ordine), [1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(categories.map(({ slug }) => slug)).size, 6);
  for (const category of categories) {
    assert.equal(category.inMenu, true, `${category.slug}: presenza menu`);
    assert.ok(category.badgeTesto, `${category.slug}: badge`);
    assert.ok(category.tema, `${category.slug}: tema`);
    assert.ok(category.accento?.badgeTesto, `${category.slug}: accento dettaglio`);
    assert.ok(category.seo?.breadcrumbUrl, `${category.slug}: SEO categoria`);
  }
  assert.equal(categories.some(({ slug }) => slug === "offerte"), false);
});
