// Dalla foto della cappelliera ricava una piastrella che si ripete lungo la cabina.
//
// Uso: node scripts/build-cabin-bin.mjs <foto.png>
//
// Due cose che l'asset deve fare e che non vengono da sole:
//  - ripetersi al GIUNTO della portella, non a un punto qualsiasi: si trovano le
//    fughe verticali (colonne piu' scure della media) e si ritaglia fra quelle,
//    cosi' la ripetizione cade dove cadrebbe in un aereo vero;
//  - SPEGNERSI IN BASSO. Sotto la cappelliera c'e' la parete della scena, che ha
//    il suo colore: con un bordo netto si vedrebbe la cucitura. L'ultimo tratto
//    sfuma verso il trasparente e la luce di cortesia si posa sulla parete.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORGENTE = process.argv[2];
const USCITA = resolve(radice, "assets/flight/cabin-bin.webp");
if (!SORGENTE) {
  console.error("Manca la foto di partenza.\n  node scripts/build-cabin-bin.mjs <foto.png>");
  process.exit(1);
}

const grigio = await sharp(readFileSync(SORGENTE)).greyscale().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = grigio.info;

// Le fughe sono colonne piu' scure: si guarda solo la meta' alta, dove c'e' la
// portella, perche' in basso la striscia di luce falserebbe la media.
const finoA = Math.round(H * 0.55);
const colonne = new Float64Array(W);
for (let x = 0; x < W; x++) {
  let somma = 0;
  for (let y = 0; y < finoA; y++) somma += grigio.data[y * W + x];
  colonne[x] = somma / finoA;
}
const media = colonne.reduce((a, b) => a + b, 0) / W;
const dev = Math.sqrt(colonne.reduce((a, b) => a + (b - media) ** 2, 0) / W);

const fughe = [];
for (let x = 1; x < W - 1; x++) {
  if (colonne[x] < media - 1.2 * dev && colonne[x] <= colonne[x - 1] && colonne[x] <= colonne[x + 1]) {
    if (!fughe.length || x - fughe[fughe.length - 1] > W * 0.1) fughe.push(x);
  }
}
console.log("fughe della portella a x =", fughe.join(", ") || "(nessuna)");

let da = 0, a = W;
if (fughe.length >= 2) { da = fughe[0]; a = fughe[fughe.length - 1]; }
const largo = a - da;
console.log("piastrella:", largo + "x" + H, "da x=" + da);

const { data, info } = await sharp(readFileSync(SORGENTE))
  .extract({ left: da, top: 0, width: largo, height: H })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const C = info.channels;

// L'ultimo tratto si spegne: sotto c'e' la parete della scena.
const SPEGNI_DA = 0.72;      // frazione dell'altezza in cui comincia a sparire
for (let y = 0; y < info.height; y++) {
  const t = y / info.height;
  if (t <= SPEGNI_DA) continue;
  const k = 1 - (t - SPEGNI_DA) / (1 - SPEGNI_DA);
  const morbido = k * k * (3 - 2 * k);
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * C;
    data[i + 3] = Math.round(data[i + 3] * morbido);
  }
}

const finale = await sharp(data, { raw: { width: info.width, height: info.height, channels: C } })
  .webp({ quality: 86, alphaQuality: 92 })
  .toFile(USCITA);
console.log("scritto", USCITA, finale.width + "x" + finale.height, finale.size, "byte");
console.log("rapporto larghezza/altezza da riportare in cabin.js:",
            +(finale.width / finale.height).toFixed(4));
