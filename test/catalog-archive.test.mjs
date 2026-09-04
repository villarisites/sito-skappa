import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { mergeCatalogRows, parseCatalogCsv } from "../scripts/catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVED_IDS = [
  "gallipoli", "ibiza", "lloret-de-mar", "malta", "mykonos", "tirana", "varsavia", "zante"
];

function readWindowArray(source, property) {
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return JSON.parse(JSON.stringify(context.window[property]));
}

test("archivio_containsExactEightLegacyObjectsAndIsNotLoadedPublicly", async () => {
  // Arrange
  const legacy = readWindowArray(
    await readFile(path.join(ROOT, "data", "destinations.js"), "utf8"),
    "DESTINATIONS"
  );

  // Act
  const archived = readWindowArray(
    await readFile(path.join(ROOT, "data", "archivio.js"), "utf8"),
    "ARCHIVED_DESTINATIONS"
  );
  const manifest = parseCatalogCsv(await readFile(path.join(ROOT, "data", "catalogo.csv"), "utf8"));
  const active = mergeCatalogRows(manifest.rows, legacy);

  // Assert
  assert.deepEqual(archived.map(({ id }) => id).sort(), [...ARCHIVED_IDS].sort());
  for (const id of ARCHIVED_IDS) {
    assert.deepEqual(
      archived.find((destination) => destination.id === id),
      legacy.find((destination) => destination.id === id),
      `${id}: l'oggetto archiviato deve essere identico al legacy`
    );
    assert.equal(active.some((destination) => destination.id === id), false);
  }

  const rootFiles = (await readdir(ROOT)).filter((name) => name.endsWith(".html"));
  const jsFiles = (await readdir(path.join(ROOT, "js"))).filter((name) => name.endsWith(".js"));
  for (const relativePath of [
    ...rootFiles,
    ...jsFiles.map((name) => path.join("js", name))
  ]) {
    const source = await readFile(path.join(ROOT, relativePath), "utf8");
    assert.doesNotMatch(source, /(?:data\/)?archivio\.js/, `${relativePath} non deve caricare l'archivio`);
  }
});
