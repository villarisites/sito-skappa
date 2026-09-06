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

for (const source of sources) {
  const directory = path.join(root, "assets", "foto", source.slug);
  await mkdir(directory, { recursive: true });
  const input = await download(source.photoId);
  const pipeline = sharp(input).rotate();
  // Il rapporto va imposto, non ereditato dalla sorgente. Chiedendo solo la
  // larghezza uscivano hero di sette forme diverse — undici verticali — e ogni
  // pagina meta ritagliava la sua in modo suo. `position` al 30% dall'alto e'
  // la stessa banda che l'hero mostra (css/style.css, ".pagina-viaggio .hero-bg").
  const ritaglio = { fit: "cover", position: sharp.gravity.north };
  await Promise.all([
    pipeline.clone().resize(1920, 1280, ritaglio).webp({ quality: 82, effort: 4 }).toFile(path.join(directory, "hero.webp")),
    pipeline.clone().resize(840, 560, ritaglio).webp({ quality: 82, effort: 4 }).toFile(path.join(directory, "card.webp")),
    pipeline.clone().resize(320, 213, ritaglio).webp({ quality: 72, effort: 4 }).toFile(path.join(directory, "card-sm.webp"))
  ]);
  console.log(`${source.slug}: hero, card, card-sm`);
}

console.log(`Immagini generate: ${sources.length} destinazioni da Pexels`);
