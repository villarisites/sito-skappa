# TASKS — skappa.it

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
