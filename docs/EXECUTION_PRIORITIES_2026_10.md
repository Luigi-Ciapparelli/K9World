# PortaleCinofilo — priorità operative e criteri di completamento

## Ricerca ed Esposizioni implementate — 8 ottobre 2026

NAV-01/PRO-01 preparati sulla base remota `85cd0a7`: ricerca quotidiana con soli
Addestratori/Pensioni; Esposizioni con Toelettatura/Handler; attività e anteprima
della visibilità integrate nel profilo guidato. I dati precedenti sono conservati.
Leggere [EXHIBITIONS_RELEASE_V1.md](EXHIBITIONS_RELEASE_V1.md) per mappatura,
contratti API, verifiche e rilascio coordinato con la nuova migration
`20261008120000_exhibitions_and_service_catalog.sql`.

I controlli qui documentati sono locali con dati sintetici; non attestano un
nuovo deployment Ready o lo stato del database online. L'installer con --publish
esegue i controlli nativi e pubblica dal repository WSL dell'utente.
Questa istruzione di esecuzione supera il precedente limite «solo documenti»
per questo incremento. Export e nuove recensioni restano successivi; la ZIP
indicata dall'utente non è stata letta.

8 ottobre 2026. Base remota riletta: `821f4de`.

**Questo incremento aggiorna soltanto le direttive.** Nessun nuovo sviluppo, migrazione, acquisto, attivazione di monitor, invito o pubblicazione social eseguito. Il piano precedente su mercati, SEO e hosting è già presente su GitHub. La ZIP esclusa da Luigi non è stata letta.

## 1. Un ordine di lavoro, senza ricominciare dal passato

Obiettivo: far utilizzare il portale in Italia, osservare richieste realmente gestite e costruire un modello sostenibile. L'espansione estera viene dopo una prova locale utile; non è necessario completare tutte le funzioni future per incontrare i primi professionisti.

Le specifiche approvate sono in [FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md](FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md). Le raccomandazioni su internazionalizzazione, SEO e infrastruttura sono in [INTERNATIONAL_SEO_AND_HOSTING_V1.md](INTERNATIONAL_SEO_AND_HOSTING_V1.md). Questo documento ne ordina l'esecuzione futura e non trasforma le raccomandazioni in acquisti o decisioni già approvate.

**Regola di continuità:** codice, migrazioni, prove passate e disponibilità online sono evidenze diverse. I vecchi paragrafi “da implementare” restano storici quando un incremento successivo li supera. Non ricreare calendario, messaggi, pacchetti, abbonamenti o archivio solo perché una lista di settembre li indicava mancanti. Verificare prima l'incremento pertinente e correggere soltanto il problema reale.

## 2. Lavori prioritari

Le priorità non sono una nuova autorizzazione di esecuzione. “Pronto per progettazione” significa che il requisito è abbastanza definito per il prossimo incarico; non significa codice pronto o funzione rilasciata.

| ID | Ordine e stato | Lavoro | Dipendenza | Quando è completato |
| --- | --- | --- | --- | --- |
| AFF-01 | Prima priorità; diagnosi in attesa di dettagli | Ricostruire il downtime e identificare il componente coinvolto | Data, ora, URL e sintomo; poi log pertinenti | Causa o limite della diagnosi documentato, intervento motivato e verifica del percorso coinvolto |
| SEO-01 | Prima priorità; campione pubblico già controllato | Associare esclusioni Google agli URL | Tre export Search Console; canonica Google del duplicato | Ogni gruppo classificato, pagine essenziali controllate, correzioni specifiche individuate |
| NAV-01 | Implementato e verificato localmente; rilascio da confermare | Ricerca quotidiana con Addestratori/Pensioni, nuova area Esposizioni | Mappatura di categorie, servizi, profili e URL esistenti | Percorsi comprensibili, vecchi link gestiti, nessuna perdita di storico |
| PRO-01 | Implementato insieme a NAV-01; rilascio da confermare | Adattare profilo guidato e servizi alle nuove aree | Mappatura attività miste e handler | Un professionista imposta soltanto ciò che offre, con anteprima della visibilità e dati salvati |
| EXP-01 | Implementato e verificato localmente; rilascio da eseguire | Esportare lo storico autorizzato del cane | Modello reale di note, revisioni, concessioni e file | Export leggibile e completo nel perimetro consentito; isolamento e revoca verificati |
| REV-01 | Specifica parziale; chiudere le decisioni mirate | Richieste di valutazione dopo esperienze concluse | Soglia pensioni, visibilità cliente, cadenza e completamento servizi | Ammissibilità lato server, niente duplicati, regole distinte e storico preservato |
| SOC-01 | Pianificazione pronta; produzione futura | Dimostrazioni del prodotto e campagna del portale | Materiali effettivi dei tre post, funzione mostrata disponibile; budget per Higgsfield | Una sequenza curata e un collegamento pertinente, controllati nell'anteprima del canale |
| ECO-01 | Ricerca commerciale proposta | Individuare un problema professionale per cui esiste disponibilità a pagare | Interviste e utilizzo reale | Offerta concreta, costo di erogazione e interesse documentati; nessuna tariffa attivata automaticamente |
| INT-01 | Dopo la prima prova italiana | Confrontare due mercati, provarne uno | Offerta locale, lingua/assistenza e budget incrementale | Scelta motivata dai dati; nessun insieme di siti nazionali creato in anticipo |

