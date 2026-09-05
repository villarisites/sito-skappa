import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

// Genera gli oblo' del "Volo SKAPPA" dentro index.html, fra i marcatori
// <!--#volo inizio--> e <!--#volo fine-->.
// Sono link statici di proposito: devono funzionare senza JavaScript ed essere
// leggibili dai motori di ricerca, quindi non possono nascere a runtime.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = path.join(ROOT, "index.html");
const INIZIO = "<!--#volo inizio-->";
const FINE = "<!--#volo fine-->";
const PRIME_EAGER = 5;

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function loadCatalog() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ["data/destinations.js", "data/categorie.js", "js/catalog.js"]) {
    vm.runInContext(await readFile(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return context.window;
}

function prezzoEtichetta(destination) {
  const price = Number(destination.prezzo);
  return Number.isFinite(price) && price > 0 ? `Da ${destination.prezzo}€` : "Su richiesta";
}

function oblo(destination, catalog, index) {
  const small = String(destination.imgCard || destination.imgHero || "").replace("card.webp", "card-sm.webp");
  const hero = destination.imgHero || destination.imgCard || "";
  const url = catalog.urlDettaglio(destination);
  const loading = index < PRIME_EAGER ? "" : ' loading="lazy" decoding="async"';
  return `            <a class="volo-oblo" role="listitem" href="${escapeAttr(url)}"`
    + ` data-nome="${escapeAttr(destination.nome)}"`
    + ` data-prezzo="${escapeAttr(prezzoEtichetta(destination))}"`
    + ` data-hero="${escapeAttr(hero)}"`
    + ` aria-label="${escapeAttr(destination.nome)} — ${escapeAttr(prezzoEtichetta(destination))}">`
    + `<img src="${escapeAttr(small)}" alt="${escapeAttr(destination.nome)}" width="320" height="400"${loading} /></a>`;
}

export function renderOblo(destinations, catalog) {
  return destinations.map((destination, index) => oblo(destination, catalog, index)).join("\n");
}

async function main() {
  const catalog = (await loadCatalog()).SkappaCatalog;
  const destinations = catalog.tutte();
  const page = await readFile(PAGE, "utf8");
  const start = page.indexOf(INIZIO);
  const end = page.indexOf(FINE, start);
  if (start < 0 || end < 0) {
    throw new Error(`marcatori ${INIZIO} / ${FINE} non trovati in index.html`);
  }

  const blocco = `${INIZIO}\n${renderOblo(destinations, catalog)}\n          `;
  const aggiornata = page.slice(0, start) + blocco + page.slice(end);
  if (aggiornata === page) {
    console.log(`Volo invariato: ${destinations.length} oblo'`);
    return;
  }
  await writeFile(PAGE, aggiornata, "utf8");
  console.log(`Volo aggiornato: ${destinations.length} oblo'`);
}

// pathToFileURL, non una stringa costruita a mano: su Windows il percorso ha
// spazi e lettera di unita', e il confronto testuale non combacia mai.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Volo non generato: ${error.message}`);
    process.exitCode = 1;
  });
}
