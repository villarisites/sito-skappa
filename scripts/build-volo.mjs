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
const PREZZO_INIZIO = "<!--#prezzo inizio-->";
const PREZZO_FINE = "<!--#prezzo fine-->";
const CABINA_INIZIO = "<!--#cabina inizio-->";
const CABINA_FINE = "<!--#cabina fine-->";
// Quante mete entrano nella cabina. Non tutte: al passo dei finestrini 27 mete
// fanno una scena larga quasi ventimila pixel, e nessuno la percorre. Le altre
// restano raggiungibili dalle categorie, che esistono gia'.
const METE_IN_CABINA = 8;
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

// Il claim dell'hero non puo' stare scritto a mano nell'HTML: e' un'affermazione
// sul catalogo, e il catalogo cambia. Nell'HTML c'era "DA 169€" mentre tutte e 27
// le mete dicevano "Su richiesta" - il JavaScript lo correggeva a runtime, ma
// quello che finisce ai motori di ricerca e a chi ha JS lento e' l'HTML servito.
// Anche il sottotitolo va generato insieme, se no resta "a partire" davanti a un
// prezzo che non c'e'.
export function renderPrezzoHero(destinations) {
  const prezzi = destinations
    .map((d) => Number(d.prezzo))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (prezzi.length === 0) {
    return {
      sottotitolo: "Viaggi già organizzati, costruiti su di te",
      prezzo: "PREVENTIVO SU RICHIESTA"
    };
  }
  return {
    sottotitolo: "Viaggi già organizzati a partire",
    prezzo: `DA ${Math.min(...prezzi)}€`
  };
}

// I finestrini della cabina sono link veri, generati qui: devono funzionare
// senza JavaScript ed essere indicizzabili, esattamente come lo erano gli oblo'.
// js/cabina.js legge da questi elementi le mete da disegnare, invece di avere
// un proprio elenco: due elenchi da tenere allineati a mano e' il modo in cui
// oggi cinque destinazioni sono rimaste senza link.
export function renderCabina(destinations, catalog) {
  return destinations.slice(0, METE_IN_CABINA).map((d) => {
    const url = catalog.urlDettaglio(d);
    return `          <a class="presa" id="presa-${escapeAttr(d.id)}" href="${escapeAttr(url)}"`
      + ` data-meta="${escapeAttr(d.id)}" aria-label="Scopri ${escapeAttr(d.nome)}">`
      + `<img src="${escapeAttr(d.imgHero || d.imgCard || "")}" alt="" />`
      + `<span class="presa-label">${escapeAttr(d.nome)}</span></a>`;
  }).join("\n");
}

export function renderOblo(destinations, catalog) {
  return destinations.map((destination, index) => oblo(destination, catalog, index)).join("\n");
}

async function main() {
  const catalog = (await loadCatalog()).SkappaCatalog;
  const destinations = catalog.tutte();
  const page = await readFile(PAGE, "utf8");
  // La striscia di oblo' e' opzionale: la home con la cabina non ce l'ha piu'.
  // Se i marcatori non ci sono si salta, invece di far fallire tutto il build -
  // il prezzo dell'hero e i finestrini della cabina devono generarsi comunque.
  let aggiornata = page;
  const start = page.indexOf(INIZIO);
  const end = page.indexOf(FINE, start);
  let oblo = 0;
  if (start >= 0 && end >= 0) {
    const blocco = `${INIZIO}\n${renderOblo(destinations, catalog)}\n          `;
    aggiornata = page.slice(0, start) + blocco + page.slice(end);
    oblo = destinations.length;
  }

  const pStart = aggiornata.indexOf(PREZZO_INIZIO);
  const pEnd = aggiornata.indexOf(PREZZO_FINE, pStart);
  if (pStart < 0 || pEnd < 0) {
    throw new Error(`marcatori ${PREZZO_INIZIO} / ${PREZZO_FINE} non trovati in index.html`);
  }
  const hero = renderPrezzoHero(destinations);
  aggiornata = aggiornata.slice(0, pStart)
    + `${PREZZO_INIZIO}\n`
    + `      <p class="hero-subtitle">${hero.sottotitolo}</p>\n`
    + `      <div class="hero-price"><span id="heroPriceMin">${hero.prezzo}</span></div>\n      `
    + aggiornata.slice(pEnd);

  const cStart = aggiornata.indexOf(CABINA_INIZIO);
  const cEnd = aggiornata.indexOf(CABINA_FINE, cStart);
  if (cStart < 0 || cEnd < 0) {
    throw new Error(`marcatori ${CABINA_INIZIO} / ${CABINA_FINE} non trovati in index.html`);
  }
  aggiornata = aggiornata.slice(0, cStart)
    + `${CABINA_INIZIO}
${renderCabina(destinations, catalog)}
`
    + aggiornata.slice(cEnd);

  if (aggiornata === page) {
    console.log(`Home invariata: ${oblo} oblo', ${METE_IN_CABINA} finestrini`);
    return;
  }
  await writeFile(PAGE, aggiornata, "utf8");
  console.log(`Home aggiornata: ${oblo} oblo', ${METE_IN_CABINA} finestrini, hero "${hero.prezzo}"`);
}

// pathToFileURL, non una stringa costruita a mano: su Windows il percorso ha
// spazi e lettera di unita', e il confronto testuale non combacia mai.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Volo non generato: ${error.message}`);
    process.exitCode = 1;
  });
}
