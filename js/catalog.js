(function (global) {
  'use strict';

  var SVG_PLACEHOLDER = '<svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>';

  function normalizza(destinazione) {
    if (!destinazione || typeof destinazione !== 'object') return destinazione;
    if (!Array.isArray(destinazione.categorie) || destinazione.categorie.length === 0) {
      destinazione.categorie = destinazione.tipologia ? [destinazione.tipologia] : [];
    }
    return destinazione;
  }

  function tutte() {
    return (global.DESTINATIONS || []).map(normalizza);
  }

  function categoria(slug) {
    return (global.SKAPPA_CATEGORIE || []).find(function (voce) {
      return voce.slug === slug;
    });
  }

  function categoriaPrincipale(destinazione) {
    var normalizzata = normalizza(destinazione);
    if (!normalizzata || !normalizzata.categorie.length) return undefined;
    return categoria(normalizzata.categorie[0]);
  }

  function urlDettaglio(destinazione) {
    var voce = categoriaPrincipale(destinazione);
    var template = voce ? voce.template : 'viaggio.html';
    return template + '?id=' + destinazione.id;
  }

  function perCategoria(slug) {
    return tutte().filter(function (destinazione) {
      return destinazione.categorie.indexOf(slug) !== -1;
    });
  }

  function conOfferta() {
    var adesso = new Date();
    return tutte().filter(function (destinazione) {
      var offerta = destinazione.offerta;
      var haCategoria = destinazione.categorie.indexOf('last-minute') !== -1;
      if (!haCategoria && !offerta) return false;
      if (offerta && offerta.attiva === false) return false;
      var scadenza = (offerta && offerta.scadenza) || destinazione.scadenza;
      return !scadenza || new Date(scadenza) > adesso;
    });
  }

  function cerca(query) {
    var q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    return tutte().filter(function (destinazione) {
      return String(destinazione.nome || '').toLowerCase().includes(q)
        || String(destinazione.date || '').toLowerCase().includes(q);
    });
  }

  function immagineResponsive(destinazione) {
    var src = destinazione.imgCard || destinazione.imgHero || '';
    var small = src.indexOf('card.webp') >= 0 ? src.replace('card.webp', 'card-sm.webp') : '';
    return {
      src: src,
      srcset: small ? ' srcset="' + small + ' 320w, ' + src + ' 840w" sizes="(max-width:640px) 90vw, 320px"' : ''
    };
  }

  function buildDefaultCard(destinazione, opzioni) {
    var voce = categoriaPrincipale(destinazione) || {};
    var isSummer = voce.slug === 'mete-estive';
    var isEuropa = voce.slug === 'fughe-in-europa';
    var contesto = opzioni.contesto || 'carousel';
    var indice = Number(opzioni.indice || 0);
    var immagine = immagineResponsive(destinazione);
    var extraClass = isSummer ? ' dest-card-summer' : '';
    var badge = isSummer
      ? '<span class="card-season-badge"><svg class="ic"><use href="assets/icons.svg#wave"></use></svg> Estate</span>'
      : '';

    if (contesto === 'grid' && isEuropa) {
      badge = '<span style="position:absolute;top:.75rem;right:.75rem;background:var(--teal);color:#fff;font-size:.6875rem;font-weight:900;padding:.35rem .875rem;border-radius:2rem;letter-spacing:.08em;text-transform:uppercase;z-index:10"><svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Europa</span>';
    }

    var voloRow = isEuropa
      ? '<p style="font-size:' + (contesto === 'grid' ? '.5625rem' : '0.5625rem') + ';color:var(--teal);font-weight:700;letter-spacing:' + (contesto === 'grid' ? '.05em' : '0.05em') + ';margin-bottom:' + (contesto === 'grid' ? '.15rem' : '0.15rem') + '"><svg class="ic"><use href="assets/icons.svg#plane"></use></svg> volo incluso</p>'
      : '';
    var imageLoad = contesto === 'grid'
      ? 'loading="lazy" decoding="async"'
      : (indice === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"');

    return '<a href="' + urlDettaglio(destinazione) + '" class="dest-card' + extraClass + '">'
      + '<div class="dest-card-img-placeholder">'
      + '<img src="' + immagine.src + '" alt="' + destinazione.nome + '" class="dest-card-photo" ' + imageLoad + immagine.srcset + ' onerror="this.style.display=\'none\'" />'
      + SVG_PLACEHOLDER
      + '</div>'
      + '<div class="dest-card-overlay"></div>'
      + badge
      + '<div class="dest-card-city">' + destinazione.nome + '</div>'
      + '<div class="dest-card-info">'
      + '<p class="dest-card-date">' + (destinazione.date || '') + '</p>'
      + voloRow
      + '<p class="dest-card-price">' + destinazione.prezzo + '€</p>'
      + '</div>'
      + '</a>';
  }

  function buildLastMinuteCard(destinazione, opzioni) {
    var contesto = opzioni.contesto || 'listing';
    var indice = Number(opzioni.indice || 0);
    var sconto = destinazione.prezzoOriginale
      ? Math.round((1 - destinazione.prezzo / destinazione.prezzoOriginale) * 100)
      : null;
    var immagine = contesto === 'home'
      ? { src: destinazione.imgHero || '', srcset: '' }
      : immagineResponsive(destinazione);
    var imageLoad = contesto === 'home'
      ? (indice === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"')
      : 'loading="lazy" decoding="async"';
    var style = contesto === 'home' ? ' style="flex:0 0 260px;max-width:280px"' : '';
    var countdown = contesto === 'listing' && destinazione.scadenza
      ? '<span class="card-mini-countdown" id="lmcd_' + indice + '">⏱ calcolo...</span>'
      : '';
    var compact = contesto === 'listing';

    return '<a href="' + urlDettaglio(destinazione) + '" class="dest-card dest-card-lm"' + style + '>'
      + '<div class="dest-card-img-placeholder">'
      + '<img src="' + immagine.src + '" alt="' + destinazione.nome + '" class="dest-card-photo" ' + imageLoad + immagine.srcset + ' onerror="this.style.display=\'none\'" />'
      + SVG_PLACEHOLDER
      + '</div>'
      + '<div class="dest-card-overlay"></div>'
      + '<span class="card-lm-badge">⚡ Last Minute</span>'
      + '<div class="dest-card-city">' + destinazione.nome + '</div>'
      + '<div class="dest-card-info">'
      + '<p class="dest-card-date">' + (destinazione.date || '') + '</p>'
      + '<p style="font-size:' + (compact ? '.5625rem' : '0.5625rem') + ';color:var(--teal);font-weight:700;letter-spacing:' + (compact ? '.05em' : '0.05em') + ';margin-bottom:' + (compact ? '.15rem' : '0.15rem') + '"><svg class="ic"><use href="assets/icons.svg#plane"></use></svg> volo incluso</p>'
      + '<p class="dest-card-price">'
      + (destinazione.prezzoOriginale ? '<span class="card-lm-prezzo-orig">' + destinazione.prezzoOriginale + '€</span>' : '')
      + destinazione.prezzo + '€'
      + (sconto ? ' <span style="font-size:' + (compact ? '.5625rem' : '0.5625rem') + ';color:#fca5a5;font-weight:700">-' + sconto + '%</span>' : '')
      + '</p>'
      + countdown
      + '</div>'
      + '</a>';
  }

  function buildCard(destinazione, opzioni) {
    var opts = opzioni || {};
    return opts.variante === 'lastminute'
      ? buildLastMinuteCard(normalizza(destinazione), opts)
      : buildDefaultCard(normalizza(destinazione), opts);
  }

  // Riga di risultato della ricerca: markup identico a quello che era in js/main.js
  function buildRisultatoRicerca(destinazione) {
    var voce = categoriaPrincipale(destinazione) || {};
    return '<a href="' + urlDettaglio(destinazione) + '" class="search-result" onclick="closeSearch()">'
      + '<div><span class="search-result-name">' + destinazione.nome + '</span> <span class="search-badge ' + voce.badgeClass + '">' + voce.badgeHtml + '</span>'
      + '<div class="search-result-meta">' + (destinazione.date || '') + ' &nbsp;·&nbsp; ' + (destinazione.hotel || '') + '</div></div>'
      + '<span class="search-result-price">' + destinazione.prezzo + '€</span></a>';
  }

  global.SkappaCatalog = {
    normalizza: normalizza,
    tutte: tutte,
    categoria: categoria,
    categoriaPrincipale: categoriaPrincipale,
    urlDettaglio: urlDettaglio,
    perCategoria: perCategoria,
    conOfferta: conOfferta,
    cerca: cerca,
    buildCard: buildCard,
    buildRisultatoRicerca: buildRisultatoRicerca
  };
})(window);
