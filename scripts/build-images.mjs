import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = JSON.parse(await readFile(path.join(root, "data", "photo-sources.json"), "utf8"));

async function download(photoId) {
  const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${photoId}: download HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`${photoId}: contenuto non immagine (${type})`);
  return Buffer.from(await response.arrayBuffer());
}

// Senza filtro le riscarica tutte. Con `--solo praga,sofia` solo quelle: serve
// quando si cambia la foto di una meta e non si vuole ritoccare le altre.
const soloArg = process.argv.find((a) => a.startsWith("--solo="));
const solo = soloArg ? new Set(soloArg.slice(7).split(",").map((x) => x.trim())) : null;

for (const source of sources) {
  if (solo && !solo.has(source.slug)) continue;
  const directory = path.join(root, "assets", "foto", source.slug);
  await mkdir(directory, { recursive: true });
  const input = await download(source.photoId);
  // Il rapporto va imposto, non ereditato dalla sorgente: chiedendo solo la
  // larghezza uscivano hero di sette forme diverse — undici verticali — e ogni
  // pagina meta ritagliava la sua in modo suo.
  // Il rettangolo e' lo stesso che usa scripts/build-hero-format.mjs: centro in
  // orizzontale, 30% dall'alto in verticale, cioe' la banda che l'hero mostra
  // (css/style.css, ".pagina-viaggio .hero-bg"). Le gravita' di sharp non
  // sanno esprimere una percentuale, quindi il taglio si calcola a mano.
  const dritto = await sharp(input).rotate().toBuffer();
  const m = await sharp(dritto).metadata();
  let cw, ch, cx, cy;
  if (m.width / m.height > 1.5) {
    ch = m.height;
    cw = Math.round(m.height * 1.5);
    cy = 0;
    cx = Math.round((m.width - cw) / 2);
  } else {
    cw = m.width;
    ch = Math.round(m.width / 1.5);
    cx = 0;
    cy = Math.round((m.height - ch) * 0.30);
  }
  const pipeline = sharp(dritto).extract({ left: cx, top: cy, width: cw, height: ch });
  const scala = { fit: "fill", kernel: "lanczos3" };
  await Promise.all([
    pipeline.clone().resize(1920, 1280, scala).webp({ quality: 82, effort: 4 }).toFile(path.join(directory, "hero.webp")),
    pipeline.clone().resize(840, 560, scala).webp({ quality: 82, effort: 4 }).toFile(path.join(directory, "card.webp")),
    pipeline.clone().resize(320, 213, scala).webp({ quality: 72, effort: 4 }).toFile(path.join(directory, "card-sm.webp"))
  ]);
  console.log(`${source.slug}: hero, card, card-sm`);
}

console.log(`Immagini generate: ${solo ? [...solo].join(", ") : sources.length + " destinazioni"} da Pexels`);