AFF-01 e SEO-01 non richiedono di bloccare tutta la documentazione o la preparazione commerciale. Se manca un dato, registrare la dipendenza e proseguire su un lavoro indipendente. Non riempire il tempo aggiungendo nuove funzioni non richieste.

## 3. Primo incremento di prodotto: ricerca ed Esposizioni

### Percorso del proprietario

- “Trova aiuto per il cane” resta il pulsante verde e apre direttamente la ricerca degli addestratori. Nessuna domanda iniziale aggiuntiva su quotidiano, sport o esposizioni.
- I due box quotidiani sono **Addestratori** e **Pensioni**. Sport ed Esposizioni hanno ingressi autonomi nella navigazione. Impara resta gratuito e accessibile senza iscrizione.
- Toelettatura rimane disponibile in Esposizioni, senza necessità di partecipare a una gara. Handler indica il professionista per esposizioni, non qualunque conduttore sportivo.
- Il proprietario deve capire cosa offre una scheda e nella quale zona opera. Un filtro attivo deve essere visibile, modificabile e non sparire cambiando pagina.
- Se non ci sono risultati, mostrare lo stato reale e una possibilità utile, come ampliare la zona. Non popolare la ricerca con profili fittizi, attività escluse o risultati di un'altra categoria non dichiarata.

### Percorso del professionista

Integrare la scelta delle attività nella procedura guidata esistente. Chi lavora su più ambiti seleziona le attività effettive: non introdurre un'opzione autonoma “Entrambi” o un modulo unico con tutti i campi. Mostrare, prima del salvataggio, in quali ricerche comparirà il profilo e quali informazioni mancano.

L'assegnazione a un'area non equivale a qualifica verificata. Non attribuire badge sportivi alla toelettatura o agli handler per la sola scelta di una categoria. Un profilo misto conserva i propri servizi, con visibilità coerente con l'ambito.

### Prima di cambiare dati e URL

Inventariare le categorie reali nel codice e nel database, distinguendo attività professionale, servizio, disciplina e filtro. Proporre una mappatura leggibile prima della migrazione. Conservare identificativi e storico di account, servizi già erogati, prenotazioni, conversazioni, pacchetti e recensioni.

Pet sitting e passeggiate escono dall'offerta pubblica come deciso da Luigi; non cancellare per questo i rapporti precedenti. Per vecchi link filtrati e servizi rimossi definire un esito esplicito, senza sostituirli silenziosamente con un'attività diversa. Se cambiano URL pubblici, coordinare redirect, canonical, sitemap e link interni nella stessa modifica.

**Prova di completamento NAV-01/PRO-01:** ricerca proprietario senza passaggi aggiuntivi; pensione raggiungibile; sport separato; toelettatura e handler trovabili; attività mista coerente; nessun risultato dichiarato verificato senza evidenza; percorsi precedenti gestiti; controlli visuali desktop/mobile. Riutilizzare le prove esistenti pertinenti, aggiungendo soltanto i casi nuovi.

## 4. Export e recensioni: confini da conservare

### EXP-01 — esportazione

