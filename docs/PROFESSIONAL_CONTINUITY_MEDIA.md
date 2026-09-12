# Storico professionale del cane, note e media — architettura v1

Stato: decisione di prodotto approvata in chat; proposta tecnica da verificare sul codice e sul database prima delle migration. Questo documento non implementa funzionalità né descrive tabelle già esistenti.

Baseline Git verificata: 9b23833, main e signup-dog-profile allineati, working tree pulito. Profilo pubblico e prenotazioni sono stati verificati dall'utente in produzione. La nuova fase riguarda lo storico professionale, non le note inviate dal proprietario con una prenotazione.

## 1. Decisioni approvate

- Il professionista mantiene un archivio del proprio lavoro: sessioni, osservazioni, foto, audio e video prodotti.
- Il cane possiede uno storico professionale continuo: autori, periodi, attività e contributi restano identificabili.
- Il proprietario autorizza l'accesso allo storico condivisibile per il nuovo professionista.
- Gli appunti riservati del professionista sono distinti dai contributi destinati alla continuità.
- Il nuovo professionista aggiunge contributi senza riscrivere quelli dei predecessori.
- Archivio dell'autore e storico condivisibile referenziano lo stesso contributo e gli stessi asset, senza copie per ogni destinatario.
- Foto, audio e video devono essere ottimizzati conservando la qualità utile all'osservazione del cane.
- Conservazione dell'archivio non equivale a spazio illimitato, accesso eterno ai dati nuovi o impossibilità di cancellazione.

## 2. Distinzioni obbligatorie

| Oggetto | Scopo | Regola |
| --- | --- | --- |
| bookings.notes | Messaggio del richiedente per una prenotazione | Flusso esistente; non diventa una nota professionale |
| client_notes | Appunti CRM sul cliente | Mantiene le attuali regole accepted/completed; nessuna estensione automatica |
| Sessione professionale | Contesto del lavoro sul cane | Autore, cane, data, eventuale booking, attività |
| Nota professionale | Osservazione attribuita all'autore | Visibilità privata o destinata alla continuità |
| Asset media | File e sue versioni | Accesso privato e autorizzazioni esplicite |
| Relazione persona–cane | Storia di chi ha seguito il cane | Non concede da sola tutti i permessi |
| Concessione di accesso | Chi può leggere quali contributi e per quanto tempo | Separata dalla relazione e revocabile |

Le scelte di questa fase si applicano al nuovo dominio. Non rendere permanenti i permessi delle note CRM esistenti per ottenere l'archivio professionale.

## 3. Visibilità e passaggio di consegne

Una nota nasce privata. L'autore decide quali contributi sono destinati allo storico condivisibile. Il proprietario può autorizzare il nuovo professionista a leggere tale storico, ma non può trasformare gli appunti privati dell'autore in materiale condiviso.

La concessione iniziale proposta seleziona contributi o un periodo storico: non include automaticamente ogni contenuto futuro. Accesso ai nuovi contributi richiede una scelta esplicita. Il pacchetto deve mostrare anche i limiti della propria completezza: assenza di note condivise non significa assenza di lavoro precedente.

| Attore | Contributi propri | Storico condivisibile altrui | Appunti privati altrui | Nuovi dati del cane |
| --- | --- | --- | --- | --- |
| Autore durante relazione attiva | Crea e consulta nel proprio contesto | Solo se autorizzato | No | Solo ambito autorizzato |
| Autore dopo fine relazione | Consulta il proprio archivio, secondo conservazione | Solo con concessione ancora valida | No | Nessun accesso automatico |
| Nuovo professionista | Crea con relazione attiva autorizzata | Solo elementi autorizzati dal proprietario | No | Solo ambito autorizzato |
| Proprietario | Consulta i contributi resi condivisibili | Gestisce le concessioni autorizzate | No | Secondo la gestione cane esistente |
| Anonimo o professionista estraneo | No | No | No | No |
| Assistenza/amministrazione | Nessun accesso ordinario implicito ai media | Eventuale procedura separata, motivata e tracciata | Procedura separata | Procedura separata |

