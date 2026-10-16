# Conferma delle lezioni da parte degli istruttori

16 ottobre 2026. Incremento TEAM-01 sulla base GitHub `9216c48`.
Stato di pubblicazione in [CURRENT_STATE](CURRENT_STATE.md).

## Percorso

1. Il centro apre **Istruttori del centro** e individua un account collegato
   e confermato dalla persona. L’accesso iniziale resta in sola lettura.
2. Seleziona **Consenti completamento lezioni** e conferma l’ambito della delega.
3. L’istruttore apre **Collaborazioni con i centri**. Per le proprie lezioni
   accettate, dopo l’orario di fine, compare **Segna lezione svolta**.
4. Conferma che il servizio si è effettivamente svolto. La lezione passa a
   completata; persona e centro vedono il nome di chi ha confermato.
5. **Rimuovi permesso di completamento** interrompe le nuove conferme,
   conservando l’accesso alla propria agenda. La revoca del collegamento
   elimina anche l’accesso all’agenda, secondo le regole già esistenti.

Il decorso dell’orario non completa automaticamente una lezione. Le assenze
non annullano appuntamenti né provano che una lezione non si sia svolta:
il centro gestisce le variazioni; la conferma resta un’azione esplicita.

## Ambito del permesso

Solo servizi formativi (`trainer`, `enci_course`), assegnati a quella persona,
con inizio successivo all’accettazione della collaborazione. Richiesti account
con email confermata, ruolo ammesso, collegamento e istruttore attivi.
La persona non può completare una prenotazione in cui è essa stessa il cliente.
Non può accettare/rifiutare richieste, cambiare date o assegnazioni, aprire
recapiti, messaggi, note o CRM. Nessuna autorizzazione implicita per un admin.

Il trigger delle valutazioni esistente resta attivo: voto alla singola
prestazione e soglie previste per i servizi formativi. Nessuna nuova media
del professionista/centro, recensione automatica o consumo di pacchetti.

## Integrità e audit

Migration aggiuntiva `20261014210000_centre_lesson_completion_permissions.sql`
(64ª), senza riscrivere migration già applicate.

- `can_complete_lessons` nasce `false` per tutti i collegamenti, nuovi ed esistenti.
- Il centro gestisce il permesso con versione attesa e audit del cambiamento.
- La conferma ricontrolla sul server persona, permesso, appartenenza, assegnazione,
  stato e orario, anche quando il browser mostra dati non aggiornati.
- Le versioni attese impediscono di confermare un’assegnazione o permesso cambiato.
  In caso di conflitto la pagina aggiorna i dati prima di consentire una nuova prova.
- Lock del centro prima di relazione, prenotazione e assegnazione: concessioni,
  revoche, riassegnazioni e completamento hanno un ordine coerente.
- `pc_private.centre_lesson_completions` registra autore reale, nome al momento
  della conferma, assegnazione e orario. Una conferma ripetuta non duplica audit
  né valutazione. Nessuna impersonazione dell’account del centro.
- RLS e revoca di accesso diretto a anon/authenticated/service_role. RPC pubbliche
  invoker e implementazioni private definer con search_path vuoto. I nomi degli
  autori delle conferme sono restituiti al centro e all’istruttore autorizzato;
  nessun nuovo registro pubblico.

La revoca non cancella lezioni già completate o attribuzione della conferma.
I riferimenti ad account e assegnazione nell’audit sono snapshot; la rimozione
degli oggetti operativi non riscrive l’autore storico. Nessuna nuova durata di
conservazione o possibilità di export globale viene introdotta.

## Prove e rilascio

- PGlite: 63 migration precedenti e la nuova, regressioni elenco/calendario,
  collegamenti e assenze; permesso iniziale negato, concessione/versioni,
  storico escluso, divieto di completare la propria prenotazione, orario,
  audit unico, valutazione per lezione e revoca.
- Browser 1440 e 390 px, API simulate: concessione, completamento, autore,
  conflitto recuperabile e revoca con pagina della persona rimasta obsoleta.
  Flusso precedente di collegamento/agenda ancora superato.
- TypeScript, build e SEO passati: 396 pagine HTML pubbliche, 392 URL in sitemap;
  nessuna area account resa indicizzabile.
- Test PostgreSQL nativo incluso: undici casi su due connessioni, di cui quattro
  nuovi su completamento/revoca e completamento/riassegnazione nei due ordini.
  Non eseguito nell’ambiente di preparazione privo del server PostgreSQL;
  l’installer lo richiede sul PC di Luigi prima della pubblicazione.

Auth/Storage e API browser sono simulati: non è un collaudo di Supabase online.
`aggiorna_permessi_istruttori.py ~/K9World --publish` verifica la compatibilità,
salva i file precedenti, esegue test nativi/TypeScript/build/SEO, dry-run, commit
locale recuperabile, db push e push su main. Accetta soltanto questa migration
e quella delle assenze se ancora in attesa. Interrompe su modifiche estranee.
Nessuna nuova dipendenza, Edge Function, secret, invio o servizio a pagamento.
Attendere Vercel Ready per il commit pubblicato.

Messaggi, note con autore personale, ruoli organizzativi e turni orari sono
incrementi successivi; questo permesso non li abilita.
