# Indisponibilità degli istruttori per alcune ore

16 ottobre 2026. TEAM-01, base GitHub `b8b30c2`.
Stato corrente in [CURRENT_STATE](CURRENT_STATE.md).

## Uso

In **Istruttori del centro → Gestisci indisponibilità**, il centro può scegliere
**Giornate intere** oppure **Alcune ore**. La persona collegata trova lo stesso
comando nella propria pagina **Collaborazioni con i centri**.

Per alcune ore si indicano giorno, inizio e fine. Gli orari sono sempre italiani
(`Europe/Rome`), anche quando il dispositivo usa un altro fuso. La fascia deve
iniziare prima della fine nello stesso giorno, con precisione al minuto, non deve
essere già terminata e la data deve essere entro due anni. Il modulo richiede
soltanto i campi della modalità scelta. Non raccoglie motivazioni personali.

Il limite condiviso rimane 200 periodi futuri attivi per istruttore. Le giornate
intere conservano gli estremi inclusi e il massimo di 366 giorni per periodo.
Non sono introdotti turni di lavoro, ricorrenze settimanali o fasce notturne
su due date: questi sono incrementi distinti.

## Calendario e prenotazioni

Il filtro per istruttore distingue **Istruttore assente** per l’intera giornata
da **Orari bloccati** per una fascia. Sotto il giorno selezionato compaiono le
ore esatte; i colori dei servizi restano invariati.

Una fascia 14:00–16:00 impedisce una nuova assegnazione che attraversa quelle
ore. Una lezione che termina alle 14:00 o inizia alle 16:00 non si sovrappone.
La conferma di una lezione di gruppo non supera l’indisponibilità.
Le assegnazioni già presenti restano conservate: l’avviso e il conteggio
riguardano soltanto quelle effettivamente sovrapposte. Nessuna cancellazione,
rifiuto, messaggio al cliente o modifica dell’intero centro avviene automaticamente.

L’indisponibilità personale resta privata al centro e alla persona autorizzata;
non viene pubblicata al cliente. Il permesso di completamento delle lezioni
e il nome dell’autore della conferma sono preservati.

## Implementazione e sicurezza

Migration aggiuntiva `20261016090000_instructor_hourly_time_off.sql` (65ª).
Due colonne opzionali `start_time`/`end_time` sulla tabella privata esistente:
NULL significa giornata intera e conserva i periodi e le API precedenti.
Un vincolo impedisce fasce parziali malformate. Nessuna migration applicata riscritta.

La nuova RPC `add_instructor_time_off_hours` riusa l’autorizzazione esistente:
centro competente oppure account collegato, attivo e con email confermata.
La persona può rimuovere le proprie fasce; quelle indicate dal centro sono
rimovibili dal centro. La revoca della collaborazione interrompe l’accesso.
UUID di richiesta per retry, versione attesa per rimozione, audit e RLS invariati.
Lo stesso UUID non può cambiare significato tra giornata intera e fascia oraria.

Assegnazione e inserimento della fascia acquisiscono prima il lock del centro.
Il controllo utilizza intervalli con fine esclusa, convertiti nel fuso italiano.
Gli orari inesistenti o ripetuti durante il cambio dell’ora vengono respinti
con un messaggio specifico, senza scegliere silenziosamente un’interpretazione.
Le fasce con estremi non ambigui che attraversano il cambio dell’ora sono ammesse.

RPC pubblica invoker e implementazione privata definer con search_path vuoto;
nessun nuovo accesso diretto alle tabelle o concessione a anon/service_role.
Nessun nuovo secret, dipendenza npm, servizio esterno o costo attivato.

## Prove e rilascio

- PGlite: storia di 65 migration e regressioni elenco, calendario, collaborazioni,
  completamento e giornate intere. Nuovi casi: confini adiacenti, sovrapposizioni,
  conteggio preciso, isolamento, retry/audit, vincoli e passaggi ora legale/solare.
- Browser desktop 1440 e mobile 390 px con API simulate: centro e persona,
  campi contestuali, orari invalidi, retry, lettura/rimozione ed errore senza dati
  obsoleti. Browser in fuso americano, etichette e dati dell’assenza in ora italiana.
  Calendario verificato per assenza totale e parziale, filtri e recupero errori.
- TypeScript, build e SEO; nessuna area personale aggiunta alla sitemap.
- `test_instructor_hourly_time_off.py`: PostgreSQL temporaneo senza TCP,
  tredici casi concorrenti su due connessioni, inclusi i due ordini fra
  fascia oraria e assegnazione. Non eseguito nell’ambiente di preparazione;
  obbligatorio nel comando di pubblicazione sul PC di Luigi.

Auth/Storage e API browser simulati; database online non modificato qui.
`aggiorna_assenze_orarie_istruttori.py ~/K9World --publish` verifica compatibilità,
crea backup ed esegue test nativi/TypeScript/build/SEO. Il dry-run accetta solo
questa migration e quella precedente dei permessi se ancora mancante; segue
commit locale recuperabile, db push e push main. Attendere Vercel Ready.
