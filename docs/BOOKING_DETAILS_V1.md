# Prenotazioni leggibili e recupero dagli errori

18 ottobre 2026. Incremento BOOK-02 sulla base GitHub `f3e8aa2`.
Priorità: funzionamento degli strumenti professionali, chiarezza e protezione dei dati.

## Comportamento

- Richieste del professionista, riepiloghi della giornata e prenotazioni del
  cliente mostrano servizio, cane/i e fine prevista, accanto alle note già presenti.
- Il nome del servizio proviene prima dalla copia conservata nelle esperienze
  delle prenotazioni. Una rinomina o eliminazione dal catalogo non cambia questa
  copia. Dove manca, il nome attuale è dichiarato come tale; nessuna ricostruzione
  inventata delle vecchie richieste. L'orario finale è quello della prenotazione.
- Date e giornata della dashboard seguono Europe/Rome, coerentemente con il
  calendario. I confini includono le giornate di 23/25 ore del cambio dell'ora.
- Un prezzo zero resta zero euro; un prezzo mancante non diventa zero.
- Se i dettagli non arrivano, appare Riprova dettagli. Accetta/Rifiuta/Completa
  attendono la lettura del contesto. Le richieste superate da un filtro, ricaricamento
  o cambio account non sostituiscono il risultato corrente.
- L'annullamento del cliente gestisce errori e doppio clic. Dopo un esito incerto
  rilegge lo stato: non dichiara il successo e non reinvia automaticamente.
- Rimossa la ripetizione delle note nella dashboard. Spazio inferiore nella pagina
  cliente per poter scorrere le ultime azioni oltre il pulsante flottante Aiuto.

## Dati e accesso

72ª migration: `20261018093000_private_booking_details.sql`.
Nuova `public.get_booking_details(uuid[])`, involucro SECURITY INVOKER della
funzione controllata in `pc_private`. Legge solo il proprietario richiedente o
il professionista destinatario, con account email confermato. Massimo 100 ID per
chiamata; richieste raggruppate per pagina, non una chiamata per prenotazione.

La proiezione contiene ID della prenotazione, fine, nome/provenienza del servizio,
nomi dei cani e indicazione di dati non più disponibili. Nessun recapito, scheda
completa, nota privata, nuovo accesso amministrativo o permesso esteso al team.
I cani non più appartenenti al richiedente non espongono i loro nomi attuali.
Un cane eliminato non viene ricostruito; gli archivi storici esistenti mantengono
le proprie regole. Le altre RPC e i relativi contratti restano invariati.

Non modifica prenotazioni, valutazioni, servizi o dati storici. Le recensioni
continuano a riferirsi alla singola prestazione. Nessun nuovo costo di servizio,
provider esterno, invio, notifica automatica o caricamento multimediale.

## Prove e limiti

- PGlite: 71 migration precedenti più nuova; isolamento partecipanti, email
  confermata, limiti del batch, snapshot dopo rinomina/eliminazione, cani trasferiti
  o eliminati, confine API. Regressione clienti e note private.
- Node: risposte incomplete/malformate, prezzi, orari italiani e cambio dell'ora.
- Browser con SDK Supabase reale e API simulate: professionista e cliente a
  1440/390 px, anche con browser nel fuso America/New_York. Errori, retry,
  risposta superata, azioni bloccate durante lettura, accettazione e annullamento
  con risposta persa o accettazione contemporanea simulata.
- Regressione del percorso ospite/accesso, richiesta con note, messaggio con
  retry, accettazione, lettura cliente e calendario. Fixture aggiornata alla
  nuova proiezione e al formato attuale delle valutazioni.
- TypeScript, lint dei file modificati, build e controllo HTML/SEO.

`scripts/tests/test_booking_details.py` ricostruisce la storia in PostgreSQL
nativo temporaneo senza TCP e senza dati online. È incluso come controllo
obbligatorio dell'installer, ma non eseguito nell'ambiente di preparazione.
Auth/Storage sono simulati. Questi test non certificano Supabase online,
concorrenza del provider, account reali o Vercel Ready.

## Rilascio

Installer: `aggiorna_dettagli_prenotazioni.py ~/K9World --publish` da WSL.
Verifica compatibilità di tutti i file prima di scrivere, conserva backup,
esegue test nativo/Node, TypeScript, build/SEO e dry-run. Crea un commit locale
recuperabile, applica soltanto la migration prevista, compatibile col frontend
precedente, poi esegue il push dei file elencati. Se compaiono altre migration
si ferma prima dell'applicazione.

L'incremento è preparato localmente: nessuna applicazione SQL online o pubblicazione
GitHub è implicita in questo documento. Dopo il comando registrare hash remoto,
esito migration e Ready di Vercel separatamente. Non ripetere le prove complete
per aggiornare soltanto lo stato documentale.
