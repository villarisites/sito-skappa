(function () {
  'use strict';

  // "Il Volo SKAPPA": la striscia di oblo' nell'hero della home.
  // Gli oblo' sono link veri e la striscia scorre in CSS: senza questo file
  // la sezione resta usabile e indicizzabile. Qui ci sono solo i miglioramenti.

  var strip = document.getElementById('voloStrip');
  if (!strip) return;

  var oblo = Array.prototype.slice.call(strip.querySelectorAll('.volo-oblo'));
  if (!oblo.length) return;

  var nome = document.getElementById('voloNome');
  var prezzo = document.getElementById('voloPrezzo');
  var menoMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Quale oblo' e' al centro ----
  function attiva(el) {
    oblo.forEach(function (o) { o.classList.toggle('is-attivo', o === el); });
    if (nome) nome.textContent = el.getAttribute('data-nome') || '';
    if (prezzo) prezzo.textContent = el.getAttribute('data-prezzo') || '';
  }

  if ('IntersectionObserver' in window) {
    var osservatore = new IntersectionObserver(function (voci) {
      var migliore = null;
      voci.forEach(function (voce) {
        if (!voce.isIntersecting) return;
        if (!migliore || voce.intersectionRatio > migliore.intersectionRatio) migliore = voce;
      });
      if (migliore) attiva(migliore.target);
    }, { root: strip, threshold: [0.55, 0.8, 1] });
    oblo.forEach(function (o) { osservatore.observe(o); });
  }
  attiva(oblo[0]);

  // ---- Frecce e tastiera ----
  function scorri(direzione) {
    var passo = oblo[0].getBoundingClientRect().width + 24;
    strip.scrollBy({ left: passo * direzione, behavior: menoMovimento ? 'auto' : 'smooth' });
  }
  var prev = document.getElementById('voloPrev');
  var next = document.getElementById('voloNext');
  if (prev) prev.addEventListener('click', function () { scorri(-1); });
  if (next) next.addEventListener('click', function () { scorri(1); });
  strip.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { scorri(-1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { scorri(1); e.preventDefault(); }
  });

  // ---- Trascinamento col mouse (su touch basta lo swipe nativo) ----
  var giu = false, partenzaX = 0, partenzaScroll = 0, trascinato = 0;
  strip.addEventListener('mousedown', function (e) {
    giu = true; trascinato = 0;
    partenzaX = e.pageX;
    partenzaScroll = strip.scrollLeft;
    strip.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', function (e) {
    if (!giu) return;
    var delta = e.pageX - partenzaX;
    trascinato = Math.abs(delta);
    strip.scrollLeft = partenzaScroll - delta;
  });
  window.addEventListener('mouseup', function () {
    if (!giu) return;
    giu = false;
    strip.classList.remove('is-dragging');
  });
  // Un trascinamento non deve aprire la meta che sta sotto il puntatore
  strip.addEventListener('click', function (e) {
    if (trascinato > 8) { e.preventDefault(); e.stopPropagation(); trascinato = 0; }
  }, true);

  // ---- Precarica l'hero della meta appena la sfiori ----
  var precaricate = {};
  function precarica(url) {
    if (!url || precaricate[url]) return;
    precaricate[url] = true;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }
  oblo.forEach(function (o) {
    ['mouseenter', 'focus'].forEach(function (evento) {
      o.addEventListener(evento, function () { precarica(o.getAttribute('data-hero')); });
    });
  });

  // ---- La transizione porta ----
  if (menoMovimento) return;

  var porta = document.getElementById('voloPorta');
  var lampo = document.getElementById('voloLampo');
  if (!porta || !lampo) return;

  oblo.forEach(function (o) {
    o.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      var destinazione = o.getAttribute('href');
      var hero = o.getAttribute('data-hero');
      if (!destinazione) return;
      e.preventDefault();

      // Il portello parte dalla posizione esatta dell'oblo' cliccato
      var box = o.getBoundingClientRect();
      var w = window.innerWidth, h = window.innerHeight;
      porta.style.backgroundImage = hero ? 'url("' + hero + '")' : '';
      porta.style.setProperty('--porta-top', (box.top / h * 100) + '%');
      porta.style.setProperty('--porta-right', ((w - box.right) / w * 100) + '%');
      porta.style.setProperty('--porta-bottom', ((h - box.bottom) / h * 100) + '%');
      porta.style.setProperty('--porta-left', (box.left / w * 100) + '%');
      lampo.style.setProperty('--lampo-x', ((box.left + box.width / 2) / w * 100) + '%');
      lampo.style.setProperty('--lampo-y', ((box.top + box.height / 2) / h * 100) + '%');

      // forza un reflow, altrimenti il browser accorpa stato iniziale e finale
      void porta.offsetWidth;

      document.body.classList.add('volo-in-partenza');
      porta.classList.add('is-aperta');
      lampo.classList.add('is-acceso');

      try { sessionStorage.setItem('skappa_volo', '1'); } catch (err) { /* modalita' privata */ }
      window.setTimeout(function () { window.location.href = destinazione; }, 430);
    });
  });
})();
