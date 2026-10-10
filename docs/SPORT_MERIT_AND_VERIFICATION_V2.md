# Risultati verificati e merito per disciplina — 26 settembre 2026

## Aggiornamento del 10 ottobre 2026

La protezione dalle modifiche è ora implementata nel pacchetto
[CREDENTIAL_VERIFICATION_INTEGRITY_V1](CREDENTIAL_VERIFICATION_INTEGRITY_V1.md),
con salvataggio atomico, versione attesa e storico privato. La proposta SQL
originaria non va applicata separatamente. Stato remoto in CURRENT_STATE.
I limiti del collegamento identità/provider e del ranking descritti sotto rimangono.

## Stato storico del 26 settembre

Base letta su GitHub: `8d1baf9` (area Sport separata). Questo incremento contiene
un motore TypeScript server, test sintetici, criteri editoriali e una proposta SQL
per invalidare attestazioni modificate. **Non contiene un importatore Working-Dog
funzionante, nuovi badge pubblicati o un ranking collegato alla ricerca.**
Nessun database remoto o Edge Function è stato modificato.

`supabase/functions/_shared/sportMerit.ts` è il motore server isolato; il parser
`workingDogResultParser.ts` è stato collegato all'Edge Function esistente, ma non
è ancora collaudato contro una risposta live del provider. La versione della
politica è `pc-sport-merit-2026-09-26-draft1`: proposta concreta da rivedere prima
dell'attivazione dei badge. Il motore non è una barriera di autorizzazione;
accetta esclusivamente fatti già verificati dal server, mai JSON del browser.

## Criteri dei riconoscimenti PortaleCinofilo

Un risultato deve appartenere al conduttore identificato, al cane e alla prova
indicati nella stessa evidenza. Un esito negativo, ritirato o squalificato non
assegna alcuna medaglia, anche se il punteggio scritto sembra sufficiente.
Una medaglia descrive risultati sportivi, non certifica capacità nell'educazione
quotidiana, benessere, abilitazione professionale o titolo di campione.

Le soglie seguenti sono scelte editoriali del portale basate sui regolamenti,
non medaglie assegnate da FCI/ENCI. Serve almeno un risultato che soddisfi la riga.

| Disciplina e regolamento | Bronzo | Argento | Oro |
| --- | --- | --- | --- |
| IGP, FCI 2025 | IGP1 superato integralmente | IGP2 superato integralmente | IGP3 superato integralmente |
| Obedience, FCI 2025 | Classe 1, almeno 256/320 | Classe 2, almeno 256/320 | Classe 3, almeno 256/320 |
| Agility, FCI 2025 | Classe 1, percorso Agility a zero penalità totali | Classe 2, stesso requisito | Classe 3, stesso requisito |
| Rally Obedience, ENCI 2026 | Classe 1, almeno 90/100 | Classe 2, almeno 90/100 | Classe 3, almeno 90/100 |
| Mondioring, FCI, documento 17191 | Livello I, almeno 160/200 | Livello II, almeno 240/300 | Livello III, almeno 320/400 |
| Pista, FCI 2025 | IFH1 superato | IFH2 superato | IFH3 oppure IGP-FH superato |
| Mantrailing, prove sportive FCI/IRO 2025 | RH-MT V superato | RH-MT A superato | RH-MT B superato |
| Hoopers, FCI 2026 | H1 a zero penalità totali | H2 a zero penalità totali | H3 a zero penalità totali |
| Dog Dancing, ENCI 2024, separando Freestyle e HTM | Classe 1, almeno 34/40 | Classe 2, almeno 34/40 | Classe 3, almeno 34/40 |

- IGP: conservata la scala già richiesta. Il superamento è dell'intera prova;
  un totale alto non compensa una fase insufficiente. UPr, FPr e prove parziali
  non diventano IGP completo né Obedience. L'esito ufficiale deve essere esplicito.
- Obedience: 256/320 è l'inizio della qualifica Eccellente. Nessuna conversione
  automatica di punteggi provenienti da regolamenti nazionali diversi.
- Agility: penalità di percorso **e tempo**, con classi e formato distinti.
  Jumping resta consultabile come risultato ma non assegna automaticamente il
  badge Agility previsto qui. Nessuna soglia riciclata dai vecchi giudizi qualitativi.
- Rally: il regolamento ENCI ha classi 1/2/3. La singola classe internazionale FCI
  non deve essere scambiata per tre livelli: occorre una mappatura esplicita.
