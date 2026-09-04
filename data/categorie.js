(function (global) {
  'use strict';

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
      inMenu: true
    },
    {
      slug: 'fughe-in-europa',
      nome: 'Fughe in Europa',
      pagina: 'fughe-in-europa.html',
      badgeClass: 'badge-capitali',
      badgeIcona: 'plane',
      badgeHtml: '<svg class="ic"><use href="assets/icons.svg#plane"></use></svg> Europa',
      badgeTesto: 'Europa',
      template: 'viaggio-citybreak.html',
      ordine: 2,
      inMenu: true
    },
    {
      slug: 'last-minute',
      nome: 'Last minute',
      pagina: 'last-minute.html',
      badgeClass: 'badge-estive',
      badgeIcona: 'zap',
      badgeHtml: '⚡ Last Minute',
      badgeTesto: 'Last Minute',
      template: 'viaggio-lastminute.html',
      ordine: 3,
      inMenu: true
    }
  ];
})(window);
