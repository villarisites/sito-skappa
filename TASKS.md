# TASKS — skappa.it

## 2026-09-04 (notte) — Fase 1 IMPLEMENTATA e verificata

I tre template di dettaglio sono stati unificati in `viaggio.html`; i due file legacy sono stati
eliminati e hanno redirect 301 permanenti. Il render sceglie tema, SEO e comportamento dai dati.

- [x] `viaggio-citybreak.html` e `viaggio-lastminute.html` eliminati
- [x] CSS dei dettagli spostato in `css/style.css`, interamente sotto `.pagina-viaggio`
- [x] Tema per categoria: oro, teal e rosso, incluso il bagliore corretto del logo
- [x] SEO per categoria centralizzata in `data/categorie.js`; un solo blocco SEO in `<head>`
- [x] Selettore aeroporto, countdown futuro, sconto e `priceValidUntil` guidati dai dati
- [x] CTA: checkout, preventivo o consulenza secondo `linkPagamento` / `soloConsulenza`
- [x] Attivita', FAQ e recensioni vuote non lasciano sezioni vuote
- [x] `admin.html`, `sitemap.xml` e template di categoria allineati a `viaggio.html`
- [x] Redirect 301 aggiunti dopo il blocco WIP; la query string e' preservata dai redirect 301

**Verifica browser Playwright:** 14 destinazioni e 4 listing confrontati con il baseline,
0 differenze e 0 errori JS. Passano anche fixture per preventivo, consulenza, Last Minute,
scadenza passata/futura e sezioni vuote. `npm run build:pages` eseguito due volte: tutto invariato.
`verify-cards.cjs`: 28 card, 0 differenze. Dettaglio in `.ai-handoff/CLAUDE_REVIEW_fase1.md`.

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Fondamenta | **FATTA** |
| 1 | Template di dettaglio unico | **FATTA** |
| 2 | Tassonomia nuova (6 categorie, 27 mete), foto, pagine categoria | prossima |
| 3 | Hero "Il Volo SKAPPA" | da fare |
| 4 | Pulizia peso + uscita dal WIP | da fare |

## 2026-09-04 (sera) — Fase 0 IMPLEMENTATA e verificata

Fondamenta pronte. Il sito e' equivalente a prima, con tre eccezioni dichiarate (tutte migliorie).

- [x] `partials/nav.html` + `overlays.html` + `footer.html`; `scripts/build-pages.mjs` + `npm run build:pages`
- [x] Tutte e 13 le pagine con navbar passano dai partial (marcatori `<!--#partial ...-->`), build idempotente
- [x] `js/catalog.js` (`window.SkappaCatalog`) + `data/categorie.js`, inclusi in tutte e 13 le pagine
- [x] `buildCard` unica nel repo: card di home, europa, summer e last-minute provate **byte-identiche** (32 confronti, 0 differenze)
- [x] Ricerca centralizzata in `main.js` -> `SkappaCatalog`; JSON-LD e filtri passano dal catalogo
- [x] `categorie[]` scritto nei 14 oggetti di `data/destinations.js` (`tipologia` mantenuta), `admin.html` allineato
- [x] Verificato in browser reale: 5 pagine, zero errori JS di pagina

**Differenze visibili volute** (normalizzazione verso `index.html`, era gia' nel piano):
`width`/`height` su logo e immagine footer (fix CLS che avevano solo la home), `title="Cerca"`,
`aria-current="page"`, e il bottone di ricerca mobile aggiunto a `chi-siamo` e ai 3 `viaggio*`.

**Bug preesistente corretto:** su `fughe-in-europa`, `summer-tour` e `last-minute` c'era un secondo
IIFE di ricerca inline oltre a quello di `main.js`: i due handler si annullavano e **il bottone
cerca non apriva nulla**. Rimosso il duplicato.

**Percorso:** Codex (`task-mtn7j8pu-wx2iak`) ha fatto partial + catalog + admin + 5 pagine legali,
poi si e' fermato su ACL NTFS che negano la scrittura a `CodexSandboxUsers` su 10 file. Il resto
l'ho completato io su richiesta. Sblocco pronto in `scratchpad/sblocca-acl-codex.ps1` (serve un
PowerShell come amministratore) se si vuole tornare a usare Codex su questo repo.

Dettaglio completo in `.ai-handoff/CLAUDE_REVIEW.md`. **Non ancora committato.**

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Fondamenta | **FATTA** |
| 1 | Unificare i 3 template `viaggio*.html` in uno | prossima |
| 2 | Tassonomia nuova (6 categorie, 27 mete), foto, pagine categoria | da fare |
| 3 | Hero "Il Volo SKAPPA" | da fare |
| 4 | Pulizia peso + uscita dal WIP | da fare |

# TASKS — skappa.it

## 2026-09-04 — Approvato il rifacimento in 4 fasi (Fase 0 pianificata, non implementata)

**Nessuna modifica al sito.** Toccati solo `.gitignore` e questo file; tutto il resto e' materiale
di lavoro non pubblicato.

