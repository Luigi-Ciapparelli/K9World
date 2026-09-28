# Abbonamenti professionali V1 — 28 settembre 2026

## Stato e punto di partenza

Incremento preparato su `f7d94f4` di `origin/main`, che comprende pacchetti di
lezioni e confine API privato. L'utente ha confermato l'applicazione delle
migrazioni precedenti e Security Advisor con 0 errori e 0 warning; le 22 INFO
sulle tabelle chiuse senza policy sono intenzionali. Non equivalgono a un
collaudo completo del servizio. Questo incremento non è ancora applicato al
Supabase online né pubblicato su Vercel al momento della preparazione.

## Funzionamento

- Menu professionista: **Abbonamenti**; accesso proprietario: **I miei abbonamenti**.
- Piani settimanali, ogni due settimane o mensili, con servizio attivo,
  numero di lezioni (1–200), prezzo per periodo e descrizione.
- Assegnazione a un proprietario con una prenotazione del professionista
  accettata o completata. Il professionista deve essere approvato.
- Primo periodo da oggi o entro 365 giorni; date nel fuso `Europe/Rome`.
- Ogni rinnovo è una conferma esplicita di un accordo già preso con il cliente.
  Nessun addebito, pagamento registrato, fattura o prenotazione automatica.
- Al massimo un periodo futuro confermato. Se il periodo successivo è già
  completamente trascorso, chiudere i rinnovi e assegnare un nuovo accordo.
- I mesi seguono l'anniversario originale: 31 gennaio → 28/29 febbraio →
  31 marzo. La scadenza è esclusiva a mezzanotte italiana; in UI viene mostrato
  l'ultimo giorno incluso. Il cambio dell'ora non sposta i giorni del periodo.
- Ogni periodo ha un saldo separato. Le lezioni inutilizzate non si trasferiscono.
  La data di svolgimento, non quella di inserimento, determina il periodo valido.
- Lezioni manuali o collegate a prenotazioni completate, storico e storni usano
  lo stesso registro dei pacchetti: una prenotazione non può essere scalata
  due volte da pacchetti o abbonamenti. Le note qui sono visibili al cliente.
  Gli appunti riservati restano nell'archivio professionale.
- **Chiudi rinnovi** richiede un motivo e lascia validi i periodi già confermati.
  **Annulla periodo** impedisce nuovi utilizzi di quel periodo, conservando
  saldo, motivo e storico. Non esegue rimborsi. Gli storni restano tracciati.
- Modificare o archiviare un piano riguarda le future assegnazioni. Gli accordi
  esistenti mantengono nome, descrizione, servizio, prezzo e quota originari.
- I vecchi dati beta sono conservati come **Da verificare**. Non si inventano
  crediti o rinnovi. I vecchi piani possono essere completati e poi riattivati;
  i vecchi accordi rimangono consultabili senza operazioni automatiche.
- Le liste clienti e periodi sono paginate; la ricerca del cliente mostra fino
  a 50 risultati. Il proprietario ha una vista di sola lettura dei propri dati.

## Database e autorizzazioni

Migration nuova: `20260928120000_professional_subscriptions.sql`.
Nessuna riscrittura delle migrazioni applicate.

Estende `subscription_plans` e `client_subscriptions` e crea
`subscription_periods`. Ogni periodo usa un `client_passes` dedicato;
`passes.origin='subscription'` identifica i modelli interni, non modificabili
né assegnabili tramite le RPC dei pacchetti. Non vengono mostrati nell'area
Pacchetti. Le cinque implementazioni private dei pacchetti interessate sono
aggiornate; i loro contratti pubblici restano invariati.

Tabelle chiuse ai ruoli anon/authenticated, RLS attiva, otto RPC autorizzate:

- `list_own_subscription_plans`, `save_own_subscription_plan`,
  `set_subscription_plan_active`;
- `issue_client_subscription`, `renew_client_subscription`,
  `close_client_subscription`;
- `list_my_subscriptions`, `get_subscription_periods`.

Implementazioni SECURITY DEFINER solo in `pc_private`, con search_path vuoto;
wrapper pubblici SECURITY INVOKER. `pc_private` resta fuori dagli schemi
esposti da PostgREST. Helper interni senza EXECUTE per anon/authenticated.

Assegnazioni e rinnovi hanno UUID stabili per riprovare dopo una risposta persa.
Il rinnovo verifica l'ultimo periodo osservato e blocca la riga dell'accordo.
Modifiche ai piani e chiusura hanno controllo versione. Il blocco del
professionista serializza nuove assegnazioni, rinnovi e chiusure.
I dati seguono le cancellazioni account già previste per i pacchetti: non
costituiscono un archivio fiscale o un registro a conservazione permanente.

## Verifiche effettuate

- Ricostruzione di tutte le 49 migrazioni precedenti e applicazione della nuova
  in PGlite/PostgreSQL isolato. Auth e Storage sono dipendenze SQL simulate.
- Piani, retry di assegnazione/rinnovo, identità, separazione clienti,
  condizioni congelate, date mensili/bisestili/cambio ora, periodi futuri,
  saldo separato, annullamento, chiusura e conservazione dello storico.
- Servizio inattivo, professionista non approvato, ruoli anon/owner/pro,
  rifiuto di accessi diretti alle tabelle e agli helper interni.
- Regressione pacchetti preesistenti e controlli del confine API: nessuna
  funzione pubblica SECURITY DEFINER eseguibile dai client o vista pubblica
  con privilegi del proprietario.
- TypeScript e build Vite con continuità attiva.
- Browser Chromium con backend simulato: creazione piano, assegnazione e
  rinnovo con risposta persa, doppio clic, lezioni, storno, chiusura,
  annullamento periodo, archivio piano, errore di rete e proprietario mobile.

Lo script `scripts/tests/test_professional_subscriptions.py` esegue gli stessi
casi SQL su PostgreSQL nativo temporaneo nel WSL, senza porte TCP e senza
credenziali online. Concorrenza tra connessioni, servizi Supabase reali e
flusso browser sul database online non sono attestati da questi test.

## Applicazione e rilascio

Nel Bash/WSL di Luigi, dopo aver applicato lo script di preparazione:

```bash
cd ~/K9World &&
python3 scripts/tests/test_professional_subscriptions.py &&
npm run typecheck &&
VITE_PROFESSIONAL_CONTINUITY=true npm run build &&
git diff --check &&
npx supabase db push --dry-run
```

Il dry-run deve proporre soltanto `20260928120000_professional_subscriptions.sql`.
Applicare la migrazione con `npx supabase db push` prima di pubblicare il frontend.
Aggiornare lo snapshot con `VITE_PROFESSIONAL_CONTINUITY=true python3 scripts/update_project_state.py`.
Committare i file dell'incremento; escludere `supabase/.temp/cli-latest` e cache.
Il frontend contiene le nuove voci senza un altro flag da attivare.
Registrare commit, esito migrazione e deployment Ready nel passaggio di consegne.

In caso di ripristino frontend, mantenere i dati e la migration additiva:
non cancellare periodi o applicare DROP per nascondere le nuove schermate.

## Passi successivi

Tessere/membership e campagne con invii reali e preferenze del destinatario
rimangono incrementi successivi. La vecchia pagina Statistiche necessita inoltre
di revisione: metriche, lingua, euro e distinzione tra valore prenotato e incassato.
Non considerare questo rilascio una riattivazione di tutti gli strumenti beta.
