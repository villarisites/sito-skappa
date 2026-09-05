// Dalla foto del vano del finestrino ricava un asset con il BUCO trasparente.
//
// Uso: node scripts/build-cabin-window.mjs <foto.png>
//
// L'immagine di partenza ha l'apertura riempita di verde pieno: i generatori non
// producono alpha, e chiedere un verde da scontornare e' l'unico modo di ottenere
// un buco vero attraverso cui far passare il panorama.
//
// Due cose che non si possono saltare:
//  - il DESPILL. Sul bordo interno della cornice il verde sborda e lascia un alone
//    che si vede eccome sopra una foto calda. Si toglie riportando il canale verde
//    alla media di rosso e blu dove sfora.
//  - la MISURA dell'apertura. La cabina deve allineare il buco dell'asset al foro
//    che ha gia' calcolato: senza le proporzioni esatte l'allineamento va a occhio
//    e si vede un anello di parete dentro al finestrino.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORGENTE = process.argv[2];
const USCITA = resolve(radice, "assets/flight/window-bay.webp");
if (!SORGENTE) {
  console.error("Manca la foto di partenza.\n  node scripts/build-cabin-window.mjs <foto.png>");
  process.exit(1);
}

const { data, info } = await sharp(readFileSync(SORGENTE))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// Quanto un pixel e' "verde da togliere": il verde che supera il maggiore fra
// rosso e blu. Sul verde pieno vale ~200, sulla plastica chiara sta sotto zero.
function verdezza(i) {
  return data[i + 1] - Math.max(data[i], data[i + 2]);
}

const DENTRO = 90;   // sopra: buco pieno
const FUORI = 25;    // sotto: materiale pieno; in mezzo, bordo sfumato

let minX = W, maxX = -1, minY = H, maxY = -1, aperti = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    const v = verdezza(i);

    let alpha = 255;
    if (v >= DENTRO) alpha = 0;
    else if (v > FUORI) alpha = Math.round(255 * (1 - (v - FUORI) / (DENTRO - FUORI)));

    // Despill: dove il verde sfora, lo si riporta alla media degli altri due.
    // Va fatto anche sui pixel che restano opachi, perche' l'alone e' proprio li'.
    const medio = (data[i] + data[i + 2]) / 2;
    if (data[i + 1] > medio) data[i + 1] = Math.round(medio + (data[i + 1] - medio) * 0.15);

    data[i + 3] = alpha;
    if (alpha < 128) {
      aperti++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

// L'asset deve essere SOLO il finestrino, non anche una toppa di parete.
// Il pannello piatto attorno alla cornice porta con se' la luce con cui e' stato
// generato: sopra la parete della scena, che ha il suo gradiente, si legge come
// un rettangolo piu' chiaro attorno a ogni finestrino. Sfumare i bordi non basta,
// perche' il colore sbagliato resta comunque dentro alla sfumatura.
//
// Dove finisce la cornice e comincia il pannello lo si misura invece di deciderlo:
// la cornice e l'incasso hanno rilievo, il pannello e' piatto. Si confronta
// l'immagine con la sua versione molto sfocata e si guarda dove il dettaglio muore.
const sfocata = await sharp(readFileSync(SORGENTE))
  .greyscale().blur(26).raw().toBuffer();
const piana = await sharp(readFileSync(SORGENTE))
  .greyscale().raw().toBuffer();

// La grana del pannello e' dettaglio anche lei: se si conta qualunque scarto,
// il bordo risulta essere tutta l'immagine. Il rilievo della cornice e' molto
// piu' forte della grana, quindi si alza la soglia; e si contano le colonne
// dove il rilievo c'e' su una porzione consistente dell'altezza, invece di
// fermarsi al primo pixel isolato.
const SOGLIA = 16;

const perColonna = new Int32Array(W);
const perRiga = new Int32Array(H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (Math.abs(piana[y * W + x] - sfocata[y * W + x]) > SOGLIA) {
      perColonna[x]++; perRiga[y]++;
    }
  }
}
const cx = (minX + maxX + 1) / 2, cy = (minY + maxY + 1) / 2;

