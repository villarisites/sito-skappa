import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { parseCatalogCsv } from "../scripts/catalog-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.SKAPPA_CHROME
  || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const MIME = new Map([
  [".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"], [".webp", "image/webp"], [".xml", "application/xml; charset=utf-8"]
]);

function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const target = path.resolve(ROOT, relative);
      if (!target.startsWith(`${ROOT}${path.sep}`)) throw new Error("Path fuori root");
      const info = await stat(target);
      if (!info.isFile()) throw new Error("Non è un file");
      response.writeHead(200, { "content-type": MIME.get(path.extname(target)) || "application/octet-stream" });
      response.end(await readFile(target));
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForJson(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Chrome DevTools non disponibile: ${url}`);
}

class CdpClient {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }

  once(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const listeners = this.listeners.get(method) || [];
      const timer = setTimeout(() => reject(new Error(`Timeout evento ${method}`)), timeoutMs);
      listeners.push((params) => {
        clearTimeout(timer);
        resolve(params);
      });
      this.listeners.set(method, listeners);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  close() {
    this.socket.close();
  }
}

function checksFor(testCase) {
  const problems = [];
  const text = document.body.innerText;
  if (/(^|\D)(null|undefined|NaN)€/.test(text) || /(^|\D)0€/.test(text)) {
    problems.push("prezzo non valido visibile");
  }
  if (!window.SkappaCatalog && testCase.kind !== "admin") problems.push("catalogo JS non disponibile");

  if (testCase.kind === "detail") {
    const destination = window.SkappaCatalog.tutte().find(({ id }) => id === testCase.id);
    if (!destination) problems.push("destinazione non trovata");
    if (document.querySelector("#heroNome")?.textContent.trim() !== testCase.name) problems.push("nome hero errato");
    const heroPrice = document.querySelector("#heroPrezzo")?.textContent.trim();
    if (heroPrice !== testCase.expectedPrice) problems.push(`prezzo hero: ${heroPrice}`);
    const heroImage = document.querySelector("#heroBg");
    if (!heroImage || !heroImage.style.backgroundImage.includes(testCase.id)) problems.push("hero image non impostata");
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((node) => JSON.parse(node.textContent))
      .find((entry) => entry["@graph"]);
    const trip = jsonLd?.["@graph"]?.find((entry) => entry["@type"] === "TouristTrip");
    if (!trip) problems.push("TouristTrip JSON-LD assente");
    if (testCase.expectedPrice === "Su richiesta") {
      if (document.querySelector("#pPrezzo")?.textContent.trim() !== "Su richiesta") problems.push("prezzo pacchetto errato");
      if (trip?.offers) problems.push("Offer presente senza prezzo");
      if (!/preventivo/i.test(document.querySelector("#heroCta")?.textContent || "")) problems.push("CTA preventivo assente");
      for (const id of ['heroCta', 'pacchettoBtn', 'percheBloccaBtn', 'navbarCta', 'stickyCtaBtn']) {
        const url = new URL(document.getElementById(id).href);
        if (url.searchParams.get('meta') !== testCase.id || url.hash !== '#preventivoForm') problems.push(`CTA ${id} perde la meta o apre il checkout`);
      }
      if (getComputedStyle(document.querySelector('#payToggle')).display !== 'none') problems.push('acconto disponibile senza prezzo');
      if (/Paghi online|Stripe/.test(document.querySelector('#nextSteps').innerText)) problems.push('istruzioni pagamento senza checkout');
    } else if (trip?.offers?.price !== testCase.expectedPrice.replace("€", "")) {
      problems.push("Offer JSON-LD errata");
    }
  }

  if (testCase.kind === "category") {
    const cards = document.querySelectorAll("#catalogGrid .dest-card").length;
    if (cards !== testCase.expectedCount) problems.push(`card: ${cards}/${testCase.expectedCount}`);
  }

  if (testCase.kind === "honeymoon" && !/Prenota una consulenza/i.test(text)) problems.push("CTA consulenza assente");
  if (testCase.kind === "cruise" && !/in arrivo/i.test(text)) problems.push("stato crociere assente");
  if (testCase.kind === "offers" && !document.querySelector("#offersGrid")) problems.push("griglia offerte assente");
  if (testCase.kind === "admin" && !document.querySelector("#f-offerta-attiva")) problems.push("schema admin non caricato");
  if (testCase.kind === "admin") {
    const index = window.DESTINATIONS.findIndex((d) => d.id === 'praga');
    selectDest(index);
    const edited = getFormData();
    if (edited.imgCard !== window.DESTINATIONS[index].imgCard) problems.push('salvataggio editor perde imgCard');
    if (edited.faq.length || edited.recensioni.length || edited.attivita.length) problems.push('editor aggiunge record vuoti a Praga');
  }

  if (testCase.kind === "home") {
    const oblo = document.querySelectorAll(".volo-oblo").length;
    if (oblo !== testCase.expectedPortholes) problems.push(`oblo: ${oblo}/${testCase.expectedPortholes}`);
    const sezioni = document.querySelectorAll("#homeCategorie section").length;
    if (sezioni !== testCase.expectedSections) problems.push(`sezioni categoria: ${sezioni}/${testCase.expectedSections}`);
    const card = document.querySelectorAll("#homeCategorie .dest-card").length;
    if (card === 0) problems.push("nessuna card nelle sezioni categoria");
    if (!document.querySelector(".volo-oblo.is-attivo")) problems.push("nessun oblo attivo");
    const prezzo = document.querySelector("#heroPriceMin")?.textContent.trim();
    if (!/^(DA \d+€|SU RICHIESTA)$/.test(prezzo || "")) problems.push(`prezzo hero: ${prezzo}`);
  }
  return problems;
}

async function inspectPage(debugPort, baseUrl, testCase) {
  const targetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" });
  const target = await targetResponse.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  const errors = [];
  const requests = new Map();
  client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    errors.push(exceptionDetails.exception?.description || exceptionDetails.text || "Errore JavaScript");
  });
  client.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error" && entry.url?.startsWith(baseUrl)) errors.push(entry.text);
  });
  client.on("Network.requestWillBeSent", ({ requestId, request }) => requests.set(requestId, request.url));
  client.on("Network.responseReceived", ({ response }) => {
    if (response.url.startsWith(baseUrl) && response.status >= 400) errors.push(`${response.status} ${response.url}`);
  });
  client.on("Network.loadingFailed", ({ requestId, errorText, canceled }) => {
    const url = requests.get(requestId);
    if (!canceled && url?.startsWith(baseUrl)) errors.push(`${errorText} ${url}`);
  });

  await Promise.all([
    client.send("Runtime.enable"), client.send("Page.enable"),
    client.send("Network.enable"), client.send("Log.enable")
  ]);
  await client.send("Page.navigate", { url: `${baseUrl}${testCase.path}` });
  var ready = false;
  for (var attempt = 0; attempt < 100; attempt += 1) {
    const state = await client.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true
    });
    if (state.result.value === "complete") {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) errors.push("timeout caricamento pagina");
  await new Promise((resolve) => setTimeout(resolve, 300));
  const expression = `(${checksFor.toString()})(${JSON.stringify(testCase)})`;
  const evaluation = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (evaluation.exceptionDetails) errors.push(evaluation.exceptionDetails.text);
  else errors.push(...(evaluation.result.value || []));
  client.close();
  await fetch(`http://127.0.0.1:${debugPort}/json/close/${target.id}`);
  return [...new Set(errors)];
}

