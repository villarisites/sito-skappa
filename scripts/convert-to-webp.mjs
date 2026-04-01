/**
 * convert-to-webp.mjs
 * Converte tutte le immagini JPG/PNG in assets/foto/ in formato WebP.
 * Aggiorna automaticamente tutti i riferimenti in HTML e JS.
 *
 * Uso: node scripts/convert-to-webp.mjs
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Prova a importare sharp
let sharp;
try {
  const mod = await import('sharp');
  sharp = mod.default;
} catch {
  console.error('sharp non trovato. Installa con: npm install sharp');
  process.exit(1);
}

// ── 1. Trova tutte le immagini JPG/PNG ───────────────────────────────────────
async function findImages(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await findImages(fullPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── 2. Converti in WebP ──────────────────────────────────────────────────────
async function convertImage(srcPath) {
  const ext = extname(srcPath);
  const destPath = srcPath.slice(0, -ext.length) + '.webp';

  if (existsSync(destPath)) {
    console.log(`  skip  ${basename(destPath)} (già esistente)`);
    return false;
  }

  await sharp(srcPath)
    .webp({ quality: 82, effort: 4 })
    .toFile(destPath);

  console.log(`  ok    ${basename(srcPath)} → ${basename(destPath)}`);
  return true;
}

// ── 3. Aggiorna riferimenti in file HTML e JS ─────────────────────────────────
async function updateReferences() {
  const targets = [];

  // tutti gli HTML nella root
  const rootEntries = await readdir(ROOT, { withFileTypes: true });
  for (const e of rootEntries) {
    if (e.isFile() && /\.html$/.test(e.name)) targets.push(join(ROOT, e.name));
  }

  // data/destinations.js e js/*.js
  const jsFiles = ['data/destinations.js', 'js/main.js'];
  for (const rel of jsFiles) {
    const p = join(ROOT, rel);
    if (existsSync(p)) targets.push(p);
  }

  let totalReplacements = 0;
  for (const filePath of targets) {
    let content = await readFile(filePath, 'utf8');
    const original = content;
    // Sostituisce estensioni .jpg / .jpeg / .png con .webp (solo per path dentro assets/)
    content = content.replace(/(['"`])(assets\/[^'"`]+)\.(jpg|jpeg|png)(['"`])/gi,
      (_, q1, path, _ext, q2) => `${q1}${path}.webp${q2}`);
    if (content !== original) {
      await writeFile(filePath, content, 'utf8');
      const matches = (content.match(/assets\/[^'"`]+\.webp/g) || []).length;
      console.log(`  refs  ${basename(filePath)} (${matches} riferimenti aggiornati)`);
      totalReplacements++;
    }
  }
  return totalReplacements;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const assetsDir = join(ROOT, 'assets', 'foto');
console.log('\n🔍 Scansione immagini in assets/foto/...');
const images = await findImages(assetsDir);
console.log(`   Trovate ${images.length} immagini\n`);

console.log('🖼  Conversione in WebP...');
let converted = 0;
for (const img of images) {
  const ok = await convertImage(img);
  if (ok) converted++;
}
console.log(`\n✅ Convertite ${converted} nuove immagini (${images.length - converted} già in WebP)\n`);

console.log('🔗 Aggiornamento riferimenti in HTML/JS...');
const updatedFiles = await updateReferences();
console.log(`\n✅ Aggiornati ${updatedFiles} file con riferimenti .webp\n`);

console.log('🎉 Fatto! Le immagini originali JPG/PNG sono conservate come backup.');
console.log('   Per eliminarle manualmente usa: find assets/ -name "*.jpg" -o -name "*.png"\n');
