# TASKS — skappa.it

## 2026-09-07 (notte) — Foto nuove per Bucarest, Budapest, Sofia e Hurghada

Le quattro che avevo segnalato come da sostituire, cercate su Pexels e scelte
guardandole (provini a contatto, sei candidate per meta').

| meta | prima | ora |
|---|---|---|
| Bucarest | 1222x687, sorgente utile 1031px (1,86x di ingrandimento) | 5184x3456 — centro storico dall'alto all'ora d'oro, Czapp Arpad |
| Budapest | 1280x1920 verticale, utile 1280px | 3968x2540 — Ponte delle Catene, Danubio e Parlamento, Kateryna Unuvar |
| Sofia | 1439x1920 verticale, utile 1439px | 6000x4000 — cattedrale Aleksandr Nevskij al tramonto, TSV Photography |
| Hurghada | 1920x3409 verticale, 2,2 MB — la sua banda 3:2 era quasi tutta telo di ombrellone e cielo | 6016x4000 — spiaggia, palme e mare turchese, Vika Glitter |

Nessuna delle quattro viene piu' ingrandita: le sorgenti sono tutte sopra i
3900px di larghezza.

### Come, e perche' cosi'

- Le tre nuove entrano in `data/photo-sources.json` con fotografo e pagina di
  origine, come le altre 21. Bucarest, Budapest e Sofia erano nell'elenco
  `REUSED_IDS` del test, cioe' avevano foto riciclate da chissa' dove; ora
  escono dalla stessa pipeline.
- `build-images.mjs` accetta `--solo=bucarest,budapest,sofia,hurghada`: senza
  filtro riscaricherebbe tutte e 21 e toccherebbe file che non c'e' motivo di
  toccare.
- Lo stesso script ora calcola il taglio 3:2 a mano invece di usare una
  gravita' di sharp: le gravita' non sanno esprimere una percentuale, e il
  taglio deve essere identico a quello di `build-hero-format.mjs` (centro in
  orizzontale, 30% dall'alto), se no i due strumenti si contraddicono.
- Il test `catalog-images` ora controlla anche l'**altezza**, non solo la
  larghezza. Guardando solo la larghezza passavano le hero verticali: era il
  buco da cui e' venuto tutto.

Pexels: uso libero, nessuna attribuzione richiesta; il fotografo resta
registrato in `photo-sources.json`.

### Restano molli, ma non le vede nessuno

Gallipoli (2,16x), Lloret de Mar (2,03x) e Tirana (1,51x) hanno la cartella
foto ma **nessuna scheda nel catalogo** — come Ibiza, Malta, Mykonos, Varsavia
e Zante. Se una di queste diventa una meta vera, la foto va rifatta prima.

`npm test` 41/41, `npm run test:browser` 36/36.

## 2026-09-07 (tardi) — Le foto delle mete hanno tutte la stessa forma

Francesco: *"rendere le foto di grandezza uguale... cosi' non dobbiamo
modificare per ogni meta"*. Aveva ragione sulla causa, e la causa stava a monte
di tutto quello che stavo aggiustando.

`build-images.mjs` chiedeva **solo la larghezza** (`resize({ width: 1920 })`) e
lasciava alla sorgente il rapporto. Risultato: 35 hero di sette forme diverse.

| forma | quante | esempi |
|---|---|---|
| 3:2 (1.500) | 14 | Praga, Madrid, Zante |
| **verticali** (0.56–0.80) | **11** | Amsterdam 1920x2880, Hurghada 1920x**3409** (2,2 MB), Giappone, Vienna |
| 4:3 (1.333) | 3 | Malta, Thailandia, Valencia |
| altre | 7 | 1.26, 1.6, 1.78, 2.02 |
| sotto risoluzione | 3 | Gallipoli 1200x593, Lloret 1200x630, Bucarest 1222x687 |

Con `cover` ogni forma diversa e' un ritaglio diverso, e a finestra alta e
stretta anche una **scala** diversa: la foto dell'hero era il 46% del sorgente,
quella lasciata dalla cabina il 78%. Nel passaggio cambiava grandezza. Nessuna
regola sull'inquadratura poteva valere per tutte.

Ora tutte 3:2: **hero 1920x1280, card 840x560, card-sm 320x213**. 105 file, 44
riscritti (i restanti erano gia' a posto), **~5 MB in meno** — Hurghada da sola
ne perde 1,4.

- `scripts/build-hero-format.mjs` (nuovo, `npm run build:hero-format`) lavora
  sui file che ci sono, senza rete: le sorgenti di 14 mete su 35 non stanno in
  `data/photo-sources.json`, quindi rigenerare da Pexels non era un'opzione.
  Senza `--scrivi` fa la prova a vuoto.
- Il ritaglio riproduce quello che il browser gia' faceva — centro in
  orizzontale, 30% dall'alto in verticale — quindi le foto non cambiano
  inquadratura, cambia solo il file.
- `build-images.mjs` corretto alla radice: `resize(1920, 1280, { fit: "cover" })`.
  Era li' il bug, e senza questo il prossimo download rimetteva tutto storto.

Originali salvati fuori dal repo prima di sovrascrivere (git li ha comunque).

### Sei mete hanno bisogno di una foto nuova

Partono da meno di 1536px utili: vengono ingrandite e restano molli. Non e' una
cosa che si sistema con uno script.

  Gallipoli (890x593, 2.16x) · Lloret de Mar (945x630, 2.03x) · Bucarest
  (1031x687, 1.86x) · Tirana (1273x849, 1.51x) · Budapest (1280x853, 1.50x) ·
  Sofia (1439x959, 1.33x)

Da guardare anche **Hurghada**: la sorgente e' uno scatto verticale sotto un
ombrellone, e la sua banda 3:2 e' quasi tutta telo e cielo. E' sempre stata
cosi' — il browser mostrava gia' quella banda — ma ora si vede che non e' una
buona hero.

### La foto non si muove piu' nel passaggio

Tre cose insieme, misurate:

- `.mondo-pieno img` (cabina) ora ha `object-position: 50% 30%`, lo stesso
  ritaglio dell'hero: prima lasciava il centro.
- `arrivo-posa` non muove piu' il ritaglio: cambia solo la luce e il riquadro.
- `.pagina-viaggio .hero-bg` e' legata al **viewport** (`height: max(100vh, 100%)`)
  invece che all'altezza dell'hero. L'hero e' alta quanto il suo contenuto — 788
  px su Praga, 916 su Monaco — e un riquadro diverso era un ritaglio diverso.
  Il `max()` serve alle hero piu' alte del viewport: li' la foto deve coprirle,
  se no resta una striscia scoperta in fondo.

Movimento della foto fra la fine della cabina e l'hero, su 4 misure di finestra
x 3 mete: **0,0 px in 9 casi su 12**. I tre che restano sono a 1280x720, dove
l'hero e' piu' alta del viewport (16–39 px, e sono percorsi, non scattati).

### La fascia cookie tornava sotto ai pulsanti

Francesco: *"cookie e privacy non e' in primo piano, su richiesta e richiedi
preventivo lo coprono"*. Colpa mia: l'arrivo dalla cabina alza `.hero-content`
a `z-index: 10000` e la navbar a 10001 per stare sopra il piano di continuita',
e la fascia stava a 9999. Portata a **10002**. Il consenso sta sopra tutto: e'
l'unica cosa che deve.

`npm test` 41/41, `npm run test:browser` 36/36.

## 2026-09-07 — La foto si posa dove deve, non 31 px piu' in giu'

Francesco: *"scende un po' rispetto alla fine, sono un po' sfasate in altezza"*.
Aveva ragione, e non era dove pensavo: la **cucitura** e' esatta al pixel (l'ultimo
fotogramma della cabina e il primo della meta combaciano, misurato a 1440x900,
1920x1080, 1366x768 e 1512x820). Il salto era **all'altro capo**, quando il piano
di continuita' passa il testimone alla `.hero-bg` vera.

Il piano finiva a `var(--arrivo-fine, 87vh)`. Ma l'hero della pagina meta non e'
una frazione del viewport: e' `min-height: 72vh` e poi **alta quanto il suo
contenuto** — nome, badge, date, pulsanti. Misurata davvero:

| finestra | Praga | Monaco di Baviera | Giappone |
|---|---|---|---|
| 1440x900 | 788 px | **916 px** | 788 px |
| 1280x720 | 776 px | 891 px | 776 px |
| 900x1000 | 741 px | 822 px | 741 px |

87vh non poteva essere giusto quasi mai. Su Praga a 1440x900 il piano finiva
31 px piu' in alto della hero; su Monaco ~69 px. Al 99% dell'animazione il piano
si spegne, la hero si scopre, e la foto scatta in giu' di quella differenza.

Ora `--arrivo-fine` la scrive **js/viaggio.js**, misurando l'hero vera dopo aver
scritto il contenuto — prima di quel punto non era misurabile. `cover` si
ricalcola sul riquadro, quindi basta dare al piano l'altezza vera perche' le due
inquadrature coincidano. Il ripiego, se quello script non gira, passa da 87vh a
**100vh**: nessun movimento d'altezza, che e' meglio di un movimento sbagliato.

Verificato con una sonda che calcola dove cade la cima della foto sullo schermo,
per il piano e per la hero: **scarto 0,0 px** su 4 misure di finestra x 3 mete.

Resta — di proposito — la discesa di ~32 px CSS *durante* l'arrivo: la cabina
lascia la foto ritagliata al centro, la hero la ritaglia al 30%. Quella
differenza va percorsa, e ora e' percorsa tutta dall'animazione invece di
essere per meta' uno scatto finale. Se anche quella deve sparire, la strada e'
far finire la cabina gia' sul ritaglio al 30% (`object-position` sull'immagine
a schermo intero): una riga, ma e' una scelta di regia.

`npm test` 41/41, `npm run test:browser` 36/36.

## 2026-09-06 (notte) — Il portale scorre, e il salto alla pagina meta si accorcia

Francesco: *"il problema e' tra fine immagine e inizio nuova pagina"*. Misurato,
sono due cose diverse, e tutte e due si vedono.

### 1. Il buco della navigazione

Alla fine della corsa il codice fa `location.href` e la pagina meta parte da
zero: fetch, parse, primo disegno. Nel frattempo la cabina resta inchiodata
sull'ultimo fotogramma. Prima misura (Chrome vero, cache disattivata): **539 ms
di pagina congelata piu' 101 ms di attesa**.

Ora, appena la corsa comincia, una regola di speculation rules chiede a Chrome di
caricare **e disegnare** la meta in anticipo: la corsa dura 1,18 s, che e' piu'
del tempo che serve. Quando si naviga la pagina e' gia' pronta e l'attivazione
salta tutto il caricamento. Dove il prerender non c'e' (Firefox, Safari) resta un
`rel="prefetch"`, che almeno toglie la rete di mezzo.

Si prepara **solo la meta in cui si sta gia' entrando**, non quelle su cui passa
il mouse: niente pagine scaricate a vuoto e niente visite finte in analytics.

Perche' la meta non bruci l'animazione d'arrivo mentre nessuno la guarda,
`viaggio.html` mette `data-in-anticipo` quando `document.prerendering` e' vero, e
lo toglie a `prerenderingchange`. L'attributo mette in pausa le animazioni
d'arrivo: il loro primo fotogramma e' gia' la foto a schermo intero, quindi in
pausa si vede esattamente quello che si deve vedere.

Misurato (Chrome senza DevTools attaccato — con il CDP collegato Chrome rifiuta
il prerender e il numero non si vede; server con 80 ms di latenza per richiesta,
tre giri per parte):

| | ultimo fotogramma cabina → primo pixel meta |
|---|---|
| prima | 202 / 218 / 245 ms |
| ora | 150 / 170 / 410 ms |

Il residuo (~150 ms) **non e' caricamento**: e' il costo dello scambio di pagina
del browser. Quello resta finche' si naviga davvero. Sulla rete vera il divario
e' piu' largo di cosi', perche' li' il caricamento pesa e in locale no.

### 2. La corsa stessa

Il portale spendeva **292 ms di main thread in ricalcoli di stile** su 1,2 s di
animazione, con un fotogramma da 83 ms. Due cause, tutte e due misurate:

- `--dolly` e `--par` sono proprieta' custom **ereditate**: scriverle a ogni
  fotogramma obbligava Chrome a ricalcolare lo stile di tutta la scena sotto.
  Ora sono registrate con `@property` e `inherits: false`. Nessuna delle due
  serviva ai figli: ognuna vale solo per l'elemento su cui viene scritta.
- lo spegnimento dei sette finestrini vicini erano **quattordici tween** (filtro
  e velo) che riscrivevano sette immagini grandi a ogni fotogramma. Ora e' un
  cambio di classe solo, e la transizione la fa il CSS.

| | ricalcoli di stile | fotogramma peggiore | oltre 32 ms | oltre 50 ms |
|---|---|---|---|---|
| prima | 255 per 292 ms | 83,3 ms | 4 | 1 |
| ora | 281 per **83 ms** | 42–50 ms | 2 | 0 |

Effetto collaterale voluto: al ritorno i vicini si riaccendono **in transizione**.
Prima il velo tornava con un tween e il filtro invece scattava alla fine, quando
`aggiornaLuci()` riscriveva gli inline.

### 3. La cucitura

Verificata a fotogrammi fermi: l'ultimo della cabina e il primo della meta
combaciano — stessa inquadratura, stessa posizione. L'unica cosa che cambiava
era la **fascia cookie**, che nella cabina stava sotto la scena a schermo intero
e nella meta saliva da sotto proprio durante l'arrivo. Ora aspetta 0,75 s.

### Verifica

- `npm test` 41/41, `npm run test:browser` 36/36.
- Il tetto degli script inline di `viaggio.html` sale da 3200 a 3450 caratteri:
  200 servono alla pausa del prerender, e devono stare inline perche' l'attributo
  va messo prima del primo calcolo di stile. La spiegazione sta in `style.css`,
  non nello script.
- Ritorno dalla meta alla cabina: provato, la scena si ricompone e i finestrini
  tornano alle loro luci.
- `flight-lab/cabin.js` rigenerato, `flight-lab/cabin.css` riallineato a mano.

### Resta aperto

- Lo scambio di pagina (~150 ms di immagine ferma). Toglierlo del tutto vuol dire
  non navigare — cioe' costruire la pagina meta senza cambiare documento. E' un
  cambio di architettura, non una regolazione.

## 2026-09-06 (tardi) — Le targhette stanno sulle portelle

Il nome della meta sta sulla portella della cappelliera, "dove un aereo mette i
numeri di fila". Ma le due griglie non hanno mai avuto un rapporto fra loro: le
portelle erano una piastrella ripetuta alla sua larghezza NATURALE (quella che
le viene dall'altezza e da `BIN_RAPPORTO`), i finestrini al passo delle campate.
Misurato a 1440x900: **portelle ogni 173 px, finestrini ogni 288**. Le due
griglie sfilavano l'una sull'altra e una targhetta su tre finiva a cavallo di un
giunto — era il caso di MONACO DI BAVIERA.

- [x] **Una portella per campata.** `backgroundSize` della cappelliera fissato a
      `passo x 100%` invece di `auto 100%`. La causa vera era il limite
      d'altezza (`dim.H * 0.34`): senza, la piastrella sarebbe naturalmente larga
      quanto una campata. Il limite pero' serve — a 396 px di fascia una
      cappelliera alta 224 px si mangerebbe il 57% della banda — quindi si paga
      un allargamento dell'asset (1,67x a 1440x900). Guardato: e' un guadagno,
      una portella larga quanto la campata ha le proporzioni che ha in un aereo
      vero invece di quelle di un quadretto.
- [x] **E in fase.** La piastrella si ripete dal bordo sinistro della SCENA,
      mentre il primo finestrino sta a mezzo viewport: senza
      `backgroundPositionX` la griglia avrebbe avuto il passo giusto ma sfasato.
      Su desktop la fase viene 0 e non si sarebbe visto; su mobile vale 78,9 px.
- [x] **Un nome non puo' sbordare dalla sua portella.** `max-width:
      calc(var(--passo) - 0.6rem)` sulla targhetta, col nome in uno `<span>`
      perche' un nodo di testo dentro un flex e' anonimo e `text-overflow` non
      ci ha presa. Prima prova col tetto all'86%: troncava MONACO DI BAVIERA
      (254 px su 288) che invece ci sta. Il limite giusto e' il bordo della
      portella, non una frazione.
- [x] **Tolto un `<linearGradient id="cappelliera">`** dalla parete SVG: residuo
      di quando la cappelliera era disegnata invece che un asset, non usato da
      nessun `url(#...)`, e per giunta rubava l'id al div. Funzionava per caso —
      `elBin` si risolve prima che la parete esista — ma una seconda
      `getElementById` avrebbe preso il gradiente. Ci e' cascato il primo probe
      di verifica, che leggeva `backgroundSize: auto` su un elemento alto 0.

**Verifiche.** Scarto targhetta-portella **0,00 px su tutte e otto**, a 1440x900
e a 390x844, e ancora 0 dopo aver ridimensionato la finestra a 1180, 900, 620,
390 e ritorno (la fase dipende da `vw` e `costruisci()` rigira al resize).
Fascia guardata a occhio nei due formati, su mobile anche dopo aver scorso di
una campata. Portale non regredito: fotogramma peggiore 34,0 e 232 fotogrammi
con 2 scatti sopra i 32 ms — meglio di prima. `npm test` 41/41,
`npm run test:browser` 36/36.

## 2026-09-06 (sera) — Dalla foto alle scritte, e tutto piu' svelto

Fra la cabina e la pagina della meta non c'era una transizione: c'era un taglio.
La foto arrivava a schermo intero, poi di colpo compariva la pagina finita, con
la sua hero piu' scura e ritagliata diversamente. Adesso quella differenza viene
percorsa, e le parole atterrano sulla foto mentre la foto si posa nella pagina.

- [x] **Il link porta l'informazione.** I finestrini puntano a
      `viaggio.html?id=...&da=cabina`. Sta nell'URL e non in sessionStorage cosi'
      sopravvive a un ricaricamento e si vede guardandolo. Il canonical non porta
      il parametro, quindi per i motori di ricerca resta una pagina sola.
- [x] **Il primo fotogramma della nuova pagina contiene gia' la foto.** Uno
      script inline in testa a `viaggio.html` — prima di qualunque foglio di
      stile — scrive `--foto-arrivo` e mette l'attributo `data-dalla-cabina`.
      Aspettare `destinations.js` o `viaggio.js` vorrebbe dire un fotogramma
      vuoto, ed e' li' che si vedrebbe il lampo.
- [x] **L'arrivo e' in CSS puro**, in `style.css` (cerca "L'ARRIVO DALLA
      CABINA"): nessuno script da aspettare e nessuno stato in cui il piano possa
      restare a coprire la pagina se qualcosa fallisce.
- [x] **Ad animare e' l'ALTEZZA del piano, non una maschera che scorre.** Sembra
      la scelta piu' cara ed e' invece l'unica che combacia: `cover` si ricalcola
      sul riquadro, quindi mentre il piano si accorcia la foto assume esattamente
      la scala che avra' nell'hero. Con una maschera su un piano alto 100vh la
      scala restava quella del viewport, e su mobile — dove `cover` e' guidato
      dall'altezza e non dalla larghezza — al cambio la foto faceva un salto.
- [x] **Le scritte stanno SOPRA il piano.** Il piano finisce esattamente dove
      finisce l'hero, quindi il testo non viene mai scoperto dalla sua ritirata:
      la prima versione lo lasciava sotto e si vedeva spuntare solo la parte
      bassa, attraverso la sfumatura, con le righe che arrivavano dal fondo verso
      l'alto — l'ordine rovesciato.
- [x] **Piu' svelto.** Il portale della cabina va da 2,0 s a 1,18 s. Le durate
      erano tarate in rapporto fra loro, quindi non sono state cambiate a mano
      una per una: c'e' `RITMO` in `js/cabina.js`, un solo numero che le accorcia
      tutte insieme con `timeScale`. L'arrivo dura 0,6 s. **Sono queste le due
      manopole** se il passaggio sembra sbrigativo o lento.
- [x] **Tolto il vecchio atterraggio del Volo**, script in `viaggio.html` e CSS
      in `volo.css`: `js/volo.js` non e' piu' caricato da nessuna pagina da
      quando la cabina ha preso il posto del Volo, quindi il flag che lo
      accendeva non veniva piu' scritto e l'animazione non partiva mai.

**Una trappola, costata un giro.** Un `url()` dentro una variabile CSS non lo
risolve il documento ma il FOGLIO che se ne serve: scritto relativo diventava
`css/assets/foto/...` e il piano restava blu. Ora lo script lo risolve in JS.

**Verifiche.** `npm test` 41/41 (due test di guardia aggiornati, non allentati:
gli href dei finestrini e il tetto degli script inline), `npm run test:browser`
36/36, sequenza catturata a 1440x900 e a 390x844 in un Chrome vero, e movimento
ridotto controllato — il piano non compare nemmeno.

## 2026-09-06 — La foto non si impasta piu' durante il portale

Difetto: entrando in un finestrino, la foto diventava una macchia per tutta la corsa
della camera. Confermato da Francesco in un browser vero, e non riproducibile in
headless: senza GPU il raster viene rifatto a ogni fotogramma e l'immagine esce sempre
nitida. Misurato in un Chrome vero con `Page.startScreencast` (i fotogrammi realmente
compositati) e la varianza del laplaciano al centro dello schermo.

**Causa.** `will-change: transform` su `.cabina.in-volo` dice alla GPU di rasterizzare
il piano UNA volta e poi stirarlo. E' anche quello che tiene fluida la corsa: togliendolo
la nitidezza va da 4 a 75, ma i fotogrammi scendono da 209 a 41. Quindi non si toglie —
gli si da' meno da stirare.

- [x] **La corsa della camera era tarata due volte.** `misura()` calcolava `DOLLY` come se
      la cabina fosse a schermo intero (com'e' nel prototipo), poi `apriLaCabina()` la
      ingrandiva comunque di k=2,27. In coordinate della fascia il viewport da coprire e'
      largo `vw/k`, non `vw`, e alto esattamente `H` — la fascia DIVENTA l'altezza dello
      schermo, per definizione di k. Aggiunta `scalaApertura()`, usata sia per tarare la
      corsa sia per eseguirla, cosi' i due conti non possono divergere.
- [x] **La foto viene impaginata tre volte piu' grande del suo riquadro** e rimpicciolita
      altrettanto dal transform: a schermo non cambia nulla, ma il raster di partenza e'
      tre volte piu' fitto. Il fattore si accorcia da solo quando il riquadro supera la
      risoluzione della sorgente (1920px), cosi' sugli schermi molto larghi non si paga
      memoria di decodifica per niente.

**Misure, a 1440x900.** Stiramento della texture a fine corsa **15,2x -> 3,3x**.
Nitidezza del fotogramma peggiore **4,1 -> 21,6**; il corpo della corsa da 23-31 a 42-65.
Fluidita' invariata: 210 fotogrammi in 2,4 s, 3 scatti sopra i 32 ms (prima 209 e 2).
Su mobile lo stiramento passa da 9,5x a 2,4x.

**Resta aperto.** Gli ultimi ~150 ms, al culmine dell'ingrandimento, sono ancora un po'
morbidi. Rilasciando il `will-change` a meta' corsa spariscono del tutto (nitidezza minima
48,7) ma compare uno scatto da 200 ms: misurato, e' un baratto peggiore. Su mobile la foto
a fine corsa non copre il viewport — difetto preesistente, non toccato qui.

**Verifiche.** `npm test` 41/41, `npm run test:browser` 36/36, console pulita.

## 2026-09-05 (pomeriggio) — Flusso "Su richiesta" corretto, cabina rimessa in piedi

Due lavori distinti. Il primo tocca il sito vero, il secondo solo il laboratorio.

### Sito — le mete senza prezzo non sono piu' acquistabili

- [x] **Checkout e acconto seguono il prezzo, non il vecchio link.** Budapest, Parigi,
      Bucarest, Barcellona, Sofia e Londra dicevano "Su richiesta" ma tenevano
      `linkPagamento` e `acconto`: le CTA aprivano ancora Stripe e Budapest calcolava un
      saldo di **-79 EUR**. Ora una regola sola (`canCheckout` / `canPayDeposit` in
      `js/travel-detail.js`) governa CTA, sticky bar, selettore acconto e cambio aeroporto.
- [x] **Le pagine leggere non parlano piu' come un pacchetto gia' pronto.** "Cosa succede
      dopo" racconta il preventivo invece delle istruzioni di pagamento, le sezioni senza
      contenuto spariscono, "Partenza da" senza citta' diventa "Partenza da concordare".
- [x] **Salvataggio admin non distruttivo.** Salvando Praga si perdeva `imgCard` e si
      creavano attivita', FAQ e recensioni vuote. I campi non esposti dall'editor ora si
      conservano.
- [x] **Regressioni aggiunte** su prezzo assente + vecchio checkout + acconto, e sullo
      smoke di browser (CTA che perdono la meta, acconto senza prezzo, imgCard).

### flight-lab — la cabina

Il prototipo era rimasto **a meta'**: markup e CSS nuovi (scroll orizzontale, comandi,
fallback senza JS) senza il JavaScript che li regge. La scena non si accendeva proprio.

- [x] **La prospettiva passa al contenitore che scorre.** Prima stava sulla scena, larga
      quanto tutta la cabina: il punto di fuga scorreva insieme alla parete. Ora l'origine
      resta al centro del viewport e coincide sempre col finestrino che lo scroll-snap
      centra — su qualunque schermo.
- [x] **Mobile.** A 390px i finestrini si sovrapponevano e sotto "Budapest" spuntava
      Vienna. Il passo ora viene dal rapporto vero dell'aereo (53cm fra i finestrini,
      23 di larghezza), non da frazioni della larghezza dello schermo.
- [x] **Due citta' nello stesso finestrino.** Il piano dei mondi a -620px scivolava di
      240px per campata contro un foro di 290: il panorama del vicino entrava in quello
      attivo. Portato a -150, con le tre misure (copertura del foro, copertura a fine
      corsa, non invasione del vicino) calcolate invece che scelte a occhio.
- [x] **Portale.** La navigazione partiva a Flip al 30%: ora `arrivo` e' l'onComplete
      della Flip stessa (verificato: progresso 1 all'arrivo, e **un solo** nodo immagine).
      La corsa della camera ha piu' margine e accelerazione lineare — l'accelerazione la
      dava gia' la prospettiva — quindi la cornice esce con calma invece che in uno scatto.
- [x] **Si entra solo dal finestrino centrato.** Cliccando un vicino la cabina ci si porta
      davanti e aspetta che lo scroll si fermi davvero. Prima si volava dentro un foro e
      si atterrava sulla foto di un altro.
- [x] **Sedili veri, e di profilo** (`assets/flight/seat-side.webp`, generato e
      scontornato) al posto dei gradienti CSS. La camera guarda la fiancata, perpendicolare
      all'asse della fusoliera: i sedili sono rivolti verso la prua, quindi si vedono **di
      lato**. Uno schienale frontale sarebbe corretto solo guardando lungo il corridoio.
      Il passo delle file e' quello vero (76 cm) e **non** coincide con quello dei
      finestrini (53): non si allineano, come in un aereo. La fase e' scelta perche'
      davanti al finestrino centrato ci sia il vuoto fra due file. Il primo piano viene
      tolto dal rendering a fine corsa: a z=+150 arrivava a ridosso della camera, dove la
      scala tende all'infinito.
- [x] **Cielo fuori dalla scena** — il suo `inset` negativo allargava l'area di
      scorrimento di 1665px.

- [x] **Texture della parete.** Non e' la foto incollata: dalla foto si ricava una MAPPA
      DI MATERIALE neutra (grigio medio = nessun effetto) applicata in soft-light, cosi'
      colore e luce restano ai gradienti dell'SVG e l'asset porta solo la grana.
      Lo script `npm run build:cabin-texture -- <foto.png>` trova le fughe misurando le
      colonne piu' scure, ritaglia la zona che non ne contiene (le fughe le disegna gia'
      l'SVG, al passo dei finestrini: averle anche nella piastrella voleva dire due serie
      con spaziature diverse), toglie la luce sottraendo la versione sfocata e specchia il
      risultato in 2x2 perche' i bordi combacino. 512x512, 84 KB.
      Due trappole trovate guardando: il pattern SVG sfuma i bordi della piastrella verso
      il trasparente e disegna una **griglia** sulla parete — si risolve disegnando
      l'immagine mezzo pixel oltre il bordo; e la prima piastrella conteneva le fughe per
      un mio errore nella scelta del ritaglio.

- [x] **Il salto foto -> pagina.** Non era una dissolvenza mancante: la cabina finiva con la
      foto a schermo intero ritagliata al centro, l'hero della meta e' alta **60vh** e
      ritagliata a **center 30%**. Due inquadrature diverse della stessa foto, scambiate di
      colpo. Ora la differenza viene percorsa: `flight-lab/arrivo.html` + `arrivo.js`
      riprendono la foto esattamente dov'era e la ritagliano fino al riquadro dell'hero,
      con l'ombra che entra durante e il contenuto che arriva per ultimo.
      **Misurato:** l'ultimo fotogramma della cabina e il primo dell'arrivo sono identici -
      differenza massima **0** su 1,1 milioni di pixel.
      Restava un fotogramma **nero** fra i due documenti (registrato con screencast CDP a
      1994 ms): la foto era un `<img>` a cui il JS assegnava il `src`, quindi il primo
      disegno del nuovo documento avveniva prima che gsap e `arrivo.js` fossero scaricati.
      Spostata in CSS, scritta dallo script inline nel `<head>`: **0 fotogrammi vuoti su 81**.

- [x] **Il vano del finestrino diventa un asset** (`assets/flight/window-bay.webp`, 50 KB).
      Le cornici disegnate in box-shadow sembravano adesivi appiccicati al muro; ora c'e'
      l'incasso profondo con la guida della tendina. Generato col verde nell'apertura e
      scontornato da `npm run build:cabin-window -- <foto.png>`, che fa tre cose non
      saltabili: **despill** (senza, l'alone verde sul bordo interno si vede sopra una foto
      calda), **misura dell'apertura** (le proporzioni finiscono in `cabin.js`: a occhio
      resta un anello di parete dentro al finestrino), e **ritaglio sulla sola cornice**.
      Quest'ultimo e' il punto: tenendo anche il pannello attorno, l'asset portava con se'
      la luce con cui era stato generato e attorno a ogni finestrino si vedeva un rettangolo
      piu' chiaro. Dove finisce la cornice si **misura** — soglia ricavata dall'immagine,
      perche' con una fissa la grana del pannello la faceva risultare larga quanto tutto.
