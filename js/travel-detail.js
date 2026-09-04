(function (global) {
  'use strict';

  function hasPrice(destination) {
    var price = Number(destination && destination.prezzo);
    return Number.isFinite(price) && price > 0;
  }

  function priceLabel(destination) {
    return hasPrice(destination) ? destination.prezzo + '€' : 'Su richiesta';
  }

  function priceMarkup(destination) {
    return hasPrice(destination)
      ? '<span class="pacchetto-euro">€</span>' + destination.prezzo
      : 'Su richiesta';
  }

  function createOffer(destination, pageUrl) {
    if (!hasPrice(destination)) return undefined;
    return {
      '@type': 'Offer',
      price: String(destination.prezzo),
      priceCurrency: 'EUR',
      url: destination.linkPagamento || pageUrl,
      availability: 'https://schema.org/InStock'
    };
  }

  global.SkappaTravel = Object.freeze({
    hasPrice: hasPrice,
    priceLabel: priceLabel,
    priceMarkup: priceMarkup,
    createOffer: createOffer
  });
})(window);
