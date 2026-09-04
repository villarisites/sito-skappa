import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  catalogRowsToScript,
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
    output: path.join(ROOT, "data", "destinations.js")
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag !== "--input" && flag !== "--output") {
      throw new Error(`argomento sconosciuto: ${flag}`);
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`valore mancante per ${flag}`);
    options[flag.slice(2)] = path.resolve(value);
    index += 1;
  }

  return options;
}

async function main() {
  const { input, output } = readArguments(process.argv.slice(2));
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

  await mkdir(path.dirname(output), { recursive: true });
  const temporaryOutput = `${output}.${process.pid}.tmp`;
  await writeFile(temporaryOutput, catalogRowsToScript(parsed.rows), "utf8");
  await rename(temporaryOutput, output);
  console.log(`Catalogo generato: ${parsed.rows.length} mete`);
}

main().catch((error) => {
  console.error(`Catalogo non generato: ${error.message}`);
  process.exitCode = 1;
});