Il proprietario può revocare il passaggio di consegne; ciò non cancella automaticamente l'archivio originale dell'autore. Una revoca interrompe nuove letture e nuovi link; le copie già scaricate non possono essere richiamate tecnicamente. Download ed esportazioni devono avere permessi espliciti.

Non presumere che la presenza di un cane nel database provi proprietà legale, paternità di un media o consenso delle persone riprese. Il modello di autorizzazione del prodotto resta distinto da questi accertamenti.

## 4. Provenienza, storia e rettifiche

Ogni sessione conserva autore, cane, data effettiva dell'attività e data di registrazione. Una relazione dichiarata, una prenotazione accettata e una qualifica ufficiale non sono prove equivalenti.

Ogni nota distingue osservazioni, obiettivi, attività, risultati e interpretazioni. Può indicare fonti e limiti. Una diagnosi o un'etichetta comportamentale non deve essere dedotta automaticamente dal sistema.

Bozze modificabili; contributi finalizzati correggibili mediante revisioni attribuite, con motivo e cronologia. Il collega non modifica l'originale: aggiunge una nuova osservazione. La cronologia applicativa non costituisce certificazione ufficiale né prova di immutabilità assoluta.

Cancellazione e rettifica devono restare possibili attraverso procedure definite. Nessuna cronologia può essere usata come scorciatoia per conservare indefinitamente contenuti da eliminare.

## 5. Modello concettuale proposto, non schema definitivo

Nomi da confrontare con il repo prima di usarli:

- person_dog_relationships: persona, cane, tipo relazione, conferma, inizio/fine. Conservare dogs.owner_id come proprietario account primario.
- professional_sessions: autore, cane, attività, data, booking facoltativo, stato bozza/finalizzato. Verificare che booking e cane coincidano quando collegati.
- dog_professional_notes: sessione/cane/autore, visibilità, stato, versione corrente. Non usare una colonna gigantesca in dogs.
- professional_note_revisions: testo, autore revisione, data, motivo; accesso ereditato dalla nota.
- media_assets: uploader, contesto autorizzativo, stato, metadati verificati, checksum, conservazione e conteggio byte.
- media_variants: percorso privato, formato, dimensioni, durata, frame rate ove pertinente, byte, ruolo originale/master/anteprima/miniatura, versione del trattamento.
- note_media_links: nota/revisione e asset. Controllo esplicito di appartenenza e compatibilità di visibilità.
- continuity_access_grants: concedente, destinatario, cane, ambito storico, permessi, scadenza/revoca e motivazione.
- professional_audit_events: concessioni, revoche, finalizzazioni, esportazioni, trattamento e cancellazione; nessun testo integrale o URL firmato nei log.

Una nota può avere diversi media. Non duplicare l'asset per concedere un nuovo accesso. Non condividere un asset privato attraverso una nota pubblicata per errore: rendere esplicita e verificabile la scelta di condivisione per gli allegati.

La deduplicazione iniziale, se implementata, è limitata allo stesso dominio di autorizzazione e ad asset con provenienza compatibile. Non deduplicare tra clienti/account mediante hash esposti: si rischiano inferenze di esistenza, ambiguità di titolarità e cancellazioni incrociate.

## 6. Controlli di accesso

- Database e storage autorizzano ogni operazione; nascondere un pulsante non basta.
- auth.uid() determina l'identità: un professional_id inviato dal client non costituisce autorizzazione.
- Creazione: professionista abilitato, relazione attiva autorizzata, cane/sessione/booking coerenti.
- Archivio autore: accesso limitato ai contributi prodotti, senza riaprire il profilo corrente completo del cane o del cliente.
- Destinatario: concessione attiva per quello specifico cane e ambito, contributo condivisibile e stato media pronto.
- Bucket privati; autorizzare la generazione dei link brevi lato server. Un link firmato è una credenziale temporanea, non un sostituto del controllo di accesso.
- Revoca: niente nuovi link; quelli emessi possono restare validi fino alla scadenza. Stabilire il tempo massimo accettabile. Se serve revoca immediata, usare accesso mediato con controllo su ogni richiesta.
- Credenziali privilegiate solo nei servizi server; worker con privilegi minimi necessari.
- Cifratura in transito e a riposo da verificare nella configurazione del provider. La cifratura end-to-end non è assunta: deve essere valutata separatamente perché cambia elaborazione server, recupero e condivisione.

