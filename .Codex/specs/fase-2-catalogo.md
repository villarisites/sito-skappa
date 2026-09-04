# Spec: Fase 2 — catalogo, foto e pagine categoria
Status: APPROVED
Created: 2026-09-04

## Goal

Sostituire il catalogo concluso con 27 mete in 6 categorie, mantenendo i contenuti ricchi delle
6 mete riusate e rendendo dati, pagine e navigazione rigenerabili da fonti uniche.

## Non-goals

- Non costruire l'hero "Il Volo SKAPPA" (Fase 3).
- Non rimuovere il redirect WIP o il `noindex` della pagina di attesa (Fase 4).
- Non eliminare o ricomprimere gli asset legacy (Fase 4).
- Non inventare prezzi: vengono compilati da Francesco in `data/catalogo.csv`.
- Non scrivere attività, FAQ o recensioni per le 21 mete leggere.

## Acceptance Criteria

- [x] AC1 — `data/catalogo.csv` contiene esattamente 27 ID unici e le colonne
  `id;nome;categorie;prezzo;durata;partenzaDa;date;hotel;tagline`; le categorie multiple sono
  serializzate in modo non ambiguo.
- [x] AC2 — `npm run build:catalog` valida ID, categorie e prezzo numerico; con prezzi mancanti
  fallisce senza modificare `data/destinations.js` e indica tutte le righe da completare.
- [x] AC3 — Con un CSV valido, il build produce 27 destinazioni e preserva integralmente attività,
  FAQ, recensioni, Stripe e altri contenuti ricchi di Budapest, Parigi, Bucarest, Barcellona,
  Sofia e Londra.
- [x] AC4 — Le altre 8 mete attuali sono rimosse dal catalogo attivo e conservate in
  `data/archivio.js`, che nessuna pagina pubblica carica.
- [ ] AC5 — Ogni meta nuova ha `hero.webp` (1920px, q82), `card.webp` (840px, q82) e
  `card-sm.webp` (320px, q72) in `assets/foto/<slug>/`; le 6 mete riusate mantengono gli asset
  esistenti e tutte le immagini risultano leggibili dal browser.
- [x] AC6 — `data/categorie.js` descrive le 6 categorie finali e costituisce la fonte unica per
  nome, ordine, pagina, badge, tema e presenza nel menu.
- [x] AC7 — Esistono le pagine `mercatini-natale.html`, `europa.html`, `mare-sole.html` e
  `intercontinentali.html`; ciascuna mostra esattamente le mete della categoria tramite
  `SkappaCatalog`, inclusi i casi di appartenenza multipla.
- [x] AC8 — `viaggi-di-nozze.html` non mostra prezzi e offre una CTA "Prenota una consulenza";
  `crociere.html` mostra lo stato "in arrivo" e invia il form Formspree con `tipo=crociere`.
- [x] AC9 — `offerte.html` mostra solo mete con offerta attiva e scadenza futura; sostituisce
  funzionalmente `last-minute.html`.
- [x] AC10 — La navbar desktop e mobile espone Home, Destinazioni (le 6 categorie), Offerte,
  Chi siamo e Contatti; l'elenco categorie viene generato da `data/categorie.js` durante la build
  statica dei partial e non e' duplicato nelle pagine.
- [x] AC11 — `admin.html` usa checkbox per `categorie[]`, gestisce `offerta` e
  `soloConsulenza`, e continua a esportare un `destinations.js` valido per lo schema nuovo.
- [x] AC12 — I redirect permanenti coprono le tre vecchie pagine categoria e gli 8 ID archiviati;
  le regole WIP restano prime e attive fino alla Fase 4.
- [x] AC13 — `sitemap.xml` non contiene mete archiviate o `praga-lastminute`; contiene le nuove
  pagine indicizzabili e i 27 URL canonici `viaggio.html?id=<slug>`.
- [ ] AC14 — Build e regressioni: `build:catalog`, `build:pages` e `build:css` passano; le 6 mete
  riusate conservano testi, CTA, SEO e contenuti ricchi; nessuna pagina nuova genera errori JS.

## Data Model Changes

- `tipologia` cessa di essere la fonte: `categorie: string[]` e' obbligatorio nel catalogo nuovo.
- `offerta` ha forma `{ prezzoOriginale, scadenza, attiva? }`.
- `soloConsulenza: true` forza la CTA consulenza e nasconde il checkout.
- Le mete leggere possono omettere `attivita`, `faq` e `recensioni`; il template unico le nasconde.
- `data/archivio.js` conserva gli 8 oggetti rimossi senza essere caricato dal frontend.

## API Contract

Solo build locale e file statici:

- Input: `data/catalogo.csv`, separatore `;`, UTF-8.
- Output: `data/destinations.js` con assegnazione a `window.DESTINATIONS`.
- In caso di validazione fallita: exit code non zero, elenco completo degli errori, output esistente
  lasciato intatto.

## Dependencies

- Fasi 0 e 1 (`8fd52ac`, `0d821ba`).
- Node.js e `sharp` già presenti.
- Formspree `xlgpwjlj` e CSP esistente.
- Foto selezionate esclusivamente da Unsplash o Pexels.
- Compilazione dei prezzi da parte di Francesco prima della build finale del catalogo.

## Decisions

- Le 27 mete uniche sono: Praga, Monaco di Baviera, Vienna, Budapest, Parigi, Bucarest,
  Barcellona, Sofia, Londra, Madrid, Siviglia, Cracovia, Lisbona, Valencia, Amsterdam, Berlino,
  Tenerife, Sharm el-Sheikh, Marrakech, Hurghada, Dubai, New York, Los Angeles, Maldive, Messico,
  Thailandia e Giappone.
- `mercatini-natale` e' un sottoinsieme sovrapposto a `europa`; le 4 mete dei mercatini appartengono
  a entrambe le categorie.
- Le 6 mete con contenuti da riusare sono Budapest, Parigi, Bucarest, Barcellona, Sofia e Londra.
- Le 8 mete archiviate sono Gallipoli, Ibiza, Lloret de Mar, Malta, Mykonos, Tirana, Varsavia e Zante.

## Open Questions

- Nessuna decisione di prodotto bloccante: tassonomia, fonti foto, CTA e comportamento pagine sono
  già approvati nel piano generale.
- Input operativo ancora mancante: prezzi (e, dove disponibili, durata/partenza/date/hotel/tagline)
  da compilare nel CSV che verrà predisposto dopo l'approvazione di questa spec.
