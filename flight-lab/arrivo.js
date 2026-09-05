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
    // Quanto va tagliato dal basso perche' il piano diventi il riquadro dell'hero
    var taglio = Math.max(0, hSchermo - hFinale);

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

    // 1. il riquadro si chiude fino all'altezza dell'hero
    tl.to(continuita, { clipPath: 'inset(0px 0px ' + taglio + 'px 0px)', duration: 0.75 }, 0);
    // 2. e insieme la foto scorre verso il ritaglio dell'hero
    tl.to(continuita, { backgroundPosition: '50% 30%', duration: 0.75 }, 0);
    // 3. l'ombra dell'hero entra mentre il riquadro si chiude, non dopo
    tl.to(heroOverlay, { opacity: 1, duration: 0.6 }, 0.15);
    // 4. il contenuto arriva per ultimo, come chiede il brief
    tl.to(contenuto, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07 }, 0.45);
    tl.from(contenuto, { y: 18, duration: 0.5, stagger: 0.07 }, 0.45);

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
