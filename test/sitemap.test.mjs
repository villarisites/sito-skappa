import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseCatalogCsv } from "../scripts/catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVED = ["gallipoli", "ibiza", "lloret-de-mar", "malta", "mykonos", "tirana", "varsavia", "zante"];
const PAGES = [
  "mercatini-natale.html", "europa.html", "mare-sole.html", "intercontinentali.html",
  "viaggi-di-nozze.html", "crociere.html", "offerte.html"
];

test("sitemap_containsNewPagesAndExactlyThe27CanonicalDestinations", async () => {
  const sitemap = await readFile(path.join(ROOT, "sitemap.xml"), "utf8");
  const manifest = parseCatalogCsv(await readFile(path.join(ROOT, "data", "catalogo.csv"), "utf8"));
  const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);

  for (const page of PAGES) assert.ok(locations.includes(`https://skappa.it/${page}`), page);
  for (const { id } of manifest.rows) {
    const url = `https://skappa.it/viaggio.html?id=${id}`;
    assert.equal(locations.filter((location) => location === url).length, 1, id);
  }
  const destinationUrls = locations.filter((location) => location.includes("/viaggio.html?id="));
  assert.equal(destinationUrls.length, 27);
  for (const id of [...ARCHIVED, "praga-lastminute"]) {
    assert.equal(sitemap.includes(`id=${id}`), false, `${id}: escluso`);
  }
  assert.doesNotMatch(sitemap, /summer-tour\.html|fughe-in-europa\.html|last-minute\.html/);
});