const manifest = parseCatalogCsv(await readFile(path.join(ROOT, "data", "catalogo.csv"), "utf8"));
const testCases = manifest.rows.map((row) => ({
  kind: "detail",
  id: row.id,
  name: row.nome,
  expectedPrice: row.prezzo ? `${Number(row.prezzo.replace(",", "."))}€` : "Su richiesta",
  path: `/viaggio.html?id=${row.id}`
}));
testCases.push(
  { kind: "category", path: "/mercatini-natale.html", expectedCount: 4 },
  { kind: "category", path: "/europa.html", expectedCount: 16 },
  { kind: "category", path: "/mare-sole.html", expectedCount: 4 },
  { kind: "category", path: "/intercontinentali.html", expectedCount: 7 },
  { kind: "honeymoon", path: "/viaggi-di-nozze.html" },
  { kind: "cruise", path: "/crociere.html" },
  { kind: "offers", path: "/offerte.html" },
  { kind: "admin", path: "/admin.html" },
  { kind: "home", path: "/index.html", expectedPortholes: 27, expectedSections: 4 }
);

const server = await startStaticServer();
const { port: sitePort } = server.address();
const debugPort = await freePort();
const profile = path.join(process.env.TEMP || "D:\\tmp", `skappa-chrome-${process.pid}`);
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "about:blank"
], { stdio: "ignore", windowsHide: true });

try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const baseUrl = `http://127.0.0.1:${sitePort}`;
  const failures = [];
  for (const testCase of testCases) {
    const errors = await inspectPage(debugPort, baseUrl, testCase);
    const label = testCase.id || testCase.path;
    if (errors.length) failures.push({ label, errors });
    else console.log(`ok ${label}`);
  }
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure.label}: ${failure.errors.join(" | ")}`);
    process.exitCode = 1;
  } else {
    console.log(`Browser smoke completato: ${testCases.length} pagine senza errori`);
  }
} finally {
  chrome.kill();
  await new Promise((resolve) => server.close(resolve));
}
