// =============================================
//  Skappa – main.js
// =============================================

// ---- Theme toggle ----
// (Early init is in inline <script> in <head> to avoid FOUC)

// Fix inline white/rgba(255) text in content areas (outside .hero / .dest-card)
var _savedInlineColors = [];
function fixInlineTextColors(isLight) {
  if (isLight) {
    _savedInlineColors = [];
    document.querySelectorAll('[style]').forEach(function (el) {
      // Escludi hero (overlay scuro), navbar, card foto, footer
      if (el.closest('.hero, .viaggio-hero, .dest-card, .navbar, .footer')) return;
      var s = el.getAttribute('style') || '';
      var ns = s;
      // Converti testo bianco/rgba(255) in scuro
      ns = ns.replace(/color\s*:\s*rgba\(255[^)]+\)/gi, 'color:rgba(3,16,48,0.65)')
             .replace(/color\s*:\s*#fff(fffff)?\b/gi, 'color:rgba(3,16,48,0.65)');
      // Converti background inline che usano CSS var navy → colori chiari
      ns = ns.replace(/background\s*:\s*var\(--navy2\)/g, 'background:#eef0f7')
             .replace(/background\s*:\s*var\(--navy\)/g, 'background:#f5f6fa');
      if (ns !== s) {
        _savedInlineColors.push({ el: el, orig: s });
        el.setAttribute('style', ns);
      }
    });
  } else {
    _savedInlineColors.forEach(function (item) {
      item.el.setAttribute('style', item.orig);
    });
    _savedInlineColors = [];
  }
}

window.toggleTheme = function () {
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var next = isLight ? 'dark' : 'light';
  if (next === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('skappa_theme', next);
  fixInlineTextColors(next === 'light');
};

// Apply fix on page load if light theme is active
document.addEventListener('DOMContentLoaded', function () {
  if (document.documentElement.getAttribute('data-theme') === 'light') {
    fixInlineTextColors(true);
  }
});

// ---- Configurazione WhatsApp ----
// Cambia questo numero con quello di SKAPPA (formato internazionale, senza +)
var SKAPPA_WA_NUMBER = '3930306294';
var SKAPPA_WA_MESSAGE = 'Ciao! Vorrei informazioni sui viaggi SKAPPA 🌍';

// ---- Navbar scroll shadow ----
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ---- Mobile menu ----
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// ---- Carousel factory (loop infinito) ----
function initCarousel(trackId, prevId, nextId, dotsId) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const dotsContainer = document.getElementById(dotsId);
  if (!track) return;

  const realCards = Array.from(track.querySelectorAll('.dest-card'));
  const total = realCards.length;
  if (total === 0) return;

  const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];

  function updateDots(realIdx) {
    dots.forEach((d, idx) => d.classList.toggle('active', idx === realIdx));
  }

  if (total === 1) { updateDots(0); return; }

  // --- Clona card per loop infinito ---
  // Layout finale: [total cloni-prima] [total card reali] [total cloni-dopo]
  realCards.forEach(c => {
    const cl = c.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    track.appendChild(cl);
  });
  realCards.slice().reverse().forEach(c => {
    const cl = c.cloneNode(true);
    cl.setAttribute('aria-hidden', 'true');
    track.insertBefore(cl, track.firstChild);
  });

  // currentAllIdx: indice assoluto in tutte le card (0-based).
  // Le card reali sono a [total … 2*total-1].
  let currentAllIdx = total;
  let isResetting = false;

  function goToAllIdx(allIdx, smooth) {
    const allCards = track.querySelectorAll('.dest-card');
    const target = allCards[allIdx];
    if (!target) return;
    currentAllIdx = allIdx;
    updateDots(allIdx % total);
    if (smooth) {
      track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    } else {
      isResetting = true;
      track.scrollLeft = target.offsetLeft;
      setTimeout(() => { isResetting = false; }, 100);
    }
  }

  // Posizionamento iniziale sulla prima card reale (senza animazione)
  requestAnimationFrame(() => goToAllIdx(total, false));

  // Dopo lo scroll, se siamo in zona clone → salto silenzioso alla card reale
  let scrollTimer = null;
  track.addEventListener('scroll', () => {
    if (isResetting) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const allCards = Array.from(track.querySelectorAll('.dest-card'));
      const sl = track.scrollLeft;
      let closestIdx = 0, minDist = Infinity;
      allCards.forEach((card, idx) => {
        const dist = Math.abs(card.offsetLeft - sl);
        if (dist < minDist) { minDist = dist; closestIdx = idx; }
      });
      const realIdx = closestIdx % total;
      if (closestIdx < total || closestIdx >= 2 * total) {
        // Zona clone → reset istantaneo alla card reale corrispondente
        goToAllIdx(total + realIdx, false);
      } else {
        currentAllIdx = closestIdx;
        updateDots(realIdx);
      }
    }, 150);
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goToAllIdx(currentAllIdx - 1, true));
  if (nextBtn) nextBtn.addEventListener('click', () => goToAllIdx(currentAllIdx + 1, true));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goToAllIdx(total + i, true)));
}

// Carousel init per index.html è in index.html (dopo generazione dinamica card)