// La soglia non puo' essere un numero fisso: la grana del pannello e' forte
// quanto basta da oscillare sopra e sotto qualunque valore scelto a priori, e
// infatti con una soglia fissa la cornice risultava larga quanto l'immagine.
// Si ricava invece dall'immagine stessa: il rilievo della cornice e' molto
// sopra la mediana, la grana ci sta attorno.
function estremi(profilo, lunghezza) {
  const ordinato = Array.from(profilo).sort(function (a, b) { return a - b; });
  const mediana = ordinato[ordinato.length >> 1];
  const massimo = ordinato[ordinato.length - 1];
  const soglia = mediana + 0.55 * (massimo - mediana);
  // serve una corsa di colonne consecutive: una sola colonna anomala sul bordo
  // dell'immagine basterebbe a falsare tutto
  var primo = -1, ultimo = -1, corsa = 0;
  for (var i = 0; i < lunghezza; i++) {
    if (profilo[i] > soglia) {
      corsa++;
      if (corsa >= 3) { if (primo < 0) primo = i - 2; ultimo = i; }
    } else corsa = 0;
  }
  return primo < 0 ? [0, lunghezza - 1] : [primo, ultimo];
}

const [sinistra, destra] = estremi(perColonna, W);
const [sopra, sotto] = estremi(perRiga, H);
let bordoX = Math.max(Math.abs(sinistra - cx), Math.abs(destra - cx));
let bordoY = Math.max(Math.abs(sopra - cy), Math.abs(sotto - cy));

// un margine, perche' l'ombra portata della cornice sulla parete e' parte del pezzo
const semiX = Math.min(W / 2, bordoX * 1.06);
const semiY = Math.min(H / 2, bordoY * 1.06);
const SFUMA = 0.1;        // frazione del semiasse su cui si spegne
console.log("cornice: si estende fino a", Math.round(semiX) + "x" + Math.round(semiY),
            "dal centro (l'immagine e'", W / 2 + "x" + H / 2 + ")");

// Maschera a rettangolo stondato attorno alla cornice, con bordo morbido: fuori
// di li' non c'e' asset, c'e' la parete della scena.
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    if (data[i + 3] === 0) continue;             // il buco resta buco
    // superellisse: piu' squadrata di un'ellisse, come la cornice vera
    const u = Math.abs(x - cx) / semiX;
    const v = Math.abs(y - cy) / semiY;
    const d = Math.pow(Math.pow(u, 4) + Math.pow(v, 4), 0.25);
    let k = (1 - d) / SFUMA;
    k = Math.max(0, Math.min(1, k));
    const morbido = k * k * (3 - 2 * k);
    data[i + 3] = Math.round(data[i + 3] * morbido);
  }
}

if (aperti === 0) {
  console.error("Nessun verde trovato: l'apertura non e' stata riempita di verde pieno?");
  process.exit(1);
}

const apW = maxX - minX + 1;
const apH = maxY - minY + 1;
const info2 = await sharp(data, { raw: { width: W, height: H, channels: C } })
  .webp({ quality: 88, alphaQuality: 95 })
  .toFile(USCITA);

console.log("scritto", USCITA, `${info2.width}x${info2.height}`, info2.size, "byte");
console.log("apertura:", `${apW}x${apH}`, "a partire da", `${minX},${minY}`);
console.log("");
console.log("Costanti da riportare in cabin.js (VANO):");
console.log(JSON.stringify({
  larghezzaSuApertura: +(W / apW).toFixed(4),
  altezzaSuApertura: +(H / apH).toFixed(4),
  centroAperturaX: +(((minX + maxX + 1) / 2) / W).toFixed(4),
  centroAperturaY: +(((minY + maxY + 1) / 2) / H).toFixed(4)
}, null, 2));