Implementazione dell’8 ottobre: [DOG_HISTORY_EXPORT_V1.md](DOG_HISTORY_EXPORT_V1.md).
Contenuti, limiti e stato del rilascio in quel documento; criteri originari sotto.

Il primo incremento può esportare dati e documenti realmente disponibili: non deve promettere registrazioni audio/video non implementate. Se un allegato autorizzato esiste ma non è recuperabile, non ometterlo silenziosamente; spiegare il limite nel riepilogo consentito.

La specifica deve coprire: identità e attività del cane, luoghi registrati, autori, date, revisioni e contributi condivisi. Non aggiungere tracciamento GPS. Verificare i permessi alla richiesta e alla consegna, inclusa la revoca durante la preparazione. Nessun accesso alle note private altrui o elenco di metadati riservati. L'archivio originale resta al professionista secondo il modello già deciso.

PDF e archivio strutturato con allegati rimangono formati proposti da valutare rispetto a dati, dimensioni e utilità. Definire limite, scadenza e pulizia dei temporanei; non introdurre una dipendenza a pagamento senza confronto. La futura compressione dei media deve rispettarne leggibilità e utilità professionale: nessuna cancellazione automatica degli originali stabilita da questa direttiva.

### REV-01 — valutazioni

Restano vincolanti: per lo stesso cliente e addestratore, richiesta reciproca soltanto dopo la seconda esperienza effettivamente conclusa, anche con servizi diversi. Non contare acquisti di pacchetti, appuntamenti annullati o semplice decorso dell'orario. Per le pensioni soltanto cliente → struttura.

Prima dell'implementazione chiudere in una sola decisione raggruppata:

| Decisione aperta | Proposta da valutare, non ancora approvata |
| --- | --- |
| Prima recensione della pensione | Consentirla dopo il primo soggiorno concluso |
| Rating del cliente | Nessun punteggio pubblico dei proprietari; definire chi può leggerlo e per quale scopo prima di raccoglierlo |
| Richieste dopo la seconda esperienza | Evitare una nuova richiesta dopo ogni singola lezione; stabilire quando aggiornare la valutazione |
| Canale iniziale | Richiesta nell'account, senza attivare automaticamente email, SMS o WhatsApp |
| Esperienze precedenti al rilascio | Riutilizzare soltanto stati affidabili; niente solleciti arretrati automatici |

Definire anche limite del commento, finestra di valutazione, rettifiche, moderazione e gestione delle valutazioni reciproche per ridurre ritorsioni. Non ricostruire a posteriori un servizio “completato” senza evidenza. Una recensione racconta un'esperienza e non certifica qualifica o merito sportivo.

## 5. Lancio e comunicazione: fare conoscere una funzione utilizzabile

### Cosa permette di iniziare

Non aspettare che Google indicizzi ogni scheda razza, che nasca Esposizioni o che sia pronto il filmato completo. Le dimostrazioni concordate e gli inviti autorizzati possono usare le funzioni già disponibili, quando il percorso mostrato funziona nella versione pubblica.

Prima di ampliare la distribuzione, verificare soltanto il percorso interessato: pagina di arrivo, accesso/conferma email se necessari, azione richiesta e possibilità di risposta. Un problema di autenticazione o perdita dei dati interrompe il relativo invito fino alla correzione. Un'esclusione di una scheda razza non blocca di per sé una dimostrazione del calendario.

Nella comunicazione evitare “beta” o “MVP” come etichetta commerciale, mantenendo la trasparenza: rete in costruzione, funzioni effettive e limiti nel punto in cui contano. Non promettere clienti garantiti, copertura locale inesistente o guarigione dei problemi comportamentali.

### Sequenza dei prossimi contenuti — proposta, non calendario già pubblicato

| Passaggio | Cosa deve capire il pubblico | Destinazione pertinente |
| --- | --- | --- |
| Identità e utilità | Che cos'è il portale e per chi esiste | Pagina effettivamente mostrata, evitando di ripetere la presentazione già pubblicata senza esaminarla |
| Un compito semplice | Come usare una lezione o il percorso prima del cane | `/impara` oppure `/prima-del-cane`, uno solo per contenuto |
| Un professionista utile | Come cercare aiuto nella propria zona | `/search`; dichiarare i limiti reali dell'offerta locale |
| Lavoro professionale | Come gestire un'esigenza concreta con uno strumento disponibile | `/become-pro`, senza includere nella promessa funzioni future |
| Campagna narrativa | Perché conoscere il cane e lavorare insieme cambia la relazione | Un invito coerente con la storia e il prodotto mostrato |

