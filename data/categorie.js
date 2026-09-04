(function (global) {
  'use strict';

  function prezzoTitolo(d) {
    return d.prezzo ? ' | Da ' + d.prezzo + '€' : '';
  }

  function prezzoDescrizione(d) {
    return d.prezzo ? ' Da ' + d.prezzo + '€ a persona.' : ' Quotazione personalizzata su richiesta.';
  }

  function categoria(config) {
    return Object.assign({
      template: 'viaggio.html', inMenu: true, badgeClass: 'badge-capitali', badgeIcona: 'compass'
    }, config);
  }

  global.SKAPPA_CATEGORIE = [
    categoria({
      slug: 'mercatini-natale', nome: 'Mercatini di Natale', pagina: 'mercatini-natale.html',
      ordine: 1, tema: 'natale', badgeHtml: '✦ Mercatini di Natale',
      badgeTesto: 'Mercatini di Natale', badgeDettaglio: '✦ Speciale Natale',
      accento: {
        logoGlow: 'rgba(201,45,67,0.68)', badgeBg: 'rgba(201,45,67,0.16)',
        badgeBordo: 'rgba(245,196,94,0.42)', badgeTesto: '#f5c45e', badgeAnim: 'none',
        check: '#f5c45e', titolo: '#f5c45e', punto: '#c92d43'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Mercatini di Natale con SKAPPA' + prezzoTitolo(d); },
        descrizioneBreve: function (d) { return 'Vivi i mercatini di Natale di ' + d.nome + ' con SKAPPA.' + prezzoDescrizione(d); },
        descrizioneCompleta: function (d) { return 'Viaggio ai mercatini di Natale di ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + prezzoDescrizione(d); },
        breadcrumb: 'Mercatini di Natale', breadcrumbUrl: '/mercatini-natale.html',
        nomeSchema: function (d) { return d.nome + ' – Mercatini di Natale SKAPPA'; }
      }
    }),
    categoria({
      slug: 'europa', nome: 'Europa', pagina: 'europa.html', ordine: 2, tema: 'europa',
      badgeHtml: '<svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Europa',
      badgeTesto: 'Europa', badgeDettaglio: '<svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Fuga in Europa',
      badgeIcona: 'plane',
      accento: {
        logoGlow: 'rgba(40,134,153,0.65)', badgeBg: 'rgba(40,134,153,0.15)',
        badgeBordo: 'rgba(40,134,153,0.35)', badgeTesto: '#5dd8ec', badgeAnim: 'none',
        check: '#5dd8ec', titolo: '#5dd8ec', punto: '#288699'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Viaggio in Europa con SKAPPA' + prezzoTitolo(d); },
        descrizioneBreve: function (d) { return 'Scopri ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + prezzoDescrizione(d); },
        descrizioneCompleta: function (d) { return 'Viaggio a ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + prezzoDescrizione(d); },
        breadcrumb: 'Europa', breadcrumbUrl: '/europa.html',
        nomeSchema: function (d) { return d.nome + ' – Europa SKAPPA'; }
      }
    }),
    categoria({
      slug: 'mare-sole', nome: 'Mare & Sole', pagina: 'mare-sole.html', ordine: 3, tema: 'mare',
      badgeHtml: '<svg class="ic"><use href="assets/icons.svg#wave"></use></svg> Mare &amp; Sole',
      badgeTesto: 'Mare & Sole', badgeDettaglio: '☀ Mare &amp; Sole', badgeIcona: 'wave',
      accento: {
        logoGlow: 'rgba(254,189,65,0.65)', badgeBg: 'rgba(254,189,65,0.12)',
        badgeBordo: 'rgba(254,189,65,0.4)', badgeTesto: '#febd41', badgeAnim: 'none',
        check: 'var(--gold)', titolo: 'var(--gold)', punto: '#e8754f'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Mare e sole con SKAPPA' + prezzoTitolo(d); },
        descrizioneBreve: function (d) { return 'Parti per ' + d.nome + ' con SKAPPA: mare, sole e assistenza.' + prezzoDescrizione(d); },
        descrizioneCompleta: function (d) { return 'Vacanza mare e sole a ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + prezzoDescrizione(d); },
        breadcrumb: 'Mare & Sole', breadcrumbUrl: '/mare-sole.html',
        nomeSchema: function (d) { return d.nome + ' – Mare e sole SKAPPA'; }
      }
    }),
    categoria({
      slug: 'intercontinentali', nome: 'Intercontinentali', pagina: 'intercontinentali.html',
      ordine: 4, tema: 'orizzonti', badgeHtml: '◇ Intercontinentali',
      badgeTesto: 'Intercontinentali', badgeDettaglio: '◇ Oltre l’Europa',
      accento: {
        logoGlow: 'rgba(123,92,255,0.62)', badgeBg: 'rgba(123,92,255,0.14)',
        badgeBordo: 'rgba(125,226,255,0.34)', badgeTesto: '#7de2ff', badgeAnim: 'none',
        check: '#7de2ff', titolo: '#b8a8ff', punto: '#7b5cff'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Viaggio intercontinentale SKAPPA' + prezzoTitolo(d); },
        descrizioneBreve: function (d) { return 'Scopri ' + d.nome + ' con un viaggio SKAPPA oltre l’Europa.' + prezzoDescrizione(d); },
        descrizioneCompleta: function (d) { return 'Viaggio intercontinentale a ' + d.nome + ' con SKAPPA. ' + (d.tagline || '') + prezzoDescrizione(d); },
        breadcrumb: 'Intercontinentali', breadcrumbUrl: '/intercontinentali.html',
        nomeSchema: function (d) { return d.nome + ' – Intercontinentale SKAPPA'; }
      }
    }),
    categoria({
      slug: 'viaggi-di-nozze', nome: 'Viaggi di nozze', pagina: 'viaggi-di-nozze.html',
      ordine: 5, tema: 'luna-di-miele', badgeHtml: '♡ Viaggi di nozze',
      badgeTesto: 'Viaggi di nozze', badgeDettaglio: '♡ Su misura per voi',
      accento: {
        logoGlow: 'rgba(222,139,160,0.6)', badgeBg: 'rgba(222,139,160,0.14)',
        badgeBordo: 'rgba(246,211,185,0.38)', badgeTesto: '#f6d3b9', badgeAnim: 'none',
        check: '#f6d3b9', titolo: '#f2b8c6', punto: '#de8ba0'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Viaggio di nozze su misura | SKAPPA'; },
        descrizioneBreve: function (d) { return 'Progettiamo il vostro viaggio di nozze a ' + d.nome + ' con una consulenza dedicata.'; },
        descrizioneCompleta: function (d) { return 'Viaggio di nozze su misura a ' + d.nome + ' con consulenza SKAPPA dedicata.'; },
        breadcrumb: 'Viaggi di nozze', breadcrumbUrl: '/viaggi-di-nozze.html',
        nomeSchema: function (d) { return d.nome + ' – Viaggio di nozze SKAPPA'; }
      }
    }),
    categoria({
      slug: 'crociere', nome: 'Crociere', pagina: 'crociere.html', ordine: 6, tema: 'crociere',
      badgeHtml: '≈ Crociere', badgeTesto: 'Crociere', badgeDettaglio: '≈ Rotte SKAPPA',
      accento: {
        logoGlow: 'rgba(46,168,196,0.62)', badgeBg: 'rgba(46,168,196,0.14)',
        badgeBordo: 'rgba(142,224,229,0.38)', badgeTesto: '#8ee0e5', badgeAnim: 'none',
        check: '#8ee0e5', titolo: '#8ee0e5', punto: '#2ea8c4'
      },
      seo: {
        titolo: function (d) { return d.nome + ' – Crociera con SKAPPA' + prezzoTitolo(d); },
        descrizioneBreve: function (d) { return 'Scopri la crociera ' + d.nome + ' con SKAPPA.' + prezzoDescrizione(d); },
        descrizioneCompleta: function (d) { return 'Crociera ' + d.nome + ' selezionata da SKAPPA.' + prezzoDescrizione(d); },
        breadcrumb: 'Crociere', breadcrumbUrl: '/crociere.html',
        nomeSchema: function (d) { return d.nome + ' – Crociera SKAPPA'; }
      }
    })
  ];
})(window);
