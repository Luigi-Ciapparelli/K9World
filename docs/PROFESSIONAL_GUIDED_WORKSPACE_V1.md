# Area professionista guidata — versione 1

Data: 29 settembre 2026. Base esaminata: `b512eb952825b54532c91c8632e1917ae40d27ac`
(`Modernize home with visual media and unified help navigation`, su `origin/main`).

## Esigenza e comportamento

Luigi ha chiesto un percorso simile all’avvio di Facebook Business: attività brevi,
progressi visibili e scoperta degli strumenti, evitando un unico modulo lungo.
La pagina `/pro/settings` diventa **Profilo guidato**. L’accesso diretto a ogni
strumento resta disponibile: il percorso non blocca chi usa già il portale.

Quattro attività di base sono riconosciute dai dati salvati:

1. Identità: nome, tipo di professionista e nome dell’attività quando necessario.
2. Zona: comune e copertura; il catalogo italiano esistente suggerisce i comuni.
3. Presentazione: una breve descrizione del lavoro.
4. Primo servizio: almeno un servizio attivo, salvato attraverso la RPC esistente.

Il contatore misura queste quattro attività, non approvazione amministrativa,
visibilità garantita, qualifiche, meriti sportivi o capacità del professionista.
I dati già presenti vengono riconosciuti; un errore di caricamento mostra un
messaggio e un comando Riprova, senza fingere un profilo vuoto.

## Schermate e salvataggi

Ogni attività ha una rotta riprendibile `/pro/settings?step=...`.
Foto e link, esperienza, attestati, ricerca/sport, messaggi, regole e verifiche
sono schermate separate e facoltative. Il professionista sceglie l’ordine.

- I salvataggi aggiornano solo i campi del passaggio aperto. Le regole di
  prenotazione si salvano esclusivamente nel loro passaggio.
- Il servizio ha tre passaggi: cosa offri, prezzo/durata, controllo/colore.
  Solo l’ultimo pulsante scrive via `save_my_calendar_service`; il retry conserva
  lo stesso identificativo del servizio. Il colore rimane quello del calendario.
- Gli attestati si inseriscono uno alla volta in tre passaggi. Working-Dog
  è in un riquadro apribile. Dichiarazioni e verifiche mantengono la distinzione
  e le API precedenti: completare il percorso non verifica una qualifica.
- La zona usa il catalogo dei comuni già presente nel progetto. Una nuova zona
  non risolta non viene salvata con le coordinate della precedente.
- Errori di salvataggio conservano i dati compilati e non avanzano il percorso.
- Le bozze dei campi del profilo restano in memoria passando fra le sue sezioni.
  Il router chiede conferma prima di uscire con modifiche non salvate; i moduli
  di servizio, ricerca/sport e risposta registrano la stessa protezione quando
  un cambio di sezione ne perderebbe la bozza. Anche i link hash e l’uscita dalla
  pagina rispettano la protezione. Non è un autosalvataggio delle bozze.

## Scoperta degli strumenti

La scheda **Esplora gli strumenti** apre una guida contestuale in tre passaggi
accanto a calendario, richieste/messaggi, clienti, archivio, pacchetti e
abbonamenti. L’archivio segue `VITE_PROFESSIONAL_CONTINUITY` come prima.
La guida si può chiudere e ripetere; gli strumenti operativi restano utilizzabili.
Non crea prenotazioni fittizie, non invia messaggi né attiva prodotti o addebiti.

“Guida completata” significa lettura dei passaggi, non operazione commerciale
eseguita. Questo piccolo progresso è salvato soltanto nel browser, con una
chiave distinta per utente (`pc-pro-explored-v1:<id>`), senza dati dei clienti.
I progressi del profilo, invece, sono calcolati dai dati del database.
Non sono introdotti punti pubblici, premi o incentivi a inventare attività.

## Aspetto e accessibilità

Menu laterale raggruppato per lavoro, percorsi dei clienti e presenza pubblica;
richiamo al profilo guidato nella dashboard esistente. Fondo caldo, verde scuro,
stati chiari, transizioni brevi, tema scuro e rispetto di `prefers-reduced-motion`.
Su mobile il menu è richiudibile e il contatore di completamento resta visibile.
Le schede hanno navigazione da tastiera; il titolo riceve il focus nei passaggi.

## Verifiche eseguite

- TypeScript e build di produzione con flag continuità attivo.
- ESLint mirato: nessun errore; due segnalazioni di Fast Refresh nel file del
  router che esporta Provider e hook (organizzazione di sviluppo, non Supabase).
- Browser Chromium con API completamente simulate: progresso da 2/4 a 4/4 e
  ripristino dopo ricarica; payload limitato al passaggio; errore/retry di
  salvataggio; tre passaggi del servizio; retry con identico UUID; protezione
  delle bozze con navigazione applicativa e hash nativo; attestato dichiarato;
  guide senza mutazioni di dati operativi; errore di caricamento esplicito.
- Controlli di overflow a 320, 390, 768, 1024 e 1440 px; ispezione di schermate
  desktop, mobile, servizio, strumenti e tema scuro.

Test conservato in `scripts/tests/test_professional_guided_ui.mjs`.
Richiede Playwright/Chromium già disponibili (gli stessi requisiti degli altri
controlli UI). Usa solo un Vite locale configurato con dati fittizi:

```bash
VITE_SUPABASE_URL=https://pc-home-test.supabase.co VITE_SUPABASE_ANON_KEY=synthetic-anon-key VITE_PROFESSIONAL_CONTINUITY=true npm run dev -- --host 127.0.0.1 --port 5196 --strictPort
```

In un altro terminale: `node scripts/tests/test_professional_guided_ui.mjs`.
Variabili opzionali: `PC_PLAYWRIGHT_MODULE`, `PC_CHROMIUM_PATH`,
`PC_TEST_BASE_URL`, `PC_SCREENSHOTS`. Le richieste Supabase sono intercettate;
non usare un server o account reale per questi test.

Limite: queste prove non verificano i servizi Supabase reali, upload Storage,
SMS/email, provider Working-Dog o il deployment Vercel. Le implementazioni
backend, i permessi, i contratti delle RPC e le migrazioni non cambiano.

## Rilascio

Nessuna migrazione necessaria. Pacchetto `aggiorna_area_professionisti.py`:
controlla l’hash di ogni file prima di modificarne uno, conserva un backup,
applica solo i file dichiarati e tollera una seconda esecuzione già applicata.
Con `--publish` verifica branch main e allineamento remoto, esegue typecheck e
build, committa solo i file previsti e fa push. Non inserisce segreti o `.env`.

Preparazione e prove locali completate. La pubblicazione su GitHub e lo stato
Ready di Vercel di questo incremento devono essere confermati dall’esecuzione
sul repository di Luigi. Dopo il deployment, accedere come professionista e
aprire **Profilo guidato**; gli account proprietario hanno la propria area.
