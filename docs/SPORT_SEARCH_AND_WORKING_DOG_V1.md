# Ricerca sportiva e Working-Dog per disciplina — v1

Stato: direttiva prodotto del 26 settembre 2026. Questo documento è una
specifica tecnica da approvare; non crea migration, non modifica Supabase e non
dichiara implementate le funzioni descritte.

<!-- sport-search-and-working-dog-v1 -->

## Obiettivo

Separare la ricerca per gestione quotidiana del cane dalla ricerca per sport
cinofilo, lasciando a ogni professionista la scelta `companion`, `sport` o
`both`. I risultati Working-Dog e i badge sono sempre valutati per la singola
disciplina.

## Modello logico proposto

- `professional_search_modes`: profilo, modalità visibili, autore, timestamp e
  stato di migrazione iniziale.
- `sport_discipline_catalog`: provider, provider id, label canonica, alias,
  versione, fonti e stato.
- `professional_sport_disciplines`: discipline offerte da un professionista,
  testo del servizio, area e disponibilità.
- `working_dog_profile_claims`: collegamento, URL, fingerprint, stato,
  identità riconciliata, ultima verifica e motivo della revisione.
- `working_dog_results`: evento, data, cane, disciplina, livello,
  piazzamento, fonte e stato verificato.
- `discipline_merit_configs`: pesi, soglie, fattori di recenza, badge e
  versione dell'algoritmo per disciplina.
- `professional_discipline_merit`: score, tier, configurazione usata, data e
  audit del calcolo per `(professional_id, discipline_id)`.

I nomi sono un contratto di progettazione, non una richiesta di creare queste
tabelle prima della revisione dello schema reale.

## Pipeline provider-aware

1. Il professionista collega il profilo Working-Dog e seleziona le discipline
   che vuole offrire.
2. Una RPC autenticata crea una richiesta idempotente; il browser non scrive
   risultati, tier o score.
3. Un worker server acquisisce la fonte, riconcilia identità e normalizza
   disciplina tramite il catalogo versionato.
4. La configurazione della disciplina valida i campi, scarta il cane errato e
   marca `verified`, `pending_review` o `rejected`.
5. Solo i risultati `verified` alimentano `professional_discipline_merit` e
   la card pubblica.
6. Ogni ricalcolo conserva versione, fingerprint, timestamp e motivazione.

## Merito e presentazione

Per ogni disciplina si applicano pesi e soglie propri. Il punteggio non viene
confrontato con quello di un'altra disciplina e non usa follower, pagamento o
popolarità come scorciatoia. Il profilo mostra, vicino al badge, disciplina,
livello, fonte, data di controllo e stato.

## Ricerca e interfaccia

- ingresso **Gestione del cane** con filtri pratici e competenze di contesto;
- ingresso **Sport cinofili** con azione “Trova addestratore per disciplina”;
- catalogo con alias e descrizione, filtro disciplina e pagina dedicata;
- card filtrate per modalità di visibilità e disciplina offerta;
- badge e risultati verificati separati, con spiegazione del calcolo;
- migrazione iniziale dei profili esistenti a `both` per evitare sparizioni.

## Sicurezza e revisione

RLS, RPC e worker devono impedire al client di auto-dichiarare badge o ranking.
Identità ambigua, provider irraggiungibile, duplicati e risultati riferiti a un
altro cane entrano in revisione e non sono pubblici. Le modifiche a pesi e
soglie sono versionate e soggette a audit.

## Test obbligatori

1. modalità `companion`, `sport` e `both` nella ricerca;
2. disciplina nuova importata dal catalogo senza modifica alle card;
3. identità Working-Dog corretta e identità ambigua;
4. risultato IGP isolato da Obedience;
5. risultato Obedience che produce il tier configurato solo dopo verifica;
6. cane errato, duplicato e fonte non raggiungibile;
7. ricalcolo con nuova versione della configurazione;
8. client che tenta di scrivere tier, score o risultato;
9. RLS tra professionisti e profilo pubblico;
10. migrazione profili esistenti senza scomparsa dalla ricerca.

## Rilascio

Prima approvare questo documento e il catalogo iniziale. Poi implementare
schema/RPC, verifier e configurazioni, eseguire i test sullo schema completo,
collegare UI e ricerca, provare con professionisti reali e solo dopo attivare
la pubblicazione dei badge.
