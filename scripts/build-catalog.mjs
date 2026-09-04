import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  catalogRowsToScript,
  mergeCatalogRows,
  parseCatalogCsv,
  validateCatalogColumns,
  validateCatalogRows
} from "./catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWED_CATEGORIES = new Set([
  "mercatini-natale", "europa", "mare-sole", "intercontinentali", "viaggi-di-nozze", "crociere"
]);
const EXPECTED_IDS = new Set([
  "praga", "monaco-di-baviera", "vienna", "budapest", "parigi", "bucarest", "barcellona",
  "sofia", "londra", "madrid", "siviglia", "cracovia", "lisbona", "valencia", "amsterdam",
  "berlino", "tenerife", "sharm-el-sheikh", "marrakech", "hurghada", "dubai", "new-york",
  "los-angeles", "maldive", "messico", "thailandia", "giappone"
]);

function readArguments(argv) {
  const options = {
    input: path.join(ROOT, "data", "catalogo.csv"),
    output: path.join(ROOT, "data", "destinations.js"),
    legacy: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag !== "--input" && flag !== "--output" && flag !== "--legacy") {
      throw new Error(`argomento sconosciuto: ${flag}`);
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`valore mancante per ${flag}`);
    options[flag.slice(2)] = path.resolve(value);
    index += 1;
  }

  options.legacy ??= options.output;
  return options;
}

async function loadLegacyDestinations(legacyPath) {
  let source;
  try {
    source = await readFile(legacyPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: legacyPath });
  if (!Array.isArray(context.window.DESTINATIONS)) {
    throw new Error(`catalogo legacy non valido: ${legacyPath}`);
  }
  return context.window.DESTINATIONS;
}

async function main() {
  const { input, output, legacy } = readArguments(process.argv.slice(2));
  const parsed = parseCatalogCsv(await readFile(input, "utf8"));
  const errors = [
    ...validateCatalogColumns(parsed.columns),
    ...validateCatalogRows(parsed.rows, {
      allowedCategories: ALLOWED_CATEGORIES,
      expectedIds: EXPECTED_IDS
    })
  ];

  if (errors.length > 0) {
    console.error(`Catalogo non generato (${errors.length} errori):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  const destinations = mergeCatalogRows(parsed.rows, await loadLegacyDestinations(legacy));
  await mkdir(path.dirname(output), { recursive: true });
  const temporaryOutput = `${output}.${process.pid}.tmp`;
  await writeFile(temporaryOutput, catalogRowsToScript(destinations), "utf8");
  await rename(temporaryOutput, output);
  console.log(`Catalogo generato: ${parsed.rows.length} mete`);
}

main().catch((error) => {
  console.error(`Catalogo non generato: ${error.message}`);
  process.exitCode = 1;
});
