/* ============================================================
   PAGINA META — la logica di viaggio.html
   Erano 497 righe dentro un <script> inline. Spostate qui per tre motivi
   misurabili, non per gusto di ordine:

   - CACHE. viaggio.html?id=praga e ?id=vienna sono due chiavi di cache diverse:
     inline, questi 26 KB si riscaricavano per ognuna delle 27 mete. Come file
     si scaricano una volta sola.
   - TEST. Inline non erano raggiungibili: js/travel-detail.js, che e' un
     ventesimo di questo codice, e' coperto dai test proprio perche' e' un file.
   - CSP. Gli script inline obbligano a 'unsafe-inline' in script-src, che
     annulla quella difesa. Tolti gli inline dalle pagine pubbliche si puo'
     stringere la policy.

   Caricato SENZA defer e nella stessa posizione di prima, subito dopo
   js/travel-detail.js: main.js e animations.js sono defer e girano dopo il
   parsing, quindi oggi partono DOPO questo codice. Con defer anche qui
   l'ordine si invertirebbe e gli observer delle animazioni si attaccherebbero
   a contenuto non ancora costruito.
   ============================================================ */
(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id') || '';
  var catalogo = window.SkappaCatalog;
  var dest = catalogo.tutte().find(function (d) { return d.id === id; });

  if (!dest) {
    document.getElementById('heroNome').textContent = 'DESTINAZIONE NON TROVATA';
    document.getElementById('heroDate').textContent = '';
    document.getElementById('heroTagline').textContent = 'Nessuna destinazione trovata per questo ID.';
    document.getElementById('heroPrezzo').textContent = '';
    document.getElementById('heroCta').style.display = 'none';
    // Una pagina "non trovata" non deve entrare in indice
    var robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute('content', 'noindex, follow');
    return;
  }

  // I record vuoti dell'editor non sono contenuti da mostrare.
  dest = Object.assign({}, dest, {
    attivita: (dest.attivita || []).filter(function (item) { return item && (item.titolo || item.descrizione); }),
    faq: (dest.faq || []).filter(function (item) { return item && item.domanda && item.risposta; }),
    recensioni: (dest.recensioni || []).filter(function (item) { return item && item.testo; }),
    inclusiConSkappa: (dest.inclusiConSkappa || []).filter(function (item) { return item && item.label; })
  });
  var categoria = catalogo.categoriaPrincipale(dest) || {};
  var seo = categoria.seo || {};
  var accento = categoria.accento || {};
  var hasPrice = window.SkappaTravel.hasPrice(dest);
  var canCheckout = window.SkappaTravel.canCheckout(dest);
  var pageUrl = 'https://skappa.it/viaggio.html?id=' + id;
  var scadenza = (dest.offerta && dest.offerta.scadenza) || dest.scadenza;
  var scadenzaMs = scadenza ? new Date(scadenza).getTime() : NaN;
  var offertaAttiva = Number.isFinite(scadenzaMs)
    && scadenzaMs > Date.now()
    && hasPrice
    && !(dest.offerta && dest.offerta.attiva === false);

  // ---- Tema di categoria ----
  // Il colore d'accento e' tutto qui: le regole in style.css leggono queste variabili.
  var radice = document.body;
  radice.classList.add('cat-' + (categoria.slug || 'generica'));
  var mappaVar = {
    '--cat-badge-bg': accento.badgeBg,
    '--cat-badge-bordo': accento.badgeBordo,
    '--cat-badge-testo': accento.badgeTesto,
    '--cat-badge-anim': accento.badgeAnim,
    '--cat-check': accento.check,
    '--cat-titolo': accento.titolo,
    '--cat-punto': accento.punto
  };
  Object.keys(mappaVar).forEach(function (nome) {
    if (mappaVar[nome]) radice.style.setProperty(nome, mappaVar[nome]);
  });
  var badgeEl = document.getElementById('badgeCategoria');
  if (badgeEl) badgeEl.innerHTML = categoria.badgeDettaglio || categoria.badgeTesto || '';
  var logoEl = document.getElementById('heroLogo');
  if (logoEl && accento.logoGlow) logoEl.style.filter = 'drop-shadow(0 0 28px ' + accento.logoGlow + ')';

  // ---- Meta SEO ----
  // title/description/og li ha gia' impostati il blocco inline nell'<head>, che gira
  // prima del render. Qui restano solo canonical e le immagini assolute.
  if (dest.imgHero) {
    var absImg = 'https://skappa.it/' + dest.imgHero;
    document.querySelector('meta[name="twitter:image"]').setAttribute('content', absImg);
    document.querySelector('meta[property="og:image"]').setAttribute('content', absImg);
  }
  var canonical = document.getElementById('canonicalTag');
  if (canonical) canonical.setAttribute('href', pageUrl);

  // ---- Hero ----
  if (dest.imgHero) {
    document.getElementById('heroBg').style.backgroundImage = "url('" + dest.imgHero + "')";
  }
  document.getElementById('heroNome').textContent = dest.nome;
  document.getElementById('heroDate').textContent = dest.date;
  document.getElementById('heroTagline').textContent = dest.tagline;
  if (dest.infoRapide && dest.infoRapide.length) {
    document.getElementById('heroInfoRapide').innerHTML = dest.infoRapide.map(function (item) {
      return '<span style="display:inline-flex;align-items:center;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:0.3rem 0.75rem;font-size:0.75rem;color:rgba(255,255,255,0.8);font-weight:600;letter-spacing:0.04em">' + item + '</span>';
    }).join('');
  }
  document.getElementById('heroPrezzo').textContent = SkappaTravel.priceLabel(dest);
  if (hasPrice && dest.prezzoOriginale) {
    document.getElementById('heroPrezzoOriginale').textContent = dest.prezzoOriginale + '€';
  }
  if (!canCheckout) {
    var heroTrustBar = document.getElementById('heroTrustBar');
    var bookingTitle = document.getElementById('bookingTitle');
    if (heroTrustBar) heroTrustBar.textContent = 'Preventivo personalizzato · Nessun impegno · Assistenza SKAPPA';
    if (bookingTitle) bookingTitle.textContent = 'RICHIEDI IL TUO PREVENTIVO';
    var nextSteps = document.getElementById('nextSteps');
    nextSteps.children[1].textContent = 'Costruiamo insieme il viaggio, prima di ogni conferma.';
    var steps = [
      ['Raccontaci il tuo viaggio', 'Indicaci la meta, le date e quante persone partiranno. La richiesta è senza impegno.'],
      ['Ricevi la proposta SKAPPA', 'Il team ti contatta per definire disponibilità, servizi inclusi e prezzo del viaggio.'],
      ['Scegli e conferma', 'Valuti la proposta e confermi solo quando tutti i dettagli sono chiari.']
    ];
    nextSteps.querySelectorAll(':scope > div > div > div:last-child').forEach(function (step, index) {
      step.children[0].textContent = steps[index][0];
      step.children[1].textContent = steps[index][1];
    });
  }
  if (canCheckout) {
    ['heroCta', 'pacchettoBtn', 'percheBloccaBtn', 'navbarCta'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) { el.href = dest.linkPagamento; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    });
    if (categoria.slug === 'last-minute') {
      var testiLastMinute = {
        heroCta: '⚡ BLOCCA IL PREZZO ORA',
        pacchettoBtn: '⚡ BLOCCA IL PREZZO ORA',
        percheBloccaBtn: '⚡ BLOCCA IL PREZZO ORA',
        stickyCtaBtn: '⚡ BLOCCA ORA'
      };
      Object.keys(testiLastMinute).forEach(function (idCta) {
        var ctaLm = document.getElementById(idCta);
        if (ctaLm) ctaLm.textContent = testiLastMinute[idCta];
      });
      var stickyEyebrow = document.getElementById('stickyEyebrow');
      if (stickyEyebrow) stickyEyebrow.textContent = '⚡ Offerta';
    }
  } else {
    // Senza checkout non lasciare CTA morte su "#": portano al preventivo oppure,
    // per le mete solo-consulenza, aprono direttamente la conversazione WhatsApp.
    var soloConsulenza = dest.soloConsulenza === true;
    var destinazioneCta = soloConsulenza
      ? 'https://wa.me/393930306294?text=' + encodeURIComponent('Ciao! Vorrei prenotare una consulenza per ' + dest.nome + '.')
      : 'index.html?meta=' + encodeURIComponent(dest.id) + '#preventivoForm';
    var testiCta = soloConsulenza
      ? {
          navbarCta: 'Prenota una consulenza',
          heroCta: 'PRENOTA UNA CONSULENZA',
          pacchettoBtn: 'PRENOTA UNA CONSULENZA →',
          percheBloccaBtn: 'PRENOTA UNA CONSULENZA',
          stickyCtaBtn: 'PRENOTA UNA CONSULENZA'
        }
      : {
          navbarCta: 'Richiedi preventivo',
          heroCta: 'RICHIEDI PREVENTIVO',
          pacchettoBtn: 'RICHIEDI PREVENTIVO →',
          percheBloccaBtn: 'RICHIEDI PREVENTIVO',
          stickyCtaBtn: 'RICHIEDI PREVENTIVO'
        };
    Object.keys(testiCta).forEach(function (idCta) {
      var cta = document.getElementById(idCta);
      if (!cta) return;
      cta.textContent = testiCta[idCta];
      cta.href = destinazioneCta;
      if (soloConsulenza) {
        cta.target = '_blank';
        cta.rel = 'noopener noreferrer';
      } else {
        cta.removeAttribute('target');
        cta.removeAttribute('rel');
      }
    });
  }

  // ---- Pacchetti ----
  document.getElementById('pNome').textContent = dest.nome;
  document.getElementById('pPartenza').textContent = dest.partenzaDa ? 'Partenza da ' + dest.partenzaDa : 'Partenza da concordare';
  document.getElementById('pPrezzo').innerHTML = SkappaTravel.priceMarkup(dest);
  if (hasPrice && dest.prezzoOriginale) {
    document.getElementById('pPrezzoOriginale').textContent = '€' + dest.prezzoOriginale + ' a persona';
  }
  if (dest.hotel) {
    var pHotel = document.getElementById('pHotel');
    if (pHotel) pHotel.innerHTML = '<svg class="ic"><use href="assets/icons.svg#hotel"></use></svg> ' + dest.hotel;
  }
  if (hasPrice && dest.durata) {
    var mGiorni = (dest.durata || '').match(/(\d+)\s*giorn/);
    var gg = mGiorni ? parseInt(mGiorni[1]) : 0;
    if (gg > 0) {
      var ppg = Math.round(dest.prezzo / gg);
      var elPPG = document.getElementById('pPrezzoGiorno');
      if (elPPG) elPPG.textContent = '≈ ' + ppg + '€ al giorno a persona';
    }
  }
  document.getElementById('pInclusi').innerHTML = (dest.inclusiPacchetto || []).map(function (item) {
    return '<li><span class="check">✓</span><span>' + item + '</span></li>';
  }).join('');

  // ---- Selettore aeroporto: solo se la meta ha piu' partenze ----
  window.currentDest = dest;
  if (hasPrice && dest.prezziAeroporti && dest.prezziAeroporti.length > 0) {
    var airHtml = '<div id="aeroportoWrap" style="margin-bottom:1.25rem">'
      + '<label style="font-size:0.6875rem;font-weight:700;color:rgba(255,255,255,0.45);letter-spacing:0.07em;text-transform:uppercase;display:block;margin-bottom:0.4rem"><svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Aeroporto di partenza</label>'
      + '<select id="aeroportoSelect" onchange="window.skappaOnAeroporto(this)" style="width:100%;padding:0.625rem 0.875rem;background:rgba(255,255,255,0.06);border:1.5px solid rgba(254,189,65,0.2);border-radius:0.5rem;color:#fff;font-size:0.875rem;font-family:inherit;outline:none;cursor:pointer">'
      + dest.prezziAeroporti.map(function(ap) {
          return '<option value="' + ap.prezzo + '" data-nome="' + ap.aeroporto + '">' + ap.aeroporto + ' — ' + ap.prezzo + '€</option>';
        }).join('')
      + '</select></div>';
    var pInclusiEl = document.getElementById('pInclusi');
    if (pInclusiEl) pInclusiEl.insertAdjacentHTML('beforebegin', airHtml);
  }

  // ---- Offerta a tempo: countdown, badge sconto, banner urgenza ----
  // Condizionata ai DATI, non alla categoria: in futuro qualsiasi meta puo' avere
  // una scadenza senza dover essere "last minute".
  if (offertaAttiva) {
    var sezioneCd = document.getElementById('countdownSection');
    if (sezioneCd) sezioneCd.style.display = '';
    var banner = document.getElementById('urgenzaBanner');
    if (banner) banner.style.display = '';
    if (dest.prezzoOriginale) {
      var perc = Math.round((1 - dest.prezzo / dest.prezzoOriginale) * 100);
      var elSconto = document.getElementById('heroSconto');
      if (elSconto && perc > 0) { elSconto.textContent = '-' + perc + '%'; elSconto.style.display = ''; }
    }
    startCountdown(scadenza);
  }

  function startCountdown(scadenzaISO) {
    var end = new Date(scadenzaISO).getTime();
    function update() {
      var diff = end - new Date().getTime();
      if (diff <= 0) {
        document.getElementById('countdownGrid').innerHTML = '<div class="countdown-expired">OFFERTA SCADUTA</div>';
        document.getElementById('urgenzaMsg').textContent = 'Questa offerta è scaduta.';
        clearInterval(timer);
        return;
      }
      var giorni = Math.floor(diff / 86400000);
      var ore    = Math.floor((diff % 86400000) / 3600000);
      var minuti = Math.floor((diff % 3600000) / 60000);
      var sec    = Math.floor((diff % 60000) / 1000);
      document.getElementById('cdDays').textContent  = String(giorni).padStart(2, '0');
      document.getElementById('cdHours').textContent = String(ore).padStart(2, '0');
      document.getElementById('cdMins').textContent  = String(minuti).padStart(2, '0');
      document.getElementById('cdSecs').textContent  = String(sec).padStart(2, '0');
      if (giorni === 0 && ore < 6) {
        document.getElementById('urgenzaMsg').textContent = 'Meno di 6 ore! Pochissimi posti rimasti a questo prezzo.';
      } else if (giorni === 0) {
        document.getElementById('urgenzaMsg').textContent = 'Offerta in scadenza oggi — assicurati il posto subito!';
      }
    }
    update();
    var timer = setInterval(update, 1000);
  }

  // ---- Pay mode toggle (acconto / pagamento completo) ----
  window._skappaPayDest = dest;
  window._skappaPayPrice = hasPrice ? Number(dest.prezzo) : null;
  if (SkappaTravel.canPayDeposit(dest)) {
    var payToggleEl = document.getElementById('payToggle');
    if (payToggleEl) {
      payToggleEl.style.display = '';
      var payAccontoAmtEl = document.getElementById('payAccontoAmt');
      var paySaldoAmtEl   = document.getElementById('paySaldoAmt');
      if (payAccontoAmtEl) payAccontoAmtEl.textContent = dest.acconto + '\u20ac';
      if (paySaldoAmtEl)   paySaldoAmtEl.textContent   = (window._skappaPayPrice - dest.acconto) + '\u20ac';
    }
  }

  // ---- Perché (sticky col) ----
  document.getElementById('percheTitolo').textContent = (dest.perche && dest.perche.titolo) || '';
  document.getElementById('percheText').textContent = (dest.perche && dest.perche.testo) || '';

  // ---- Attività (stacked items) ----
  var attivita = dest.attivita || [];
  var attivitaWrap = document.getElementById('attivitaWrap');
  if (attivitaWrap && attivita.length === 0) attivitaWrap.classList.add('senza-attivita');
  var hasPerche = dest.perche && (dest.perche.titolo || dest.perche.testo);
  if (!attivita.length && !hasPerche) attivitaWrap.closest('section').style.display = 'none';
  if (!hasPerche) attivitaWrap.querySelector('.perche-sticky-col').style.display = 'none';
  document.getElementById('attivitaSection').innerHTML = (dest.attivita || []).map(function (att) {
    var imgHtml = att.img
      ? '<div class="activity-img-wrap"><img src="' + att.img + '" alt="' + att.titolo + '" class="activity-item-img" loading="lazy" decoding="async" onerror="this.parentElement.className=\'activity-item-placeholder\';this.remove()"></div>'
      : '<div class="activity-item-placeholder"></div>';
    return '<div class="activity-item fade-in">'
      + imgHtml
      + '<div class="activity-item-content">'
      + '<h3 class="activity-title">' + att.titolo + '</h3>'
      + '<p class="activity-desc">' + att.descrizione + '</p>'
      + '</div></div>';
  }).join('');

  // ---- Inclusi con Skappa ----
  if (!dest.inclusiConSkappa.length) document.getElementById('inclusiConSkappa').closest('section').style.display = 'none';
  document.getElementById('inclusiConSkappa').innerHTML = (dest.inclusiConSkappa || []).map(function (item) {
    return '<div class="incluso-item fade-in">'
      + '<div class="incluso-icona">' + (function(v){var m={'💸':'wallet','🏨':'hotel','🌍':'globe','✈️':'plane','✈':'plane','🌊':'wave','🎒':'backpack'};return m[v]?'<svg class="ic"><use href="assets/icons.svg#'+m[v]+'"></use></svg>':(v||'★');})(item.icona) + '</div>'
      + '<span class="incluso-label">' + item.label + '</span>'
      + '</div>';
  }).join('');

  // ---- Esperienza ----
  document.getElementById('esperienzaTitolo').textContent = dest.esperienzaTitolo || '';
  document.getElementById('esperienzaTesto').textContent = dest.esperienzaTesto || '';
  if (!dest.esperienzaTitolo && !dest.esperienzaTesto) document.getElementById('esperienzaTitolo').closest('section').style.display = 'none';

  // ---- FAQ ----
  var faqSection = document.getElementById('faqSection');
  if (faqSection && (!dest.faq || dest.faq.length === 0)) faqSection.style.display = 'none';
  document.getElementById('faqContainer').innerHTML = (dest.faq || []).map(function (item) {
    return '<div class="faq-item fade-in">'
      + '<button class="faq-btn" onclick="skappaToggleFaq(this)">'
      + '<span>' + item.domanda + '</span>'
      + '<span class="faq-arrow">+</span>'
      + '</button>'
      + '<div class="faq-body">' + item.risposta + '</div>'
      + '</div>';
  }).join('');

  // ---- Recensioni ----
  var recensioniSection = document.getElementById('recensioniSection');
  if (recensioniSection && (!dest.recensioni || dest.recensioni.length === 0)) recensioniSection.style.display = 'none';
  document.getElementById('recensioniContainer').innerHTML = (dest.recensioni || []).map(function (r) {
    var tag = r.tag ? ' &nbsp;·&nbsp; ' + r.tag : '';
    var initial = r.nome ? r.nome.charAt(0).toUpperCase() : 'V';
    return '<div class="review-card fade-in">'
      + '<div class="review-stars" aria-label="5 stelle su 5">★★★★★</div>'
      + '<p class="review-text">"' + r.testo + '"</p>'
      + '<div class="review-footer-row">'
      + '<div class="review-avatar-circle" aria-hidden="true">' + initial + '</div>'
      + '<div>'
      + '<div class="review-author">' + r.nome + tag + '</div>'
      + '<div class="review-verified">✓ Partecipante confermato</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  // ---- Scarcity badge ----
  if (hasPrice && dest.postiRimasti) {
    var sb = document.getElementById('scarcityBadge');
    var st = document.getElementById('scarcityText');
    if (sb && st) { st.textContent = 'Solo ' + dest.postiRimasti + ' posti rimasti a questo prezzo'; sb.style.display = 'flex'; }
  }

  // ---- Sticky mobile CTA ----
  var stickyCta = document.getElementById('stickyCta');
  if (stickyCta) {
    var spEl = document.getElementById('stickyPrice');
    if (spEl) spEl.textContent = SkappaTravel.priceLabel(dest);
    if (canCheckout) {
      var sBtn = document.getElementById('stickyCtaBtn');
      if (sBtn) { sBtn.href = dest.linkPagamento; sBtn.target = '_blank'; sBtn.rel = 'noopener'; }
    }
    var heroEl = document.querySelector('.viaggio-hero');
    if (heroEl) {
      var heroObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (window.innerWidth >= 768) return;
          stickyCta.classList.toggle('visible', !e.isIntersecting);
          document.body.classList.toggle('sticky-cta-visible', !e.isIntersecting);
        });
      }, { threshold: 0 });
      heroObs.observe(heroEl);
    }
  }

  // ---- Attiva fade-in ----
  setTimeout(function () {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(function (el) { obs.observe(el); });
  }, 0);

  // ---- JSON-LD Structured Data ----
  var baseUrl = 'https://skappa.it';
  var tripImg = dest.imgHero ? baseUrl + '/' + dest.imgHero : null;
  var offer = SkappaTravel.createOffer(dest, pageUrl);
  if (offertaAttiva) offer.priceValidUntil = new Date(scadenzaMs).toISOString().split('T')[0];
  var graph = [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type":"ListItem","position":1,"name":"Home","item":baseUrl+"/"},
        {"@type":"ListItem","position":2,"name":seo.breadcrumb || categoria.nome,"item":baseUrl+(seo.breadcrumbUrl || ('/' + (categoria.pagina || 'index.html')))},
        {"@type":"ListItem","position":3,"name":dest.nome,"item":pageUrl}
      ]
    },
    {
      "@type": "TouristTrip",
      "name": seo.nomeSchema ? seo.nomeSchema(dest) : dest.nome + " – SKAPPA",
      "description": dest.tagline,
      "url": pageUrl,
      "image": tripImg || undefined,
      "touristType": "Giovani viaggiatori",
      "provider": {"@type":"TravelAgency","name":"SKAPPA","url":baseUrl},
      "offers": offer,
      "aggregateRating": (dest.recensioni && dest.recensioni.length >= 2) ? {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": String(dest.recensioni.length)
      } : undefined
    }
  ];
  if (dest.faq && dest.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": dest.faq.map(function(q) {
        return {"@type":"Question","name":q.domanda,"acceptedAnswer":{"@type":"Answer","text":q.risposta}};
      })
    });
  }
  var ldScript = document.createElement('script');
  ldScript.type = 'application/ld+json';
  ldScript.textContent = JSON.stringify({"@context":"https://schema.org","@graph":graph});
  document.head.appendChild(ldScript);
})();

