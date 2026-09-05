(function (global) {
  'use strict';

  function hasPrice(destination) {
    var price = Number(destination && destination.prezzo);
    return Number.isFinite(price) && price > 0;
  }

  function priceLabel(destination) {
    return hasPrice(destination) ? destination.prezzo + '€' : 'Su richiesta';
  }

  function canCheckout(destination) {
    return hasPrice(destination) && destination.soloConsulenza !== true
      && Boolean(destination.linkPagamento);
  }

  function canPayDeposit(destination, selectedPrice) {
    var price = selectedPrice === undefined ? Number(destination && destination.prezzo) : Number(selectedPrice);
    var deposit = Number(destination && destination.acconto);
    return canCheckout(destination) && Number.isFinite(price)
      && Number.isFinite(deposit) && deposit > 0 && deposit < price;
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
    canCheckout: canCheckout,
    canPayDeposit: canPayDeposit,
    priceLabel: priceLabel,
    priceMarkup: priceMarkup,
    createOffer: createOffer
  });
})(window);
