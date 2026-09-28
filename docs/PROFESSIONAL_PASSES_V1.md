# Pacchetti di lezioni — 27 settembre 2026

Primo strumento ripristinato dopo la rimozione delle pagine beta. Base esaminata:
`db2e010` su GitHub. Implementato e verificato nella copia di lavoro; database
online e pubblicazione di questo incremento **non ancora eseguiti**.

## Percorso nell’interfaccia

- Professionista → **Pacchetti** (`#/pro/passes`), senza flag aggiuntivi.
- **Modelli** → nuovo modello: servizio attivo, nome, numero di lezioni, prezzo,
  validità in giorni e descrizione interna del modello.
- **Pacchetti dei clienti** → assegna un modello a un cliente con una propria
  prenotazione accettata o completata. Il professionista deve essere approvato.
- **Registra lezione** scala una lezione già svolta: collegamento a una
  prenotazione completata compatibile oppure registrazione manuale.
- **Storico** conserva ogni utilizzo. **Storna questa lezione** restituisce un
  credito e aggiunge il motivo della rettifica senza cancellare l’originale.
- **Annulla pacchetto** impedisce altri utilizzi e conserva motivazione e saldo.
- Proprietario → **I miei pacchetti** dalla dashboard (`#/owner/passes`):
  condizioni, residui, scadenza, annullamenti e storico in sola lettura.

Le descrizioni delle lezioni e le motivazioni sono visibili al cliente.
Gli appunti professionali riservati restano nel loro archivio separato.
L’elenco dei pacchetti è paginato, con filtro per stato. La ricerca clienti
mostra fino a 50 corrispondenze per nome, selezionando solo clienti autorizzati.

## Regole operative

- Una lezione corrisponde a un credito di un solo servizio. I pacchetti non
  combinano servizi di durata diversa e non prenotano automaticamente date.
- Servizio, nome, prezzo, quantità e scadenza vengono fissati all’assegnazione.
  Modificare/archiviare un modello non modifica i pacchetti già assegnati.
- Il prezzo è quello concordato. Assegnare/scalare un pacchetto **non incassa,
  non fattura e non registra un pagamento**; non cambia prezzi o statistiche
  delle prenotazioni. L’accordo commerciale va già confermato con il cliente.
- La validità parte dall’assegnazione; la scadenza è esclusa. Si può registrare
  in ritardo una lezione svolta entro quel periodo, anche dopo la scadenza.
  Lezioni future, anteriori all’assegnazione o fuori validità sono respinte.
- Prenotazione, cliente, professionista e servizio devono corrispondere.
  Una prenotazione non può consumare due pacchetti contemporaneamente.
- Le assegnazioni beta precedenti restano **Da verificare**: nessun credito
  originale, pagamento o scadenza viene dedotto senza una fonte attendibile.
  Possono essere annullate dopo verifica; una nuova assegnazione richiede
  l’accordo sui nuovi termini, senza trasferimenti automatici dei residui.
- Stornare un utilizzo non riattiva un pacchetto annullato o scaduto.

## Database e accessi

Nuova migration: `20260927170000_restore_professional_passes.sql`.
Estende `passes` e `client_passes`, aggiunge il registro `pass_usage_events`.
Non riscrive migrazioni già applicate. RLS resta attiva; le tre tabelle non
espongono accessi diretti ad `anon` o `authenticated`. Le RPC verificano sempre
l’identità e il ruolo effettivo; nessun ID professionista scelto dal browser.

Blocchi di riga serializzano i saldi. UUID operativi rendono idempotenti
assegnazioni, utilizzi e storni; un indice univoco protegge le prenotazioni da
addebiti duplicati su pacchetti diversi. I modelli usano versioni per impedire
sovrascritture silenziose. Le cancellazioni account mantengono le precedenti
regole di cascata: questo registro non promette conservazione dopo cancellazione
dell’account e non sostituisce l’archivio professionale di continuità.

## Verifiche e loro limiti

Eseguite nella copia di lavoro:

- TypeScript e build di produzione con continuità attiva.
- PGlite/PostgreSQL 18: 47 migration precedenti + nuova, preservazione beta,
  assegnazione, condizioni immutabili, saldi, retry, rettifiche, annullamento,
  scadenze, permessi, isolamento fra account e cascata account. Passata anche
  la regressione esistente sulle prenotazioni e continuità.
- Playwright/Chromium: creazione modello, assegnazione con risposta persa e
  retry dello stesso UUID, doppio clic, lezione manuale/prenotata, storno,
  annullamento, archivio, errore di caricamento e vista proprietario mobile.
  Screenshot desktop/mobile ispezionati. Backend del browser simulato.

Il test nativo `scripts/tests/test_professional_passes.py` ripete la storia su
PostgreSQL locale privato e aggiunge **quattro prove con due connessioni**:
assegnazione ripetuta, utilizzo ripetuto, storno ripetuto e contesa dell’ultimo
credito. Attende di osservare entrambi i client bloccati prima di liberarli.
Queste quattro prove native devono essere eseguite nel WSL dell’utente:
non sono state eseguite nell’ambiente di preparazione. Auth e Storage sono
dipendenze SQL simulate; nessun test qui attesta servizi Supabase live.

## Applicazione e rilascio

Nel Bash WSL del repository:

```bash
python3 scripts/tests/test_professional_passes.py
npm run typecheck
VITE_PROFESSIONAL_CONTINUITY=true npm run build
npx supabase db push --dry-run
```

Il dry-run deve proporre soltanto la nuova migration indicata sopra. Se test
e piano sono corretti, applicare con `npx supabase db push`, poi pubblicare
il frontend. Nessuna Edge Function, credenziale o variabile Vercel nuova.
Fare commit esplicito dei file di questo incremento, includendo la migration;
escludere `supabase/.temp`, file ambiente e cache Python.

Per eseguire il test UI con Playwright già disponibile: avviare Vite su 5190
usando `VITE_SUPABASE_URL=https://pc-passes-test.supabase.co` e una chiave anon
sintetica, poi `node scripts/tests/test_professional_passes_ui.mjs`.
Supporta `PC_PLAYWRIGHT_MODULE`, `PC_CHROMIUM_PATH`, `PC_TEST_BASE_URL` e
`PC_SCREENSHOTS`. Non usarlo contro il backend reale.

In caso di problema dopo l’applicazione, ripristinare il frontend precedente
senza eliminare tabelle, registro o colonne. Non riaprire i vecchi accessi
diretti alle tabelle per aggirare un errore RPC.

## Prossimi strumenti

Abbonamenti, tessere/livelli cliente e campagne restano incrementi successivi.
Non compaiono voci vuote nell’interfaccia. Le campagne precedenti segnavano
«inviato» senza consegna email: servirà un invio reale con esiti, idempotenza
e preferenze del destinatario. I rinnovi automatici richiedono un flusso
pagamenti effettivo; questo incremento non li dichiara operativi.