function skappaToggleFaq(btn) {
  var body = btn.nextElementSibling;
  var arrow = btn.querySelector('.faq-arrow');
  var isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.classList.toggle('open', !isOpen);
}

window.skappaOnAeroporto = function(sel) {
  if (!SkappaTravel.hasPrice(window.currentDest) || !Number.isFinite(Number(sel.value)) || Number(sel.value) <= 0) return;
  var price = sel.value;
  var nome = sel.options[sel.selectedIndex].getAttribute('data-nome') || 'Napoli';
  var cityName = nome.replace(/\s*\([^)]*\)\s*/, '').trim();
  var hP = document.getElementById('heroPrezzo');
  if (hP) hP.textContent = price + '€';
  var pP = document.getElementById('pPrezzo');
  // Aggiorna il prezzo solo se siamo in modalità pagamento completo
  var tabAcconto = document.getElementById('payTabAcconto');
  var inAccontoMode = tabAcconto && tabAcconto.classList.contains('pay-tab--active');
  if (!inAccontoMode && pP) pP.innerHTML = '<span class="pacchetto-euro">€</span>' + price;
  var pPart = document.getElementById('pPartenza');
  if (pPart) pPart.textContent = 'Partenza da ' + cityName;
  if (window.currentDest && window.currentDest.durata) {
    var mG = (window.currentDest.durata || '').match(/(\d+)\s*giorn/);
    var gg = mG ? parseInt(mG[1]) : 0;
    if (gg > 0) {
      var ppg = Math.round(parseInt(price) / gg);
      var elPPG = document.getElementById('pPrezzoGiorno');
      if (elPPG && !inAccontoMode) elPPG.textContent = '\u2248 ' + ppg + '\u20ac al giorno a persona';
    }
  }
  // Aggiorna _skappaPayPrice e il saldo visualizzato
  window._skappaPayPrice = Number(price);
  var depositAvailable = SkappaTravel.canPayDeposit(window._skappaPayDest, window._skappaPayPrice);
  var toggle = document.getElementById('payToggle');
  if (toggle) toggle.style.display = depositAvailable ? '' : 'none';
  if (!depositAvailable && inAccontoMode) skappaSetPayMode('full');
  if (depositAvailable) {
    var paySaldoEl = document.getElementById('paySaldoAmt');
    if (paySaldoEl) paySaldoEl.textContent = (window._skappaPayPrice - window._skappaPayDest.acconto) + '\u20ac';
  }
  var sp = document.getElementById('stickyPrice');
  if (sp) sp.textContent = price + '€';
};

