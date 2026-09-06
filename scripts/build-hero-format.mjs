// Porta le foto delle mete tutte alla STESSA forma: 3:2.
//
// Perche' serve: `build-images.mjs` chiedeva solo la larghezza e lasciava il
// rapporto della sorgente. Il risultato erano 35 hero di sette forme diverse —
// undici VERTICALI (Amsterdam 1920x2880, Hurghada 1920x3409 e 2,2 MB) — e ogni
// pagina meta ritagliava la sua in modo suo. Ogni regola sull'inquadratura
// andava tarata meta per meta.
//
// Il ritaglio riproduce quello che il browser fa gia' oggi, cosi' la foto che
// si vede non cambia inquadratura: al centro in orizzontale, e in verticale al
// 30% dall'alto — lo stesso `background-position: 50% 30%` con cui l'hero
// disegna la foto (css/style.css, ".pagina-viaggio .hero-bg").
//
// Non scarica niente: lavora sui file che ci sono. Le sorgenti di quattordici
// mete su trentacinque non stanno in data/photo-sources.json, quindi rigenerare
// da Pexels non e' un'opzione.
//
//   node scripts/build-hero-format.mjs            elenca cosa farebbe
//   node scripts/build-hero-format.mjs --scrivi   riscrive i file
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// La hero e' la misura che conta; card e card-sm seguono lo stesso rapporto
// perche' escono dalla stessa foto e dalla stessa pipeline.
const FORMATI = [
  { file: "hero.webp",    larga: 1920, alta: 1280, qualita: 82 },
  { file: "card.webp",    larga: 840,  alta: 560,  qualita: 82 },
  { file: "card-sm.webp", larga: 320,  alta: 213,  qualita: 72 }
];
const FUOCO_Y = 0.30;   // la banda che si vede, quando c'e' da tagliare in altezza

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = path.join(root, "assets", "foto");
const scrivi = process.argv.includes("--scrivi");

const mete = (await readdir(base, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && d.name !== "utility")
  .map((d) => d.name)
  .sort();

let cambiati = 0, risparmio = 0;
const ingranditi = [];

for (const meta of mete) {
  for (const f of FORMATI) {
    const file = path.join(base, meta, f.file);
    let prima;
    try { prima = await stat(file); } catch { continue; }

    const dati = await readFile(file);
    const m = await sharp(dati).metadata();
    if (m.width === f.larga && m.height === f.alta) continue;

    // Il rettangolo da tenere: al centro in orizzontale, al FUOCO_Y in verticale.
    let cw, ch, cx, cy;
    if (m.width / m.height > f.larga / f.alta) {
      ch = m.height;
      cw = Math.round(m.height * (f.larga / f.alta));
      cy = 0;
      cx = Math.round((m.width - cw) / 2);
    } else {
      cw = m.width;
      ch = Math.round(m.width / (f.larga / f.alta));
      cx = 0;
      cy = Math.round((m.height - ch) * FUOCO_Y);
    }

    const uscita = await sharp(dati)
      .extract({ left: cx, top: cy, width: cw, height: ch })
      .resize(f.larga, f.alta, { fit: "fill", kernel: "lanczos3" })
      .webp({ quality: f.qualita, effort: 4 })
      .toBuffer();

    const dKB = Math.round((uscita.length - prima.size) / 1024);
    // Segnalate solo quelle ingrandite davvero, e solo la hero: un 1916 portato
    // a 1920 non lo vede nessuno, un 890 si.
    const molle = f.file === "hero.webp" && cw < f.larga * 0.8;
    if (molle) ingranditi.push(`${meta} (sorgente utile ${cw}x${ch}, ${(f.larga / cw).toFixed(2)}x)`);
    console.log(`${meta.padEnd(18)} ${f.file.padEnd(12)} ${String(m.width + "x" + m.height).padEnd(11)}` +
                ` -> ${f.larga}x${f.alta}  ${dKB >= 0 ? "+" : ""}${dKB} KB${molle ? "  INGRANDITA da " + cw + "px" : ""}`);

    if (scrivi) await writeFile(file, uscita);
    cambiati++;
    risparmio -= dKB;
  }
}

console.log(`\n${cambiati} file da riformattare su ${mete.length} mete` +
            (scrivi ? " — SCRITTI" : " — prova a vuoto, usa --scrivi per applicare") +
            `, ${risparmio >= 0 ? "risparmio" : "aumento"} ${Math.abs(risparmio)} KB`);
if (ingranditi.length) {
  console.log(`\nQueste partono da meno di 1536px utili: la foto viene ingrandita e resta molle.`);
  console.log("Vanno sostituite con una sorgente piu' grande, non si sistema qui:");
  ingranditi.forEach((r) => console.log("  - " + r));
}
