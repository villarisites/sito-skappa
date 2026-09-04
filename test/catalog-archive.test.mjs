import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVED_IDS = [
  "gallipoli", "ibiza", "lloret-de-mar", "malta", "mykonos", "tirana", "varsavia", "zante"
];
const ARCHIVE_HASHES = new Map([
  ["lloret-de-mar", "f5bc7972dc89d2a04c7ae3b3e50878ae0151b1cdc56ce439cd5438cc0636e430"],
  ["gallipoli", "54b26d4805484a3356dd7e97fa0981294e3f3a93502adc9ecef4e94090d4d11e"],
  ["zante", "5e70c1c869697f0178f3be7b2c22149cc634f7c932648728e6b492622863c41d"],
  ["ibiza", "62b42c0f2541cbe442c4bdb5529915fd001cd628f623dbd04daf0170cd6e396a"],
  ["mykonos", "ed06cf6175682f8bdd0410082a5a1b5a97ccbfae3ec23a6bbaded1b13d385023"],
  ["tirana", "47d494cd73cfbc672a6b9fc337a183543f6df4ec48868b2e240cad4ddfacf58c"],
  ["malta", "7a9d2656179f8dc64a16f942557f5642473d5916a225f8c2cbd9dc8315dec710"],
  ["varsavia", "b0ebb3573ce3b78354e7a797d5694cc5d3b92b03855f5d26f0aca985a34ce9ba"]
]);

function readWindowArray(source, property) {
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return JSON.parse(JSON.stringify(context.window[property]));
}

test("archivio_containsExactEightLegacyObjectsAndIsNotLoadedPublicly", async () => {
  // Arrange
  const active = readWindowArray(
    await readFile(path.join(ROOT, "data", "destinations.js"), "utf8"),
    "DESTINATIONS"
  );

  // Act
  const archived = readWindowArray(
    await readFile(path.join(ROOT, "data", "archivio.js"), "utf8"),
    "ARCHIVED_DESTINATIONS"
  );
  // Assert
  assert.deepEqual(archived.map(({ id }) => id).sort(), [...ARCHIVED_IDS].sort());
  for (const id of ARCHIVED_IDS) {
    const destination = archived.find((item) => item.id === id);
    const digest = createHash("sha256").update(JSON.stringify(destination)).digest("hex");
    assert.equal(digest, ARCHIVE_HASHES.get(id), `${id}: oggetto legacy invariato`);
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