function skappaSetPayMode(mode) {
  var dest = window._skappaPayDest;
  if (!SkappaTravel.canCheckout(dest)) return;
  if (mode === 'acconto' && !SkappaTravel.canPayDeposit(dest, window._skappaPayPrice)) return;
  var tabFull       = document.getElementById('payTabFull');
  var tabAcconto    = document.getElementById('payTabAcconto');
  var accontoInfo   = document.getElementById('payAccontoInfo');
  var pPrezzo       = document.getElementById('pPrezzo');
  var pPrezzoGiorno = document.getElementById('pPrezzoGiorno');
  var btn           = document.getElementById('pacchettoBtn');
  if (mode === 'acconto') {
    if (tabFull)    tabFull.classList.remove('pay-tab--active');
    if (tabAcconto) tabAcconto.classList.add('pay-tab--active');
    if (accontoInfo) accontoInfo.style.display = '';
    if (pPrezzo)       pPrezzo.innerHTML = '<span class="pacchetto-euro">\u20ac</span>' + dest.acconto;
    if (pPrezzoGiorno) pPrezzoGiorno.textContent = 'Blocca il posto con il solo acconto';
    if (btn) {
      btn.textContent = 'PRENOTA CON ACCONTO \u2192';
      if (dest.linkAcconto) {
        btn.href = dest.linkAcconto; btn.target = '_blank'; btn.rel = 'noopener noreferrer';
      } else {
        btn.href = 'https://wa.me/393930306294?text=' + encodeURIComponent('Ciao! Vorrei prenotare ' + dest.nome + ' con acconto.');
        btn.target = '_blank'; btn.rel = 'noopener noreferrer';
      }
    }
  } else {
    if (tabFull)    tabFull.classList.add('pay-tab--active');
    if (tabAcconto) tabAcconto.classList.remove('pay-tab--active');
    if (accontoInfo) accontoInfo.style.display = 'none';
    var fullPrice = window._skappaPayPrice || parseInt(dest.prezzo) || 0;
    if (pPrezzo) pPrezzo.innerHTML = '<span class="pacchetto-euro">\u20ac</span>' + fullPrice;
    if (pPrezzoGiorno) {
      var mG = (dest.durata || '').match(/(\d+)\s*giorn/);
      var gg = mG ? parseInt(mG[1]) : 0;
      pPrezzoGiorno.textContent = gg > 0 ? '\u2248 ' + Math.round(fullPrice / gg) + '\u20ac al giorno a persona' : '';
    }
    if (btn) {
      btn.textContent = 'BLOCCA IL TUO POSTO \u2192';
      if (dest.linkPagamento) { btn.href = dest.linkPagamento; btn.target = '_blank'; btn.rel = 'noopener noreferrer'; }
    }
  }
}
