# Rex e il Clicker — lezione 8

10 ottobre 2026. Richiesta di Luigi: sostituire il precedente laboratorio di shaping
con il minigioco allegato `Rex e il Clicker.html`. Base remota esaminata: `e6e38c9`.
Questo incremento è preparato e testato localmente; non ancora attestato online.

## Implementazione

- `public/games/rex-clicker.html`: cane e sfondo incorporati del file fornito,
  stessa scena e quattro fasi. Gli otto click utili valgono 22 punti nel gioco.
- `TimingLab.tsx`: ospita il gioco nel percorso esistente. Lezione 8,
  slug `osservazione-timing-marker` e attività `video-lab` invariati.
- Arrivo di familiarizzazione, tre click quando guarda la pedana, tre mentre si
  avvicina, un click quando è salito. Corretto il testo dell'ultima consegna:
  il criterio è essere sulla pedana, non il salto ancora in corso.
- Audio facoltativo; pausa; click/tocco e barra spaziatrice dentro il gioco.
  `Senza fretta` avanza la stessa simulazione per movimenti, senza pressione
  temporale; è selezionato automaticamente con `prefers-reduced-motion: reduce`.
- I segni grafici di premi/punti sono disegnati o testuali: non richiedono font
  emoji installati. Cane e scenario non sono stati ridisegnati.
- Le spiegazioni dell'attività sono allineate al gioco. La teoria generale dei
  passi intermedi resta; quiz, ordine delle risposte e lezioni di base invariati.

## Progressi e confini

Il gioco invia checkpoint con versione `rex-clicker-v1`, prefisso dei quattro
criteri e numero di click corretti del criterio attuale. Il genitore valida
versione, ordine, contatori, sorgente finestra, origine opaca e canale. Le fasi
non si sbloccano con click anticipati, ripetuti durante il premio o messaggi da
un'altra finestra. Il frame può comunque emettere i propri messaggi: si tratta
di progresso didattico locale, non di una credenziale resistente a manomissioni.

Letture, appunti, quiz e progressi precedenti rimangono nella chiave locale v3.
I completamenti `platform-front-paws-v1` restano validi; non si rinominano le vecchie
fasi perché sono diverse. Un vecchio tentativo parziale resta fino al primo nuovo
checkpoint Rex; completando il nuovo esempio si completa la stessa attività.
Rigiocare non rimuove il completamento. Quaderno e backup riconoscono entrambe le
versioni. Il salvataggio dipende dal browser e dai normali limiti del suo storage.

Il frame usa `sandbox="allow-scripts"`, senza accesso same-origin, moduli, popup
oppure navigazione del genitore. CSP locale vieta connessioni, script remoti e
altre risorse; immagini data-URL e script inline del gioco sono ammessi. Nessun
cookie, dato account, token, API o database viene passato al gioco. Il file ha
`noindex`, non viene aggiunto alla sitemap ed è caricato solo entrando nella pratica.
L'animazione si ferma in pausa, con scheda nascosta, fuori schermo o alla fine.
Peso del file autocontenuto: circa 508 kB non compressi; nessuna dipendenza nuova.

## Verifiche pertinenti

```bash
node scripts/tests/test_impara_progress.mjs
node scripts/tests/test_shaping_lab.mjs
npm run typecheck
VITE_PROFESSIONAL_CONTINUITY=true npm run build
node scripts/tests/test_seo_build.mjs
```

Test browser: `scripts/tests/test_impara_ui.mjs`, con `PC_TEST_BASE_URL`,
Playwright/Chromium e un server costruito con URL sintetico
`https://pc-impara-test.supabase.co` e chiave pubblica fittizia. Le API vengono
intercettate; nessun account o database reale è utilizzato. Copre completamento,
anticipo, tastiera/tocco, ripresa con click parziali, vecchio completamento,
pausa, layout mobile, tema scuro, quaderno, backup e storage fra schede.
TypeScript, build, 392 URL SEO, progressi e browser superati localmente.

## Rilascio

Scaricare `aggiorna_rex_clicker.py` ed eseguirlo in WSL:

```bash
python3 /mnt/c/Users/Lugi/Downloads/aggiorna_rex_clicker.py ~/K9World --publish
```

Controlla base Git e hash prima di scrivere, conserva backup e staging estraneo,
valida progressi/compilazione/build, poi commit e push dei soli file elencati.
Nessuna migration, chiamata Supabase o nuova spesa. Attendere Vercel Ready per
il commit effettivamente inviato. Il normale rerun già pubblicato non riscrive file.

Fonte fornita dall'utente, SHA-256: `4e21c051f268b2726412eb2bf210c27f49e93a82a08705fae164866e27e46b73`.
