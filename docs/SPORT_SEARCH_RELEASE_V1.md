# Sport cinofili — ricerca e visibilità, incremento 1

Data: 26 settembre 2026. Base esaminata: `f8d476669fa30e22192285d68df67a4c8808e006`.
Stato: codice preparato e verificato in ambiente isolato. Pubblicazione e
applicazione su Supabase remoto ancora da registrare.

## Implementato

- `#/search?type=trainer`: percorso diretto per la gestione quotidiana. Nessuna
  scelta Gestione/Sport, domanda intermedia o filtro disciplina.
- `#/sport`: area autonoma, visibile nel menu desktop/mobile e in un blocco
  proprio della Home. Filtro disciplina, città/GPS e gli ordinamenti esistenti.
- Profilo pubblico e prenotazione restano quelli esistenti. Il ritorno dalla
  scheda conserva il contesto Sport e i parametri della ricerca.
- Nel pannello **Profilo e servizi**, vicino all'inizio della pagina, due
  checkbox indipendenti regolano Gestione del cane e Sport cinofili. Nessuna
  opzione «Entrambi». Salvataggio dedicato; gli errori conservano le scelte.
- Le discipline offerte sono mostrate come attività dichiarate nel profilo;
  selezionarle non assegna qualifiche, badge o risultati verificati.
- La ricerca non attribuisce più precedenza IGP generale e non aggiunge
  automaticamente professionisti sportivi fuori zona. Distanza, esperienza,
  prezzo e valutazione rispettano la scelta di ordinamento dell'utente.

## Dati e permessi

Migrazione unica: `20260926220000_separate_sport_search.sql`.
Le 45 migrazioni precedenti restano inalterate.

Tre tabelle con RLS e senza privilegi diretti per `anon`/`authenticated`:

- `sport_discipline_catalog`: catalogo estensibile, alias, stato e versione;
- `professional_search_modes`: due booleani indipendenti;
- `professional_sport_disciplines`: attività offerte scelte dal professionista.

RPC pubbliche: `list_sport_disciplines`, `get_public_professional_sports`,
`search_sport_professionals`. La firma e la forma delle righe della vecchia
`search_public_professionals` restano compatibili. L'helper interno non è
eseguibile dai client. Le coordinate esatte non sono pubblicate.

RPC private: `get_my_professional_search_modes`,
`set_my_professional_search_modes`. L'identità deriva da `auth.uid()`;
il client non passa un id di un altro professionista. Un lock sul profilo
serializza i salvataggi. Discipline sconosciute/inattive e valori nulli sono
respinti prima di scrivere; i duplicati sono eliminati.

### Migrazione dei profili

Per tutti i profili già esistenti sono inizialmente attivi entrambi i booleani,
come richiesto dalla direttiva. La ricerca quotidiana continua a includerli.
Per comparire negli elenchi Sport occorre selezionare almeno una disciplina
offerta e avere un servizio `trainer` attivo e un profilo approvato. Non viene
dedotto ciò che una persona insegna dai risultati sportivi presenti.

I nuovi profili hanno, in assenza di preferenze, Gestione attiva e Sport
disattivo. Spegnere entrambe le opzioni nasconde i servizi di addestramento da
queste ricerche; gli altri servizi, le prenotazioni e gli archivi sono conservati.

## Catalogo iniziale e prossima fase

Il catalogo iniziale contiene IGP, Obedience, Agility, Rally Obedience,
Mondioring, Pista sportiva, Mantrailing, Hoopers, Dog Dancing, Disc Dog e
Flyball. È un catalogo editoriale di ricerca, **non** l'elenco completo delle
discipline supportate da Working-Dog. `working_dog_status` è `unconfirmed`;
non sono inventati id provider, soglie o equivalenze dei livelli.

Come concordato, questo è il blocco catalogo/visibilità/ricerca. Il successivo
resta **verifier Working-Dog e ranking separato per disciplina**, descritto in
`SPORT_SEARCH_AND_WORKING_DOG_V1.md`. L'edge function esistente e i badge IGP
esistenti nel profilo non vengono presentati come quel nuovo verifier.
In particolare, questo incremento non assegna un badge oro Obedience.

Il prossimo blocco deve verificare identità e singolo risultato (conduttore,
cane, evento, disciplina/livello), usare configurazioni versionate per disciplina,
gestire ambiguità, accesso al provider, deduplicazione, rettifiche e ricalcolo.
Il precedente controllo di testo sull'intera pagina non costituisce prova
sufficiente per ampliare automaticamente badge e ranking ad altre discipline.

## Verifiche

- TypeScript e build Vite: superati.
- 45 migrazioni reali e nuova migrazione eseguite senza riscritture su PostgreSQL
  WASM (PGlite), con dipendenze Auth/Storage simulate e dati sintetici.
- Regressioni SQL: backfill, combinazioni dei selettori, discipline nuove,
  duplicate/inattive/sconosciute, profili non approvati, servizi disattivi,
  filtri, distanza approssimata, isolamento IGP/Obedience e permessi.
- Test Chromium desktop/mobile: superati percorso diretto proprietario, disciplina
  dinamica, ordinamento, ritorno dal profilo, checkbox indipendenti e recupero
  da errori di caricamento/salvataggio. Test ripetibile:
  `scripts/tests/test_sport_search_ui.mjs`, backend simulato. Non sostituisce
  una prova con dati e servizi Supabase online.
- Test PostgreSQL nativo da eseguire nel WSL esistente:
  `python3 scripts/tests/test_sport_search.py ~/K9World`.

## Applicazione e pubblicazione

1. Applicare l'aggiornamento alla copia locale; il preparatore verifica ogni
   file prima di scrivere e salva un backup. Se trova codice diverso, si ferma.
2. Eseguire test SQL nativo, typecheck, build con il flag continuità già usato,
   poi `npx supabase db push --dry-run`. Deve risultare soltanto questa migrazione.
3. Applicare `npx supabase db push`, quindi commit/push del codice. Non servono
   nuovi flag Vercel o un deploy di edge function per questo incremento.
4. Registrare commit e deploy effettivi; rigenerare `docs/CURRENT_STATE.md` dal
   repository collegato a Supabase. Non dichiarare pubblicato solo per la build.

Rollback frontend: è compatibile con la nuova firma della ricerca ordinaria.
Non cancellare la migrazione applicata o le preferenze salvate. Per ritirare
la funzionalità usare una correzione successiva e preservare i dati.
