# Note delle lezioni scritte dall’istruttore

16 ottobre 2026. TEAM-01; base verificata `origin/main` a `9855c8f`.
Nuova migration: `20261016170000_centre_lesson_notes.sql` (67ª).
Incremento preparato localmente; SQL online e Vercel Ready non osservati qui.

## Percorso nell’interfaccia

1. Il centro apre **Istruttori del centro** (`/pro/team`) e concede **Consenti
   note delle lezioni** a una collaborazione attiva. Il permesso parte spento
   ed è distinto da completamento e messaggi.
2. La persona collegata apre **Collaborazioni con i centri** (`/account/centres`).
   Sulle lezioni assegnate e terminate compare **Note della lezione**.
3. Sceglie il cane autorizzato, descrive attività e osservazioni. Serve una relazione
   di continuità con il centro già attiva all’inizio della lezione: l’appuntamento
   da solo non la crea e non permette di retrodatare il consenso.
4. Il centro vede il contributo nell’archivio, con nome dell’autore e centro.
   Solo l’autore può rettificarlo, con motivo e revisione attesa; la cronologia resta.
5. **Il tuo lavoro nei centri → Apri i tuoi contributi** mostra soltanto i propri
   testi, anche dopo la revoca. **Scarica queste revisioni** esporta la pagina
   corrente, fino a 30 revisioni, senza identificativi interni o nuovi recapiti.

## Archivio e condivisione

Le sessioni e revisioni già esistenti restano l’unico archivio. Due tabelle private
aggiungono attribuzione e consenso per revisione. Il centro conserva il lavoro
svolto nel proprio percorso; la persona conserva accesso ai contributi scritti da lei.
Non accede all’intero archivio del centro né agli appunti degli altri istruttori.

La nota è inizialmente privata a centro e autore. L’autore può consentire al centro
di proporre **quella revisione** allo storico del cane. La casella parte vuota anche
per una rettifica. Il centro deve poi selezionarla esplicitamente; il proprietario
può concedere solo le revisioni selezionate a un successore autorizzato.

Il ritiro del consenso da parte dell’autore chiude le nuove letture condivise,
anche dopo la fine della collaborazione. Non elimina l’originale dal centro o
dall’archivio personale e non richiama copie già scaricate. Una rettifica ritira
le pubblicazioni precedenti. Il centro non può modificare il testo altrui o
ripubblicarlo senza consenso valido. Export e letture condivise mostrano l’autore reale.

## Controlli tecnici

- Account verificato, collaborazione attiva, centro approvato, istruttore attivo,
  permesso corrente e assegnazione/versioni correnti, su lezioni trainer/enci_course.
- Lezione terminata, relazione bilaterale precedente, cane del proprietario
  originale e collegato a quella prenotazione. Nessun conferimento implicito.
- Blocco transazionale coerente con assegnazioni e archivio; richiesta ripetuta
  con UUID e contenuto identici produce una sola sessione. Una risposta persa
  mantiene il testo e permette di riprovare lo stesso invio.
- Le rettifiche conservano autore, data, testo e motivo. Un conflitto di revisione
  non sovrascrive dati. Un retry non ripristina un consenso ritirato.
- Metadati con RLS; accesso diretto negato a anon, authenticated e service_role.
  Wrapper pubblici invoker, implementazioni private con search_path vuoto.
- Nominalità conservata dopo cancellazione account. L’ex collaboratore vede solo
  i propri contributi catturati, non aggiornamenti del cliente o del centro.

## Prove e limiti

Eseguite: 66 migration precedenti più nuova su PGlite; regressioni team, calendario,
account, assenze, completamento e messaggi. Provati isolamento, retry, rettifiche,
selezione/revoca, cambio proprietario, cancellazione account e autorizzazioni SQL.
Browser desktop 1440 e mobile 390 con account/API sintetici: concessione, errore
503 dopo salvataggio e retry, rettifica, archivio centro, revoca contro pagina
obsoleta, download personale e relazione mancante. TypeScript, lint mirato e
build/SEO verificati. Auth/Storage sono simulati; questi test non attestano dati
online, consegna email o configurazione Vercel.

`test_centre_lesson_notes.py` ricostruisce il database privato PostgreSQL e include
otto casi con due connessioni: nota/permesso e nota/assegnazione in entrambi gli
ordini, doppio invio, rettifiche concorrenti, pubblicazione/ritiro consenso nei due
ordini. Non eseguiti in questo ambiente privo di PostgreSQL server: l’installer li
richiede sul PC di Luigi **prima** di applicare la migration online.

## Rilascio

Il pacchetto del 17 ottobre `aggiorna_turni_istruttori.py` include anche queste
note e sostituisce l’installer precedente. Procedura, compatibilità e limiti in
[INSTRUCTOR_WEEKLY_SHIFTS_V1](INSTRUCTOR_WEEKLY_SHIFTS_V1.md).
Dopo Ready, il centro abilita il permesso per la collaborazione desiderata.

Restano separati i ruoli organizzativi più ampi e i media delle sessioni con
quote/compressione. Nessuna email o campagna inviata.
