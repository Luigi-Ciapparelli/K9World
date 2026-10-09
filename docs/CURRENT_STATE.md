# PortaleCinofilo — stato corrente

Aggiornato il **9 ottobre 2026**. Base verificata con fetch di `origin/main`:
[`558e0d5`](https://github.com/Luigi-Ciapparelli/K9World/commit/558e0d573c1b7c679cd4d74936b2ab744e524f9d).
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
| Impara / diagnosi SEO | `204441b` | Timing spostato dalla posizione 2 alla 8; altre lezioni scalate; CSV e riscontri SEO conservati | Nessuna garanzia di indicizzazione; ordine e progressi preservati |

| Guide razze / SEO | `558e0d5` | Guide originali Shikoku, Clumber Spaniel e Dobermann, fonti e metadata specifici | Attendere riscontri Google; nessuna promessa di indicizzazione |

Specifiche: [Esposizioni](EXHIBITIONS_RELEASE_V1.md),
[export](DOG_HISTORY_EXPORT_V1.md), [valutazioni](SERVICE_REVIEWS_V1.md).
I vecchi testi «preparato localmente, da pubblicare» per questi tre blocchi sono superati.

La base GitHub contiene **54 migration**, fino a
`20261008220000_completed_service_reviews.sql`. Il nuovo incremento aggiunge
`20261009140000_profile_images.sql` (55ª). La presenza di un file non dimostra
che sia applicato nel database online.

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
| Impara | Otto lezioni, attività, quiz, quaderno e shaping; riordino su GitHub 1,3,4,5,6,7,8,2, rinumerato 1–8 | Slug e progressi preservati; nessun attestato ufficiale o sync account |
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

Il build di questo aggiornamento riporta **396 pagine HTML e 392 URL nella
sitemap**. Il controllo HTTP pubblico del 9 ottobre osserva anch’esso 392 URL,
con Esposizioni presente. Il conteggio di 391 dell’8 ottobre è storico.

## Riscontri esterni già disponibili

| Fonte e periodo | Cosa sappiamo | Cosa non dimostra |
| --- | --- | --- |
| Luigi, settembre 2026 | Registrazione e recupero password funzionanti; email ricevuta in inbox e rientro al dominio .com | Consegna di ogni futuro codice Edge o configurazione attuale senza controllo |
| Output CLI di Luigi, 30 settembre | Migration recapiti e deploy `account-contacts`, `send-verification-code`, `verify-code`; `CONTACT_SMS_ENABLED=false`; commit `599e152` | Nuovo collaudo dei servizi al 9 ottobre |
| Controllo pubblico, 8 ottobre | Campione di pagine HTTP 200, canonical, redirect .it → .com, 404 corretta | Tutte le pagine, funzioni autenticate, indicizzazione o causa del downtime |
| Luigi, 9 ottobre | Primi tre post; assenza di trazione segnalata sugli altri canali, visualizzazioni soltanto TikTok; possibile prova Higgsfield da 100 crediti | Conteggi comparabili, conversioni, prova già attiva o spesa autorizzata |
| CSV e URL ricevuti, 9 ottobre | 264 URL unici: 246 razze e 18 altre pagine; scansionate Shikoku/Clumber Spaniel/Dobermann; duplicata la home | Causa certa delle esclusioni |
| HTTP pubblico, 9 ottobre | Campione di 10 pagine e 4 varianti della home: HTTP finale 200, canonical coerenti, nessun noindex; tutti i 264 URL presenti nella sitemap | Indicizzazione, accessibilità storica o flussi autenticati |
| Luigi, Controllo URL della home | Alla scansione del 4 ottobre Google scelse la home senza www; dichiarata quella con www. Richiesta di indicizzazione inviata e sitemap riuscita, confermate il 9 ottobre | Nuova scansione già completata o canonical già aggiornata nell'indice |
| HTTP pubblico, secondo controllo 9 ottobre | Home, `/impara` e sitemap senza www restituiscono 308 verso www; home e sitemap www rispondono 200 | Tempi o scelta futura di Google |
| Git remoto, 9 ottobre | `558e0d5` include riordino Impara, analisi SEO e tre guide originali | Nuovo controllo autenticato di Vercel/Supabase |

## Residui identificati e dipendenze

| Blocco | Stato reale | Per procedere |
| --- | --- | --- |
| IMG-01 | Foto professionali/banner e foto cliente privata preparate e testate | Rilascio mediante installer, migration prima del frontend; prova Storage reale dopo Ready |
| MEDIA-01 | Allegati delle sessioni rinviati per decisione di Luigi | Prima matrice quote per abbonamento, utilità dei file, compressione, conservazione e costo totale; nessuna pipeline audio/video avviata |
| TEAM-01 | Manca attribuzione della prenotazione al singolo istruttore del centro | Modellare persona/team/assegnazione e storia delle modifiche; poi estendere REV-01 |
| SPORT-02 | Basi presenti, flusso reale e ranking completo non attestati | Verifica identità/fonte, criteri per disciplina, invalidazione/revoca, integrazione e prova reale |
| SEO-01 | Canonical ricevuta, redirect coerenti, richiesta inviata e sitemap riuscita; tre guide specifiche su GitHub | Osservare nuova scansione, canonical e pagine prioritarie. Non chiedere di nuovo i dati già ricevuti |
| AFF-01 | Luigi conferma che la causa è rimasta ignota; piano gratuito soltanto ipotizzato | Nessun acquisto basato sull’ipotesi; se ricapita raccogliere ora/URL/errore e correlare log |
| SOC-01 | Concept approvato; possibile trial da 100 crediti comunicato, video non prodotto | Storyboard e scena campione; verificare crediti/costo reale della generazione prima dell’uso, nessuna spesa attivata |
| ECO-01 / INT-01 | Modello economico e mercati da validare | Utilizzo reale, costi e disponibilità a pagare; fonti aggiornate prima di domande di fondi o spese |

Ulteriori direttive restano nel [backlog completo](PRODUCT_DIRECTION.md):
learning/credenziali futuri, team, formazione ENCI, biblioteca, tessere/campagne,
editoria, ricerca, commercio e rete di centri. La loro presenza nel piano non è
prova di implementazione. Priorità e criteri: [EXECUTION_PRIORITIES](EXECUTION_PRIORITIES_2026_10.md).

## Incremento immagini preparato il 9 ottobre

Foto/logo professionale visibile in ricerca e profilo, upload banner anche per
individuali e handler; editor con anteprima, ridimensionamento e WebP. Una foto
personale facoltativa del cliente, privata e visibile nei contesti autorizzati
(prenotazioni, calendario, dashboard, CRM). Percorsi fissi per sostituire le copie
senza produrre nuovi oggetti a ogni upload. Nessun allegato di sessione introdotto.
Specifica e limiti: [PROFILE_IMAGES_V1](PROFILE_IMAGES_V1.md).

SQL verificato ricostruendo le 54 migration precedenti e la nuova in PostgreSQL
WASM: ruoli, isolamento, stati prenotazione, relazione bilaterale, revoca e cambio
proprietario. Auth/Storage sono dipendenze simulate. Test browser con API simulate,
compressione reale nel browser, TypeScript, build e HTML SEO: vedere la specifica.
Non sono prove del database online, dei byte nello Storage reale o di concorrenza
nativa. Nessun nuovo audit remoto Supabase è stato eseguito.

Da questo ambiente manca l'autenticazione GitHub in scrittura. L'installer WSL
prepara backup, verifica compatibilità e test, controlla il dry-run, crea il commit,
applica soltanto la migration prevista e invia main. **Preparato non significa già
online**: registrare output Supabase, commit remoto e Vercel Ready dopo l'esecuzione.
Nessuna spesa, invio esterno o modifica delle tariffe autorizzata da questo incremento.
