// =============================================
//  SKAPPA – Animations & Micro-interactions
//  scroll-storytelling, visual depth, motion-micro
// =============================================
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =============================================
  //  1. PARALLAX HERO BG
  // =============================================
  if (!reducedMotion) {
    var heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
      var rafPending = false;
      window.addEventListener('scroll', function () {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function () {
          heroBg.style.transform = 'translateY(' + (window.pageYOffset * 0.28) + 'px)';
          rafPending = false;
        });
      }, { passive: true });
    }
  }

  // =============================================
  //  2. ENHANCED STAGGER REVEAL (scroll-storytelling)
  //  Sostituisce il semplice fade-in con animazioni
  //  più drammatiche per elementi specifici.
  // =============================================
  if (!reducedMotion) {

    // Stagger per gli item figli di un container [data-stagger]
    var staggerContainers = document.querySelectorAll('[data-stagger]');
    staggerContainers.forEach(function (container) {
      var items = Array.from(container.children);
      var delay = parseInt(container.getAttribute('data-stagger-delay') || '70', 10);

      // Imposta stato iniziale
      items.forEach(function (item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(32px) scale(0.94)';
        item.style.transition = 'opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)';
      });

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            items.forEach(function (item, i) {
              setTimeout(function () {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0) scale(1)';
              }, i * delay);
            });
            io.unobserve(container);
          }
        });
      }, { threshold: 0.1 });

      io.observe(container);
    });

    // Reveal da sinistra per elementi .reveal-left
    document.querySelectorAll('.reveal-left').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-40px)';
      el.style.transition = 'opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)';
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
          io.unobserve(el);
        }
      }, { threshold: 0.15 });
      io.observe(el);
    });

    // Reveal da destra per elementi .reveal-right
    document.querySelectorAll('.reveal-right').forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      el.style.transition = 'opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1)';
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
          io.unobserve(el);
        }
      }, { threshold: 0.15 });
      io.observe(el);
    });
  }

  // =============================================
  //  3. COUNT-UP PREZZO HERO
  // =============================================
  var priceEl = document.getElementById('heroPriceMin');
  if (priceEl && !reducedMotion) {
    var text = priceEl.textContent;
    var match = text.match(/\d+/);
    if (match) {
      var target = parseInt(match[0], 10);
      var startTime = null;
      var duration = 1400;

      function countUp(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        priceEl.textContent = 'DA ' + Math.round(eased * target) + '€';
        if (progress < 1) requestAnimationFrame(countUp);
      }

      // Parte dopo un breve delay (hero entra in scena)
      setTimeout(function () { requestAnimationFrame(countUp); }, 500);
    }
  }

  // =============================================
  //  4. MAGNETIC BUTTONS (motion-micro)
  // =============================================
  if (!reducedMotion) {
    document.querySelectorAll('.btn-gold, .btn-navy').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) * 0.28;
        var dy = (e.clientY - cy) * 0.28;
        btn.style.transform = 'translateY(-3px) translate(' + dx + 'px, ' + dy + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        // Spring back: rimuovi l'inline style e lascia agire il CSS
        btn.style.transform = '';
      });
    });
  }

  // =============================================
  //  5. 3D CARD TILT su hover (motion-micro)
  // =============================================
  if (!reducedMotion) {
    var allCards = document.querySelectorAll('.dest-card');

    allCards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        var tiltX = dy * -7;
        var tiltY = dx * 7;
        card.style.transform =
          'scale(1.035) translateY(-5px) perspective(700px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  // =============================================
  //  6. FEATURE ICON BOUNCE on hover (motion-micro)
  // =============================================
  if (!reducedMotion) {
    document.querySelectorAll('.feature-icon').forEach(function (icon) {
      var parent = icon.parentElement;
      parent.addEventListener('mouseenter', function () {
        icon.style.animation = 'none';
        // Force reflow
        void icon.offsetWidth;
        icon.style.animation = 'skappa-icon-bounce 0.45s cubic-bezier(0.22,1,0.36,1)';
      });
    });
  }

  // =============================================
  //  7. SCROLL PROGRESS BAR
  // =============================================
  var progressBar = document.getElementById('skappaScrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      var pct = (window.scrollY / total * 100).toFixed(1);
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  // =============================================
  //  8. NAVBAR: glassmorphism on scroll
  // =============================================
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        navbar.style.backdropFilter = 'blur(10px)';
        navbar.style.webkitBackdropFilter = 'blur(10px)';
        navbar.style.boxShadow = '0 2px 24px rgba(0,0,0,0.22)';
      } else {
        navbar.style.backdropFilter = '';
        navbar.style.webkitBackdropFilter = '';
        navbar.style.boxShadow = '';
      }
    }, { passive: true });
  }

  // =============================================
  //  9. LAST MINUTE BADGE: urgency glow pulse
  //  (aggiunge un alone rosso pulsante attorno
  //   alle card last-minute)
  // =============================================
  document.querySelectorAll('.dest-card-lm').forEach(function (card, i) {
    // Delay staggerato tra card
    setTimeout(function () {
      card.style.animation = 'skappa-lm-glow 3s ease-in-out infinite';
    }, i * 400);
  });

})();