Esaminare prima i tre post realmente usciti e i dati disponibili. La priorità sperimentale TikTok deriva dal riscontro di Luigi; non dimostra ancora più conversioni o un costo di acquisizione minore. Adattare i materiali a Instagram e Facebook dopo verifica dell'anteprima. Nessun orario, hashtag o numero di post viene presentato come garanzia algoritmica.

### Produzione futura Higgsfield a costo controllato

Prima storyboard con lo stesso binomio riconoscibile e messaggio comprensibile senza audio. Poi una sola scena campione e un montaggio breve per giudicare anatomia, coerenza dei personaggi, voce, sottotitoli e chiarezza. Soltanto se il campione è valido valutare la produzione dell'intera storia entro un tetto di spesa esplicito. Non comprare crediti in questo incremento.

Il concept approvato resta quello dei cani, incontro al parco, portale e binomi sereni. La trasformazione è una metafora del percorso, non un risultato istantaneo del sito. Non riaprire l'animazione della Home statica. Evitare la scorciatoia di generare scritte dentro le immagini: testi e ritagli vanno verificati nel montaggio e nell'anteprima nativa.

## 6. Misurazione, ricavi e limite di lavoro

Proposta organizzativa: una funzione in sviluppo per volta, affiancata dalla comunicazione sulle funzioni già disponibili. Chiudere ogni incremento con esito verificabile; non accumulare prove locali senza registrare se e quando il rilascio sia avvenuto. Non far dipendere la validazione italiana dalla futura rete immobiliare o dal franchising.

Riepilogo settimanale con data, fonte e periodo:

- professionisti esterni con profilo completo, attività corretta e disponibilità effettiva;
- richieste reali ricevute e richieste con risposta, distinguendole dai test;
- tempo di prima risposta, casi non soddisfatti e ostacolo principale;
- ritorno all'uso, con definizione e finestra temporale esplicite;
- visite e azioni dai contenuti quando misurabili; “non misurato” se il dato manca;
- spese effettive e ore di assistenza, senza inventare costi di acquisizione da pochi casi.

Il registro su GitHub contiene soltanto aggregati non identificativi. Contatti, note e conversazioni restano negli strumenti autorizzati. Non aggiungere pixel o tracciamento invasivo per riempire la tabella.

Come primi obiettivi di prova mantenere **5 professionisti esterni disponibili e 3 richieste reali gestite**, già proposti nel piano d'impresa. Sono obiettivi operativi, non trazione esistente né prova statistica di redditività. Se le richieste non arrivano, esaminare offerta, promessa e distribuzione; se arrivano ma restano senza risposta, correggere la gestione prima di aumentare il traffico.

Per i ricavi: esplorare un servizio B2B facoltativo che risolva un problema osservato, misurandone tempo e costo. Non togliere automaticamente gli strumenti gratuiti esistenti, vendere posizioni o badge, o promettere che i banner copriranno i costi. Inquadramento dell'attività, finanziamenti e spese seguono [BUSINESS_ROADMAP_V1.md](BUSINESS_ROADMAP_V1.md) e la guida; questa direttiva non attiva incassi o presenta domande di contributo.

## 7. Prossima azione e passaggio di consegne

**Ora Luigi:** può proseguire la guida e le dimostrazioni concordate; per AFF-01/SEO-01 servono soltanto dettagli del disservizio ed export dei tre motivi Search Console. Nessuna password o token in chat o nel repository.

**Ora assistente:** completare e conservare questo piano, mantenendo separati fatti, proposte e decisioni aperte. Nessuna implementazione ancora. Per un successivo incarico di sviluppo partire dalla base GitHub aggiornata e da NAV-01/PRO-01, salvo un problema concreto di affidabilità/accesso che richieda precedenza.

**Prima di dichiarare completato un futuro incremento:** indicare file, verifiche pertinenti e limiti, eventuali migration/Edge coinvolte, commit remoto e riscontro del rilascio. La sola compilazione non dimostra che un utente possa usare la funzione. Un test recente già valido non va ripetuto senza una ragione concreta.
