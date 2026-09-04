(function (global) {
  'use strict';

  // Le categorie di oggi. La pagina di dettaglio (viaggio.html) legge da qui
  // il tema di colore, il badge e le stringhe SEO: sono indicizzate, non vanno
  // riscritte "per uniformita'".
  global.SKAPPA_CATEGORIE = [
    {
      slug: 'mete-estive',
      nome: 'Mete estive',
      pagina: 'summer-tour.html',
      badgeClass: 'badge-estive',
      badgeIcona: 'wave',
      badgeHtml: '<svg class="ic"><use href="assets/icons.svg#wave"></use></svg> Estate',
      badgeTesto: 'Estate',
      template: 'viaggio.html',
      ordine: 1,
      inMenu: true,
      // Badge mostrato nell'hero della pagina di dettaglio
      badgeDettaglio: '&#9728; Escape Tour',
      // Variabili CSS consumate da .pagina-viaggio in css/style.css
      accento: {
        logoGlow: 'rgba(254,189,65,0.65)',
        badgeBg: 'rgba(254,189,65,0.12)',
        badgeBordo: 'rgba(254,189,65,0.4)',
        badgeTesto: '#febd41',
        badgeAnim: 'none',
        check: 'var(--gold)',
        titolo: 'var(--gold)',
        punto: 'var(--gold)'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Escape Tour con SKAPPA | Da ' + d.prezzo + '€'; },
        descrizioneBreve: function (d) { return 'Escape Tour a ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + ' Alloggio, eventi e supporto inclusi. Da ' + d.prezzo + '€ a persona.'; },
        descrizioneCompleta: function (d) { return 'Escape Tour a ' + d.nome + ' con SKAPPA. ' + d.tagline + ' Alloggio, eventi e supporto inclusi. Da ' + d.prezzo + '€ a persona, partenza da ' + d.partenzaDa + '.'; },
        breadcrumb: 'Escape Tour',
        breadcrumbUrl: '/summer-tour.html',
        nomeSchema: function (d) { return d.nome + ' – Escape Tour SKAPPA'; }
      }
    },
    {
      slug: 'fughe-in-europa',
      nome: 'Fughe in Europa',
      pagina: 'fughe-in-europa.html',
      badgeClass: 'badge-capitali',
      badgeIcona: 'plane',
      badgeHtml: '<svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Europa',
      badgeTesto: 'Europa',
      template: 'viaggio.html',
      ordine: 2,
      inMenu: true,
      badgeDettaglio: '<svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Fuga in Europa',
      accento: {
        logoGlow: 'rgba(40,134,153,0.65)',
        badgeBg: 'rgba(40,134,153,0.15)',
        badgeBordo: 'rgba(40,134,153,0.35)',
        badgeTesto: '#5dd8ec',
        badgeAnim: 'none',
        check: '#5dd8ec',
        titolo: '#5dd8ec',
        punto: '#288699'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – City Break con SKAPPA | Da ' + d.prezzo + '€'; },
        descrizioneBreve: function (d) { return 'Fuga a ' + d.nome + ' organizzata da SKAPPA. ' + (d.tagline || '') + ' Volo A/R e alloggio inclusi. Da ' + d.prezzo + '€ a persona.'; },
        descrizioneCompleta: function (d) { return 'Fuga a ' + d.nome + ' organizzata da SKAPPA. ' + d.tagline + ' Volo A/R e alloggio inclusi. Da ' + d.prezzo + '€ a persona, partenza da ' + d.partenzaDa + '.'; },
        breadcrumb: 'Fughe in Europa',
        breadcrumbUrl: '/fughe-in-europa.html',
        nomeSchema: function (d) { return d.nome + ' – Fuga in Europa SKAPPA'; }
      }
    },
    {
      slug: 'last-minute',
      nome: 'Last minute',
      pagina: 'last-minute.html',
      badgeClass: 'badge-estive',
      badgeIcona: 'zap',
      badgeHtml: '⚡ Last Minute',
      badgeTesto: 'Last Minute',
      template: 'viaggio.html',
      ordine: 3,
      inMenu: true,
      badgeDettaglio: '⚡ Last Minute',
      accento: {
        logoGlow: 'rgba(239,68,68,0.65)',
        badgeBg: 'rgba(220,38,38,0.15)',
        badgeBordo: 'rgba(220,38,38,0.4)',
        badgeTesto: '#fca5a5',
        badgeAnim: 'pulse-badge 2s infinite',
        check: 'var(--gold)',
        titolo: 'var(--lm-red)',
        punto: '#ef4444'
      },
      seo: {
        titolo: function (d) { return 'Last Minute ' + d.nome + ' – SKAPPA | Solo ' + d.prezzo + '€'; },
        descrizioneBreve: function (d) { return 'Offerta last minute a ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + ' Solo ' + d.prezzo + '€ a persona, posti limitati. Prenota subito prima che scada!'; },
        descrizioneCompleta: function (d) { return 'Offerta last minute a ' + d.nome + ' con SKAPPA. ' + d.tagline + ' Solo ' + d.prezzo + '€ a persona, posti limitati. Prenota subito prima che scada!'; },
        breadcrumb: 'Last Minute',
        breadcrumbUrl: '/last-minute.html',
        nomeSchema: function (d) { return d.nome + ' – Last Minute SKAPPA'; }
      }
    }
  ];
})(window);