Il catalogo va ricostruito da zero: 27 mete nuove in 6 categorie, piu' un hero "Il Volo SKAPPA"
(aereo con oblo' che scorrono le mete, e all'apertura di una meta la porta si apre sulla destinazione).
Il punto di ripresa autorevole e' **`NEXT_SESSION.md`** in root — leggerlo prima di agire.
Piano completo in `~/.claude/plans/dobbiamo-modificare-il-sito-noble-micali.md`.

| Fase | Contenuto | Stato |
|---|---|---|
| 0 | Fondamenta: partial nav/footer + `scripts/build-pages.mjs`, `js/catalog.js`, `data/categorie.js`, `categorie[]` al posto di `tipologia` | pianificata |
| 1 | Unificare i 3 template `viaggio*.html` in uno | da fare |
| 2 | Tassonomia nuova, foto, pagine categoria | da fare |
| 3 | Hero "Il Volo SKAPPA" (CSS/JS puro, niente 3D) | da fare |
| 4 | Pulizia peso + uscita dal WIP | da fare |

- [x] `.gitignore` — aggiunti `.ai-handoff/` e `NEXT_SESSION.md` (mai committare ne' pubblicare)
- [x] Handoff Fase 0 scritto: `.ai-handoff/REQUEST.md`, `.ai-handoff/CLAUDE_PLAN.md`
- [x] **Riparato il plugin Codex.** `claude plugin list` dava
      `codex@openai-codex ✘ failed to load — Marketplace openai-codex not found`: la dichiarazione in
      `~/.claude/settings.json` aveva una sorgente ibrida github+`path` locale non piu' valida.
      Rimosso e ricreato il marketplace, reinstallato il plugin. **Si registra al riavvio della sessione.**
- [ ] **Implementare la Fase 0** (via `codex:codex-rescue`, handoff gia' pronto)
- [ ] **Serve a Francesco:** compilare i prezzi in `data/catalogo.csv` (nasce in Fase 2).
      E' l'unico blocco esterno, tutto il resto procede senza.

### Due verifiche fatte, da non ripetere

- **`assets/preventivi/` non e' esposto.** `git ls-files | grep preventiv` -> solo
  `preventivi-manager.html`; `git log --all -- 'assets/preventivi*'` -> vuoto. E' gitignored, non e'
  mai entrato nella storia, Netlify non lo pubblica. **Nessun history purge da fare.**
- **Peso reale deployato: 138 MB** (`git ls-files | xargs du -bc`). I `.zip`/`.mp4` sono gia'
  gitignored: il grasso pubblicato sono i `hero.png|jpg` sorgente ancora tracciati
  (budapest 37 MB, mykonos 15 MB, `utility/sfondo hero.png` 5,1 MB) e la cartella `img/` legacy.
  Servite davvero e da ricomprimere: `parigi/activity-2.webp` 5,1 MB, `sofia/activity-2.webp` 3,4 MB.


## 2026-08-29 — Il link WhatsApp non aveva il prefisso paese

**Non ancora deployato.** Riguarda tutto il sito, non solo la pagina di attesa.

Il numero SKAPPA e' **393 030 6294**: dieci cifre, prefisso mobile italiano `393`, quindi valido.
Nei link mancava pero' il prefisso internazionale. `wa.me` vuole il formato E.164 senza `+`, cioe'
**39 (Italia) + il numero**: il valore giusto e' `393930306294`. Il doppio `39` iniziale e' corretto
e non e' un refuso — e' la ragione per cui a prima vista sembrava un numero troppo corto.

- [x] `js/main.js` riga 58 — `SKAPPA_WA_NUMBER`, da cui dipende il **pulsante WhatsApp flottante
      di tutte le pagine** che caricano main.js (13 pagine)
- [x] `viaggio.html`, `viaggio-citybreak.html`, `viaggio-lastminute.html` — il link
      "PRENOTA CON ACCONTO", dove il numero era **hardcoded** invece di usare la costante
- [x] `wip.html` — la costante in cima allo script
- [x] Commenti aggiornati in `main.js` e `wip.html`: spiegano perche' il doppio `39` e' giusto,
      cosi' nessuno lo "corregge" togliendolo

**Verifica: non conclusiva, ed e' bene saperlo.** `wa.me` non valida il numero lato server —
restituisce la stessa pagina sia per `3930306294` sia per `393930306294`, quindi da riga di comando
non si distingue un numero buono da uno rotto. La correzione e' giusta per la regola del formato,
ma l'unica prova vera e' **aprire il link una volta da un telefono con WhatsApp installato**.

- [ ] Aprire `https://wa.me/393930306294` da telefono e verificare che apra la chat SKAPPA.
- [ ] **Il numero resta duplicato in 5 punti.** Le 3 pagine viaggio non possono usare la costante
      di `main.js` senza rischi: main.js e' caricato con `defer`, il loro script inline gira prima.
      Da centralizzare solo insieme a un riordino degli script, non da soli.


## 2026-08-29 — La pagina di attesa smette di dire "sito rotto"

**Non ancora deployato.** Modificati `wip.html` e `netlify.toml`; backup di `wip.html` in
`D:\temp\claude\...\scratchpad\wip.html.bak` (ma la fonte autorevole resta git: `git checkout HEAD -- wip.html`).

### Perché

Ogni riga della pagina aveva come soggetto **il sito**, non il viaggio: `<title>` "Stiamo arrivando",
badge "Sito in costruzione", barra di caricamento animata, "stiamo mettendo a punto gli ultimi
dettagli". Il visitatore leggeva "l'azienda non è pronta", mentre la verità è l'opposto — i viaggi
vecchi sono finiti e se ne stanno costruendo di nuovi. Una notizia buona raccontata come un guasto.

### Cosa è cambiato

- [x] **Soggetto spostato dal sito al viaggio.** H1: *"Non trovi viaggi perché li stiamo scegliendo"*.
      Risponde alla domanda che il visitatore ha in testa e trasforma l'attesa in prova di qualità.
      Badge da "Sito in costruzione" a "Prossime partenze"; `<title>` "SKAPPA – Le prossime partenze".
- [x] **Riferimento temporale**: "le nuove partenze arrivano in **autunno**". Stagione, non data
      precisa — scelta di Francesco. ⚠️ **Una parola sola da confermare**: se la stagione giusta è
      un'altra, si cambia `autunno` nel lead e nella `<meta name="description">`.
- [x] **I 4 pilastri del sito vero** (volo A/R, alloggio selezionato, prezzo fisso, assistenza h24)
      portati in pagina: dicono cosa si compra anche mentre non c'è niente da comprare.
- [x] **Raccolta contatti** — prima ogni visita era persa, c'era solo un `mailto:`.
      Campo email + WhatsApp come alternativa secondaria.
- [x] **Tolta la barra di avanzamento animata**: è il segnale visivo di "sto caricando / sono rotto"
      e contraddiceva il messaggio.
- [x] Aggiunto uno **scrim radiale** dietro il testo: il lembo illuminato della Terra nello sfondo
      passa esattamente dietro il lead e ne mangiava il contrasto.

### Scelte tecniche, con il motivo

- **Formspree, non Netlify Forms.** Netlify Forms andrebbe a sbattere contro il redirect
  `/* → /wip.html` con `force = true` in `netlify.toml`. Formspree (`xlgpwjlj`) è già usato dai due
  form di `index.html` ed è **già autorizzato dalla CSP** (`connect-src ... https://formspree.io`):
  zero modifiche a `netlify.toml`.
- **Invio via `fetch` con fallback.** Se il fetch fallisce, il form resta un POST normale verso
  Formspree: nessuna iscrizione va persa. Esito annunciato con `role="status"` `aria-live="polite"`.
- **Campo esca `_gotcha`** per i bot, fuori schermo e `aria-hidden`.
- **Il link WhatsApp parte come `mailto:`** e viene riscritto dal JS: senza JS resta un contatto valido.

### Verificato in locale (server su 127.0.0.1:8791, misure dal DOM)

| Viewport | Contenuto | Scroll Y | Scroll X | CTA sopra la piega |
|---|---|---|---|---|
| 1536×695 | 695 | no | no | sì |
| 1280×720 | 720 | no | no | sì |
| 768×1024 | 1024 | no | no | sì |
| 414×896 | 896 | no | no | sì |
| 390×844 | 844 | no | no | sì |
| 360×640 | 745 | **sì** | no | sì |

Un solo `<h1>`. Bottone 46px di altezza (sopra i 44 del target touch) e a piena larghezza sotto i 420px.
Su 360×640 — telefono piccolo e vecchio — il footer con WhatsApp/email richiede un piccolo scroll,
ma la CTA resta sopra la piega: accettabile.

Il primo giro sforava di 65px su portatile: risolto con una `@media (max-height:820px)` che stringe
logo e spaziature, invece di comprimere anche gli schermi alti.

### Da fare

- [x] **Numero WhatsApp corretto in tutti e 5 i punti** (vedi la sezione in cima al file).
- [ ] **Confermare la stagione** ("autunno") o cambiarla.
- [ ] **Prova di invio reale** dopo il deploy: compilare il form e verificare che la mail arrivi
      dalla casella Formspree. `tipo=lista-attesa-wip` distingue queste iscrizioni dalle altre due.
- [ ] ⏳ **`noindex, nofollow` ha una scadenza.** Va bene per settimane; se resta mesi Google toglie
      skappa.it dall'indice e al lancio si riparte da zero sul proprio stesso nome.
      Da togliere insieme ai redirect WIP in `netlify.toml`.
- [ ] Quando i viaggi nuovi sono pronti: commentare i blocchi `[[redirects]]` fra
      `# ===== WIP / MANUTENZIONE — INIZIO/FINE =====` in `netlify.toml`.
