import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { parseCatalogCsv } from "./catalog-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = "https://skappa.it";

function entry(location, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${location}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>"
  ].join("\n");
}

const context = { window: {} };
vm.runInNewContext(
  await readFile(path.join(root, "data", "categorie.js"), "utf8"),
  context
);
const categoryPages = context.window.SKAPPA_CATEGORIE
  .filter(({ inMenu }) => inMenu)
  .sort((left, right) => left.ordine - right.ordine)
  .map(({ pagina }) => pagina);
const manifest = parseCatalogCsv(await readFile(path.join(root, "data", "catalogo.csv"), "utf8"));

const entries = [
  entry(`${baseUrl}/`, "weekly", "1.0"),
  ...categoryPages.map((page) => entry(`${baseUrl}/${page}`, "monthly", "0.9")),
  entry(`${baseUrl}/offerte.html`, "daily", "0.9"),
  ...manifest.rows.map(({ id }) => entry(`${baseUrl}/viaggio.html?id=${id}`, "monthly", "0.85")),
  ...[
    ["chi-siamo.html", "monthly", "0.7"], ["faq.html", "monthly", "0.6"],
    ["cancellazione.html", "yearly", "0.4"], ["termini.html", "yearly", "0.4"],
    ["privacy.html", "yearly", "0.4"], ["cookie.html", "yearly", "0.3"]
  ].map(([page, frequency, priority]) => entry(`${baseUrl}/${page}`, frequency, priority))
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${entries.join("\n\n")}\n\n</urlset>\n`;
await writeFile(path.join(root, "sitemap.xml"), xml, "utf8");
console.log(`Sitemap generata: ${entries.length} URL (${manifest.rows.length} destinazioni)`);