- Mondioring: l'80% in ciascun livello è una nostra soglia; non coincide con
  tutti i minimi ufficiali di superamento. Una medaglia non dichiara raggiunti i
  requisiti per il passaggio di classe, che possono richiedere più risultati.
- Pista: IFH1/2/3 sono dell'edizione 2025. IGP-FH richiede entrambe le piste
  superate. Nessuna reinterpretazione automatica di vecchi FH o sigle ambigue.
- Mantrailing: RH-MT V è una prova preliminare sportiva. Il badge non attesta
  operatività nel soccorso; serve il superamento dell'intera prova, non solo ricerca.
- Dog Dancing: ciascuno dei quattro criteri deve avere almeno 5/10; il totale
  da solo non basta. Il formato internazionale su altra scala non usa queste soglie.

### Disc Dog e Flyball: proposta da chiudere prima di automatizzare

Non esiste una scala universale 1/2/3 equivalente alle righe precedenti.
Il motore restituisce `needs_review`, senza inventare una medaglia.

| Disciplina | Proposta Bronzo | Proposta Argento | Proposta Oro | Condizione mancante |
| --- | --- | --- | --- | --- |
| Disc Dog, USDDN Super Open Freestyle | Podio in una qualificazione ufficiale | Qualificazione mondiale attestata dall'organizzatore | Podio nella finale mondiale | Validare equivalenza dei livelli, risultati e identità del binomio; separare Toss & Fetch e gli altri circuiti |
| Flyball | Podio regionale nella divisione principale | Podio nazionale nella divisione principale | Podio mondiale nella divisione principale | Verificare roster e presenza effettiva del cane e conduttore; definire numero minimo di squadre e competizioni ammesse |

Queste due righe non sono implementate. Un piazzamento di squadra o la presenza
del nome nell'elenco iscritti non bastano per attribuire un risultato individuale.

## Catalogo del portale e copertura della fonte

Le undici discipline del portale sono un catalogo editoriale: non dimostrano
copertura Working-Dog. Caniva, collegata a Working-Dog, mostra anche Bikejöring,
Canicross, Herding Dog, Rescue Dog, THS e Waterworks. BH/VT, seminari ed esposizioni
non diventano automaticamente categorie di merito sportivo per addestratori.
Queste ulteriori discipline richiedono regolamento/versione e dati campione prima
di configurare medaglie. Non presentare le nove politiche implementate come
copertura completa di Working-Dog.

## Contratto della verifica automatica

1. Collegamento dell'identità con prova di controllo del profilo oppure revisione
   dell'identità. Il solo nome coincidente non è prova di possesso dell'account.
   Un URL pubblico collegato non deve essere chiamato OAuth.
2. Accesso documentato e autorizzato ai risultati, con ID stabili di persona,
   cane, evento, risultato e revisione. Non chiedere password o cookie in chat.
3. Importare la singola riga ufficiale con ruolo conduttore, disciplina,
   regolamento, classe, data, formato, esito e punteggi/penalità necessari.
4. Conservare fonte, data controllo, impronta dell'evidenza, versione parser e
   versione delle regole. Gestire omonimi, cambio nome del cane, rettifiche e revoche.
5. Calcolare la medaglia lato server con `evaluateMerit`. Il browser non decide
   verifica, punteggio di ranking o colore del badge.
6. Scrivere risultato e stato con controllo della versione originale: se il
   professionista modifica il record durante il fetch, la verifica deve essere
   scartata e ripetuta. Solo record pubblici e verificati entrano nei badge.
7. Ricalcolare dopo modifica/revoca e gestire i retry tramite identificativi
   esterni, senza incrementare risultati o cani a ogni sincronizzazione.

Sul profilo mostrare per esempio **OBEDIENCE · Oro**, classe, risultato, cane,
evento e collegamento alla fonte. Un oro IGP e un oro Obedience non rappresentano
una graduatoria comune. Il caso di Valentina Balli è un esempio desiderato:
non le viene attribuito alcun risultato senza verificarlo.

### Ostacolo verificato il 26 settembre

Le pagine Caniva consultate dichiarano che i risultati sono visibili dopo login.
La consultazione della pagina principale Working-Dog è risultata bloccata in
questo ambiente. Non è stata trovata un'API pubblica documentata: ciò non dimostra
che non esista un accesso partner. Il prossimo input utile è un URL reale del
profilo Working-Dog e un URL di una prova (preferibilmente Obedience), per
verificare struttura e accessibilità; se il login è obbligatorio serve un canale
autorizzato dal provider. L'accesso non va aggirato con scraping autenticato.

