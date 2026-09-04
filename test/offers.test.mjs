import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("offers_returnsOnlyExplicitlyActiveFutureOffers", async () => {
  const context = { window: {} };
  context.window.window = context.window;
  context.window.DESTINATIONS = [
    { id: "future", categorie: ["europa"], offerta: { attiva: true, scadenza: "2999-01-01T00:00:00Z" } },
    { id: "expired", categorie: ["europa"], offerta: { attiva: true, scadenza: "2000-01-01T00:00:00Z" } },
    { id: "inactive", categorie: ["europa"], offerta: { attiva: false, scadenza: "2999-01-01T00:00:00Z" } },
    { id: "undated", categorie: ["europa"], offerta: { attiva: true } },
    { id: "plain", categorie: ["europa"] }
  ];
  vm.runInNewContext(await readFile(path.join(ROOT, "data", "categorie.js"), "utf8"), context.window);
  vm.runInNewContext(await readFile(path.join(ROOT, "js", "catalog.js"), "utf8"), context.window);

  assert.deepEqual(
    Array.from(context.window.SkappaCatalog.conOfferta(), ({ id }) => id),
    ["future"]
  );
});

test("offersPage_usesOfferFlagAndReplacesLastMinuteFunctionally", async () => {
  const page = await readFile(path.join(ROOT, "offerte.html"), "utf8");
  assert.match(page, /SkappaCatalog\.conOfferta\(\)/);
  assert.match(page, /id="offersGrid"/);
  assert.match(page, /variante:\s*["']lastminute["']/);
  assert.doesNotMatch(page, /perCategoria\(["']last-minute["']\)/);
  assert.match(page, /<!--#partial nav/);
});
