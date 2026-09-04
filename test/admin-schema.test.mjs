import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATEGORIES = [
  "mercatini-natale", "europa", "mare-sole", "intercontinentali", "viaggi-di-nozze", "crociere"
];

test("admin_editsAndExportsTheNewCatalogSchema", async () => {
  const page = await readFile(path.join(ROOT, "admin.html"), "utf8");
  const categoryInputs = Array.from(page.matchAll(/name="f-categorie"\s+value="([^"]+)"/g), (match) => match[1]);
  assert.deepEqual(categoryInputs, CATEGORIES);
  assert.match(page, /id="f-offerta-attiva"/);
  assert.match(page, /id="f-offerta-prezzo-originale"/);
  assert.match(page, /id="f-offerta-scadenza"/);
  assert.match(page, /id="f-soloConsulenza"/);

  const collector = page.slice(page.indexOf("function getFormData()"), page.indexOf("function v(id)"));
  assert.doesNotMatch(collector, /tipologia\s*:/);
  assert.match(collector, /data\.offerta\s*=\s*\{/);
  assert.match(collector, /data\.soloConsulenza\s*=\s*true/);
  assert.match(collector, /categorie:\s*categories/);
});
