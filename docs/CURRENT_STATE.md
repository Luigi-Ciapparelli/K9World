# PortaleCinofilo — stato corrente

Aggiornato il **9 ottobre 2026**. Base verificata con fetch di `origin/main`:
[`fd619e4`](https://github.com/Luigi-Ciapparelli/K9World/commit/fd619e484e31828cc3c6cecf64c1aec285d0ae33).
Questo registro è mantenuto manualmente; il generatore scrive in
[TECHNICAL_SNAPSHOT](TECHNICAL_SNAPSHOT.md). I checkpoint precedenti sono nello
[storico](PROJECT_HISTORY.md), non sono ulteriori istruzioni da eseguire.

## Come leggere gli stati

- **GitHub:** codice e documentazione inclusi nel commit remoto esaminato.
- **Test locali:** prove pertinenti documentate, con i limiti della relativa specifica.
- **Riscontro online:** osservazione datata o output fornito da Luigi; non un collaudo permanente.
- **Da completare:** parte mancante identificata; non ricostruire ciò che esiste già.

## Incrementi recenti presenti su GitHub

| Blocco | Commit remoto | Risultato | Limite residuo |
| --- | --- | --- | --- |
| NAV-01 / PRO-01 | `7f11610` | Ricerca quotidiana Addestratori/Pensioni; Esposizioni con Toelettatura/Handler; attività nel profilo guidato | Una categoria selezionata non certifica una qualifica |
| EXP-01 | `3ec87ad` | Storico autorizzato in HTML stampabile in PDF e JSON; archivio autore e selezioni ricevute | Audio/video e documenti delle sessioni assenti; luoghi solo quando registrati nelle note; limiti dimensionali espliciti |
| REV-01 | `fd619e4` | Recensioni dal secondo servizio con un addestratore individuale; pensione dal primo; voto sul cliente privato | Reciprocità per centri sospesa finché manca l'istruttore assegnato; moderazione completa futura |

Specifiche: [Esposizioni](EXHIBITIONS_RELEASE_V1.md),
[export](DOG_HISTORY_EXPORT_V1.md), [valutazioni](SERVICE_REVIEWS_V1.md).
I vecchi testi «preparato localmente, da pubblicare» per questi tre blocchi sono superati.

Il repository contiene **54 migration**, fino a
`20261008220000_completed_service_reviews.sql`. Questo è un conteggio dei file
versionati, non la prova che tutte siano applicate nel database online.

Gli incrementi riportano test SQL, TypeScript, build/SEO e prove browser con dati
sintetici. Auth/Storage e API browser sono simulati nelle prove descritte;
non equivalgono a verifiche dei servizi reali. Per REV-01 non è attestata la
concorrenza su due connessioni PostgreSQL native. In questo consolidamento non
sono stati ripetuti test applicativi, eseguite migration o consultati pannelli privati.
Vercel Ready e stato Supabase degli ultimi tre incrementi non sono stati
osservati direttamente: **non segnalarli come falliti né come verificati**.

## Funzioni già presenti, da non ricostruire

| Area | Implementazione nel repository | Confine importante |
| --- | --- | --- |
| Home e ricerca | Home con immagine statica; percorso pre-cane facoltativo; aiuto diretto, Sport ed Esposizioni separati | Non ripristinare la porta animata o un selettore iniziale obbligatorio |
| Impara | Otto lezioni, attività, quiz, quaderno, shaping sulla piattaforma; basi di condizionamento classico/operante | Progressi locali nel browser, non attestati ufficiali né sincronizzazione account |
| Cani | Identità/razza FCI, data di nascita, scheda e foto private | Nessun tracciamento GPS continuo introdotto |
| Account | Registrazione, recupero password, email/telefono modificabili, verifiche e conferme previste dal flusso | Modalità lancio email-only; SMS disattivati per contenere costi |
| Profilo professionale | Procedura guidata, identità visiva, esperienza, credenziali, attività/servizi e visibilità | Dato dichiarato, approvazione profilo e qualifica verificata sono distinti |
| Richieste | Nome e note richiedente, accettazione/rifiuto/completamento, conversazioni e modelli di risposta | Nessuna integrazione WhatsApp o campagna esterna deducibile dai modelli |
| Calendario | Impegni e colori dei servizi, pausa e indisponibilità con termine | Non cancellare automaticamente appuntamenti già accettati |
| CRM e continuità | Clienti autorizzati, inviti bilaterali, sessioni, note/revisioni, archivio autore e condivisione selettiva | Prenotazione accettata e relazione attiva sono due cose diverse |
| Pacchetti e abbonamenti | Assegnazioni, lezioni residue, scadenze, storni e periodi/rinnovi confermati | Nessun incasso o addebito automatico implementato da questi strumenti |
| Sport | Ricerca separata, discipline, visibilità indipendente, credenziali; basi del parser/merito per disciplina | Verifica reale completa Working-Dog e collegamento del nuovo ranking restano da chiudere |
| SEO | URL pubblici, HTML prerenderizzato, canonical, sitemap, robots e 404 | Il build non dimostra l'indicizzazione Google |
| Sicurezza API | RLS, RPC controllate, proiezioni pubbliche e confine `pc_private` | Uno storico audit positivo non certifica ogni modifica successiva |

Il collaudo build degli incrementi recenti riporta 396 pagine HTML e 392 URL
nella sitemap; il controllo HTTP pubblico dell'8 ottobre osservava invece 391
URL. Sono rilevazioni diverse, non un nuovo conteggio live effettuato oggi.

## Riscontri esterni già disponibili

| Fonte e periodo | Cosa sappiamo | Cosa non dimostra |
| --- | --- | --- |
| Luigi, settembre 2026 | Registrazione e recupero password funzionanti; email ricevuta in inbox e rientro al dominio .com | Consegna di ogni futuro codice Edge o configurazione attuale senza controllo |
| Output CLI di Luigi, 30 settembre | Migration recapiti e deploy `account-contacts`, `send-verification-code`, `verify-code`; `CONTACT_SMS_ENABLED=false`; commit `599e152` | Nuovo collaudo dei servizi al 9 ottobre |
| Controllo pubblico, 8 ottobre | Campione di pagine HTTP 200, canonical, redirect .it → .com, 404 corretta | Tutte le pagine, funzioni autenticate, indicizzazione o causa del downtime |
| Luigi, 7–8 ottobre | Primi tre post pubblicati; visualizzazioni riportate soltanto da TikTok | Conteggi, ripartizione dei post, conversioni o efficacia comparativa misurata |
| Search Console riportata da Luigi | 264 rilevate/non indicizzate; 3 scansionate/non indicizzate; 1 duplicata con canonica Google diversa | Quali URL siano interessati o una causa già accertata |
| Git remoto, 9 ottobre | `fd619e4` include export, Esposizioni e nuove valutazioni | Nuovo controllo autenticato di Vercel/Supabase |

## Residui identificati e dipendenze

| Blocco | Stato reale | Per procedere |
| --- | --- | --- |
| MEDIA-01 | Pipeline allegati privati delle sessioni non implementata | Progettare quote, compressione, permessi, conservazione, download e recupero; eventuale spesa richiede tetto esplicito |
| TEAM-01 | Manca attribuzione della prenotazione al singolo istruttore del centro | Modellare persona/team/assegnazione e storia delle modifiche; poi estendere REV-01 |
| SPORT-02 | Basi presenti, flusso reale e ranking completo non attestati | Verifica identità/fonte, criteri per disciplina, invalidazione/revoca, integrazione e prova reale |
| SEO-01 | Diagnosi URL incompleta | Export dei tre gruppi Search Console; canonical Google del duplicato |
| AFF-01 | Causa dell'interruzione sconosciuta | Data, ora/fuso, URL, errore o schermata; correlare log dei componenti |
| SOC-01 | Concept approvato; campagna Higgsfield non prodotta | URL/statistiche dei tre post; storyboard, scena campione e budget/crediti disponibili |
| ECO-01 / INT-01 | Modello economico e mercati da validare | Utilizzo reale, costi e disponibilità a pagare; fonti aggiornate prima di domande di fondi o spese |

Ulteriori direttive restano nel [backlog completo](PRODUCT_DIRECTION.md):
learning/credenziali futuri, team, formazione ENCI, biblioteca, tessere/campagne,
editoria, ricerca, commercio e rete di centri. La loro presenza nel piano non è
prova di implementazione. Priorità e criteri: [EXECUTION_PRIORITIES](EXECUTION_PRIORITIES_2026_10.md).

## Chiusura di questo consolidamento

Solo documentazione, indice iniziale e destinazione del generatore diagnostico.
Nessun cambio a interfaccia, regole di accesso, database, account o campagna.
Al successivo rilascio aggiornare le righe coinvolte con commit ed evidenza;
non anteporre un altro resoconto lasciando in vigore quello precedente.