// ---- Fade-in on scroll ----
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ---- Kit form (Formspree AJAX) ----
const kitForm = document.getElementById('kitForm');
if (kitForm) {
  kitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('kitSubmitBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Invio in corso…';

    try {
      const res = await fetch(kitForm.action, {
        method: 'POST',
        body: new FormData(kitForm),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        kitForm.innerHTML = '<p style="color:var(--gold);font-weight:700;text-align:center;padding:1.5rem;font-size:1.1rem">🎒 Benvenuto a bordo!<br/><span style="font-size:.9rem;font-weight:400;opacity:.8">Controlla la tua email — ti scriviamo presto.</span></p>';
        // GA4: traccia conversione lead
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', { event_category: 'form', event_label: 'kit_sopravvivenza' });
        }
      } else {
        throw new Error('server');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = originalText;
      const errEl = kitForm.querySelector('.kit-error');
      if (!errEl) {
        btn.insertAdjacentHTML('afterend', '<p class="kit-error" style="color:#ef4444;text-align:center;font-size:.875rem;margin-top:.5rem">Ops, qualcosa è andato storto. Riprova o scrivici su WhatsApp.</p>');
      }
    }
  });
}

// ---- Cookie banner ----
(function () {
  if (localStorage.getItem('skappa_cookies')) return;

  var s = document.createElement('style');
  s.textContent = [
    '@keyframes slideUpCookie{from{transform:translateY(100%)}to{transform:translateY(0)}}',
    '#cookieBanner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#020c24;border-top:1px solid rgba(254,189,65,.18);padding:1rem 1.25rem;box-shadow:0 -6px 30px rgba(0,0,0,.45);animation:slideUpCookie .35s ease}',
    '#cookieBanner .cb-inner{max-width:72rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}',
    '#cookieBanner .cb-text p:first-child{font-size:.75rem;font-weight:700;color:#fff;margin-bottom:.2rem}',
    '#cookieBanner .cb-text p.cb-desc{font-size:.6875rem;color:rgba(255,255,255,.5);line-height:1.6}',
    '#cookieBanner .cb-text a{color:#febd41;text-decoration:underline}',
    '#cookieBanner .cb-btns{display:flex;gap:.5rem;flex-shrink:0;flex-wrap:wrap}',
    '#cookieBanner .cb-btn-sec{padding:.45rem .875rem;font-size:.6875rem;font-weight:700;background:transparent;border:1.5px solid rgba(255,255,255,.2);color:rgba(255,255,255,.6);border-radius:.5rem;cursor:pointer;font-family:inherit;transition:border-color .2s}',
    '#cookieBanner .cb-btn-sec:hover{border-color:rgba(255,255,255,.4)}',
    '#cookieBanner .cb-btn-acc{padding:.45rem 1rem;font-size:.6875rem;font-weight:800;background:#febd41;border:none;color:#031030;border-radius:.5rem;cursor:pointer;font-family:inherit;transition:opacity .2s}',
    '#cookieBanner .cb-btn-acc:hover{opacity:.85}'
  ].join('');
  document.head.appendChild(s);

  var b = document.createElement('div');
  b.id = 'cookieBanner';
  b.innerHTML = '<div class="cb-inner">'
    + '<div class="cb-text">'
    + '<p>Cookie &amp; Privacy</p>'
    + '<p class="cb-desc">Usiamo cookie tecnici necessari e, con il tuo consenso, cookie analitici per migliorare l\'esperienza. <a href="cookie.html">Cookie Policy</a></p>'
    + '</div>'
    + '<div class="cb-btns">'
    + '<button class="cb-btn-sec" onclick="skappaCookieAccept(\'necessary\')">Solo necessari</button>'
    + '<button class="cb-btn-acc" onclick="skappaCookieAccept(\'all\')">Accetta tutti</button>'
    + '</div></div>';
  document.body.appendChild(b);
})();

window.skappaCookieAccept = function (type) {
  localStorage.setItem('skappa_cookies', type);
  var b = document.getElementById('cookieBanner');
  if (!b) return;
  b.style.transition = 'transform .3s ease';
  b.style.transform = 'translateY(100%)';
  setTimeout(function () { b.remove(); }, 300);
};

// ---- WhatsApp floating button ----
(function () {
  var waUrl = 'https://wa.me/' + SKAPPA_WA_NUMBER
    + '?text=' + encodeURIComponent(SKAPPA_WA_MESSAGE);

  var s = document.createElement('style');
  s.textContent = [
    '@keyframes waPulse{0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,0.45)}70%{box-shadow:0 0 0 10px rgba(37,211,102,0)}}',
    '#waBtn{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9998;width:3.25rem;height:3.25rem;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:waPulse 2.4s infinite;transition:transform .2s,box-shadow .2s;text-decoration:none}',
    '#waBtn:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,0.45);animation:none}',
    '#waBtn svg{width:1.625rem;height:1.625rem;fill:#fff;flex-shrink:0}',
    '#waBtn .wa-tooltip{position:absolute;right:calc(100% + 0.75rem);top:50%;transform:translateY(-50%);background:rgba(2,12,36,0.92);color:#fff;font-size:0.6875rem;font-weight:700;white-space:nowrap;padding:0.35rem 0.75rem;border-radius:0.375rem;pointer-events:none;opacity:0;transition:opacity .2s;font-family:Inter,sans-serif;letter-spacing:0.04em}',
    '#waBtn:hover .wa-tooltip{opacity:1}'
  ].join('');
  document.head.appendChild(s);

  var btn = document.createElement('a');
  btn.id = 'waBtn';
  btn.href = waUrl;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', 'Contattaci su WhatsApp');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
    + '<span class="wa-tooltip">Scrivici su WhatsApp</span>';
  document.body.appendChild(btn);
})();
