/* ============================================================
   ARRIVO — la seconda meta' del portale
   La cabina lascia la foto a schermo intero, ritagliata al centro.
   L'hero della meta e' alta 60vh e ritagliata al 30%. Sono due inquadrature
   diverse della stessa foto: se le scambi di colpo si vede un salto, e infatti
   si vedeva. Qui la differenza viene PERCORSA.

   Il piano `.continuita` parte esattamente dov'era la foto e viene ritagliato
   fino al riquadro dell'hero, mentre l'immagine scorre dal ritaglio centrale a
   quello al 30%. Quando i due combaciano, l'hero vero si accende sotto e il
   piano sparisce: il cambio non si vede perche' in quell'istante mostrano la
   stessa identica cosa.
   ============================================================ */
(function () {
  'use strict';

  var meno = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var diretto = document.documentElement.hasAttribute('data-diretto');
  var meta = document.documentElement.dataset.meta || 'praga';

  var continuita = document.getElementById('continuita');
  var heroBg = document.getElementById('heroBg');
  var heroOverlay = document.getElementById('heroOverlay');
  var contenuto = document.querySelectorAll('.hero-contenuto > *');

  document.getElementById('heroNome').textContent = meta.toUpperCase();

  // Chi arriva diretto vede la pagina normale: non c'e' nessuna continuita'
  // da preservare, e fingerla sarebbe solo un'animazione in piu'.
  if (diretto || meno) {
    if (continuita) continuita.remove();
    return;
  }

  function altezzaHero() {
    return document.querySelector('.hero').getBoundingClientRect().height;
  }

  function atterra() {
    var hFinale = altezzaHero();
    var hSchermo = window.innerHeight;
    // Dove finisce l'hero, in percentuale di schermo: e' li' che la foto deve
    // essersi spenta del tutto.
    var fine = Math.min(100, (hFinale / hSchermo) * 100);
    var inizio = fine * 0.84;   // da qui comincia a spegnersi: stretta, se no la
                               // dissolvenza arriva fin sopra il testo della sezione sotto

    var tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: function () {
        // I due stati ora combaciano: si accende l'hero vero e il piano se ne va.
        // Nessuna dissolvenza incrociata, sarebbe visibile proprio perche'
        // le due immagini sono identiche.
        heroBg.style.opacity = 1;
        continuita.remove();
      }
    });

    // 1. la foto si spegne verso il basso, con un bordo morbido
    tl.fromTo(continuita,
      { '--m1': '100%', '--m2': '100%' },
      { '--m1': inizio + '%', '--m2': fine + '%', duration: 0.9 }, 0);
    // 2. e insieme scorre verso il ritaglio dell'hero
    tl.to(continuita, { backgroundPosition: '50% 30%', duration: 0.9 }, 0);
    // 3. L'ombra entra PRESTO e lentamente: prima arrivava tutta nell'ultimo
    //    quarto e la foto passava da piatta a scura di colpo.
    tl.to(heroOverlay, { opacity: 1, duration: 0.85, ease: 'power1.inOut' }, 0.05);
    // 4. Il contenuto arriva per ultimo, come chiede il brief, ma con lo spazio
    //    per farlo una riga per volta invece che tutto insieme sul finale.
    tl.fromTo(contenuto,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, 0.42);

    return tl;
  }

  // ?fermo=1 lascia la timeline in pausa, come ?resta=1 nella cabina: serve a
  // guardare l'atterraggio da fermi invece che a cronometro.
  var FERMO = new URLSearchParams(location.search).has('fermo');

  // Si parte solo quando la foto e' davvero disegnabile: partire prima
  // significherebbe animare un rettangolo vuoto.
  function avvia() {
    var tl = atterra();
    if (FERMO) tl.pause(0);
    window.__arrivo.tl = tl;
  }

  // La foto e' un fondo CSS gia' disegnato dal primo fotogramma: non c'e' piu'
  // un <img> da aspettare. Basta lasciar passare un frame per il layout.
  requestAnimationFrame(function () { requestAnimationFrame(avvia); });

  window.__arrivo = { atterra: atterra, tl: null };
})();