`verify-working-dog/index.ts` ora richiede una riga di risultato univoca con
conduttore e cane nella stessa riga e restituisce anche posizione, punteggio,
qualifica e classe quando la pagina li espone. Una pagina che cambia markup,
produce righe duplicate o non consente una corrispondenza univoca resta `pending`.
Il parser è ancora un adapter prudente per HTML pubblico, non una prova che
Working-Dog autorizzi un accesso automatizzato. Le verifiche automatiche storiche
non diventano automaticamente evidenze conformi al nuovo contratto.

## Ranking nella sola disciplina selezionata

Ordine proposto: livello della medaglia, cani distinti al livello migliore,
eventi distinti al livello migliore, data più recente a quel livello, ID stabile
come spareggio tecnico. La data indica attività recente, non annulla il merito
storico. Gli ordinamenti scelti dall'utente, come distanza o prezzo, restano
espliciti. La ricerca quotidiana mantiene il percorso diretto e non usa medaglie
sportive per sostituire i criteri di scelta della gestione del cane.

`summarizeMerit` calcola i componenti per una sola disciplina e variante. I
duplicati in conflitto vengono esclusi; il database dovrà fornire solo la revisione
corrente. Collegamento a ricerca, filtri e UI ancora da implementare.

## Protezione delle modifiche e test

Nel codice esaminato il 26 settembre il trigger conservava la verifica quando il titolare cambiava livello,
disciplina o prova. Proposta correttiva:
`docs/proposals/invalidate_changed_sport_evidence.sql`.
Ogni modifica dell'evidenza, anche amministrativa, imposta `pending`; un cambio
di sola visibilità non perde la verifica. Non eseguire la proposta come migrazione
finché non è integrata con il salvataggio atomico del nuovo verifier e con un
registro delle revisioni. Una verifica non deve cambiare i campi di evidenza e
attestare contemporaneamente il vecchio record.

Test del motore: `node scripts/tests/test_sport_merit.mjs`,
`node scripts/tests/test_working_dog_result_parser.mjs` e
`node scripts/tests/test_working_dog_result_integration.mjs`.
I test usano identità e risultati sintetici, senza accesso a Working-Dog.
Non equivalgono a collaudo del provider, Supabase o browser.

Esito nel workspace: 69 controlli del motore, 9 controlli del parser e il caso
reale fornito di Valentina Balli (264,38, EX, 4ª) superati;
TypeScript dei moduli verificato. Proposta SQL, regressioni ricerca e permessi superati su PostgreSQL
WASM (PGlite), ricostruendo le 46 migrazioni senza riscriverle; Auth/Storage
simulati. Per ripetere su PostgreSQL nativo usare
`python3 scripts/tests/test_sport_evidence_invalidation.py`.

## Fonti primarie consultate

- [FCI IGP e IFH 2025](https://www.fci.be/medias/UTI-REG-IGP-en-2025-22401.pdf)
- [FCI Obedience 2025](https://www.fci.be/medias/OBE-REG-COB-123-20250101-en-19816.pdf)
- [FCI Agility](https://www.fci.be/medias/AGI-REG-en-23672.pdf)
- [ENCI Rally Obedience, regolamento 2026](https://www.enci.it/media/6671308/regolamento-prove-nazionali-di-rally-obedience.pdf)
- [FCI Rally Obedience internazionale 2025](https://www.fci.be/medias/FCI-ROB-REG-2025-en-19918.pdf)
- [FCI Mondioring](https://www.fci.be/medias/MON-REG-en-17191.pdf)
- [FCI/IRO soccorso e mantrailing 2025](https://www.fci.be/medias/SAU-REG-IPO-2025-en-21973.pdf)
- [FCI Hoopers](https://www.fci.be/medias/HOO-REG-en-22638.pdf)
- [ENCI Dog Dancing 2024](https://www.enci.it/media/9234/regolamento-nazionale-prove-dog-dancing-in-vigore-dal-1-settembre-2024.pdf)
- [USDDN, regolamenti ufficiali](https://usddn.com/official-rules/)
- [FCI Flyball](https://www.fci.be/medias/FLY-REG-en-15567.pdf)
- [Caniva, catalogo](https://www.caniva.com/)
- [Caniva, ricerca Obedience e avviso login](https://www.caniva.com/search?category%5B%5D=obedience)
