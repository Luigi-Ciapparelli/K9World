# Calendario per istruttore e sovrapposizioni

14 ottobre 2026. Estensione della prima fase [TEAM-01](CENTRE_INSTRUCTORS_V1.md).
Registro del rilascio: [CURRENT_STATE](CURRENT_STATE.md).

## Uso

Nel calendario di un centro compare il filtro **Istruttore**:

- Tutti gli impegni del centro, vista iniziale.
- Lezioni accettate da assegnare: solo lezioni di addestramento/corso ENCI
  accettate, assegnabili e senza nominativo; non confondere con richieste pendenti.
- Singoli istruttori, inclusi quelli inattivi che conservano lezioni nello storico.

Il filtro agisce sul mese e sugli impegni del giorno insieme al filtro servizio.
I colori continuano a identificare i servizi. L’indisponibilità riguarda ancora
l’intero centro; non è l’orario personale dell’istruttore. I dati delle assegnazioni
sono caricati per tutti gli appuntamenti del periodo, in batch di massimo 200.
Un errore di lettura non trasforma gli impegni in lezioni da assegnare: la vista
filtrata chiede di riprovare oppure consente di mostrare tutti gli impegni.

## Conferma delle sovrapposizioni

Se il centro assegna lo stesso istruttore a lezioni con orari sovrapposti, il
server ferma il salvataggio e mostra un avviso. Il centro può scegliere un altro
istruttore oppure confermare esplicitamente che gli impegni sono compatibili,
ad esempio per una lezione di gruppo. La conferma non viene selezionata da sola.
Il nome salvato e la conferma sono registrati nell’audit privato.

Gli intervalli sono semiaperti: una lezione che termina esattamente all’inizio
della successiva non si sovrappone. Si considerano assegnazioni a lezioni
accettate o completate, si esclude la prenotazione che si sta modificando.
Annullate/rifiutate non impegnano l’istruttore. La verifica riguarda solo il
medesimo nominativo nell’elenco dello stesso centro: non incrocia account o
nomi omonimi di centri diversi e non è un calcolo automatico della capienza.

Le assegnazioni precedenti non vengono riscritte, e un retry identico conserva
la stessa versione e lo stesso evento. Non sono introdotti eventi di gruppo,
biglietti o accessi del personale. La valutazione resta della prestazione.

## Implementazione

Nuova migration `20261014004500_centre_instructor_calendar.sql`, successiva a
`20261013180000_centre_instructor_assignments.sql`. Non modifica la prima migration.
Aggiunge `overlap_confirmed` alla riga dell’assegnazione e la RPC
`assign_booking_instructor_checked` con conferma inizialmente falsa. La vecchia
RPC a tre argomenti delega allo stesso controllo senza conferma, evitando un
percorso alternativo che salti il vincolo. Permessi, versioni attese e blocco
centro → prenotazione → assegnazione restano applicati dal database.

## Verifiche

- PGlite: 61 migration ricostruite, ruoli/isolamento del primo blocco, nomi storici,
  export, recensioni, sovrapposizione respinta, conferma esplicita, confini degli
  intervalli, vecchia RPC protetta, retry unico e conservazione dell’audit.
- Browser desktop 1440 e mobile 390 px, API simulate: creazione e assegnazione,
  conflitto di versione, conferma di gruppo non precompilata, filtri, gestione
  del caricamento incompleto e vista proprietario senza comandi di modifica.
- TypeScript, build e test SEO: 396 HTML, 392 URL canonici; niente area privata in sitemap.
- `test_centre_calendar.py`: PostgreSQL temporaneo via socket, storia completa
  e tre casi con connessioni separate (due ordini assegnazione/disattivazione e
  due assegnazioni sovrapposte simultanee). Test nativi forniti ma non eseguiti
  qui: obbligatori nel comando di pubblicazione sul PC di Luigi.

Auth/Storage simulati; nessuna prova Supabase/Vercel online implicita.

## Pubblicazione unica

`aggiorna_calendario_istruttori.py ~/K9World --publish` include il precedente
pacchetto istruttori. Accetta soltanto contenuti di base noti o già aggiornati;
ferma le differenze inattese prima di scrivere. Test, commit locale recuperabile,
dry-run limitato alle due migration mancanti, SQL e push GitHub. Nessuna Edge
Function, nuova dipendenza npm, email o costo aggiuntivo introdotto dal rilascio.
Attendere Vercel Ready per il commit risultante. Non eseguire entrambi gli installer.
