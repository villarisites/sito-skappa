import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEW_IDS = [
  "praga", "monaco-di-baviera", "vienna", "madrid", "siviglia", "cracovia", "lisbona",
  "valencia", "amsterdam", "berlino", "tenerife", "sharm-el-sheikh", "marrakech", "hurghada",
  "dubai", "new-york", "los-angeles", "maldive", "messico", "thailandia", "giappone",
  // Bucarest, Budapest e Sofia avevano foto riciclate e sotto risoluzione (la
  // sorgente utile di Bucarest era 1031px di larghezza): ora hanno la loro,
  // presa dalla stessa pipeline delle altre.
  "bucarest", "budapest", "sofia"
];
const REUSED_IDS = ["parigi", "barcellona", "londra"];

test("catalogImages_allDestinations_haveReadableWebpVariantsAtExpectedWidths", async () => {
  const sources = JSON.parse(await readFile(path.join(ROOT, "data", "photo-sources.json"), "utf8"));
  assert.deepEqual(sources.map(({ slug }) => slug), NEW_IDS);
  for (const source of sources) {
    assert.equal(source.provider, "Pexels");
    assert.match(source.pageUrl, /^https:\/\/www\.pexels\.com\/photo\/\d+\/$/);
    assert.ok(source.photographer);
  }

  // L'ALTEZZA conta quanto la larghezza. Finche' si guardava solo la larghezza
  // passavano hero verticali (Amsterdam 1920x2880, Hurghada 1920x3409): con
  // `cover` ogni rapporto diverso e' un ritaglio diverso, e nessuna regola
  // sull'inquadratura poteva valere per tutte. Ora sono tutte 3:2.
  for (const id of [...NEW_IDS, ...REUSED_IDS]) {
    for (const [file, larghezza, altezza] of [
      ["hero.webp", 1920, 1280], ["card.webp", 840, 560], ["card-sm.webp", 320, 213]
    ]) {
      const metadata = await sharp(path.join(ROOT, "assets", "foto", id, file)).metadata();
      assert.equal(metadata.format, "webp", `${id}/${file}: formato`);
      assert.equal(metadata.width, larghezza, `${id}/${file}: larghezza`);
      assert.equal(metadata.height, altezza, `${id}/${file}: altezza`);
    }
  }
});