## 7. Pipeline media proposta

1. Autorizzazione e prenotazione atomica della quota prima dell'upload.
2. Upload in area privata temporanea, con oggetto non sovrascrivibile e scadenza; ripresa per file grandi se supportata.
3. Finalizzazione autenticata e idempotente: verificare proprietà, byte effettivi, firma del formato, limiti e integrità. MIME ed estensione del client non sono attendibili.
4. Quarantena: file non consultabile; scansione e decodifica in worker isolato con limiti di memoria, CPU e tempo.
5. Elaborazione asincrona: normalizzazione orientamento, rimozione metadati non necessari, compressione e varianti.
6. Verifica risultato: file decodificabile, parametri utili conservati, byte calcolati, checksum e collegamenti corretti.
7. Stato ready pubblicato atomicamente insieme alle varianti private. Fallimenti e tentativi non producono file pubblici o asset senza proprietario.
8. Pulizia dei temporanei scaduti, upload incompleti e varianti non referenziate; riconciliazione quote.

Stati proposti: initiated, uploaded, quarantined, processing, ready, failed, deletion_pending, deleted. Retry con limite e deduplicazione dei job. Firma breve per ciascuna risorsa, comprese miniature e segmenti quando esistono.

Nessuna trascrizione automatica, riconoscimento di persone o analisi AI dei video è autorizzata da questo documento. Sono eventuali funzioni future con scopi e permessi separati.

## 8. Compressione utile all'analisi

Nessun codec, bitrate, risoluzione, durata massima o prezzo è già approvato. Si scelgono dopo test su materiali rappresentativi, compatibilità dispositivi e costi.

| Mezzo | Obiettivo | Verifica prima di scartare l'originale |
| --- | --- | --- |
| Foto | Master ottimizzato + miniatura | Postura, occhi, orecchie, bocca e dettagli restano leggibili; orientamento corretto |
| Audio | Voce e segnali udibili con file leggero | Comandi, clicker, pause e vocalizzazioni non vengono tagliati; nessuna soppressione aggressiva dei silenzi |
| Video | Copia di analisi + anteprima | Movimenti rapidi, sequenze, frame rate utile e sincronizzazione audio/video sono conservati |

Non aumentare artificialmente la qualità di una sorgente scadente. Non ridurre automaticamente il frame rate se serve per l'analisi temporale. Non ricomprimere ripetutamente una copia già compressa.

Gli originali restano in quarantena privata fino al controllo della copia elaborata. Dopo, conservarli o eliminarli secondo una politica esplicita; una copia ottimizzata non è equivalente all'originale per tutti gli usi. Registrare la derivazione e le trasformazioni. Non presentare un video modificato come originale.

Foto/video possono includere persone, ambienti privati o metadati di localizzazione; metadati rimossi e contenuto visivo sono problemi distinti. Eventuali versioni con parti oscurate mantengono una provenienza separata e non rendono automaticamente condivisibile l'originale.

Streaming adattivo solo quando volume e uso lo giustificano; all'inizio file ottimizzati privati, senza costruire infrastruttura video sproporzionata.

## 9. Quote, costi e conservazione

Misurare originali, copie, miniature, temporanei, eventuali backup, elaborazione e traffico in uscita separatamente. Il costo non è solo spazio occupato. Nessun numero di capacità o costo è promesso prima della misurazione.

Definire limiti per file, durata, dimensioni decodificate, upload simultanei, account e periodo. Riservare quota prima del caricamento per evitare superamenti concorrenti; rilasciarla su errore e scadenza. Avvisare prima del limite e prevedere esportazione; non cancellare silenziosamente lo storico al cambio di piano.

