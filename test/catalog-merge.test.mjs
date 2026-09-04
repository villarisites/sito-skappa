import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { mergeCatalogRows, parseCatalogCsv } from "../scripts/catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RICH_IDS = ["budapest", "parigi", "bucarest", "barcellona", "sofia", "londra"];
const CSV_FIELDS = [
  "id", "nome", "categorie", "prezzo", "durata", "partenzaDa", "date", "hotel", "tagline"
];
const MANIFEST_FIELDS = new Set(CSV_FIELDS);

function loadDestinations(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return JSON.parse(JSON.stringify(context.window.DESTINATIONS));
}

function richFields(destination) {
  return Object.fromEntries(Object.entries(destination).filter(([key]) => (
    !MANIFEST_FIELDS.has(key) && key !== "tipologia"
  )));
}

function csvField(value) {
  const text = String(value ?? "");
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

test("mergeCatalogRows_existingDestination_preservesRichFieldsAndUsesManifestValues", () => {
  // Arrange
  const legacy = [{
    id: "parigi",
    nome: "VECCHIO NOME",
    tipologia: "fughe-in-europa",
    prezzo: "999",
    categorie: ["fughe-in-europa"],
    attivita: [{ titolo: "Tour" }],
    faq: [{ domanda: "FAQ" }],
    recensioni: [{ testo: "Ottimo" }],
    linkPagamento: "https://example.com/stripe",
    prezziAeroporti: [{ aeroporto: "NAP", prezzo: "429" }],
    acconto: 99
  }];
  const rows = [{
    id: "parigi", nome: "PARIGI", categorie: "europa", prezzo: "429", durata: "4 giorni",
    partenzaDa: "Napoli", date: "Aprile", hotel: "Ibis", tagline: "Nuova tagline"
  }];

  // Act
  const [destination] = mergeCatalogRows(rows, legacy);

  // Assert
  assert.deepEqual(destination.attivita, legacy[0].attivita);
  assert.deepEqual(destination.faq, legacy[0].faq);
  assert.deepEqual(destination.recensioni, legacy[0].recensioni);
  assert.equal(destination.linkPagamento, legacy[0].linkPagamento);
  assert.deepEqual(destination.prezziAeroporti, legacy[0].prezziAeroporti);
  assert.equal(destination.acconto, 99);
  assert.equal(destination.nome, "PARIGI");
  assert.equal(destination.prezzo, 429);
  assert.deepEqual(destination.categorie, ["europa"]);
  assert.equal("tipologia" in destination, false);
});

test("buildCatalog_validManifest_produces27AndPreservesAllSixRichDestinations", async () => {
  // Arrange
  const temp = await mkdtemp(path.join(tmpdir(), "skappa-catalog-merge-"));
  const input = path.join(temp, "catalogo.csv");
  const output = path.join(temp, "destinations.js");
  const legacyPath = path.join(ROOT, "data", "destinations.js");
  const legacy = loadDestinations(await readFile(legacyPath, "utf8"));
  const manifest = parseCatalogCsv(await readFile(path.join(ROOT, "data", "catalogo.csv"), "utf8"));
  const validRows = manifest.rows.map((row) => ({ ...row, prezzo: row.prezzo || "100" }));
  const validCsv = [CSV_FIELDS.join(";"), ...validRows.map((row) => (
    CSV_FIELDS.map((field) => csvField(row[field])).join(";")
  ))].join("\n") + "\n";
  await writeFile(input, validCsv, "utf8");

  // Act
  const run = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "build-catalog.mjs"),
    "--input", input,
    "--output", output,
    "--legacy", legacyPath
  ], { cwd: ROOT, encoding: "utf8" });

  // Assert
  assert.equal(run.status, 0, run.stderr);
  const generated = loadDestinations(await readFile(output, "utf8"));
  assert.equal(generated.length, 27);
  assert.equal(new Set(generated.map(({ id }) => id)).size, 27);
  for (const id of RICH_IDS) {
    assert.deepEqual(
      richFields(generated.find((destination) => destination.id === id)),
      richFields(legacy.find((destination) => destination.id === id)),
      `${id}: i contenuti ricchi devono restare invariati`
    );
  }
  assert.equal(generated.find(({ id }) => id === "praga").imgHero, "assets/foto/praga/hero.webp");
  await rm(temp, { recursive: true, force: true });
});
