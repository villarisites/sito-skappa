/* ============================================================
   CABINA — prototipo
   La geometria dei finestrini sta in un posto solo: da qui nascono sia i fori
   nella parete SVG sia la posizione di cornici, vetri, mondi e link. Se le due
   cose vivessero separate, divergerebbero al primo ritocco.
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

  // Tutti i finestrini hanno la stessa misura: stanno sullo stesso piano, quindi
  // rimpicciolirne alcuni sarebbe falso. I vicini si leggono come vicini perche'
  // sono tagliati dal bordo e perche' ricevono meno luce, non perche' sono piccoli.
  var METE = [
    { id: 'praga',    nome: 'PRAGA',    x: 0.10, luce: 0.62 },
    { id: 'budapest', nome: 'BUDAPEST', x: 0.50, luce: 1.00 },
    { id: 'vienna',   nome: 'VIENNA',   x: 0.90, luce: 0.62 }
  ];
  var ALTEZZA_FINESTRINO = 0.40;   // frazione dell'altezza della scena
  var ATTIVA = 1;

  var scena = document.getElementById('scena');
  var camera = document.getElementById('camera');
  var elMondi = document.getElementById('mondi');
  var elParete = document.getElementById('parete');
  var elCornici = document.getElementById('cornici');
  var elVetri = document.getElementById('vetri');
  var mondoPieno = document.getElementById('mondoPieno');
  var elTarghette = document.getElementById('targhette');

  // ?resta=1 blocca la navigazione finale: serve a guardare la transizione da fermi
  var RESTA = new URLSearchParams(location.search).has('resta');
  var geometrie = [];
  var inTransizione = false;

  function misura() {
    var W = scena.clientWidth;
    var H = scena.clientHeight;
    // La fascia dei finestrini non sta a meta' altezza: in cabina e' piu' in alto,
    // perche' sotto c'e' il pannello laterale e il bracciolo.
    var cy = H * 0.44;
    geometrie = METE.map(function (meta) {
      var h = ALTEZZA_FINESTRINO * H;
      var w = h * RAPPORTO;
      return {
        meta: meta,
        x: meta.x * W,
        y: cy,
        w: w,
        h: h,
        r: w * RAGGIO
      };
    });
    return { W: W, H: H, cy: cy };
  }

  // ---- La parete: SVG, non gradienti. I fori sono veri fori. ----
  function disegnaParete(dim) {
    var fori = geometrie.map(function (g) {
      return '<rect x="' + (g.x - g.w / 2) + '" y="' + (g.y - g.h / 2) + '" width="' + g.w +
             '" height="' + g.h + '" rx="' + g.r + '" ry="' + g.r + '" fill="black"/>';
    }).join('');

    // Aloni di luce attorno ai fori: fuori e' piu' luminoso che dentro, quindi la
    // parete si schiarisce verso i finestrini. E' il segnale piu' forte per leggere
    // "sono dentro un aereo" — la versione precedente aveva luce uniforme.
    var aloni = geometrie.map(function (g) {
      return '<ellipse cx="' + g.x + '" cy="' + g.y + '" rx="' + (g.w * 1.9) + '" ry="' + (g.h * 1.25) +
             '" fill="url(#alone)" opacity="' + (0.55 * g.meta.luce) + '"/>';
    }).join('');

    // L'architettura della cabina. Senza questa, i finestrini galleggiano in un
    // fondale grigio: sono la cappelliera sopra e il pannello laterale sotto a far
    // capire che si e' seduti dentro una fusoliera.
    var W = dim.W, H = dim.H;
    var yBin = H * 0.20;          // bordo inferiore della cappelliera
    var yPannello = H * 0.66;     // dove la parete piega verso il pavimento
    var ySedili = H * 0.82;       // spalliere davanti

    var architettura =
      // cappelliera: pancia arrotondata che sporge verso di noi
      '<path d="M0,-20 L' + W + ',-20 L' + W + ',' + (yBin - 26) +
        ' Q' + (W / 2) + ',' + (yBin + 16) + ' 0,' + (yBin - 26) + ' Z" fill="url(#cappelliera)"/>' +
      // ombra portata della cappelliera sulla parete
      '<path d="M0,' + (yBin - 26) + ' Q' + (W / 2) + ',' + (yBin + 16) + ' ' + W + ',' + (yBin - 26) +
        ' L' + W + ',' + (yBin + 58) + ' Q' + (W / 2) + ',' + (yBin + 96) + ' 0,' + (yBin + 58) +
        ' Z" fill="url(#ombraBin)"/>' +
      // fuga fra gli sportelli della cappelliera
      '<rect x="0" y="' + (yBin - 30) + '" width="' + W + '" height="2" fill="rgba(0,0,0,0.34)"/>' +
      // pannello laterale sotto i finestrini: piega e prende meno luce
      '<path d="M0,' + yPannello + ' L' + W + ',' + yPannello + ' L' + W + ',' + H + ' L0,' + H +
        ' Z" fill="url(#pannelloBasso)"/>' +
      '<rect x="0" y="' + yPannello + '" width="' + W + '" height="2" fill="rgba(255,255,255,0.14)"/>' +
      '<rect x="0" y="' + (yPannello + 2) + '" width="' + W + '" height="3" fill="rgba(0,0,0,0.28)"/>' +
      // spalliere dei sedili davanti, in ombra
      '<path d="M0,' + ySedili + ' Q' + (W * 0.18) + ',' + (ySedili - 46) + ' ' + (W * 0.36) + ',' + ySedili +
        ' L' + (W * 0.36) + ',' + H + ' L0,' + H + ' Z" fill="#171a20" opacity="0.92"/>' +
      '<path d="M' + (W * 0.64) + ',' + ySedili + ' Q' + (W * 0.82) + ',' + (ySedili - 46) + ' ' + W + ',' + ySedili +
        ' L' + W + ',' + H + ' L' + (W * 0.64) + ',' + H + ' Z" fill="#171a20" opacity="0.92"/>';

    // fughe verticali fra i pannelli di parete, una per campata
    var fughe = '';
    geometrie.forEach(function (g) {
      var x = Math.round(g.x + (g.w * 1.55));
      fughe += '<rect x="' + x + '" y="' + (yBin + 26) + '" width="1.5" height="' + (yPannello - yBin - 26) +
               '" fill="rgba(0,0,0,0.16)"/>' +
               '<rect x="' + (x + 1.5) + '" y="' + (yBin + 26) + '" width="1" height="' + (yPannello - yBin - 26) +
               '" fill="rgba(255,255,255,0.10)"/>';
    });

    elParete.innerHTML =
      '<svg viewBox="0 0 ' + dim.W + ' ' + dim.H + '" preserveAspectRatio="none" aria-hidden="true">' +
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
          '<linearGradient id="cappelliera" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0"   stop-color="#8e8577"/>' +
            '<stop offset="0.6" stop-color="#cfc5b4"/>' +
            '<stop offset="1"   stop-color="#e3d9c6"/>' +
          '</linearGradient>' +
          '<linearGradient id="ombraBin" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#000000" stop-opacity="0.40"/>' +
            '<stop offset="1" stop-color="#000000" stop-opacity="0"/>' +
          '</linearGradient>' +
          '<linearGradient id="pannelloBasso" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0"   stop-color="#8a8074"/>' +
            '<stop offset="0.5" stop-color="#5f594f"/>' +
            '<stop offset="1"   stop-color="#2b2925"/>' +
          '</linearGradient>' +
          '<radialGradient id="alone">' +
            '<stop offset="0" stop-color="#dfeaf3" stop-opacity="0.75"/>' +
            '<stop offset="1" stop-color="#dfeaf3" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<filter id="incasso" x="-50%" y="-50%" width="200%" height="200%">' +
            '<feGaussianBlur stdDeviation="7" result="b"/>' +
            '<feOffset dy="4"/>' +
          '</filter>' +
          '<mask id="fori">' +
            '<rect width="' + dim.W + '" height="' + dim.H + '" fill="white"/>' + fori +
          '</mask>' +
        '</defs>' +
        '<g mask="url(#fori)">' +
          '<rect width="' + dim.W + '" height="' + dim.H + '" fill="url(#muro)"/>' +
          aloni +
          fughe +
          architettura +
          // vignettatura ai lati: la cabina prosegue oltre il viewport
          '<rect width="' + dim.W + '" height="' + dim.H + '" fill="url(#lati)"/>' +
        '</g>' +
        '<defs><linearGradient id="lati" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#0c0e13" stop-opacity="0.55"/>' +
          '<stop offset="0.22" stop-color="#0c0e13" stop-opacity="0"/>' +
          '<stop offset="0.78" stop-color="#0c0e13" stop-opacity="0"/>' +
          '<stop offset="1" stop-color="#0c0e13" stop-opacity="0.55"/>' +
        '</linearGradient></defs>' +
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
    var dim = misura();
    disegnaParete(dim);

    elMondi.innerHTML = geometrie.map(function (g) {
      // Il mondo e' piu' grande del foro: sta dietro, e attraverso il buco se ne
      // vede solo un ritaglio. E' quello che fa sembrare che esista davvero fuori.
      return '<div class="mondo" data-meta="' + g.meta.id + '" style="--mondo-x:' + g.x + 'px;--mondo-y:' + g.y + 'px;--mondo-w:' +
             (g.w * 2.1) + 'px;--mondo-h:' + (g.h * 1.7) + 'px">' +
             '<img src="../assets/foto/' + g.meta.id + '/hero.webp" alt="" />' +
             '</div>';
    }).join('');

    elCornici.innerHTML = geometrie.map(function () { return '<div class="cornice"></div>'; }).join('');
    elTarghette.innerHTML = geometrie.map(function (g) {
      return '<div class="targhetta">' + g.meta.nome + '</div>';
    }).join('');
    elVetri.innerHTML = geometrie.map(function () { return '<div class="vetro"></div>'; }).join('');

    geometrie.forEach(function (g, i) {
      stile(elCornici.children[i], g);
      stile(elTarghette.children[i], g);
      stile(elVetri.children[i], g);
      var presa = document.getElementById('presa-' + g.meta.id);
      if (presa) stile(presa, g);
      // i vicini sono piu' quieti: meno luce, non "meno selezionati"
      // Meno luce, non meno opacita': un vetro in ombra e' piu' freddo e meno
      // contrastato, non grigio. Con l'opacita' i vicini sembravano sporchi.
      var l = g.meta.luce;
      elMondi.children[i].querySelector('img').style.filter =
        'brightness(' + (0.28 + 0.72 * l) + ') contrast(' + (0.90 + 0.10 * l) + ')';
      elMondi.children[i].style.setProperty('--freddo', (1.2 * (1 - l)).toFixed(3));
    });

    aggiornaFuoco();
  }

  function aggiornaFuoco() {
    var g = geometrie[ATTIVA];
    scena.style.setProperty('--fuoco-x', g.x + 'px');
    scena.style.setProperty('--fuoco-y', g.y + 'px');
    scena.style.setProperty('--h-attivo', g.h + 'px');
    Array.prototype.forEach.call(elTarghette.children, function (t, i) {
      t.classList.toggle('is-attiva', i === ATTIVA);
    });
  }

  // ---- Parallasse: quasi inconscia, guidata dal puntatore ----
  if (!menoMovimento && window.matchMedia('(pointer: fine)').matches) {
    var mondiX = gsap.quickTo(elMondi, 'x', { duration: 0.9, ease: 'power2.out' });
    var pareteX = gsap.quickTo(elParete, 'x', { duration: 0.5, ease: 'power2.out' });
    var vetriX = gsap.quickTo(elVetri, 'x', { duration: 1.2, ease: 'power2.out' });
    window.addEventListener('pointermove', function (e) {
      if (inTransizione) return;
      var d = (e.clientX / window.innerWidth - 0.5) * 2;
      pareteX(d * -3);      // la parete e' vicina: si muove poco ma per prima
      mondiX(d * 7);        // il mondo e' lontano: si sposta in senso opposto
      vetriX(d * -5);       // il riflesso ha vita sua
    }, { passive: true });
  }

  // ---- LA TRANSIZIONE: la camera avanza dentro il foro ----
  function attraversa(indice, href) {
    if (inTransizione) return;
    inTransizione = true;
    var g = geometrie[indice];

    scena.style.setProperty('--fuoco-x', g.x + 'px');
    scena.style.setProperty('--fuoco-y', g.y + 'px');

    var mondo = elMondi.children[indice];
    var img = mondo.querySelector('img');

    if (menoMovimento) {
      // Niente movimento di camera: la stessa immagine va a schermo intero e basta.
      mondoPieno.style.visibility = 'visible';
      mondoPieno.appendChild(img);
      gsap.set(img, { position: 'absolute', inset: 0, width: '100%', height: '100%' });
      gsap.to(mondoPieno, { opacity: 1, duration: 0.2, onComplete: function () {
        if (!RESTA) window.location.href = href;
      } });
      return;
    }

    var tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: function () { if (!RESTA) window.location.href = href; }
    });

    // 1. La camera avanza. Un solo valore: la prospettiva distribuisce il resto.
    //    La parete (z=0) e il primo piano (z=+200) esplodono e escono dal viewport,
    //    il mondo (z=-300) cresce molto meno. Nessuno scale per piano.
    tl.to(camera, { '--dolly': '980px', duration: 1.0, ease: 'power2.in' }, 0);

    // 2. Gli altri finestrini si allontanano lateralmente: la cabina si apre
    geometrie.forEach(function (altra, i) {
      if (i === indice) return;
      tl.to(elMondi.children[i].querySelector('img'), {
        filter: 'brightness(0.34) contrast(0.98)', duration: 0.75, ease: 'power1.in'
      }, 0);
      tl.to(elMondi.children[i], { '--freddo': 0.62, duration: 0.75, ease: 'power1.in' }, 0);
    });

    // 3. Etichetta e riflessi si tolgono di mezzo presto
    tl.to([elTarghette, elVetri], { opacity: 0, duration: 0.32 }, 0);

    // 4. Quando la cornice ha ormai superato il bordo dello schermo, Flip prende
    //    LA STESSA immagine — quella dentro il finestrino, non una copia — e la
    //    porta a schermo intero. E' la continuita' che chiedeva il brief: se qui
    //    comparisse un secondo elemento, l'illusione si romperebbe.
    tl.add(function () {
      var stato = Flip.getState(img);
      mondoPieno.style.visibility = 'visible';
      mondoPieno.appendChild(img);
      Flip.from(stato, {
        duration: 0.5,
        ease: 'power2.inOut',
        absolute: true,
        scale: true
      });
    }, 0.80);

    return tl;
  }

  // ---- I link restano link: il click viene solo arricchito ----
  Array.prototype.forEach.call(document.querySelectorAll('.presa'), function (presa) {
    presa.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var i = METE.findIndex(function (m) { return m.id === presa.dataset.meta; });
      if (i < 0) return;
      e.preventDefault();
      ATTIVA = i;
      aggiornaFuoco();
      attraversa(i, presa.getAttribute('href'));
    });
  });

  window.addEventListener('resize', function () {
    if (!inTransizione) costruisci();
  });

  costruisci();
  window.__cabina = { geometrie: function () { return geometrie; }, attraversa: attraversa };
})();