- [x] **Finestrini ciechi con le tendine abbassate** alle estremita'. Con 5 finestrini per
      schermata restava mezza parete nuda a sinistra: la meta attiva e' centrata e prima di
      lei non c'e' nulla. I ciechi mostravano pero' una toppa di cielo piu' accesa delle
      foto, e la risposta esisteva gia' in un aereo vero: le tendine giu', ad altezze diverse.
- [x] **8 mete, 5 finestrini per schermata.** E un bug trovato dallo smoke, non a occhio:
      le mete erano passate da 3 a 8 nel JS ma non gli `<a>` nell'HTML — cinque destinazioni
      non erano cliccabili e sparivano dal fallback senza JS.

- [x] **L'atterraggio non e' piu' una tendina.** Il passaggio da foto piena a hero con le
      scritte usava `clip-path`: tagliava la foto di netto e il blocco della pagina saliva
      come una lama orizzontale. Ora il bordo basso e' una dissolvenza (maschera a gradiente
      con le tappe animate), l'ombra entra presto e lentamente invece che tutta nell'ultimo
      quarto, e le scritte hanno lo spazio per arrivare una per volta.
- [x] **Il fotogramma vuoto al cambio di documento** e' sceso a uno, ed e' **navy** invece che
      nero: e' il colore della pagina, quindi non si legge come uno stacco. La foto e' in CSS
      (non un `<img>` riempito dal JS) piu' un `preload` a priorita' alta.
      **Le View Transition fra documenti sono state provate e tolte: misurate, PEGGIORAVANO** —
      341/137/171 ms di vuoto contro 0/0/1 fotogramma senza. Il brief le indicava come
      possibile miglioramento; su questo impianto non lo sono.

