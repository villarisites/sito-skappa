import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEW_IDS = [
  "praga", "monaco-di-baviera", "vienna", "madrid", "siviglia", "cracovia", "lisbona",
  "valencia", "amsterdam", "berlino", "tenerife", "sharm-el-sheikh", "marrakech", "hurghada",
  "dubai", "new-york", "los-angeles", "maldive", "messico", "thailandia", "giappone"
];
const REUSED_IDS = ["budapest", "parigi", "bucarest", "barcellona", "sofia", "londra"];

test("catalogImages_allDestinations_haveReadableWebpVariantsAtExpectedWidths", async () => {
  for (const id of [...NEW_IDS, ...REUSED_IDS]) {
    for (const [file, expectedWidth] of [
      ["hero.webp", 1920], ["card.webp", 840], ["card-sm.webp", 320]
    ]) {
      const metadata = await sharp(path.join(ROOT, "assets", "foto", id, file)).metadata();
      assert.equal(metadata.format, "webp", `${id}/${file}: formato`);
      if (NEW_IDS.includes(id) || file !== "hero.webp") {
        assert.equal(metadata.width, expectedWidth, `${id}/${file}: larghezza`);
      } else {
        assert.ok(metadata.width > 0, `${id}/${file}: immagine leggibile`);
      }
    }
  }
});
