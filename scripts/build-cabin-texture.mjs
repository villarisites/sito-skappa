// Dalla foto della parete della cabina ricava una MAPPA DI MATERIALE: solo la grana, senza
// luce e senza fughe. La luce la mette il CSS, le fughe le disegna l'SVG al
// passo dei finestrini — se stessero anche nella texture ci sarebbero due
// serie di fughe con spaziature diverse.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Uso: node scripts/build-cabin-texture.mjs <foto-della-parete.png>
// La foto di partenza NON sta nel repository: e' un'immagine generata, pesante e
// non piu' necessaria una volta ricavata la piastrella. La ricetta invece serve,
// perche' l'asset e' derivato e va poter essere rifatto uguale.
const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORGENTE = process.argv[2];
const USCITA = resolve(radice, "assets/flight/cabin-wall.webp");
if (!SORGENTE) {
  console.error("Manca la foto di partenza.
  node scripts/build-cabin-texture.mjs <foto.png>");
  process.exit(1);
}

const grezza = sharp(readFileSync(SORGENTE)).greyscale();
const { data, info } = await grezza.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// ---- 1. dove sono le fughe: colonne piu' scure della media ----
const colonne = new Float64Array(W);
for (let x = 0; x < W; x++) {
  let somma = 0;
  for (let y = 0; y < H; y++) somma += data[y * W + x];
  colonne[x] = somma / H;
}
const mediaCol = colonne.reduce((a, b) => a + b, 0) / W;
let devCol = Math.sqrt(colonne.reduce((a, b) => a + (b - mediaCol) ** 2, 0) / W);
const fughe = [];
for (let x = 2; x < W - 2; x++) {
  if (colonne[x] < mediaCol - 1.6 * devCol && colonne[x] <= colonne[x - 1] && colonne[x] <= colonne[x + 1]) {
    if (!fughe.length || x - fughe[fughe.length - 1] > 30) fughe.push(x);
  }
}
console.log("fughe trovate a x =", fughe.join(", "));

// Fra due fughe c'e' un pannello, che su un aereo e' largo circa 50 cm:
// da qui la scala nativa della texture, in pixel per centimetro.
let pxPerCm = 9.94;
if (fughe.length >= 2) {
  const passi = [];
  for (let i = 1; i < fughe.length; i++) passi.push(fughe[i] - fughe[i - 1]);
  const passoMedio = passi.reduce((a, b) => a + b, 0) / passi.length;
  pxPerCm = passoMedio / 50;
  console.log("passo dei pannelli", passoMedio.toFixed(0), "px → scala nativa", pxPerCm.toFixed(2), "px/cm");
}

// ---- 2. il ritaglio piu' largo senza fughe ----
const bordi = [0, ...fughe, W];
let miglior = { da: 0, a: 0 };   // parte da zero, se no nessun candidato lo supera
for (let i = 1; i < bordi.length; i++) {
  const da = bordi[i - 1] + (i > 1 ? 14 : 0);
  const a = bordi[i] - (i < bordi.length - 1 ? 14 : 0);
  if (a - da > miglior.a - miglior.da) miglior = { da, a };
}
const lato = Math.min(miglior.a - miglior.da, H) - 8;
const x0 = Math.round(miglior.da + (miglior.a - miglior.da - lato) / 2);
const y0 = Math.round((H - lato) / 2);
console.log("ritaglio senza fughe:", lato + "x" + lato, "da x=" + x0);

const ritaglio = await sharp(readFileSync(SORGENTE))
  .greyscale().extract({ left: x0, top: y0, width: lato, height: lato })
  .raw().toBuffer();

// ---- 3. via la luce: sottrae la versione molto sfocata, resta la grana ----
const sfocata = await sharp(ritaglio, { raw: { width: lato, height: lato, channels: 1 } })
  .blur(18).raw().toBuffer();

const GUADAGNO = 3.2;   // la grana da sola e' timida: va rinforzata
const dettaglio = Buffer.alloc(lato * lato);
let somma = 0;
for (let i = 0; i < dettaglio.length; i++) {
  const v = 128 + (ritaglio[i] - sfocata[i]) * GUADAGNO;
  dettaglio[i] = Math.max(0, Math.min(255, Math.round(v)));
  somma += dettaglio[i];
}
// Ricentra esattamente sul grigio neutro: una mappa che non e' centrata sposta
// il tono della parete, e la luce deve restare decisa dai gradienti dell'SVG.
const scarto = 128 - somma / dettaglio.length;
for (let i = 0; i < dettaglio.length; i++) {
  dettaglio[i] = Math.max(0, Math.min(255, Math.round(dettaglio[i] + scarto)));
}
somma = 0;
for (let i = 0; i < dettaglio.length; i++) somma += dettaglio[i];
const mediaMappa = somma / dettaglio.length;
let dev = 0;
for (let i = 0; i < dettaglio.length; i++) dev += (dettaglio[i] - mediaMappa) ** 2;
console.log("media della mappa:", mediaMappa.toFixed(1), "(128 = neutra) | deviazione:", Math.sqrt(dev / dettaglio.length).toFixed(1));

// ---- 4. specchiata in 2x2: cosi' i bordi combaciano sempre ----
const base = sharp(dettaglio, { raw: { width: lato, height: lato, channels: 1 } });
const [n, fx, fy, fxy] = await Promise.all([
  base.clone().png().toBuffer(),
  base.clone().flop().png().toBuffer(),
  base.clone().flip().png().toBuffer(),
  base.clone().flip().flop().png().toBuffer()
]);
// il ridimensionamento va in una seconda passata: sharp applica resize prima
// del composite, e il mosaico non ci starebbe piu' dentro
const mosaico = await sharp({ create: { width: lato * 2, height: lato * 2, channels: 3, background: "#808080" } })
  .composite([
    { input: n, left: 0, top: 0 }, { input: fx, left: lato, top: 0 },
    { input: fy, left: 0, top: lato }, { input: fxy, left: lato, top: lato }
  ])
  .png().toBuffer();
const info2 = await sharp(mosaico).resize(512, 512).webp({ quality: 82 }).toFile(USCITA);
console.log("scritto", USCITA, info2.width + "x" + info2.height, info2.size, "byte");
console.log("SCALA_NATIVA_PX_PER_CM =", pxPerCm.toFixed(3), "| lato piastrella in cm =", ((lato * 2) / pxPerCm).toFixed(1));