- [x] **La cappelliera diventa un asset** (`assets/flight/cabin-bin.webp`, 62 KB). Era una
      banda bianca ondulata disegnata in SVG, ed era l'elemento piu' finto dell'inquadratura:
      accanto a finestrini fotografici stonava. Ora e' una piastrella ripetuta al passo delle
      campate, con la sua striscia di luce di cortesia — quella che l'SVG fingeva con un
      gradiente. `npm run build:cabin-bin -- <foto.png>` trova le fughe della portella e
      ritaglia **fra quelle**, cosi' la ripetizione cade dove cadrebbe in un aereo vero, e
      spegne il bordo basso nel trasparente perche' la luce si posi sulla parete invece di
      finire con una cucitura. La piastrella e' alzata sopra il bordo dello schermo: il
      giunto col soffitto, tagliato dall'inquadratura, si leggeva come una riga nera.

- [x] **Si vedeva il bordo della foto nei finestrini laterali** scorrendo. Non era una svista
      di dimensione ma un conto sbagliato: lo scivolamento del piano dei mondi era calcolato
      su UNA campata, mentre con cinque finestrini in vista quelli esterni ne stanno a DUE.
      A quel punto le tre misure diventavano incompatibili — servivano 263px di mondo ma il
      tetto per non invadere il vicino era 253. Portando il piano da -150 a -100 lo
      scivolamento si dimezza e tornano compatibili (serve 221, tetto 264).
