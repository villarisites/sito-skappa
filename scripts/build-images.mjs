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
  await Promise.all([
    pipeline.clone().resize({ width: 1920 }).webp({ quality: 82, effort: 4 }).toFile(path.join(directory, "hero.webp")),
    pipeline.clone().resize({ width: 840 }).webp({ quality: 82, effort: 4 }).toFile(path.join(directory, "card.webp")),
    pipeline.clone().resize({ width: 320 }).webp({ quality: 72, effort: 4 }).toFile(path.join(directory, "card-sm.webp"))
  ]);
  console.log(`${source.slug}: hero, card, card-sm`);
}

console.log(`Immagini generate: ${sources.length} destinazioni da Pexels`);
