/**
 * optimize-images.mjs
 * Converte tutte le immagini .jpg/.png in assets/foto/ in formato .webp
 * Richiede: npm install sharp
 * Esegui: node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FOTO_DIR = join(ROOT, 'assets', 'foto');

// Qualità WebP per tipo di immagine
const QUALITY_HERO = 80;
const QUALITY_ACTIVITY = 75;
const QUALITY_DEFAULT = 78;

/** Raccoglie ricorsivamente tutti i file .jpg/.png */
async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(fullPath)));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Determina la qualità in base al nome file */
function getQuality(filePath) {
  const name = basename(filePath).toLowerCase();
  if (name.startsWith('hero')) return QUALITY_HERO;
  if (name.startsWith('activity')) return QUALITY_ACTIVITY;
  return QUALITY_DEFAULT;
}

/** Converte un'immagine in WebP, ritorna oggetto con stats */
async function convertToWebP(srcPath) {
  const webpPath = srcPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const quality = getQuality(srcPath);

  const srcStat = await stat(srcPath);
  const srcKB = Math.round(srcStat.size / 1024);

  await sharp(srcPath)
    .webp({ quality })
    .toFile(webpPath);

  const dstStat = await stat(webpPath);
  const dstKB = Math.round(dstStat.size / 1024);
  const saving = Math.round((1 - dstKB / srcKB) * 100);

  return { src: srcPath, webp: webpPath, srcKB, dstKB, saving };
}

/** Aggiorna data/destinations.js sostituendo le estensioni immagini */
function updateDestinationsJs() {
  const destFile = join(ROOT, 'data', 'destinations.js');
  let content = readFileSync(destFile, 'utf8');

  // Sostituisce solo le estensioni nelle proprietà imgHero e img (activity images)
  const before = content;
  content = content.replace(/(["'])(assets\/foto\/[^"']*)\.(jpg|jpeg|png)(["'])/gi, (match, q1, path, ext, q2) => {
    return `${q1}${path}.webp${q2}`;
  });

  if (content !== before) {
    writeFileSync(destFile, content, 'utf8');
    console.log('✅ data/destinations.js aggiornato con estensioni .webp');
  } else {
    console.log('ℹ️  data/destinations.js: nessuna estensione da aggiornare');
  }
}

// ---- Main ----
const images = await collectImages(FOTO_DIR);
console.log(`\n🔍 Trovate ${images.length} immagini da convertire...\n`);

let totalSrcKB = 0;
let totalDstKB = 0;
let errors = 0;

for (const imgPath of images) {
  try {
    const result = await convertToWebP(imgPath);
    totalSrcKB += result.srcKB;
    totalDstKB += result.dstKB;
    const rel = imgPath.replace(ROOT, '').replace(/\\/g, '/');
    console.log(`  ${rel} → .webp  ${result.srcKB}KB → ${result.dstKB}KB (-${result.saving}%)`);
  } catch (err) {
    console.error(`  ❌ Errore: ${imgPath}\n     ${err.message}`);
    errors++;
  }
}

console.log('\n─────────────────────────────────────────');
console.log(`📦 Totale originali:  ${Math.round(totalSrcKB / 1024 * 10) / 10} MB`);
console.log(`📦 Totale WebP:       ${Math.round(totalDstKB / 1024 * 10) / 10} MB`);
console.log(`💾 Risparmio:         ${Math.round((1 - totalDstKB / totalSrcKB) * 100)}%`);
if (errors) console.log(`⚠️  Errori: ${errors}`);
console.log('─────────────────────────────────────────\n');

// Aggiorna destinations.js
updateDestinationsJs();

console.log('\n✅ Conversione completata!');
console.log('   Ricorda di aggiornare i tag <img> e <source> nell\'HTML se necessario.\n');
