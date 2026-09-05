/* ============================================================
   CABINA — prototipo
   La geometria dei finestrini sta in un posto solo: da qui nascono sia i fori
   nella parete SVG sia la posizione di cornici, vetri, mondi e link. Se le due
   cose vivessero separate, divergerebbero al primo ritocco.

   MODELLO
   La prospettiva sta sul contenitore che scorre (.cabina-scroll), non sulla
   scena. L'origine della prospettiva e' quindi ferma al centro del viewport
   mentre la cabina gli passa davanti, e siccome lo scroll-snap centra il
   finestrino attivo, l'origine coincide sempre con lui: avanzare vuol dire
   entrare esattamente in quel foro, su qualunque schermo.

   NIENTE NUMERI A OCCHIO
   Passo dei finestrini, corsa della camera e dimensione dei mondi sono tutti
   calcolati dalla geometria. I due che contano:

   - la camera deve avanzare finche' il foro attivo copre il viewport, se no
     al momento del cambio di contenitore la cornice e' ancora a schermo e si
     vede un rettangolo comparire sopra la parete;
   - il mondo dietro al foro deve essere abbastanza grande da coprire ancora
     il viewport a fine corsa, se no a fine transizione se ne vedono i bordi.
   ============================================================ */
(function () {
  'use strict';

  gsap.registerPlugin(Flip);

  var menoMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Proporzioni reali: un finestrino A320 e' circa 23x33 cm, quindi piu' alto che
  // largo (rapporto ~0,7) e con angoli molto raccordati. La versione precedente
  // usava un'ellisse, ed e' il motivo per cui sembravano uova.
  var RAPPORTO = 0.70;
  var RAGGIO = 0.42;          // raggio angoli in frazione della larghezza

  // Sempre sullo stesso aereo: il passo fra un finestrino e l'altro e' ~53 cm
  // contro i 23 di larghezza. E' questo rapporto — non una frazione della
  // larghezza dello schermo — a tenere insieme la cabina quando cambia il
  // viewport. Prima i finestrini stavano a 10%, 50% e 90% della larghezza:
  // su un telefono da 390px finivano uno sopra l'altro.
  var PASSO_SU_LARGHEZZA = 53 / 23;
  var ALTEZZA_MASSIMA = 0.46;      // il finestrino non supera questa frazione dell'altezza
  var FASCIA_Y = 0.44;             // i finestrini stanno piu' in alto della meta': sotto c'e' il pannello

  // Quanti finestrini si vedono insieme. Il brief chiede 2-3 su desktop e uno
  // principale su mobile, col precedente e il successivo che si intravedono.
  var VISIBILI_LARGO = 5;
  // Sotto 1,57 il finestrino accanto esce del tutto dal viewport: il conto e'
  // passo < (vw + w)/2 con w = passo/2,3. A 1,5 restava fuori di una decina di
  // pixel e su mobile si vedeva un finestrino solo, contro quel che chiede il brief.
  var VISIBILI_STRETTO = 1.68;
  var SOGLIA_STRETTO = 620;

  // Le mete NON sono un elenco scritto qui: si leggono dai link, che in
  // produzione li genera il build dal catalogo. Un array a parte sarebbe una
  // seconda verita' da tenere allineata a mano, ed e' esattamente il tipo di
  // disallineamento che oggi ha lasciato cinque destinazioni senza link.
  var METE = Array.prototype.map.call(
    document.querySelectorAll('.presa'),
    function (a) {
      var etichetta = a.querySelector('.presa-label');
      return {
        id: a.dataset.meta,
        nome: (etichetta ? etichetta.textContent : a.dataset.meta).trim().toUpperCase()
      };
    }
  );

  // Devono corrispondere a `perspective` e al piano dei mondi dichiarati nel CSS.
  var PROSPETTIVA = 1100;
  // La profondita' del piano dei mondi non e' libera. Un piano a -prof scivola
  // rispetto alla parete di (1 - P/(P+prof)) per ogni pixel di distanza dal
  // centro: a 620 lo scivolamento su un passo valeva 240px contro un foro di
  // 290, e il panorama del finestrino accanto entrava dentro a quello attivo —
  // si vedevano due citta' nello stesso finestrino. A 150 lo scivolamento su un
  // passo scende sotto un quarto del foro, e i mondi restano ognuno dietro al
  // suo pur mantenendo una parallasse ben visibile.
  // A 150 il conto non chiudeva piu' con cinque finestrini in vista: quelli a DUE
  // campate dal centro avrebbero avuto bisogno di un mondo largo 263px, ma il
  // tetto per non invadere il vicino era 253. Impossibile, e infatti scorrendo
  // si vedeva il bordo della foto nei finestrini laterali. A 100 lo scivolamento
  // si dimezza e le tre misure tornano compatibili (serve 221, tetto 264).
  var PROF_MONDO = 100;
  // Un piano a -d appare rimpicciolito di P/(P+d) attorno all'origine della
  // prospettiva: per rivederlo a grandezza naturale va ingrandito di (P+d)/P.
  var COMPENSA = (PROSPETTIVA + PROF_MONDO) / PROSPETTIVA;
  // Quanto un piano a -PROF_MONDO si rimpicciolisce: serve a stimare di quanto
  // un mondo laterale scivola rispetto al suo foro (parallasse vera, non errore).
  var RIDUZIONE = PROSPETTIVA / (PROSPETTIVA + PROF_MONDO);

  // Il foro deve superare il viewport con margine, non sfiorarlo: con l'8% i
  // fianchi della cornice uscivano solo nell'ultimo 4% della timeline e il
  // passaggio sembrava uno scatto invece che una corsa.
  // Proporzioni dell'asset del vano, MISURATE da scripts/build-cabin-window.mjs:
  // quanto e' grande tutto il pezzo rispetto alla sua apertura. Se rigeneri
  // l'asset, lo script le ristampa e vanno riportate qui.
  // Rapporto della piastrella della cappelliera, da scripts/build-cabin-bin.mjs
  var BIN_RAPPORTO = 1.283;
  var VANO_LARGO = 2.0984;
  var VANO_ALTO = 2.0513;
  // Il foro nella parete si allarga un filo oltre l'apertura dell'asset: se
  // fosse identico, un pixel di disallineamento mostrerebbe un anello di parete
  // dentro al finestrino. Allargandolo, e' la cornice opaca a coprire l'eccesso.
  var FORO_OLTRE = 1.05;

  // Quante volte la foto del mondo viene IMPAGINATA piu' grande del suo riquadro,
  // per poi essere rimpicciolita altrettanto dal transform: a schermo non cambia
  // niente, ma il raster di partenza e' tre volte piu' fitto.
  // Non e' cosmesi. `will-change: transform` sulla cabina fa rasterizzare il
  // piano UNA volta sola e poi lo stira la GPU: la nitidezza di TUTTA la corsa
  // e' decisa dalla misura che il piano aveva quando e' partita. Impaginata a
  // 264px e stirata fino a 1500 la foto diventa una macchia; a 792px regge.
  // Toglierlo il will-change renderebbe tutto nitido ma la corsa scende da 200
  // a 40 fotogrammi: misurato, non e' una strada.
  var DENSITA = 3;
  // Oltre la risoluzione della sorgente non si guadagna piu' nulla e si paga
  // solo memoria di decodifica, quindi la densita' si accorcia da sola sugli
  // schermi molto larghi, dove il riquadro e' gia' grande di suo.
  var LARGA_SORGENTE = 1920;   // hero.webp
  // Il ritmo di tutto il portale, in un numero solo. Le durate piu' sotto sono
  // state tarate una per una IN RAPPORTO FRA LORO — quando i sedili si spengono
  // rispetto a quando la cornice esce, quando entra la vignetta — e cambiarle a
  // mano una alla volta rompe quei rapporti. timeScale le accorcia tutte
  // insieme, e i rapporti restano quelli.
  // 1 = com'era (2,0 s fino alla navigazione); 1,7 = 1,18 s. E' la manopola
  // da girare se il portale sembra sbrigativo o al contrario lento.
  var RITMO = 1.7;
  var MARGINE_FORO = 1.25;
  var MARGINE_MONDO = 1.15;  // e il mondo deve superare il foro

  // I sedili si misurano in centimetri veri, come i finestrini: e' il finestrino
  // a dare la scala (23 cm = la sua larghezza), tutto il resto discende da li'.
  // Il passo delle FILE non e' quello dei finestrini — 76 cm contro 53 — quindi
  // i sedili non si allineano agli obló, e non devono farlo.
  var CM_FINESTRINO = 23;
  // Quanto pezzo di parete rappresenta una piastrella della texture. La foto da
  // cui e' ricavata era a 9,76 px/cm (misurato dal passo dei pannelli), la scena
  // sta a ~12,6: mappandola uno a uno la grana andrebbe ingrandita e diventerebbe
  // molle. A 40 cm la piastrella si disegna quasi a risoluzione nativa e resta
  // nitida — la grana viene piu' fine del vero, ma di una plastica goffrata
  // nessuno misura i granelli.
  var LATO_TEXTURE_CM = 40;
  var PASSO_FILE_CM = 76;
  var SEDILE_ALTEZZA_CM = 115;      // da terra alla cima del poggiatesta
  var RAPPORTO_SEDILE = 598 / 929;  // dell'asset ritagliato, visto di profilo
  // Il numero da fissare non e' la distanza della fila ma QUANTA PARTE del
  // sedile sta in quadro: misurato sull'asset, di profilo il sedile e' stretto
  // (20-29% della sua larghezza) fino a meta' altezza e diventa largo solo dal
  // 50% in giu', dove ci sono bracciolo e seduta. Tenendone in quadro meno di
  // tre quarti si vedono dei ganci appesi invece di una fila di sedili.
  // La distanza discende da qui, e cosi' si adatta da sola: su un telefono, che
  // e' molto piu' alto che largo, la fila deve stare piu' vicina per occupare la
  // stessa fetta d'inquadratura. Prima era il contrario — distanza fissa — e su
  // mobile i sedili galleggiavano staccati dal bordo basso.
  var FRAZIONE_IN_QUADRO = 0.73;
  var QUANTO_SI_VEDE = 0.40;         // frazione di schermo occupata dalla fila
  var QUANTO_SI_VEDE_STRETTO = 0.32;

  var scena = document.getElementById('scena');
  var scroller = document.getElementById('cabinaScroll');
  var camera = document.getElementById('camera');
  var elMondi = document.getElementById('mondi');
  var elParete = document.getElementById('parete');
  var elVani = document.getElementById('vani');
  // Attenzione: fino a poco fa questo id ce l'aveva anche un <linearGradient>
  // dentro la parete SVG — residuo di quando la cappelliera era disegnata e non
  // un asset. Funzionava per caso, perche' questa riga gira prima che la parete
  // esista; una seconda getElementById avrebbe preso il gradiente. Il gradiente
  // non serviva piu' a nessuno ed e' stato tolto.
  var elBin = document.getElementById('cappelliera');
  var elVetri = document.getElementById('vetri');
  var elTendine = document.getElementById('tendine');
  var elTarghette = document.getElementById('targhette');
  var elSedili = document.getElementById('sedili');
  var elPrimoPiano = document.querySelector('.primo-piano');
  var elCabina = document.getElementById('cabina');
  // La navbar e' fissa e sta sopra tutto per mestiere. Durante il portale pero'
  // deve sparire: la pagina si sta sostituendo con la meta, e una barra gialla
  // che resta a galla sopra la foto rompe l'illusione. Alzare lo z-index non
  // basterebbe da solo - e' comunque piu' onesto toglierla di mezzo.
  var elCromo = document.querySelector('nav.navbar, .navbar, nav');
  var vignetta = document.querySelector('.vignetta');
  var mondoPieno = document.getElementById('mondoPieno');
  var comandi = document.querySelector('.cabina-comandi');
  var btnPrev = document.getElementById('cabinaPrev');
  var btnNext = document.getElementById('cabinaNext');
  var btnRitorno = document.getElementById('cabinaRitorno');

  var PARAMETRI = new URLSearchParams(location.search);
  // ?resta=1 blocca la navigazione finale: serve a guardare la transizione da fermi
  var RESTA = PARAMETRI.has('resta');
  // Due interruttori per provare come stara' nella home, senza toccare il codice:
  //   ?sedili=0    la fila in primo piano sparisce
  //   ?alta=60     la cabina diventa una fascia alta 60vh invece di tutto lo schermo
  var SENZA_SEDILI = PARAMETRI.get('sedili') === '0';
  var ALTA = PARAMETRI.get('alta');
  if (ALTA && isFinite(Number(ALTA))) {
    document.documentElement.style.setProperty('--cabina-alta', Number(ALTA) + 'vh');
  }

  var geometrie = [];
  var ciechi = [];           // finestrini senza meta: riempiono le estremita'
  var dim = null;
  var DOLLY = 0;             // corsa della camera, calcolata
  var ATTIVA = 0;
  var inTransizione = false;
  var tornati = null;        // stato per la transizione inversa
  var ultimoFlip = null;     // esposta per poter guardare la transizione ferma

  // ------------------------------------------------------------------
  // GEOMETRIA
  // ------------------------------------------------------------------

  // Di quanto apriLaCabina() ingrandira' la fascia PRIMA che parta la corsa
  // della camera. Serve in due posti che devono restare d'accordo: qui, per
  // tarare la corsa, e la' per eseguirla. Sotto 1.03 la cabina e' gia' a schermo
  // pieno, non si apre, e la corsa e' quella intera.
  function scalaApertura() {
    if (!elCabina) return 1;
    var alta = elCabina.getBoundingClientRect().height;
    if (!alta) return 1;
    var k = window.innerHeight / alta;
    return k < 1.03 ? 1 : k;
  }

  function misura() {
    var vw = scroller.clientWidth;
    var H = scroller.clientHeight;

    var visibili = vw < SOGLIA_STRETTO ? VISIBILI_STRETTO : VISIBILI_LARGO;
    var passo = vw / visibili;
    var w = passo / PASSO_SU_LARGHEZZA;
    var h = w / RAPPORTO;

    // Su schermi bassi e larghi il finestrino diventerebbe piu' alto della
    // cabina: in quel caso comanda l'altezza e il passo si ricalcola da li'.
    if (h > H * ALTEZZA_MASSIMA) {
      h = H * ALTEZZA_MASSIMA;
      w = h * RAPPORTO;
      passo = w * PASSO_SU_LARGHEZZA;
    }

    var cy = H * FASCIA_Y;

    // Quando la cabina e' una fascia dentro la pagina, il viewport visto nelle
    // sue coordinate non e' lo schermo: l'apertura la ingrandisce gia' di k
    // attorno al finestrino attivo, quindi in orizzontale ne resta da coprire
    // vw/k, e in verticale esattamente H — la fascia DIVENTA l'altezza dello
    // schermo, per definizione di k.
    // Senza questa divisione la corsa e' tarata due volte: misurata a 1440x900
    // ingrandiva 15,5 volte una texture impaginata a 264px, quando ne bastavano
    // meno di 6. Quel di piu' non si vede accadere — si vede solo sfocato,
    // perche' `will-change: transform` fa stirare alla GPU un raster solo.
    var kApertura = scalaApertura();
    var vwUtile = vw / kApertura;

    // La camera avanza finche' il foro attivo copre il viewport. Il foro sta a
    // z=0, quindi cresce di P/(P-d): rovesciando, d = P * (1 - 1/ingrandimento).
    var ingrandimento = Math.max(vwUtile / w, H / h) * MARGINE_FORO;
    DOLLY = PROSPETTIVA * (1 - 1 / ingrandimento);

    // A fine corsa il mondo (z=-PROF_MONDO) e' cresciuto di (P+prof)/(P+prof-d):
    // per coprire ancora il viewport deve partire almeno da questa misura.
    var quotaFinale = (PROSPETTIVA + PROF_MONDO - DOLLY) / (PROSPETTIVA + PROF_MONDO);
    // I mondi dei finestrini laterali scivolano rispetto al loro foro: e'
    // parallasse vera (guardando di sbieco vedi un altro pezzo di fuori), ma il
    // mondo deve restare grande abbastanza da non scoprire il bordo del foro.
    // Lo scivolamento va contato per il finestrino piu' LONTANO che si vede, non
    // per quello accanto: con cinque in vista i due esterni stanno a due campate,
    // e il conto fatto su una campata sola li lasciava scoperti.
    var campateInVista = Math.max(1, Math.ceil(visibili / 2));
    var scostamento = passo * (1 - RIDUZIONE) * campateInVista;

    // Tre vincoli, tutti geometrici:
    //  1. il mondo deve coprire il suo foro anche quando lo si guarda di sbieco,
    //     cioe' tenendo conto dello scivolamento;
    //  2. a fine corsa della camera deve coprire ancora il viewport;
    //  3. non deve invadere il foro del vicino: due mondi adiacenti hanno i
    //     centri a passo*RIDUZIONE l'uno dall'altro, e quello e' il tetto.
    var minPerIlForo = w + 2 * scostamento;
    var minPerLaCorsa = vwUtile * quotaFinale * MARGINE_MONDO;
    var massimoSenzaInvadere = passo * RIDUZIONE;
    var mondoW = Math.min(massimoSenzaInvadere, Math.max(minPerIlForo * 1.1, minPerLaCorsa));
    var mondoH = Math.max(H * quotaFinale * MARGINE_MONDO, h * 1.15);

    // La scena e' larga tutta la cabina: mezzo viewport di margine per parte,
    // cosi' il primo e l'ultimo finestrino possono arrivare al centro.
    var sceneW = vw + (METE.length - 1) * passo;

    // Alle estremita' la cabina non puo' finire: la prima meta e' centrata, quindi
    // a sinistra resterebbe mezzo viewport di parete nuda. Si riempie con
    // finestrini VERI ma senza meta - in un aereo non tutti i finestrini sono una
    // destinazione - e dietro si vede il cielo, che c'e' gia'.
    // Quanti ce ne stanno e' una divisione, non una scelta: lo spazio libero da
    // un lato e' mezzo viewport.
    var quantiCiechi = Math.max(0, Math.floor(vw / 2 / passo - 0.15));
    ciechi = [];
    for (var k = 1; k <= quantiCiechi; k++) {
      ciechi.push({ x: vw / 2 - k * passo, y: cy, w: w, h: h, r: w * RAGGIO });
      ciechi.push({ x: vw / 2 + (METE.length - 1 + k) * passo, y: cy, w: w, h: h, r: w * RAGGIO });
    }

    geometrie = METE.map(function (meta, i) {
      return {
        meta: meta,
        x: vw / 2 + i * passo,
        y: cy,
        w: w,
        h: h,
        r: w * RAGGIO,
        mondoW: mondoW,
        mondoH: mondoH
      };
    });

    scena.style.width = sceneW + 'px';
    scroller.style.setProperty('--fuoco-y', cy + 'px');

    return { W: sceneW, H: H, vw: vw, passo: passo, cy: cy };
  }

  // ---- La parete: SVG, non gradienti. I fori sono veri fori. ----
  function disegnaParete(dim) {
    var W = dim.W, H = dim.H;
    var latoTex = LATO_TEXTURE_CM * (geometrie[0].w / CM_FINESTRINO);

    var fori = geometrie.concat(ciechi).map(function (g) {
      var fw = g.w * FORO_OLTRE, fh = g.h * FORO_OLTRE;
      return '<rect x="' + (g.x - fw / 2) + '" y="' + (g.y - fh / 2) + '" width="' + fw +
             '" height="' + fh + '" rx="' + (g.r * FORO_OLTRE) + '" ry="' + (g.r * FORO_OLTRE) +
             '" fill="black"/>';
    }).join('');

    // Aloni di luce attorno ai fori: fuori e' piu' luminoso che dentro, quindi la
    // parete si schiarisce verso i finestrini. E' il segnale piu' forte per leggere
    // "sono dentro un aereo" — la versione precedente aveva luce uniforme.
    var aloni = geometrie.concat(ciechi).map(function (g) {
      return '<ellipse cx="' + g.x + '" cy="' + g.y + '" rx="' + (g.w * 1.9) + '" ry="' + (g.h * 1.25) +
             '" fill="url(#alone)" opacity="0.55"/>';
    }).join('');

    // L'architettura della cabina. Senza questa, i finestrini galleggiano in un
    // fondale grigio: sono la cappelliera sopra e il pannello laterale sotto a far
    // capire che si e' seduti dentro una fusoliera.
    // Dove finisce la cappelliera non si sceglie piu': e' l'asset a dirlo. La
    // piastrella si ripete al passo delle campate, quindi la sua altezza viene
    // dal suo stesso rapporto, e il pannello servizi si appoggia sotto di lei.
    var hBin = dim.passo / BIN_RAPPORTO;
    var yBin = hBin * 0.74;       // sotto questa quota la cappelliera e' gia' sfumata
    var yPannello = H * 0.66;     // dove la parete piega verso il pavimento
    // La pancia della cappelliera e' un'onda continua lungo tutta la cabina: una
    // gobba per campata, non una sola curva stirata da un capo all'altro.
    var gobba = dim.passo;

    var architettura =
      // pannello servizi: bocchette e luce di lettura, una coppia per posto
      geometrie.map(function (g) {
        var yP = yBin + 26;
        var u = g.w * 0.17;
        return '<g opacity="0.5">' +
          '<rect x="' + (g.x - u * 2) + '" y="' + yP + '" width="' + (u * 4) + '" height="22" rx="7" fill="rgba(0,0,0,0.09)"/>' +
          '<circle cx="' + (g.x - u) + '" cy="' + (yP + 11) + '" r="5" fill="rgba(0,0,0,0.24)"/>' +
          '<circle cx="' + (g.x + u) + '" cy="' + (yP + 11) + '" r="5" fill="rgba(0,0,0,0.24)"/>' +
          '<circle cx="' + g.x + '" cy="' + (yP + 11) + '" r="3.4" fill="rgba(255,247,228,0.75)"/>' +
        '</g>';
      }).join('') +
      // pannello laterale sotto i finestrini: piega e prende meno luce
      '<path d="M0,' + yPannello + ' L' + W + ',' + yPannello + ' L' + W + ',' + H + ' L0,' + H +
        ' Z" fill="url(#pannelloBasso)"/>' +
      '<rect x="0" y="' + yPannello + '" width="' + W + '" height="2" fill="rgba(255,255,255,0.14)"/>' +
      '<rect x="0" y="' + (yPannello + 2) + '" width="' + W + '" height="3" fill="rgba(0,0,0,0.28)"/>';

    // fughe verticali fra i pannelli di parete, una per campata
    var fughe = '';
    geometrie.forEach(function (g) {
      var x = Math.round(g.x + dim.passo / 2);
      fughe += '<rect x="' + x + '" y="' + (yBin + 26) + '" width="1.5" height="' + (yPannello - yBin - 26) +
               '" fill="rgba(0,0,0,0.16)"/>' +
               '<rect x="' + (x + 1.5) + '" y="' + (yBin + 26) + '" width="1" height="' + (yPannello - yBin - 26) +
               '" fill="rgba(255,255,255,0.10)"/>';
    });

    // preserveAspectRatio non serve piu': il viewBox e' in pixel di scena, uno a uno
    elParete.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' +
        '<defs>' +
          // La cabina e' illuminata a luce calda dall'alto, e fredda dai finestrini:
          // e' il contrasto fra le due a farla leggere come un interno.
          '<linearGradient id="muro" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0"    stop-color="#c9bfae"/>' +
            '<stop offset="0.30" stop-color="#bdb3a3"/>' +
            '<stop offset="0.58" stop-color="#a79d8f"/>' +
            '<stop offset="0.80" stop-color="#6f6960"/>' +
            '<stop offset="1"    stop-color="#3b3833"/>' +
          '</linearGradient>' +
          '<linearGradient id="pannelloBasso" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0"   stop-color="#8a8074"/>' +
            '<stop offset="0.5" stop-color="#5f594f"/>' +
            '<stop offset="1"   stop-color="#2b2925"/>' +
          '</linearGradient>' +
          // La grana della plastica e' un asset, non piu' rumore procedurale.
          // E' una mappa NEUTRA (grigio medio = nessun effetto): porta solo la
          // variazione di materiale, mentre colore e luce restano ai gradienti
          // qui sopra. Per questo si applica in soft-light e non in normale.
          '<pattern id="materiale" patternUnits="userSpaceOnUse" width="' + latoTex +
            '" height="' + latoTex + '">' +
            // L'immagine si disegna mezzo pixel oltre il bordo della piastrella,
            // e il pattern ritaglia l'eccedenza. Serve perche' altrimenti il
            // bordo viene sfumato verso il trasparente e le giunzioni si leggono
            // come una griglia sulla parete.
            '<image href="../assets/flight/cabin-wall.webp" x="-0.5" y="-0.5" width="' +
              (latoTex + 1) + '" height="' + (latoTex + 1) + '" preserveAspectRatio="none"/>' +
          '</pattern>' +
          '<linearGradient id="lucePanca" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#fff3dc" stop-opacity="0.55"/>' +
            '<stop offset="1" stop-color="#fff3dc" stop-opacity="0"/>' +
          '</linearGradient>' +
          '<radialGradient id="alone">' +
            '<stop offset="0" stop-color="#dfeaf3" stop-opacity="0.75"/>' +
            '<stop offset="1" stop-color="#dfeaf3" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<mask id="fori">' +
            '<rect width="' + W + '" height="' + H + '" fill="white"/>' + fori +
          '</mask>' +
        '</defs>' +
        '<g mask="url(#fori)">' +
          '<rect width="' + W + '" height="' + H + '" fill="url(#muro)"/>' +
          aloni +
          fughe +
          architettura +
          // la grana passa sopra tutto: cappelliera, parete e pannello basso sono
          // lo stesso materiale
          '<rect width="' + W + '" height="' + H + '" fill="url(#materiale)" ' +
            'style="mix-blend-mode:soft-light" opacity="0.85"/>' +
        '</g>' +
      '</svg>';
  }

  function stile(el, g) {
    el.style.setProperty('--x', g.x + 'px');
    el.style.setProperty('--y', g.y + 'px');
    el.style.setProperty('--mostrina', Math.round(g.w * 0.055) + 'px');
    el.style.setProperty('--w', g.w + 'px');
    el.style.setProperty('--h', g.h + 'px');
    el.style.setProperty('--r', g.r + 'px');
  }

  function costruisci() {
    dim = misura();
    disegnaParete(dim);

    elMondi.innerHTML = geometrie.map(function (g) {
      // Il mondo e' piu' grande del foro: sta dietro, e attraverso il buco se ne
      // vede solo un ritaglio. E' quello che fa sembrare che esista davvero fuori.
      // La scala compensa il rimpicciolimento del piano, con origine sul centro
      // del mondo stesso: cosi' ogni finestrino ha il suo, e lo scivolamento fra
      // foro e panorama dei finestrini laterali resta quello vero della prospettiva.
      var d = Math.max(1, Math.min(DENSITA, LARGA_SORGENTE / g.mondoW));
      var fw = g.mondoW * d;
      var fh = g.mondoH * d;
      return '<div class="mondo" data-meta="' + g.meta.id + '" style="' +
             '--mondo-x:' + g.x + 'px;--mondo-y:' + g.y + 'px;' +
             '--mondo-w:' + fw + 'px;--mondo-h:' + fh + 'px;' +
             'transform:translateZ(' + (-PROF_MONDO) + 'px) scale(' + (COMPENSA / d) + ');' +
             'transform-origin:50% 50%">' +
             '<img src="../assets/foto/' + g.meta.id + '/hero.webp" alt="" ' +
             'width="' + Math.round(fw) + '" height="' + Math.round(fh) + '" ' +
             'style="width:' + fw + 'px;height:' + fh + 'px" />' +
             '</div>';
    }).join('');

    // La cappelliera: una piastrella ripetuta al passo delle campate. Sta piu'
    // avanti della parete perche' sporge davvero verso il corridoio.
    // Si alza sopra il bordo dello schermo: il giunto col soffitto che l'asset
    // ha in cima, tagliato dall'inquadratura, si leggeva come una riga nera
    // netta. Il soffitto sta sopra di noi, non deve chiudersi a schermo.
    // L'altezza della cappelliera viene dal passo delle campate, che a sua volta
    // viene dalla LARGHEZZA del viewport. In una fascia bassa quella misura si
    // mangia meta' della banda: qui viene limitata rispetto all'altezza
    // disponibile, e la piastrella si stringe di conseguenza — le cappelliere
    // diventano piu' strette delle campate, che e' quel che fanno anche in un
    // aereo vero, dove i due passi non coincidono.
    var hBinPx = Math.min(dim.passo / BIN_RAPPORTO, dim.H * 0.34);
    elBin.style.height = hBinPx + 'px';
    elBin.style.top = (-hBinPx * 0.12) + 'px';

    // UNA PORTELLA PER CAMPATA, e centrata sul suo finestrino.
    // La piastrella si ripeteva alla propria larghezza naturale — l'altezza per
    // le proporzioni dell'asset — che con i finestrini non ha nessun rapporto:
    // a 1440 le portelle cadevano ogni 173px e i finestrini ogni 288, quindi le
    // due griglie sfilavano l'una sull'altra e una targhetta su tre finiva a
    // cavallo di un giunto. Il nome sta sulla portella del SUO finestrino: o le
    // due griglie coincidono, o non ci sta.
    // Costa un allargamento dell'asset, che qui e' un guadagno: in una fascia
    // bassa la portella e' limitata in altezza, e larga quanto la campata ha le
    // proporzioni che ha in un aereo vero invece che quelle di un quadretto.
    elBin.style.backgroundSize = dim.passo + 'px 100%';
    // La fase: la piastrella si ripete dal bordo sinistro della scena, e il
    // primo finestrino sta a mezzo viewport. Senza questo la griglia sarebbe
    // del passo giusto ma sfasata, e le targhette resterebbero fuori centro.
    var fase = ((dim.vw / 2 - dim.passo / 2) % dim.passo + dim.passo) % dim.passo;
    elBin.style.backgroundPositionX = fase + 'px';

    var tutti = geometrie.concat(ciechi);
    elVani.innerHTML = tutti.map(function (g) {
      return '<div class="vano" style="--x:' + g.x + 'px;--y:' + g.y + 'px;--vw:' +
             (g.w * VANO_LARGO) + 'px;--vh:' + (g.h * VANO_ALTO) + 'px"></div>';
    }).join('');
    // Il passo lo legge il CSS per non far uscire un nome lungo dalla sua
    // portella: sta sul contenitore, non su ogni targhetta, perche' le variabili
    // CSS si ereditano e il valore e' uno solo per tutta la cabina.
    elTarghette.style.setProperty('--passo', dim.passo + 'px');
    elTarghette.innerHTML = geometrie.map(function (g) {
      // Il nome in uno span suo: un nodo di testo dentro un flex e' un elemento
      // anonimo, e su quello text-overflow non ha presa.
      return '<div class="targhetta">' +
             '<img class="marchio" src="../assets/foto/utility/logo skappa.svg" alt="" ' +
             'width="16" height="16" /><span class="nome">' + g.meta.nome + '</span></div>';
    }).join('');
    elVetri.innerHTML = tutti.map(function () { return '<div class="vetro"></div>'; }).join('');
    // Le tendine stanno solo sui finestrini senza meta. Le altezze sono diverse
    // fra loro di proposito: una fila di tendine identiche non esiste.
    var altezze = ['100%', '72%', '100%', '88%', '100%', '64%'];
    // La tendina va tagliata un po' PIU' GRANDE dell'apertura e con gli angoli
    // meno tondi: l'asset ha angoli piu' squadrati dei nostri, e con la misura
    // esatta restava scoperto uno spicchio di cielo in ogni angolo. Quel che
    // eccede lo copre la cornice, che e' opaca.
    elTendine.innerHTML = ciechi.map(function (g, i) {
      return '<div class="tendina" style="--x:' + g.x + 'px;--y:' + g.y + 'px;--w:' +
             (g.w * FORO_OLTRE * 1.04) + 'px;--h:' + (g.h * FORO_OLTRE * 1.04) + 'px;--r:' + (g.r * 0.62) +
             'px;--giu:' + altezze[i % altezze.length] + '"></div>';
    }).join('');

    // I sedili non seguono i finestrini uno a uno: il passo delle file e' un'altra
    // misura, e in un aereo vero infatti non coincidono mai.
    var unita = geometrie[0].w / CM_FINESTRINO;   // pixel di scena per centimetro
    var quantoSiVede = dim.H * (dim.vw < SOGLIA_STRETTO ? QUANTO_SI_VEDE_STRETTO : QUANTO_SI_VEDE);
    var altSedile = quantoSiVede / FRAZIONE_IN_QUADRO;
    var largSedile = altSedile * RAPPORTO_SEDILE;
    // A che distanza e' finita la fila, e quindi con che passo: se il sedile e'
    // rimpicciolito di tanto, anche le file si stringono della stessa quantita'.
    var lontananza = altSedile / (SEDILE_ALTEZZA_CM * unita);
    var passoSedile = PASSO_FILE_CM * unita * lontananza;
    // `bottom` in percentuale si misurerebbe sull'altezza del CONTENITORE, non
    // del sedile: su desktop tornava per caso, su mobile spingeva tutta la fila
    // fuori dallo schermo e il primo piano spariva. Qui e' in pixel, sul sedile.
    var sottoIlBordo = -(altSedile - quantoSiVede);
    var sedili = '';
    // Le posizioni vanno tenute dentro la scena: un sedile piazzato oltre il
    // bordo allarga l'area di scorrimento e la cabina finisce con un vuoto in coda.
    // La fase e' scelta perche' davanti al finestrino centrato ci sia il VUOTO fra
    // due file, non un poggiatesta: visto di profilo il sedile e' stretto in alto
    // e largo in basso, quindi cosi' i due schienali incorniciano il finestrino
    // da destra e da sinistra e la parte larga resta sotto al suo bordo.
    var fase = (dim.vw / 2 + passoSedile / 2) % passoSedile;
    for (var xs = fase - passoSedile; xs < dim.W + passoSedile; xs += passoSedile) {
      sedili += '<div class="sedile" style="--x:' + xs + 'px;--sw:' + largSedile +
                'px;--sb:' + sottoIlBordo + 'px"></div>';
    }
    elSedili.innerHTML = SENZA_SEDILI ? '' : sedili;

    tutti.forEach(function (g, i) {
      stile(elVetri.children[i], g);
    });
    geometrie.forEach(function (g, i) {
      stile(elTarghette.children[i], g);
      // Il nome sta sulla portella della cappelliera, sopra al suo finestrino:
      // e' dove un aereo mette i numeri di fila, ed e' il primo posto dove
      // l'occhio va quando cerca "dove sto per entrare".
      elTarghette.children[i].style.setProperty('--y-bin', (hBinPx * 0.37) + 'px');
      var presa = document.getElementById('presa-' + g.meta.id);
      if (presa) stile(presa, g);
    });

    scena.classList.add('is-ready');
    if (comandi) comandi.hidden = false;

    aggiornaLuci();
  }

  // ------------------------------------------------------------------
  // DESTINAZIONE ATTIVA
  // La piu' vicina al centro. Niente "card selezionata": cambia solo la luce.
  // ------------------------------------------------------------------
  function calcolaAttiva() {
    if (!dim) return 0;
    var i = Math.round(scroller.scrollLeft / dim.passo);
    return Math.max(0, Math.min(METE.length - 1, i));
  }

  function aggiornaLuci() {
    geometrie.forEach(function (g, i) {
      // Quanto e' lontana dal centro, in passi. I vicini non sono "meno
      // selezionati": ricevono meno luce, ed e' l'unica cosa che cambia.
      var distanza = Math.min(1, Math.abs(i - ATTIVA));
      var luce = 1 - 0.38 * distanza;
      var img = elMondi.children[i] && elMondi.children[i].querySelector('img');
      if (img) {
        img.style.filter = 'brightness(' + (0.28 + 0.72 * luce) + ') contrast(' + (0.90 + 0.10 * luce) + ')';
      }
      // Un vetro in ombra e' piu' freddo e meno contrastato, non grigio: con
      // l'opacita' i vicini sembravano sporchi.
      if (elMondi.children[i]) {
        elMondi.children[i].style.setProperty('--freddo', (1.2 * (1 - luce)).toFixed(3));
      }
      if (elTarghette.children[i]) {
        elTarghette.children[i].classList.toggle('is-attiva', i === ATTIVA);
      }
    });
    if (btnPrev) btnPrev.disabled = ATTIVA <= 0;
    if (btnNext) btnNext.disabled = ATTIVA >= METE.length - 1;
  }

  var attesaScroll = 0;
  scroller.addEventListener('scroll', function () {
    if (inTransizione || attesaScroll) return;
    attesaScroll = requestAnimationFrame(function () {
      attesaScroll = 0;
      var i = calcolaAttiva();
      if (i !== ATTIVA) { ATTIVA = i; aggiornaLuci(); }
    });
  }, { passive: true });

  // Aspetta che lo scroll si sia fermato davvero. Un setTimeout a occhio non
  // basta: se la corsa non e' finita il finestrino non e' ancora centrato.
  function quandoFermo(poi) {
    var fermoDa = 0;
    var ultimo = -1;
    (function guarda() {
      var ora = Math.round(scroller.scrollLeft);
      fermoDa = ora === ultimo ? fermoDa + 1 : 0;
      ultimo = ora;
      if (fermoDa >= 3) { poi(); return; }
      requestAnimationFrame(guarda);
    })();
  }

  function vaiA(i, comportamento) {
    if (!dim) return;
    i = Math.max(0, Math.min(METE.length - 1, i));
    scroller.scrollTo({
      left: i * dim.passo,
      behavior: comportamento || (menoMovimento ? 'auto' : 'smooth')
    });
  }

  if (btnPrev) btnPrev.addEventListener('click', function () { vaiA(ATTIVA - 1); });
  if (btnNext) btnNext.addEventListener('click', function () { vaiA(ATTIVA + 1); });

  // Tastiera: le frecce muovono la cabina di una campata per volta.
  window.addEventListener('keydown', function (e) {
    if (inTransizione) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); vaiA(ATTIVA + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); vaiA(ATTIVA - 1); }
  });

  // ---- Parallasse: quasi inconscia, guidata dal puntatore ----
  if (!menoMovimento && window.matchMedia('(pointer: fine)').matches) {
    // Passa da una variabile CSS: cosi' GSAP non riscrive il transform dei piani
    // e non si porta via il loro translateZ.
    var parMondi = gsap.quickTo(elMondi, '--par', { duration: 0.9, ease: 'power2.out' });
    var parParete = gsap.quickTo(elParete, '--par', { duration: 0.5, ease: 'power2.out' });
    var parVetri = gsap.quickTo(elVetri, '--par', { duration: 1.2, ease: 'power2.out' });
    window.addEventListener('pointermove', function (e) {
      if (inTransizione) return;
      var d = (e.clientX / window.innerWidth - 0.5) * 2;
      parParete(d * -3 + 'px');   // la parete e' vicina: si muove poco ma per prima
      parMondi(d * 7 + 'px');     // il mondo e' lontano: si sposta in senso opposto
      parVetri(d * -5 + 'px');    // il riflesso ha vita sua
    }, { passive: true });
  }

  // ------------------------------------------------------------------
  // LA TRANSIZIONE: la camera avanza dentro il foro
  // ------------------------------------------------------------------
  function attraversa(indice, href) {
    if (inTransizione) return;
    // La camera avanza verso l'origine della prospettiva, che e' il centro del
    // viewport. Entrare in un finestrino che non e' centrato vuol dire volare
    // dentro un foro e atterrare sulla foto di un altro: la continuita' che il
    // brief chiede si romperebbe proprio nel punto che conta.
    if (indice !== calcolaAttiva()) {
      ATTIVA = indice;
      aggiornaLuci();
      vaiA(indice);
      quandoFermo(function () { attraversa(indice, href); });
      return;
    }
    inTransizione = true;
    scroller.classList.add('in-transizione');

    // Se la cabina e' una fascia dentro la pagina, prima si prende lo schermo.
    // Senza questo la corsa della camera avviene dentro la banda: la cornice
    // esce dalla fascia invece che dal viewport, e l'ingrandimento si vede
    // accadere dentro una finestrella. A schermo intero il fattore e' 1 e non
    // succede nulla.
    var apertura = apriLaCabina(indice);

    var mondo = elMondi.children[indice];
    var img = mondo.querySelector('img');

    function arrivo() {
      if (RESTA) {
        if (btnRitorno) btnRitorno.hidden = false;
        return;
      }
      window.location.href = href;
    }

    if (menoMovimento) {
      // Niente movimento di camera: la stessa immagine va a schermo intero e basta.
      tornati = { img: img, mondo: mondo, larghezza: img.style.width, altezza: img.style.height };
      mondoPieno.style.visibility = 'visible';
      mondoPieno.appendChild(img);
      gsap.set(img, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' });
      gsap.fromTo(mondoPieno, { opacity: 0 }, { opacity: 1, duration: 0.25, onComplete: arrivo });
      return;
    }

    // 1. La camera avanza. Un solo valore: la prospettiva distribuisce il resto.
    //    La corsa e' calcolata (vedi misura()): si ferma quando il foro attivo
    //    ha superato il viewport, non a un numero scelto a occhio.
    var tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: function () { portaAPienoSchermo(img, mondo, arrivo); }
    });
    tl.timeScale(RITMO);

    var dopoApertura = apertura ? apertura.durata : 0;
    if (apertura) tl.to(elCabina, apertura.verso, 0);
    tl.to(camera, { '--dolly': DOLLY + 'px', duration: 1.05, ease: 'power1.in' }, dopoApertura);

    // 2. Gli altri finestrini si fanno da parte: meno luce, piu' freddi
    geometrie.forEach(function (altra, i) {
      if (i === indice) return;
      var altraImg = elMondi.children[i].querySelector('img');
      tl.to(altraImg, { filter: 'brightness(0.34) contrast(0.98)', duration: 0.75, ease: 'power1.in' }, 0);
      tl.to(elMondi.children[i], { '--freddo': 0.62, duration: 0.75, ease: 'power1.in' }, 0);
    });

    // 3. Quello che non deve venire dentro con noi si toglie presto
    tl.to([elTarghette, elVetri], { opacity: 0, duration: 0.32 }, dopoApertura);
    tl.to(elSedili, {
      opacity: 0, duration: 0.42, ease: 'power1.in',
      onComplete: function () { elSedili.style.display = 'none'; }
    }, dopoApertura);
    if (comandi) tl.to(comandi, { opacity: 0, duration: 0.25 }, 0);
    if (elCromo) tl.to(elCromo, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0);
    // la vignettatura e' fissa allo schermo: non puo' allargarsi con la cabina,
    // quindi si scioglie mentre la cornice esce
    if (vignetta) tl.to(vignetta, { opacity: 0, duration: 0.55 }, dopoApertura + 0.3);
    if (elPrimoPiano) {
      tl.to(elPrimoPiano, {
        opacity: 0, duration: 0.35,
        onComplete: function () { elPrimoPiano.style.display = 'none'; }
      }, dopoApertura);
    }

    return tl;
  }

  // Porta la cabina da fascia a schermo intero, senza rifare il layout: si
  // fissa dov'e' e si ingrandisce attorno al centro del finestrino scelto,
  // che intanto viene portato al centro dello schermo. Rifare il layout
  // vorrebbe dire ricalcolare tutta la geometria e far saltare la scena.
  function apriLaCabina(indice) {
    if (!elCabina) return null;
    var r = elCabina.getBoundingClientRect();
    var k = scalaApertura();
    if (k === 1) return null;               // e' gia' praticamente a schermo pieno

    var g = geometrie[indice];
    var cx = r.left + (g.x - scroller.scrollLeft);   // centro del finestrino, sullo schermo
    var cy = r.top + g.y;

    elCabina.classList.add('in-volo');
    gsap.set(elCabina, { transformOrigin: (cx - r.left) + 'px ' + (cy - r.top) + 'px' });

    // Solo i valori: l'animazione la aggiunge la timeline principale. Fatta
    // come tween a se' stante non sarebbe sincronizzata con la corsa della
    // camera - e' lo stesso errore che il Flip aveva prima.
    return {
      durata: 0.5,
      verso: {
        scale: k,
        x: window.innerWidth / 2 - cx,
        y: window.innerHeight / 2 - cy,
        duration: 0.5,
        ease: 'power2.inOut'
      }
    };
  }

  // A questo punto il foro ha superato il viewport e il mondo lo copre: la
  // parete non e' piu' a schermo, quindi cambiare contenitore all'immagine non
  // si vede. Prima il cambio avveniva a meta' corsa, con la cornice ancora in
  // vista: compariva un rettangolo sopra la parete.
  // Flip riusa LO STESSO nodo — se comparisse un secondo elemento l'illusione
  // si romperebbe — e restituisce una timeline: la navigazione parte da li',
  // non dalla timeline precedente, che finiva prima.
  function portaAPienoSchermo(img, mondo, arrivo) {
    tornati = { img: img, mondo: mondo, larghezza: img.style.width, altezza: img.style.height };
    var stato = Flip.getState(img);
    mondoPieno.style.visibility = 'visible';
    mondoPieno.appendChild(img);
    gsap.set(img, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', clearProps: 'transform' });
    ultimoFlip = Flip.from(stato, {
      duration: 0.45,
      ease: 'power2.inOut',
      absolute: true,
      scale: true,
      onComplete: arrivo
    });
    ultimoFlip.timeScale(RITMO);
    return ultimoFlip;
  }

  // ---- Transizione inversa: il mondo si contrae, la cabina si ricompone ----
  function torna() {
    if (!tornati) return;
    if (btnRitorno) btnRitorno.hidden = true;
    var img = tornati.img;
    var mondo = tornati.mondo;

    var stato = Flip.getState(img);
    mondo.appendChild(img);
    gsap.set(img, {
      position: 'absolute', left: 0, top: 0,
      width: tornati.larghezza, height: tornati.altezza,
      clearProps: 'transform'
    });
    var rientro = Flip.from(stato, { duration: 0.45, ease: 'power2.inOut', absolute: true, scale: true });
    rientro.timeScale(RITMO);

    if (elCabina && elCabina.classList.contains('in-volo')) {
      gsap.to(elCabina, {
        scale: 1, x: 0, y: 0, duration: 0.55, ease: 'power2.inOut',
        onComplete: function () {
          elCabina.classList.remove('in-volo');
          gsap.set(elCabina, { clearProps: 'transform,transformOrigin' });
        }
      });
    }

    var tl = gsap.timeline({
      onComplete: function () {
        inTransizione = false;
        scroller.classList.remove('in-transizione');
        mondoPieno.style.visibility = 'hidden';
        tornati = null;
        aggiornaLuci();
      }
    });
    tl.add(rientro, 0);
    tl.to(camera, { '--dolly': '0px', duration: 0.95, ease: 'power2.out' }, 0.2);
    tl.to([elTarghette, elVetri], { opacity: 1, duration: 0.4 }, 0.6);
    elSedili.style.display = '';
    if (elPrimoPiano) elPrimoPiano.style.display = '';
    tl.to(elSedili, { opacity: 1, duration: 0.4 }, 0.6);
    if (elPrimoPiano) tl.to(elPrimoPiano, { opacity: 1, duration: 0.4 }, 0.6);
    if (vignetta) tl.to(vignetta, { opacity: 1, duration: 0.5 }, 0.5);
    if (comandi) tl.to(comandi, { opacity: 1, duration: 0.4 }, 0.7);
    if (elCromo) tl.to(elCromo, { opacity: 1, duration: 0.4 }, 0.7);
    geometrie.forEach(function (g, i) {
      if (!elMondi.children[i]) return;
      tl.to(elMondi.children[i], { '--freddo': 0, duration: 0.5 }, 0.5);
    });
    tl.add(function () { mondoPieno.style.visibility = 'hidden'; }, 0.5);
    tl.timeScale(RITMO);
  }

  if (btnRitorno) btnRitorno.addEventListener('click', torna);

  // ---- I link restano link: il click viene solo arricchito ----
  Array.prototype.forEach.call(document.querySelectorAll('.presa'), function (presa) {
    presa.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var i = METE.findIndex(function (m) { return m.id === presa.dataset.meta; });
      if (i < 0) return;
      e.preventDefault();
      // Si entra solo dal finestrino che si sta guardando: se il click arriva su
      // un vicino ci pensa attraversa(), che prima porta la cabina davanti a lui.
      attraversa(i, presa.getAttribute('href'));
    });
  });

  var attesaResize = 0;
  window.addEventListener('resize', function () {
    if (inTransizione) return;
    clearTimeout(attesaResize);
    attesaResize = setTimeout(function () {
      if (inTransizione) return;
      costruisci();
      vaiA(ATTIVA, 'auto');
    }, 150);
  });

  costruisci();
  vaiA(ATTIVA, 'auto');

  window.__cabina = {
    geometrie: function () { return geometrie; },
    dolly: function () { return DOLLY; },
    attraversa: attraversa,
    flip: function () { return ultimoFlip; },
    torna: torna,
    vaiA: vaiA
  };
})();
