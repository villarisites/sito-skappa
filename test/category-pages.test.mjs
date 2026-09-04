import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { parseCatalogCsv } from "../scripts/catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = new Map([
  ["mercatini-natale", 4],
  ["europa", 16],
  ["mare-sole", 4],
  ["intercontinentali", 7]
]);

test("categoryPages_renderTheExactManifestMembershipThroughSkappaCatalog", async () => {
  const manifest = parseCatalogCsv(await readFile(path.join(ROOT, "data", "catalogo.csv"), "utf8"));
  const pageScript = await readFile(path.join(ROOT, "js", "category-page.js"), "utf8");
  assert.match(pageScript, /SkappaCatalog\.perCategoria\(categorySlug\)/);
  const context = { window: {} };
  context.window.window = context.window;
  context.window.DESTINATIONS = manifest.rows.map((row) => ({
    ...row, categorie: row.categorie.split("|")
  }));
  vm.runInNewContext(await readFile(path.join(ROOT, "data", "categorie.js"), "utf8"), context.window);
  vm.runInNewContext(await readFile(path.join(ROOT, "js", "catalog.js"), "utf8"), context.window);

  for (const [slug, expectedCount] of EXPECTED) {
    const page = await readFile(path.join(ROOT, `${slug}.html`), "utf8");
    assert.match(page, new RegExp(`data-category=["']${slug}["']`));
    assert.match(page, /id="catalogGrid"/);
    assert.match(page, /src="js\/category-page\.js"/);
    assert.match(page, /<!--#partial nav/);
    assert.match(page, /<!--#partial footer/);

    const ids = manifest.rows
      .filter((row) => row.categorie.split("|").includes(slug))
      .map(({ id }) => id);
    assert.equal(ids.length, expectedCount, `${slug}: numero mete`);
    assert.equal(new Set(ids).size, expectedCount, `${slug}: ID unici`);
    assert.equal(context.window.SkappaCatalog.perCategoria(slug).length, expectedCount);
  }

  const christmas = manifest.rows.filter((row) => row.categorie.includes("mercatini-natale"));
  assert.ok(christmas.every((row) => row.categorie.split("|").includes("europa")));
});
