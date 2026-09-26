# Ricerca sportiva e Working-Dog per disciplina — v1

Stato: direttiva prodotto del 26 settembre 2026 approvata dall’utente per
l’implementazione. Il primo incremento (catalogo, visibilità e ricerca separata)
è descritto in [SPORT_SEARCH_RELEASE_V1.md](SPORT_SEARCH_RELEASE_V1.md).
Verifier, ranking e pubblicazione dei nuovi badge restano successivi; questa
specifica non costituisce prova della loro implementazione o del deploy.

<!-- sport-search-and-working-dog-v1 -->

## Obiettivo

Offrire un percorso diretto per chi cerca aiuto nella gestione quotidiana del
cane e una sezione autonoma Sport cinofili, accessibile volontariamente dal
menu o dalla Home. La scelta della disciplina avviene solo dentro Sport. Nel
percorso normale non si chiede al proprietario di scegliere tra gestione e
sport e non si aggiungono click tra ricerca e addestratore. Il professionista
ha due selettori indipendenti di visibilità. Working-Dog e badge sono valutati
per singola disciplina.

## Modello logico proposto

- `professional_search_modes`: profilo, booleani indipendenti
  `show_companion` e `show_sport`, autore, timestamp e stato di migrazione.
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

- il percorso normale **Trova aiuto per il cane** conduce direttamente alla
  ricerca di gestione quotidiana, senza schermate di scelta o filtri sportivi;
- **Sport cinofili** è una sezione distinta nel menu e nella Home, da aprire
  soltanto quando il proprietario cerca preparazione sportiva;
- il filtro disciplina compare dentro Sport, con l'azione “Trova addestratore
  per disciplina”;
- nel pannello professionista due selettori indipendenti controllano le due
  sezioni. Se sono entrambi attivi, il professionista compare in ciascun
  elenco senza che il proprietario debba scegliere una modalità combinata;
- l'interazione di prenotazione è la stessa da entrambi i percorsi;
- catalogo con alias e descrizione, pagina disciplina e card filtrate per
  visibilità e disciplina offerta;
- badge e risultati verificati separati, con spiegazione del calcolo;
- migrazione iniziale con entrambi i selettori attivi sui profili esistenti,
  così nessuno scompare dalla ricerca.

## Sicurezza e revisione

RLS, RPC e worker devono impedire al client di auto-dichiarare badge o ranking.
Identità ambigua, provider irraggiungibile, duplicati e risultati riferiti a un
altro cane entrano in revisione e non sono pubblici. Le modifiche a pesi e
soglie sono versionate e soggette a audit.

## Test obbligatori

1. i due selettori professionista controllano indipendentemente la visibilità;
2. il percorso normale proprietario arriva alla ricerca senza scelta Gestione/Sport;
3. Sport è visibile come sezione separata e il filtro disciplina appare solo lì;
4. disciplina nuova importata dal catalogo senza modifica alle card;
5. identità Working-Dog corretta e identità ambigua;
6. risultato IGP isolato da Obedience;
7. risultato Obedience che produce il tier configurato solo dopo verifica;
8. cane errato, duplicato e fonte non raggiungibile;
9. ricalcolo con nuova versione della configurazione;
10. client che tenta di scrivere tier, score o risultato;
11. RLS tra professionisti e profilo pubblico;
12. migrazione profili esistenti senza scomparsa dalla ricerca.


## Rilascio

Procedere per incrementi: catalogo e ricerca/visibilità, poi verifier e
configurazioni. Eseguire i test sullo schema completo,
collegare UI e ricerca, provare con professionisti reali e solo dopo attivare
la pubblicazione dei badge.


<!-- sport-search-owner-ux-v2 -->

## Regola UX: lo sport è un'area separata e facoltativa

**Trova aiuto per il cane** porta direttamente alla ricerca normale. Non mostra
una domanda Gestione/Sport, non richiede una scelta di disciplina e non aggiunge
passaggi tra il proprietario e l'addestratore. **Sport cinofili** deve essere
chiaramente visibile come sezione propria nel menu e nella Home. Chi la apre
sceglie poi la disciplina. Prenotazione e contatto mantengono lo stesso flusso.
Nel pannello professionista, due checkbox indipendenti controllano la visibilità
in Gestione del cane e in Sport cinofili.
