# TASKS — skappa.it

## 2026-09-05 (pomeriggio) — Flusso "Su richiesta" corretto, cabina rimessa in piedi

Due lavori distinti. Il primo tocca il sito vero, il secondo solo il laboratorio.

### Sito — le mete senza prezzo non sono piu' acquistabili

- [x] **Checkout e acconto seguono il prezzo, non il vecchio link.** Budapest, Parigi,
      Bucarest, Barcellona, Sofia e Londra dicevano "Su richiesta" ma tenevano
      `linkPagamento` e `acconto`: le CTA aprivano ancora Stripe e Budapest calcolava un
      saldo di **-79 EUR**. Ora una regola sola (`canCheckout` / `canPayDeposit` in
      `js/travel-detail.js`) governa CTA, sticky bar, selettore acconto e cambio aeroporto.
- [x] **Le pagine leggere non parlano piu' come un pacchetto gia' pronto.** "Cosa succede
      dopo" racconta il preventivo invece delle istruzioni di pagamento, le sezioni senza
      contenuto spariscono, "Partenza da" senza citta' diventa "Partenza da concordare".
- [x] **Salvataggio admin non distruttivo.** Salvando Praga si perdeva `imgCard` e si
      creavano attivita', FAQ e recensioni vuote. I campi non esposti dall'editor ora si
      conservano.
- [x] **Regressioni aggiunte** su prezzo assente + vecchio checkout + acconto, e sullo
      smoke di browser (CTA che perdono la meta, acconto senza prezzo, imgCard).

### flight-lab — la cabina

Il prototipo era rimasto **a meta'**: markup e CSS nuovi (scroll orizzontale, comandi,
fallback senza JS) senza il JavaScript che li regge. La scena non si accendeva proprio.

- [x] **La prospettiva passa al contenitore che scorre.** Prima stava sulla scena, larga
      quanto tutta la cabina: il punto di fuga scorreva insieme alla parete. Ora l'origine
      resta al centro del viewport e coincide sempre col finestrino che lo scroll-snap
      centra — su qualunque schermo.
- [x] **Mobile.** A 390px i finestrini si sovrapponevano e sotto "Budapest" spuntava
      Vienna. Il passo ora viene dal rapporto vero dell'aereo (53cm fra i finestrini,
      23 di larghezza), non da frazioni della larghezza dello schermo.
- [x] **Due citta' nello stesso finestrino.** Il piano dei mondi a -620px scivolava di
      240px per campata contro un foro di 290: il panorama del vicino entrava in quello
      attivo. Portato a -150, con le tre misure (copertura del foro, copertura a fine
      corsa, non invasione del vicino) calcolate invece che scelte a occhio.
- [x] **Portale.** La navigazione partiva a Flip al 30%: ora `arrivo` e' l'onComplete
      della Flip stessa (verificato: progresso 1 all'arrivo, e **un solo** nodo immagine).
      La corsa della camera ha piu' margine e accelerazione lineare — l'accelerazione la
      dava gia' la prospettiva — quindi la cornice esce con calma invece che in uno scatto.
- [x] **Si entra solo dal finestrino centrato.** Cliccando un vicino la cabina ci si porta
      davanti e aspetta che lo scroll si fermi davvero. Prima si volava dentro un foro e
      si atterrava sulla foto di un altro.
- [x] **Sedili veri, e di profilo** (`assets/flight/seat-side.webp`, generato e
      scontornato) al posto dei gradienti CSS. La camera guarda la fiancata, perpendicolare
      all'asse della fusoliera: i sedili sono rivolti verso la prua, quindi si vedono **di
      lato**. Uno schienale frontale sarebbe corretto solo guardando lungo il corridoio.
      Il passo delle file e' quello vero (76 cm) e **non** coincide con quello dei
      finestrini (53): non si allineano, come in un aereo. La fase e' scelta perche'
      davanti al finestrino centrato ci sia il vuoto fra due file. Il primo piano viene
      tolto dal rendering a fine corsa: a z=+150 arrivava a ridosso della camera, dove la
      scala tende all'infinito.
- [x] **Cielo fuori dalla scena** — il suo `inset` negativo allargava l'area di
      scorrimento di 1665px.

- [x] **Texture della parete.** Non e' la foto incollata: dalla foto si ricava una MAPPA
      DI MATERIALE neutra (grigio medio = nessun effetto) applicata in soft-light, cosi'
      colore e luce restano ai gradienti dell'SVG e l'asset porta solo la grana.
      Lo script `npm run build:cabin-texture -- <foto.png>` trova le fughe misurando le
      colonne piu' scure, ritaglia la zona che non ne contiene (le fughe le disegna gia'
      l'SVG, al passo dei finestrini: averle anche nella piastrella voleva dire due serie
      con spaziature diverse), toglie la luce sottraendo la versione sfocata e specchia il
      risultato in 2x2 perche' i bordi combacino. 512x512, 84 KB.
      Due trappole trovate guardando: il pattern SVG sfuma i bordi della piastrella verso
      il trasparente e disegna una **griglia** sulla parete — si risolve disegnando
      l'immagine mezzo pixel oltre il bordo; e la prima piastrella conteneva le fughe per
      un mio errore nella scelta del ritaglio.

