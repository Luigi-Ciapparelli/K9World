# Storico condiviso: letture, scadenza e recupero

19 ottobre 2026. Base GitHub `9ed53bc`, che include il recupero delle sessioni
private. Questo incremento riguarda soltanto le letture frontend; nessuna
migration, modifica ai consensi o nuova facoltà di accesso.

## Difetto riprodotto

Nel lettore dello storico ricevuto il controllo periodico poteva restare in
attesa senza limite. Le note già caricate rimanevano sullo schermo, senza
conferma aggiornata dell’accesso. Riprodotto nel browser sulla base `9ed53bc`
simulando una richiesta senza risposta. Anche gli elenchi restavano bloccati
e una risposta malformata poteva essere scambiata per un elenco vuoto o causare
un errore di rendering.

## Correzione

- Letture con timeout di 15 secondi, annullamento delle richieste superate e
  messaggio recuperabile. Non viene presentato un errore come assenza di dati.
- Prima di rivalidare il lettore ricevuto rimuove il testo precedente. Il
  controllo resta ogni 30 secondi e al ritorno alla scheda, al focus, al ritorno
  della connessione e dopo un evento locale di modifica della condivisione.
- Scheda nascosta e perdita della connessione rimuovono le note dal lettore.
  Nessun polling mentre la scheda è nascosta; alla ripresa serve una lettura nuova.
- Scadenza della concessione controllata anche durante una richiesta bloccata,
  senza aspettare il polling. Dopo la scadenza occorre chiudere e aggiornare le
  autorizzazioni. Il timer gestisce anche durate superiori al massimo nativo.
- Risposte controllate prima della visualizzazione: array, identificativi,
  testo, date, revisione, contatori e stato previsti dalle RPC esistenti.
- Il pulsante di aggiornamento torna disponibile dopo errore/timeout. Cambio
  pagina, chiusura e uscita annullano le letture residue; una vecchia risposta
  non ripristina un contributo sul nuovo schermo.

Il controllo di scadenza nel browser è conservativo e usa l’orologio del
dispositivo. Le RPC restano l’autorità sui permessi effettivi e ricontrollano
scadenza, revoche, relazione e proprietario: nessuna autorizzazione è concessa
dal solo frontend. La revoca non recupera testo già letto, copiato o scaricato.
Non vengono memorizzati corpi delle note in localStorage, sessionStorage o URL.

La rivalidazione periodica riguarda il lettore ricevuto. Il timeout e il
controllo delle risposte si applicano anche agli elenchi di contributi propri,
pubblicazioni/destinatari del proprietario e autorizzazioni. Non cambia il
funzionamento delle operazioni di pubblicazione, concessione o revoca.

## Verifiche e rilascio

`scripts/tests/test_continuity_access_ui.mjs`: Chromium, SDK reale e API
sintetiche, viewport 1440 e 390, fuso dispositivo diverso da quello italiano.
Timeout e recupero, paginazione, revoca, risposta errata, eventi locali,
scheda nascosta/ritorno, offline/online, scadenza indipendente dal polling,
chiusura con risposta tardiva, uscita e assenza di note nello storage browser.
Controllati anche elenchi dell’autore e del proprietario con record non vuoti.

Regressione `test_continuity_recording_ui.mjs` passata: registrazione, ripresa
dell’invio, rettifiche e conflitti restano funzionanti. TypeScript, lint mirato,
build e test SEO passati. Non sono prove di Supabase o account online.
Nessun test SQL ripetuto, perché il backend non cambia.

Installer `aggiorna_lettura_storico.py ~/K9World --publish`: backup, verifica
della base e dei file, typecheck/build/SEO, commit e push circoscritti. Nessun
comando Supabase. Il rilascio frontend richiede poi Vercel Ready; il push da
solo non ne attesta l’esito. Email, media e MATCH-01 restano fuori dal perimetro.