- [x] **Il nome della meta e' salito sulla cappelliera**, sopra al suo finestrino: e' dove un
      aereo mette i numeri di fila, ed e' il primo posto dove si guarda per capire dove si
      sta per entrare. Con il marchio SKAPPA accanto, come una compagnia lo stampa sulla
      portella — in scala di grigi sulle mete non attive, se no diventa una fila di bollini.

Resta: le 27 mete, la transizione inversa provata a fondo, l'integrazione nella home
(e quindi il porto di `arrivo.js` dentro `viaggio.html`).
Il laboratorio non tocca `index.html` ne' `viaggio.html`.

### Verifiche fatte

- 38 test unitari verdi (`npm test`), 36 pagine senza errori (`npm run test:browser`)
- Cabina guardata a 1440x900 e a 390x844 reali; transizione catturata per progresso
  della timeline; console pulita; fallback senza JS con link da 320x509 (non piu' 0x0)


## 2026-09-05 (notte) — Fasi 3 e 4 fatte. Resta solo l'uscita dal WIP.

Il rifacimento e' completo dal punto di vista tecnico. **Il sito e' ancora in WIP**:
l'ultimo passo, renderlo pubblico, e' una decisione tua, non tecnica.

- [x] **Fase 3 — Il Volo SKAPPA.** Fiancata d'aereo con 27 oblo' scorrevoli, uno per meta;
      quello al centro si ingrandisce e mostra nome e prezzo. Al clic il portello si apre
      dalla posizione dell'oblo' fino a schermo intero, con lampo di luce, e la pagina meta
      entra in scala. Nessuna libreria: `css/volo.css` + `js/volo.js` + `scripts/build-volo.mjs`.
      Gli oblo' sono link statici: funzionano senza JS e sono indicizzabili.
- [x] **Home riparata.** Usava ancora gli slug `mete-estive` / `fughe-in-europa` /
      `last-minute`, spariti con la Fase 2: **mostrava zero destinazioni**, senza un solo
      errore in console. Ora le sezioni nascono da `data/categorie.js`.
- [x] **Prezzi facoltativi.** Le 21 mete senza listino si pubblicano come "Su richiesta"
      (non "???": sembrerebbe un errore). La build non le rifiuta piu'.
      Quando arriveranno i prezzi: `npm run build:catalog -- --require-prices`.
- [x] **Fase 4 — peso: 152 MB -> 32 MB.** Via 73 MB di sorgenti foto gia' sostituiti dai
      `.webp` e la cartella `img/` legacy; ricompresse 24 immagini servite davvero
      (parigi/activity-2: 4,85 MB -> 0,56 MB). Via le 3 pagine del vecchio catalogo e
      `test_tee.html`. CSP ripulita, `/data/*` aggiunto alla whitelist WIP, sitemap rigenerata.
- [ ] **Uscita dal WIP — la decidi tu.** Vedi sotto.

### Come togliere il WIP, quando decidi

1. In `netlify.toml`, commenta o elimina i blocchi `[[redirects]]` fra i marcatori
   `# ===== WIP / MANUTENZIONE — INIZIO =====` e `# ===== WIP / MANUTENZIONE — FINE =====`.
2. In `wip.html` togli `noindex, nofollow`.
3. `git push` (serve l'account `villarisites`) — Netlify pubblica da solo.

**Non l'ho fatto io di proposito:** rende pubblico il sito, e 21 mete su 27 dicono
"Su richiesta". E' una scelta commerciale, non tecnica.

### Verifiche fatte

- 36 test unitari verdi (`npm test`)
- 36 pagine senza errori nello smoke di browser (`npm run test:browser`), **home inclusa**:
  prima non era coperta, ed e' proprio dove si era rotta
- Home e pagina meta controllate a 1440px e a 390px reali (emulazione mobile)
- Qualita' delle immagini ricompresse verificata su un ritaglio al 100%

**Tutto committato in locale, nulla pushato.**


## 2026-09-04 (notte) — Fase 1 IMPLEMENTATA e verificata

I tre template di dettaglio sono stati unificati in `viaggio.html`; i due file legacy sono stati
eliminati e hanno redirect 301 permanenti. Il render sceglie tema, SEO e comportamento dai dati.

- [x] `viaggio-citybreak.html` e `viaggio-lastminute.html` eliminati
- [x] CSS dei dettagli spostato in `css/style.css`, interamente sotto `.pagina-viaggio`
- [x] Tema per categoria: oro, teal e rosso, incluso il bagliore corretto del logo
- [x] SEO per categoria centralizzata in `data/categorie.js`; un solo blocco SEO in `<head>`
- [x] Selettore aeroporto, countdown futuro, sconto e `priceValidUntil` guidati dai dati
- [x] CTA: checkout, preventivo o consulenza secondo `linkPagamento` / `soloConsulenza`
- [x] Attivita', FAQ e recensioni vuote non lasciano sezioni vuote
- [x] `admin.html`, `sitemap.xml` e template di categoria allineati a `viaggio.html`
- [x] Redirect 301 aggiunti dopo il blocco WIP; la query string e' preservata dai redirect 301

**Verifica browser Playwright:** 14 destinazioni e 4 listing confrontati con il baseline,
0 differenze e 0 errori JS. Passano anche fixture per preventivo, consulenza, Last Minute,
scadenza passata/futura e sezioni vuote. `npm run build:pages` eseguito due volte: tutto invariato.
`verify-cards.cjs`: 28 card, 0 differenze. Dettaglio in `.ai-handoff/CLAUDE_REVIEW_fase1.md`.

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Fondamenta | **FATTA** |
| 1 | Template di dettaglio unico | **FATTA** |
| 2 | Tassonomia nuova (6 categorie, 27 mete), foto, pagine categoria | prossima |
| 3 | Hero "Il Volo SKAPPA" | da fare |
| 4 | Pulizia peso + uscita dal WIP | da fare |

## 2026-09-04 (sera) — Fase 0 IMPLEMENTATA e verificata

Fondamenta pronte. Il sito e' equivalente a prima, con tre eccezioni dichiarate (tutte migliorie).

- [x] `partials/nav.html` + `overlays.html` + `footer.html`; `scripts/build-pages.mjs` + `npm run build:pages`
- [x] Tutte e 13 le pagine con navbar passano dai partial (marcatori `<!--#partial ...-->`), build idempotente
- [x] `js/catalog.js` (`window.SkappaCatalog`) + `data/categorie.js`, inclusi in tutte e 13 le pagine
- [x] `buildCard` unica nel repo: card di home, europa, summer e last-minute provate **byte-identiche** (32 confronti, 0 differenze)
- [x] Ricerca centralizzata in `main.js` -> `SkappaCatalog`; JSON-LD e filtri passano dal catalogo
- [x] `categorie[]` scritto nei 14 oggetti di `data/destinations.js` (`tipologia` mantenuta), `admin.html` allineato
- [x] Verificato in browser reale: 5 pagine, zero errori JS di pagina

**Differenze visibili volute** (normalizzazione verso `index.html`, era gia' nel piano):
`width`/`height` su logo e immagine footer (fix CLS che avevano solo la home), `title="Cerca"`,
`aria-current="page"`, e il bottone di ricerca mobile aggiunto a `chi-siamo` e ai 3 `viaggio*`.

**Bug preesistente corretto:** su `fughe-in-europa`, `summer-tour` e `last-minute` c'era un secondo
IIFE di ricerca inline oltre a quello di `main.js`: i due handler si annullavano e **il bottone
cerca non apriva nulla**. Rimosso il duplicato.

**Percorso:** Codex (`task-mtn7j8pu-wx2iak`) ha fatto partial + catalog + admin + 5 pagine legali,
poi si e' fermato su ACL NTFS che negano la scrittura a `CodexSandboxUsers` su 10 file. Il resto
l'ho completato io su richiesta. Sblocco pronto in `scratchpad/sblocca-acl-codex.ps1` (serve un
PowerShell come amministratore) se si vuole tornare a usare Codex su questo repo.

Dettaglio completo in `.ai-handoff/CLAUDE_REVIEW.md`. **Non ancora committato.**

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Fondamenta | **FATTA** |
| 1 | Unificare i 3 template `viaggio*.html` in uno | prossima |
| 2 | Tassonomia nuova (6 categorie, 27 mete), foto, pagine categoria | da fare |
| 3 | Hero "Il Volo SKAPPA" | da fare |
| 4 | Pulizia peso + uscita dal WIP | da fare |

# TASKS — skappa.it

## 2026-09-04 — Approvato il rifacimento in 4 fasi (Fase 0 pianificata, non implementata)

**Nessuna modifica al sito.** Toccati solo `.gitignore` e questo file; tutto il resto e' materiale
di lavoro non pubblicato.

Il catalogo va ricostruito da zero: 27 mete nuove in 6 categorie, piu' un hero "Il Volo SKAPPA"
(aereo con oblo' che scorrono le mete, e all'apertura di una meta la porta si apre sulla destinazione).
Il punto di ripresa autorevole e' **`NEXT_SESSION.md`** in root — leggerlo prima di agire.
Piano completo in `~/.claude/plans/dobbiamo-modificare-il-sito-noble-micali.md`.

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Fondamenta: partial nav/footer + `scripts/build-pages.mjs`, `js/catalog.js`, `data/categorie.js`, `categorie[]` al posto di `tipologia` | pianificata |
| 1 | Unificare i 3 template `viaggio*.html` in uno | da fare |
| 2 | Tassonomia nuova, foto, pagine categoria | da fare |
| 3 | Hero "Il Volo SKAPPA" (CSS/JS puro, niente 3D) | da fare |
| 4 | Pulizia peso + uscita dal WIP | da fare |

- [x] `.gitignore` — aggiunti `.ai-handoff/` e `NEXT_SESSION.md` (mai committare ne' pubblicare)
- [x] Handoff Fase 0 scritto: `.ai-handoff/REQUEST.md`, `.ai-handoff/CLAUDE_PLAN.md`
- [x] **Riparato il plugin Codex.** `claude plugin list` dava
      `codex@openai-codex ✘ failed to load — Marketplace openai-codex not found`: la dichiarazione in
      `~/.claude/settings.json` aveva una sorgente ibrida github+`path` locale non piu' valida.
      Rimosso e ricreato il marketplace, reinstallato il plugin. **Si registra al riavvio della sessione.**
- [ ] **Implementare la Fase 0** (via `codex:codex-rescue`, handoff gia' pronto)
- [ ] **Serve a Francesco:** compilare i prezzi in `data/catalogo.csv` (nasce in Fase 2).
      E' l'unico blocco esterno, tutto il resto procede senza.

### Due verifiche fatte, da non ripetere

- **`assets/preventivi/` non e' esposto.** `git ls-files | grep preventiv` -> solo
  `preventivi-manager.html`; `git log --all -- 'assets/preventivi*'` -> vuoto. E' gitignored, non e'
  mai entrato nella storia, Netlify non lo pubblica. **Nessun history purge da fare.**
- **Peso reale deployato: 138 MB** (`git ls-files | xargs du -bc`). I `.zip`/`.mp4` sono gia'
  gitignored: il grasso pubblicato sono i `hero.png|jpg` sorgente ancora tracciati
  (budapest 37 MB, mykonos 15 MB, `utility/sfondo hero.png` 5,1 MB) e la cartella `img/` legacy.
  Servite davvero e da ricomprimere: `parigi/activity-2.webp` 5,1 MB, `sofia/activity-2.webp` 3,4 MB.


## 2026-08-29 — Il link WhatsApp non aveva il prefisso paese

**Non ancora deployato.** Riguarda tutto il sito, non solo la pagina di attesa.

Il numero SKAPPA e' **393 030 6294**: dieci cifre, prefisso mobile italiano `393`, quindi valido.
Nei link mancava pero' il prefisso internazionale. `wa.me` vuole il formato E.164 senza `+`, cioe'
**39 (Italia) + il numero**: il valore giusto e' `393930306294`. Il doppio `39` iniziale e' corretto
e non e' un refuso — e' la ragione per cui a prima vista sembrava un numero troppo corto.

- [x] `js/main.js` riga 58 — `SKAPPA_WA_NUMBER`, da cui dipende il **pulsante WhatsApp flottante
      di tutte le pagine** che caricano main.js (13 pagine)
- [x] `viaggio.html`, `viaggio-citybreak.html`, `viaggio-lastminute.html` — il link
      "PRENOTA CON ACCONTO", dove il numero era **hardcoded** invece di usare la costante
- [x] `wip.html` — la costante in cima allo script
- [x] Commenti aggiornati in `main.js` e `wip.html`: spiegano perche' il doppio `39` e' giusto,
      cosi' nessuno lo "corregge" togliendolo

**Verifica: non conclusiva, ed e' bene saperlo.** `wa.me` non valida il numero lato server —
restituisce la stessa pagina sia per `3930306294` sia per `393930306294`, quindi da riga di comando
non si distingue un numero buono da uno rotto. La correzione e' giusta per la regola del formato,
ma l'unica prova vera e' **aprire il link una volta da un telefono con WhatsApp installato**.

- [ ] Aprire `https://wa.me/393930306294` da telefono e verificare che apra la chat SKAPPA.
- [ ] **Il numero resta duplicato in 5 punti.** Le 3 pagine viaggio non possono usare la costante
      di `main.js` senza rischi: main.js e' caricato con `defer`, il loro script inline gira prima.
      Da centralizzare solo insieme a un riordino degli script, non da soli.


## 2026-08-29 — La pagina di attesa smette di dire "sito rotto"

**Non ancora deployato.** Modificati `wip.html` e `netlify.toml`; backup di `wip.html` in
`D:\temp\claude\...\scratchpad\wip.html.bak` (ma la fonte autorevole resta git: `git checkout HEAD -- wip.html`).

### Perché

Ogni riga della pagina aveva come soggetto **il sito**, non il viaggio: `<title>` "Stiamo arrivando",
badge "Sito in costruzione", barra di caricamento animata, "stiamo mettendo a punto gli ultimi
dettagli". Il visitatore leggeva "l'azienda non è pronta", mentre la verità è l'opposto — i viaggi
vecchi sono finiti e se ne stanno costruendo di nuovi. Una notizia buona raccontata come un guasto.

### Cosa è cambiato

- [x] **Soggetto spostato dal sito al viaggio.** H1: *"Non trovi viaggi perché li stiamo scegliendo"*.
      Risponde alla domanda che il visitatore ha in testa e trasforma l'attesa in prova di qualità.
      Badge da "Sito in costruzione" a "Prossime partenze"; `<title>` "SKAPPA – Le prossime partenze".
- [x] **Riferimento temporale**: "le nuove partenze arrivano in **autunno**". Stagione, non data
      precisa — scelta di Francesco. ⚠️ **Una parola sola da confermare**: se la stagione giusta è
      un'altra, si cambia `autunno` nel lead e nella `<meta name="description">`.
- [x] **I 4 pilastri del sito vero** (volo A/R, alloggio selezionato, prezzo fisso, assistenza h24)
      portati in pagina: dicono cosa si compra anche mentre non c'è niente da comprare.
- [x] **Raccolta contatti** — prima ogni visita era persa, c'era solo un `mailto:`.
      Campo email + WhatsApp come alternativa secondaria.
- [x] **Tolta la barra di avanzamento animata**: è il segnale visivo di "sto caricando / sono rotto"
      e contraddiceva il messaggio.
- [x] Aggiunto uno **scrim radiale** dietro il testo: il lembo illuminato della Terra nello sfondo
      passa esattamente dietro il lead e ne mangiava il contrasto.

### Scelte tecniche, con il motivo

- **Formspree, non Netlify Forms.** Netlify Forms andrebbe a sbattere contro il redirect
  `/* → /wip.html` con `force = true` in `netlify.toml`. Formspree (`xlgpwjlj`) è già usato dai due
  form di `index.html` ed è **già autorizzato dalla CSP** (`connect-src ... https://formspree.io`):
  zero modifiche a `netlify.toml`.
- **Invio via `fetch` con fallback.** Se il fetch fallisce, il form resta un POST normale verso
  Formspree: nessuna iscrizione va persa. Esito annunciato con `role="status"` `aria-live="polite"`.
- **Campo esca `_gotcha`** per i bot, fuori schermo e `aria-hidden`.
- **Il link WhatsApp parte come `mailto:`** e viene riscritto dal JS: senza JS resta un contatto valido.

### Verificato in locale (server su 127.0.0.1:8791, misure dal DOM)

| Viewport | Contenuto | Scroll Y | Scroll X | CTA sopra la piega |
|---|---|---|---|---|
| 1536×695 | 695 | no | no | sì |
| 1280×720 | 720 | no | no | sì |
| 768×1024 | 1024 | no | no | sì |
| 414×896 | 896 | no | no | sì |
| 390×844 | 844 | no | no | sì |
| 360×640 | 745 | **sì** | no | sì |

Un solo `<h1>`. Bottone 46px di altezza (sopra i 44 del target touch) e a piena larghezza sotto i 420px.
Su 360×640 — telefono piccolo e vecchio — il footer con WhatsApp/email richiede un piccolo scroll,
ma la CTA resta sopra la piega: accettabile.

Il primo giro sforava di 65px su portatile: risolto con una `@media (max-height:820px)` che stringe
logo e spaziature, invece di comprimere anche gli schermi alti.

### Da fare

- [x] **Numero WhatsApp corretto in tutti e 5 i punti** (vedi la sezione in cima al file).
- [ ] **Confermare la stagione** ("autunno") o cambiarla.
- [ ] **Prova di invio reale** dopo il deploy: compilare il form e verificare che la mail arrivi
      dalla casella Formspree. `tipo=lista-attesa-wip` distingue queste iscrizioni dalle altre due.
- [ ] ⏳ **`noindex, nofollow` ha una scadenza.** Va bene per settimane; se resta mesi Google toglie
      skappa.it dall'indice e al lancio si riparte da zero sul proprio stesso nome.
      Da togliere insieme ai redirect WIP in `netlify.toml`.
- [ ] Quando i viaggi nuovi sono pronti: commentare i blocchi `[[redirects]]` fra
      `# ===== WIP / MANUTENZIONE — INIZIO/FINE =====` in `netlify.toml`.