- [x] **Il salto foto -> pagina.** Non era una dissolvenza mancante: la cabina finiva con la
      foto a schermo intero ritagliata al centro, l'hero della meta e' alta **60vh** e
      ritagliata a **center 30%**. Due inquadrature diverse della stessa foto, scambiate di
      colpo. Ora la differenza viene percorsa: `flight-lab/arrivo.html` + `arrivo.js`
      riprendono la foto esattamente dov'era e la ritagliano fino al riquadro dell'hero,
      con l'ombra che entra durante e il contenuto che arriva per ultimo.
      **Misurato:** l'ultimo fotogramma della cabina e il primo dell'arrivo sono identici -
      differenza massima **0** su 1,1 milioni di pixel.
      Restava un fotogramma **nero** fra i due documenti (registrato con screencast CDP a
      1994 ms): la foto era un `<img>` a cui il JS assegnava il `src`, quindi il primo
      disegno del nuovo documento avveniva prima che gsap e `arrivo.js` fossero scaricati.
      Spostata in CSS, scritta dallo script inline nel `<head>`: **0 fotogrammi vuoti su 81**.

- [x] **Il vano del finestrino diventa un asset** (`assets/flight/window-bay.webp`, 50 KB).
      Le cornici disegnate in box-shadow sembravano adesivi appiccicati al muro; ora c'e'
      l'incasso profondo con la guida della tendina. Generato col verde nell'apertura e
      scontornato da `npm run build:cabin-window -- <foto.png>`, che fa tre cose non
      saltabili: **despill** (senza, l'alone verde sul bordo interno si vede sopra una foto
      calda), **misura dell'apertura** (le proporzioni finiscono in `cabin.js`: a occhio
      resta un anello di parete dentro al finestrino), e **ritaglio sulla sola cornice**.
      Quest'ultimo e' il punto: tenendo anche il pannello attorno, l'asset portava con se'
      la luce con cui era stato generato e attorno a ogni finestrino si vedeva un rettangolo
      piu' chiaro. Dove finisce la cornice si **misura** — soglia ricavata dall'immagine,
      perche' con una fissa la grana del pannello la faceva risultare larga quanto tutto.
- [x] **Finestrini ciechi con le tendine abbassate** alle estremita'. Con 5 finestrini per
      schermata restava mezza parete nuda a sinistra: la meta attiva e' centrata e prima di
      lei non c'e' nulla. I ciechi mostravano pero' una toppa di cielo piu' accesa delle
      foto, e la risposta esisteva gia' in un aereo vero: le tendine giu', ad altezze diverse.
- [x] **8 mete, 5 finestrini per schermata.** E un bug trovato dallo smoke, non a occhio:
      le mete erano passate da 3 a 8 nel JS ma non gli `<a>` nell'HTML — cinque destinazioni
      non erano cliccabili e sparivano dal fallback senza JS.

- [x] **L'atterraggio non e' piu' una tendina.** Il passaggio da foto piena a hero con le
      scritte usava `clip-path`: tagliava la foto di netto e il blocco della pagina saliva
      come una lama orizzontale. Ora il bordo basso e' una dissolvenza (maschera a gradiente
      con le tappe animate), l'ombra entra presto e lentamente invece che tutta nell'ultimo
      quarto, e le scritte hanno lo spazio per arrivare una per volta.
- [x] **Il fotogramma vuoto al cambio di documento** e' sceso a uno, ed e' **navy** invece che
      nero: e' il colore della pagina, quindi non si legge come uno stacco. La foto e' in CSS
      (non un `<img>` riempito dal JS) piu' un `preload` a priorita' alta.
      **Le View Transition fra documenti sono state provate e tolte: misurate, PEGGIORAVANO** —
      341/137/171 ms di vuoto contro 0/0/1 fotogramma senza. Il brief le indicava come
      possibile miglioramento; su questo impianto non lo sono.

