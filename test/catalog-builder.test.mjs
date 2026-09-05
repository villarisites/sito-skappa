import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { parseCatalogCsv, validateCatalogRows } from "../scripts/catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED = new Set([
  "mercatini-natale", "europa", "mare-sole", "intercontinentali", "viaggi-di-nozze", "crociere"
]);

test("parseCatalogCsv_quotedSemicolonAndEscapedQuote_returnsExactFields", () => {
  // Arrange
  const source = "id;nome;categorie;prezzo;durata;partenzaDa;date;hotel;tagline\n"
    + "test;TEST;europa;199;;;;;\"Arte; musica e \"\"vita\"\"\"\n";

  // Act
  const parsed = parseCatalogCsv(source);

  // Assert
  assert.equal(parsed.rows[0].tagline, "Arte; musica e \"vita\"");
});

test("validateCatalogRows_multipleProblems_returnsEveryActionableError", () => {
  // Arrange
  const rows = [
    { id: "Praga", nome: "PRAGA", categorie: "europa|sconosciuta", prezzo: "" },
    { id: "Praga", nome: "PRAGA 2", categorie: "", prezzo: "WIP" }
  ];

  // Act
  const errors = validateCatalogRows(rows, { allowedCategories: ALLOWED, requirePrice: true });

  // Assert
  assert.deepEqual(errors, [
    "riga 2: id non valido: Praga",
    "riga 2: categoria sconosciuta: sconosciuta",
    "riga 2: prezzo mancante",
    "riga 3: id non valido: Praga",
    "riga 3: id duplicato: Praga",
    "riga 3: categorie mancanti",
    "riga 3: prezzo non numerico: WIP"
  ]);
});

test("buildCatalog_invalidCsv_reportsAllErrorsAndLeavesOutputUntouched", async () => {
  // Arrange
  const temp = await mkdtemp(path.join(tmpdir(), "skappa-catalog-test-"));
  const input = path.join(temp, "catalogo.csv");
  const output = path.join(temp, "destinations.js");
  const original = "window.DESTINATIONS=[{id:\"sentinella\"}];\n";
  await writeFile(input, "id;nome;categorie;prezzo;durata;partenzaDa;date;hotel;tagline\npraga;PRAGA;europa;WIP;;;;;\n", "utf8");
  await writeFile(output, original, "utf8");

  // Act
  const run = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "build-catalog.mjs"), "--input", input, "--output", output
  ], { cwd: ROOT, encoding: "utf8" });

  // Assert
  assert.equal(run.status, 1);
  assert.match(run.stderr, /prezzo non numerico: WIP/);
  assert.match(run.stderr, /sono richieste 27 mete/);
  assert.equal(await readFile(output, "utf8"), original);
  await rm(temp, { recursive: true, force: true });
});

test("buildCatalog_allowIncomplete_createsPreviewWithNullPrices", async () => {
  // Arrange
  const temp = await mkdtemp(path.join(tmpdir(), "skappa-catalog-preview-"));
  const output = path.join(temp, "destinations.js");

  // Act
  const run = spawnSync(process.execPath, [
    path.join(ROOT, "scripts", "build-catalog.mjs"),
    "--input", path.join(ROOT, "data", "catalogo.csv"),
    "--output", output,
    "--legacy", path.join(ROOT, "data", "destinations.js"),
    "--allow-incomplete"
  ], { cwd: ROOT, encoding: "utf8" });

  // Assert
  assert.equal(run.status, 0, run.stderr);
  const context = { window: {} };
  vm.runInNewContext(await readFile(output, "utf8"), context);
  assert.equal(context.window.DESTINATIONS.length, 27);
  assert.equal(context.window.DESTINATIONS.find(({ id }) => id === "praga").prezzo, null);
  await rm(temp, { recursive: true, force: true });
});

test("validateCatalogRows_missingPriceByDefault_isNotAnError", () => {
  // Arrange — "prezzo su richiesta" e' una scelta editoriale, non un dato incompleto:
  // il sito lo rende come "Su richiesta" in card, ricerca e pagina di dettaglio.
  const rows = [{ id: "praga", nome: "PRAGA", categorie: "europa", prezzo: "" }];

  // Act
  const errors = validateCatalogRows(rows, { allowedCategories: ALLOWED });

  // Assert
  assert.deepEqual(errors, []);
});

test("validateCatalogRows_missingPriceWhenRequired_reportsError", () => {
  // Arrange
  const rows = [{ id: "praga", nome: "PRAGA", categorie: "europa", prezzo: "" }];

  // Act
  const errors = validateCatalogRows(rows, { allowedCategories: ALLOWED, requirePrice: true });

  // Assert
  assert.deepEqual(errors, ["riga 2: prezzo mancante"]);
});

test("validateCatalogRows_malformedPrice_isAlwaysAnError", () => {
  // Arrange — un prezzo scritto male resta un errore anche senza requirePrice
  const rows = [{ id: "praga", nome: "PRAGA", categorie: "europa", prezzo: "WIP" }];

  // Act
  const errors = validateCatalogRows(rows, { allowedCategories: ALLOWED });

  // Assert
  assert.deepEqual(errors, ["riga 2: prezzo non numerico: WIP"]);
});