Matrice di conservazione da completare prima del lancio del dominio: originali, master, anteprime, upload incompleti, file rifiutati, revisioni, log e backup. Per ogni categoria indicare durata, responsabile della decisione, cancellazione, eccezioni motivate e procedura di recupero.

La regola approvata è continuità e archivio autore, non conservazione perpetua di ogni dato. Termini di servizio e requisiti applicabili di conservazione/cancellazione richiedono una verifica dedicata prima dell'uso reale; questo documento non stabilisce basi giuridiche o diritti assoluti sui dati.

## 10. Cancellazione, backup ed esportazione

La cancellazione è un processo distinto dalla fine della relazione e dalla revoca. Verificare chi la richiede e quali riferimenti legittimi rimangono. Il riferimento a una nota non deve diventare un mezzo per impedire una cancellazione dovuta.

Ritirare prima gli accessi; poi eliminare gli oggetti e tutte le varianti previste, gestire cache e job pendenti e lasciare solo metadati minimi di processo quando appropriato. In caso di restore, applicare nuovamente le revoche e le cancellazioni per non reintrodurre accessi o contenuti eliminati.

Verificare separatamente backup Postgres e backup dei byte nello storage: non presumere che uno includa l'altro. Stabilire obiettivi di perdita dati/tempo di recupero, costi e prova di ripristino su un campione controllato prima del lancio.

Esportazioni autorizzate includono autore, date, revisioni pertinenti, riferimenti e media consentiti. Non includono appunti privati altrui, chiavi, URL firmati persistenti o dati estranei. Avvisare che file esportati non sono revocabili a distanza.

## 11. Ordine di implementazione

1. Documentare questa decisione e collegarla alla continuità (questo checkpoint).
2. Ispezionare schema, API/RLS/storage correnti e storico migration. Definire relazione autorizzata e ambito archivio senza alterare le vecchie migration.
3. Implementare sessioni e note testuali con revisioni e passaggio autorizzato; testare l'intera matrice degli accessi.
4. Aggiungere foto private e pipeline di quota, elaborazione, cancellazione e recupero.
5. Aggiungere audio e video dopo misurazioni di qualità, compatibilità, costo e limiti.
6. Testare fine relazione, revoca, account disattivato, cambio proprietario, file fallito e ripristino.
7. Rilasciare un incremento funzionante alla volta, aggiornando documentazione e CURRENT_STATE.md. Non accumulare funzioni non verificate.

## 12. Verifiche necessarie prima del rilascio

Usare account e cani di test separati: autore A, nuovo professionista B, professionista estraneo C, proprietario e anonimo.

- B non vede nulla prima della concessione, vede solo lo storico selezionato dopo, perde le nuove letture dopo la revoca.
- A conserva i propri contributi autorizzati dopo fine relazione, ma non vede nuove sessioni di B né nuovi dati privati del cliente.
- C e anonimo non ottengono note, nomi dei file, miniature o link firmati.
- Cambiare un ID di cane/nota/sessione/upload non permette di attraversare i confini autorizzativi.
- Condividere una nota non rende visibili allegati privati non selezionati.
- Due upload concorrenti rispettano le quote; retry non duplicano asset o conteggio byte.
- File corrotti, formati falsi e file oltre i limiti restano indisponibili; GPS non necessario rimosso dalle versioni distribuite.
- Compressione verificata su postura, segnali veloci, clicker, voce e sincronizzazione; test su dispositivi d'uso reali.
- La cancellazione elimina anche le varianti previste; il ripristino non annulla revoche o cancellazioni.

## 13. Decisioni ancora aperte

Le seguenti sono proposte tecniche, non decisioni già approvate: durata delle concessioni/link, criteri di finalizzazione delle note, gestione del cambio proprietario, periodo di conservazione degli originali, limiti e quote, codec/provider di elaborazione, esportazione/download, procedure straordinarie di assistenza, obiettivi backup e recupero.

Risolverle prima della rispettiva implementazione, con opzioni concrete. Non iniziare nuove migration solo perché i nomi concettuali sono elencati qui.