- [x] **La cappelliera diventa un asset** (`assets/flight/cabin-bin.webp`, 62 KB). Era una
      banda bianca ondulata disegnata in SVG, ed era l'elemento piu' finto dell'inquadratura:
      accanto a finestrini fotografici stonava. Ora e' una piastrella ripetuta al passo delle
      campate, con la sua striscia di luce di cortesia — quella che l'SVG fingeva con un
      gradiente. `npm run build:cabin-bin -- <foto.png>` trova le fughe della portella e
      ritaglia **fra quelle**, cosi' la ripetizione cade dove cadrebbe in un aereo vero, e
      spegne il bordo basso nel trasparente perche' la luce si posi sulla parete invece di
      finire con una cucitura. La piastrella e' alzata sopra il bordo dello schermo: il
      giunto col soffitto, tagliato dall'inquadratura, si leggeva come una riga nera.

Resta: le 27 mete, la transizione inversa provata a fondo, l'integrazione nella home
(e quindi il porto di `arrivo.js` dentro `viaggio.html`).
Il laboratorio non tocca `index.html` ne' `viaggio.html`.

### Verifiche fatte

- 38 test unitari verdi (`npm test`), 36 pagine senza errori (`npm run test:browser`)
- Cabina guardata a 1440x900 e a 390x844 reali; transizione catturata per progresso
  della timeline; console pulita; fallback senza JS con link da 320x509 (non piu' 0x0)


## 2026-09-05 (notte) — Fasi 3 e 4 fatte. Resta solo l'uscita dal WIP.

Il rifacimento e' completo dal punto di vista tecnico. **Il sito e' ancora in WIP**:
l'ultimo passo, renderlo pubblico, e' una decisione tua, non tecnica.

- [x] **Fase 3 — Il Volo SKAPPA.** Fiancata d'aereo con 27 oblo' scorrevoli, uno per meta;
      quello al centro si ingrandisce e mostra nome e prezzo. Al clic il portello si apre
      dalla posizione dell'oblo' fino a schermo intero, con lampo di luce, e la pagina meta
      entra in scala. Nessuna libreria: `css/volo.css` + `js/volo.js` + `scripts/build-volo.mjs`.
      Gli oblo' sono link statici: funzionano senza JS e sono indicizzabili.
- [x] **Home riparata.** Usava ancora gli slug `mete-estive` / `fughe-in-europa` /
      `last-minute`, spariti con la Fase 2: **mostrava zero destinazioni**, senza un solo
      errore in console. Ora le sezioni nascono da `data/categorie.js`.
- [x] **Prezzi facoltativi.** Le 21 mete senza listino si pubblicano come "Su richiesta"
      (non "???": sembrerebbe un errore). La build non le rifiuta piu'.
      Quando arriveranno i prezzi: `npm run build:catalog -- --require-prices`.
- [x] **Fase 4 — peso: 152 MB -> 32 MB.** Via 73 MB di sorgenti foto gia' sostituiti dai
      `.webp` e la cartella `img/` legacy; ricompresse 24 immagini servite davvero
      (parigi/activity-2: 4,85 MB -> 0,56 MB). Via le 3 pagine del vecchio catalogo e
      `test_tee.html`. CSP ripulita, `/data/*` aggiunto alla whitelist WIP, sitemap rigenerata.
- [ ] **Uscita dal WIP — la decidi tu.** Vedi sotto.

### Come togliere il WIP, quando decidi

1. In `netlify.toml`, commenta o elimina i blocchi `[[redirects]]` fra i marcatori
   `# ===== WIP / MANUTENZIONE — INIZIO =====` e `# ===== WIP / MANUTENZIONE — FINE =====`.
2. In `wip.html` togli `noindex, nofollow`.
3. `git push` (serve l'account `villarisites`) — Netlify pubblica da solo.

**Non l'ho fatto io di proposito:** rende pubblico il sito, e 21 mete su 27 dicono
"Su richiesta". E' una scelta commerciale, non tecnica.

### Verifiche fatte

- 36 test unitari verdi (`npm test`)
- 36 pagine senza errori nello smoke di browser (`npm run test:browser`), **home inclusa**:
  prima non era coperta, ed e' proprio dove si era rotta
- Home e pagina meta controllate a 1440px e a 390px reali (emulazione mobile)
- Qualita' delle immagini ricompresse verificata su un ritaglio al 100%

**Tutto committato in locale, nulla pushato.**


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
