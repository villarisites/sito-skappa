(function () {
  'use strict';

  // Le sezioni destinazioni della home nascono dalle categorie reali, non da un elenco
  // scritto a mano: prima erano tre blocchi fissi su slug che la Fase 2 ha eliminato,
  // e la home rendeva zero card senza dirlo a nessuno.

  var contenitore = document.getElementById('homeCategorie');
  if (!contenitore || !window.SkappaCatalog) return;

  var testi = {
    'mercatini-natale': 'Luci, vin brulé e casette di legno. Le città europee nel loro momento migliore.',
    'europa': 'Dalle capitali iconiche ai posti ancora poco battuti: partenza venerdì, ritorno domenica.',
    'mare-sole': 'Mare, sole e serate lunghe. Tutto organizzato, tu pensi solo a divertirti.',
    'intercontinentali': 'Quando la vacanza deve essere il viaggio di una vita.',
    'viaggi-di-nozze': 'Costruito insieme a voi, in agenzia, senza pacchetti preconfezionati.',
    'crociere': 'Una nave, più mete, zero valigie da rifare.'
  };

  function sezione(voce, indiceSezione) {
    var accento = voce.accento || {};
    var idTrack = 'track-' + voce.slug;
    var idDots = 'dots-' + voce.slug;
    var stileBox = accento.punto
      ? ' style="border-color:' + accento.badgeBordo + ';background:' + accento.badgeBg + '"'
      : '';

    return '<section class="destinations-section" id="cat-' + voce.slug + '"'
      + (indiceSezione > 0 ? ' style="padding-top:1.5rem"' : '') + '>'
      + '<div class="max-w-6xl mx-auto">'
      + '<div class="dest-card-container fade-in"' + stileBox + '>'
      + '<div class="mb-6">'
      + '<span class="home-cat-badge" style="color:' + (accento.badgeTesto || 'var(--gold)')
      + ';border-color:' + (accento.badgeBordo || 'rgba(254,189,65,0.4)')
      + ';background:' + (accento.badgeBg || 'rgba(254,189,65,0.12)') + '">'
      + (voce.badgeHtml || voce.nome) + '</span>'
      + '<h2 class="section-title" style="margin-bottom:0.75rem">' + voce.nome + '</h2>'
      + '<p class="text-gray-300 text-sm max-w-2xl leading-relaxed">' + (testi[voce.slug] || '') + '</p>'
      + '</div>'
      + '<div class="carousel-wrap">'
      + '<button class="carousel-btn carousel-btn-prev" id="prev-' + voce.slug + '" aria-label="Precedente">&#8249;</button>'
      + '<div class="carousel-track" id="' + idTrack + '"></div>'
      + '<button class="carousel-btn carousel-btn-next" id="next-' + voce.slug + '" aria-label="Successiva">&#8250;</button>'
      + '</div>'
      + '<div class="carousel-dots" id="' + idDots + '"></div>'
      + '<p class="home-cat-tutte"><a href="' + voce.pagina + '">Vedi tutte le mete ' + voce.nome.toLowerCase()
      + ' <span aria-hidden="true">&rarr;</span></a></p>'
      + '</div></div></section>';
  }

  var categorie = (window.SKAPPA_CATEGORIE || []).slice().sort(function (a, b) {
    return (a.ordine || 0) - (b.ordine || 0);
  });

  var conMete = categorie.map(function (voce) {
    return { voce: voce, destinazioni: SkappaCatalog.perCategoria(voce.slug) };
  }).filter(function (gruppo) {
    return gruppo.destinazioni.length > 0;
  });

  if (!conMete.length) return;

  contenitore.innerHTML = conMete.map(function (gruppo, i) {
    return sezione(gruppo.voce, i);
  }).join('');

  conMete.forEach(function (gruppo) {
    var slug = gruppo.voce.slug;
    var track = document.getElementById('track-' + slug);
    var dots = document.getElementById('dots-' + slug);
    track.innerHTML = gruppo.destinazioni.map(function (d, i) {
      return SkappaCatalog.buildCard(d, { contesto: 'carousel', indice: i });
    }).join('');
    dots.innerHTML = gruppo.destinazioni.map(function (_, i) {
      return '<button class="carousel-dot' + (i === 0 ? ' active' : '') + '" aria-label="Slide ' + (i + 1) + '"></button>';
    }).join('');
    if (typeof initCarousel === 'function') {
      initCarousel('track-' + slug, 'prev-' + slug, 'next-' + slug, 'dots-' + slug);
    }
  });

  // Il placeholder SVG sparisce quando la foto e' pronta (stesso comportamento di prima)
  contenitore.querySelectorAll('.dest-card-photo').forEach(function (img) {
    function nascondi() {
      var svg = img.nextElementSibling;
      if (svg && svg.tagName === 'svg') svg.style.display = 'none';
    }
    if (img.complete && img.naturalWidth > 0) nascondi();
    else img.addEventListener('load', nascondi);
  });

  // ---- Offerte in scadenza ----
  var offerte = SkappaCatalog.conOfferta();
  var boxOfferte = document.getElementById('offerteHome');
  var grigliaOfferte = document.getElementById('offerteHomeCards');
  if (boxOfferte && grigliaOfferte) {
    if (offerte.length) {
      grigliaOfferte.innerHTML = offerte.map(function (d, i) {
        return SkappaCatalog.buildCard(d, { variante: 'lastminute', contesto: 'home', indice: i });
      }).join('');
    } else {
      boxOfferte.style.display = 'none';
    }
  }
})();
