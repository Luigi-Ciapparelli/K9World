# Valutazioni della singola prestazione — REV-02

Decisione di Luigi, 10 ottobre 2026: «associa la valutazione alla lezione svolta
nel centro riguardo il servizio prenotato, né addestratore né struttura».
Preparazione sulla base GitHub `82caa1c`; stato rilascio in CURRENT_STATE.

## Comportamento

- Ogni prenotazione idonea conclusa ha la propria valutazione. La terza lezione
  non sposta la recensione della seconda, né aggiorna un voto alla persona.
- Servizio, nome e tipo sono registrati all’accettazione. La data/orario sono
  visibili ai partecipanti. Il profilo pubblico mostra nome del servizio, voto,
  commento e primo nome dell’autore, senza orari, note, cane o recapiti.
- Per le lezioni si mantiene la soglia della seconda prestazione **formativa**
  conclusa presso la stessa attività prenotata, individuale o centro. Possono
  essere servizi formativi diversi. Pensione/toelettatura non alzano il conteggio.
  La prima lezione non diventa valutabile retroattivamente al secondo incontro.
- Dopo la soglia, ogni nuova prestazione ha una richiesta distinta, ignorabile.
  Per pensione, toelettatura e handler basta il primo servizio concluso.
- Il professionista conferma il servizio effettivamente svolto, dopo la fine
  prevista. Attesa, accettazione, tempo trascorso, acquisto pacchetto, annullamento
  e rifiuto non bastano. Nessun sollecito via email o SMS.
- Scala 1–5 e commento facoltativo entro 500 caratteri. Rettifica entro 7 giorni
  dal primo invio; la rettifica non prolunga il termine. La prossima lezione ha
  un nuovo giudizio, anche quando il vecchio termine è scaduto.
- Per le lezioni il feedback sulla collaborazione è privato fra gli account
  partecipanti e riferito alla medesima prestazione. Nel centro lo scrive
  l’account che gestisce la prenotazione; non si inventa un’identità di istruttore.
  Per pensioni e altri servizi recensisce solo il cliente.

La soglia con l’attività e la richiesta per ciascuna nuova prestazione sono
l’applicazione operativa della direttiva; non un punteggio alla struttura.
L’assegnazione di istruttori/team resta un lavoro organizzativo separato.

## Visibilità e storico

Nel profilo pubblico: «Esperienze sui servizi svolti», filtro per servizio,
paginazione, nessuna media generale. Nella ricerca: rimossi stelle/medie del
profilo, filtro «Valutazione minima» e ordinamento per valutazione. Un vecchio
parametro `min_rating` non nasconde più le attività.

Le recensioni preesistenti non vengono cancellate, spostate o reinterpretate.
Sono etichettate «Storico precedente» e mantenute in sola lettura. I vecchi thread
vuoti non producono solleciti. Un testo scritto come giudizio sul rapporto non
viene fatto passare per giudizio su una singola lezione. Le revisioni pregresse
rimangono nel registro privato. Per richieste di rettifica dello storico resta
il contatto di assistenza già previsto; nessun sistema completo di moderazione
aggiunto in questa fase.

Gli aggregati `professionals.rating/review_count` sono dismessi e mantenuti a
zero per compatibilità delle vecchie API; **i record delle recensioni restano**.
Nessuna media generale viene ricostruita, neppure dallo storico precedente.
Non usare questi campi per nuova UI, ranking, reputazione, badge o export.
Le recensioni non certificano qualifiche o risultati sportivi.

## Implementazione e sicurezza

Migration nuova: `20261010113000_booking_service_reviews.sql`. V1 non modificata.
Le tabelle private mantengono RLS e nessun accesso diretto client. I thread nuovi
hanno ambito `booking_service` e unicità per prenotazione; quelli vecchi rimangono
`legacy_relationship`. Per gli appuntamenti già accettati il contesto conservato
è quello disponibile alla migration, senza fingere una ricostruzione storica.

Restano i controlli server su attore, completamento, versioni e retry idempotenti,
la serializzazione sul professionista e il registro delle rettifiche. Un trigger
impedisce di spostare una recensione di prestazione a un’altra prenotazione.
La vecchia `submit_review` non aggira soglia, identità o categoria.

`get_public_service_reviews` espone solo i campi ammessi per attività approvate,
con filtro e limiti di pagina. Wrapper pubblico `SECURITY INVOKER`, implementazione
privata a privilegi controllati e `search_path=''`. Nessun nuovo accesso a note,
ritratti, telefono, archivio o dati cliente da parte degli altri professionisti.
La ricerca viene aggiornata preservando il corpo effettivo e i correttivi foto:
la migration rifiuta un predicato inatteso anziché sovrascrivere codice diverso.

## Verifiche e rilascio

- Ricostruzione delle 55 migration precedenti più la candidata: storico
  preservato, soglia corretta per centri/individuali, esclusione pensione dal
  conteggio lezioni, nomi congelati, terza lezione separata, retry, versione
  obsoleta, rettifica, isolamento e API pubbliche, ricerca senza rating generale.
- Browser desktop/mobile: scheda e dialogo con servizio; invio, errori e retry;
  storico non modificabile, voto privato, pensione, uscita account; filtro pubblico,
  paginazione, testo non eseguibile, errore e riprova, nessun voto globale.
- TypeScript, build/SEO e verifica dei conflitti/idempotenza dell’installer.

SQL locale PostgreSQL WASM; Auth/Storage simulati. Browser con API simulate.
Non equivalgono a collaudo Supabase reale, consegna di email o concorrenza nativa
su due connessioni. Il test Python allegato usa PostgreSQL isolato nativo in WSL.

Nel terminale `luigi@…:~/K9World$`:

```bash
cd ~/K9World && python3 /mnt/c/Users/Lugi/Downloads/aggiorna_valutazioni_prestazioni.py ~/K9World --publish
```

Installer: confronto dei file/dependenze, backup, test SQL nativo, typecheck,
build/SEO, dry-run della sola migration attesa, commit recuperabile, database,
push dei soli percorsi previsti. Nessun force push, reset, acquisto o invio esterno.
Con modifiche estranee o altra migration si ferma e preserva i file. Attendere
Vercel Ready per il commit risultante; non rilanciare altri vecchi installer.

Il controllo finale reale è circoscritto: con account di prova e servizi realmente
conclusi, verificare seconda e terza lezione distinte, filtro pubblico per servizio
e assenza del voto privato per un terzo account. Non introdurre recensioni fittizie
nei profili pubblici di professionisti reali.
