(function () {
  'use strict';

  var page = document.body;
  var categorySlug = page && page.getAttribute('data-category');
  if (!categorySlug || !window.SkappaCatalog) return;

  var settings = {
    'mercatini-natale': {
      code: 'XMAS / 01', route: 'NAP → EUR', hero: 'assets/foto/praga/hero.webp',
      empty: 'Le prossime partenze natalizie stanno per essere annunciate.'
    },
    europa: {
      code: 'EU / 02', route: 'NAP → EU', hero: 'assets/foto/parigi/hero.webp',
      empty: 'Le prossime fughe europee stanno per essere annunciate.'
    },
    'mare-sole': {
      code: 'SUN / 03', route: 'NAP → SEA', hero: 'assets/foto/tenerife/hero.webp',
      empty: 'Le prossime destinazioni mare stanno per essere annunciate.'
    },
    intercontinentali: {
      code: 'WORLD / 04', route: 'NAP → WLD', hero: 'assets/foto/new-york/hero.webp',
      empty: 'Le prossime rotte intercontinentali stanno per essere annunciate.'
    }
  }[categorySlug];
  if (!settings) return;

  var destinations = SkappaCatalog.perCategoria(categorySlug);
  var grid = document.getElementById('catalogGrid');
  var empty = document.getElementById('catalogEmpty');
  var count = document.getElementById('catalogCount');
  var minPrice = document.getElementById('catalogMinPrice');
  var code = document.getElementById('catalogCode');
  var route = document.getElementById('catalogRoute');
  var media = document.getElementById('catalogHeroMedia');

  if (code) code.textContent = settings.code;
  if (route) route.textContent = settings.route;
  if (media) media.style.backgroundImage = 'url("' + settings.hero + '")';
  if (count) count.textContent = String(destinations.length).padStart(2, '0');

  var numericPrices = destinations.map(function (destination) {
    return Number(destination.prezzo);
  }).filter(function (price) { return Number.isFinite(price) && price > 0; });
  if (minPrice) minPrice.textContent = numericPrices.length
    ? 'da ' + Math.min.apply(null, numericPrices) + '€'
    : 'su richiesta';

  if (!destinations.length) {
    if (empty) {
      empty.textContent = settings.empty;
      empty.style.display = 'block';
    }
    return;
  }

  grid.innerHTML = destinations.map(function (destination, index) {
    return SkappaCatalog.buildCard(destination, { contesto: 'grid', indice: index });
  }).join('');

  var structuredData = document.createElement('script');
  structuredData.type = 'application/ld+json';
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: (SkappaCatalog.categoria(categorySlug) || {}).nome + ' SKAPPA',
    numberOfItems: destinations.length,
    itemListElement: destinations.map(function (destination, index) {
      return {
        '@type': 'ListItem', position: index + 1, name: destination.nome,
        url: 'https://skappa.it/' + SkappaCatalog.urlDettaglio(destination)
      };
    })
  });
  document.head.appendChild(structuredData);
})();
