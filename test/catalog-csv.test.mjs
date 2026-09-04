import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const EXPECTED_COLUMNS = [
  "id", "nome", "categorie", "prezzo", "durata", "partenzaDa", "date", "hotel", "tagline"
];

const EXPECTED_CATEGORIES = new Map([
  ["praga", ["mercatini-natale", "europa"]],
  ["monaco-di-baviera", ["mercatini-natale", "europa"]],
  ["vienna", ["mercatini-natale", "europa"]],
  ["budapest", ["mercatini-natale", "europa"]],
  ["parigi", ["europa"]],
  ["bucarest", ["europa"]],
  ["barcellona", ["europa"]],
  ["sofia", ["europa"]],
  ["londra", ["europa"]],
  ["madrid", ["europa"]],
  ["siviglia", ["europa"]],
  ["cracovia", ["europa"]],
  ["lisbona", ["europa"]],
  ["valencia", ["europa"]],
  ["amsterdam", ["europa"]],
  ["berlino", ["europa"]],
  ["tenerife", ["mare-sole"]],
  ["sharm-el-sheikh", ["mare-sole"]],
  ["marrakech", ["mare-sole"]],
  ["hurghada", ["mare-sole"]],
  ["dubai", ["intercontinentali"]],
  ["new-york", ["intercontinentali"]],
  ["los-angeles", ["intercontinentali"]],
  ["maldive", ["intercontinentali"]],
  ["messico", ["intercontinentali"]],
  ["thailandia", ["intercontinentali"]],
  ["giappone", ["intercontinentali"]]
]);

function rowsFromSimpleCsv(source) {
  const lines = source.trimEnd().split(/\r?\n/);
  const columns = lines.shift().split(";");
  return {
    columns,
    rows: lines.map((line) => Object.fromEntries(columns.map((column, index) => [column, line.split(";")[index] || ""])))
  };
}

test("catalogCsv_manifest_hasExpectedColumnsAnd27UniqueDestinations", async () => {
  // Arrange
  const source = await readFile(new URL("../data/catalogo.csv", import.meta.url), "utf8");

  // Act
  const { columns, rows } = rowsFromSimpleCsv(source);
  const ids = rows.map((row) => row.id);

  // Assert
  assert.deepEqual(columns, EXPECTED_COLUMNS);
  assert.equal(rows.length, 27);
  assert.equal(new Set(ids).size, 27);
  assert.deepEqual(new Set(ids), new Set(EXPECTED_CATEGORIES.keys()));
});

test("catalogCsv_categories_matchApprovedTaxonomy", async () => {
  // Arrange
  const source = await readFile(new URL("../data/catalogo.csv", import.meta.url), "utf8");
  const { rows } = rowsFromSimpleCsv(source);

  // Act
  const actual = new Map(rows.map((row) => [row.id, row.categorie.split("|").filter(Boolean)]));

  // Assert
  assert.deepEqual(actual, EXPECTED_CATEGORIES);
});
