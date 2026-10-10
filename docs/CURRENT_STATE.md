# PortaleCinofilo — stato corrente

Aggiornato il **10 ottobre 2026**. Base verificata con fetch di `origin/main`:
[`3a6674b`](https://github.com/Luigi-Ciapparelli/K9World/commit/3a6674b1bf26235bb542c4d32891c4b1ba1e0e0a).
Questo registro è mantenuto manualmente; il generatore scrive in
[TECHNICAL_SNAPSHOT](TECHNICAL_SNAPSHOT.md). I checkpoint precedenti sono nello
[storico](PROJECT_HISTORY.md), non sono ulteriori istruzioni da eseguire.

## Incremento pronto, non ancora osservato su GitHub

Pacchetto unico TRAIN-01 + SPORT-03: ricerca educatori immediata e specializzazioni
facoltative; verifiche legate alla revisione dei dati e storico privato. Ripristinato
il pannello di revisione nella dashboard admin. L’ultimo fetch osservato resta
`3a6674b`: non presentare questi cambiamenti come già online.

Dettagli: [TRAINER_SPECIALIZATIONS_V1](TRAINER_SPECIALIZATIONS_V1.md) e
[CREDENTIAL_VERIFICATION_INTEGRITY_V1](CREDENTIAL_VERIFICATION_INTEGRITY_V1.md).
Verifiche locali: 58 migrazioni ricostruite su PGlite, test Edge, browser desktop/mobile,
TypeScript e build/SEO. Auth/Storage/provider simulati; concorrenza PostgreSQL nativa
richiesta dall’installer sul PC di Luigi, non eseguita qui. Il pacchetto include
anche la migrazione TRAIN-01, se ancora mancante. Nessuna fonte sportiva live verificata.

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
| REV-01 | `fd619e4` | Recensioni dal secondo servizio con un addestratore individuale; pensione dal primo; voto sul cliente privato | Modello precedente superato dalla decisione REV-02; vedere incremento preparato sotto |
| Impara / diagnosi SEO | `204441b` | Timing spostato dalla posizione 2 alla 8; altre lezioni scalate; CSV e riscontri SEO conservati | Nessuna garanzia di indicizzazione; ordine e progressi preservati |
| IMG-01 | `e6e38c9` | Foto/logo, banner professionali e ritratti privati dei clienti; compressione nel browser e controllo accessi | Push Git osservato; Storage reale, migration applicata e frontend Ready non osservati direttamente |
| Recupero pagine | `82caa1c` | Pagina di recupero manuale, offline e caricamento lento; bozze preservate | Causa del vecchio downtime ignota; Ready non osservato |
| Ottimizzazione foto | `0f51f98` | Foto cane WebP con anteprima esatta, sostituzione aggiornata e ritaglio serializzato | Frontend pubblico e Storage reale non collaudati da questo ambiente |
| Rex e il Clicker | `d3517b5` | Minigioco fornito da Luigi nella lezione 8; progressi e isolamento | Gioco e lezione HTTP 200 il 10 ottobre; nessuna sessione utente reale collaudata online |
| Guide razze / SEO | `558e0d5` | Guide originali Shikoku, Clumber Spaniel e Dobermann, fonti e metadata specifici | Attendere riscontri Google; nessuna promessa di indicizzazione |

Specifiche: [Esposizioni](EXHIBITIONS_RELEASE_V1.md),
[export](DOG_HISTORY_EXPORT_V1.md), [valutazioni](SERVICE_REVIEWS_V1.md).
I vecchi testi «preparato localmente, da pubblicare» per questi tre blocchi sono superati.

La base GitHub contiene **56 migration**, fino a
`20261010113000_booking_service_reviews.sql`. Il nuovo gioco non aggiunge SQL. La presenza
di un file non dimostra che sia applicato nel database online.

Gli incrementi riportano test SQL, TypeScript, build/SEO e prove browser con dati
sintetici. Auth/Storage e API browser sono simulati nelle prove descritte;
non equivalgono a verifiche dei servizi reali. Per REV-01 non è attestata la
concorrenza su due connessioni PostgreSQL native. Il correttivo
di recupero pagina ripete i test frontend pertinenti, non la storia SQL; nessuna
migration eseguita o consultazione di pannelli privati.
Vercel Ready e stato Supabase degli ultimi tre incrementi non sono stati
osservati direttamente: **non segnalarli come falliti né come verificati**.

## Funzioni già presenti, da non ricostruire

| Area | Implementazione nel repository | Confine importante |
| --- | --- | --- |
| Home e ricerca | Home con immagine statica; percorso pre-cane facoltativo; aiuto diretto, Sport ed Esposizioni separati | Non ripristinare la porta animata o un selettore iniziale obbligatorio |
| Impara | Rex e il Clicker sostituisce il vecchio laboratorio su GitHub e nella pagina pubblica; otto lezioni, attività, quiz e quaderno; riordino su GitHub 1,3,4,5,6,7,8,2, rinumerato 1–8 | Slug e progressi preservati; nessun attestato ufficiale o sync account |
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
| TRAIN-01 | Priorità corrente: ricerca quotidiana immediata, collegamenti bestiame/caccia, qualifiche ENCI distinte; preparata localmente | Installer coordinato, poi registrare esiti Supabase/GitHub/Vercel; TRAINER_SPECIALIZATIONS_V1 |
| IMG-01 | Foto professionali/banner e foto cliente privata su GitHub (`e6e38c9`) | Confermare soltanto gli esiti non osservati: applicazione migration, Ready e prova Storage reale; non ripetere lo sviluppo |
| MEDIA-01 | Allegati delle sessioni rinviati per decisione di Luigi | Prima matrice quote per abbonamento, utilità dei file, compressione, conservazione e costo totale; nessuna pipeline audio/video avviata |
| REV-02 | Presente su GitHub (`3a6674b`): voto alla specifica prestazione | Esiti online distinti; non ripetere sviluppo o rilascio senza un difetto |
| TEAM-01 | Manca attribuzione organizzativa della prenotazione al singolo istruttore del centro | Persona/team/assegnazione e storia; non necessario per REV-02 e nessun trasferimento dei voti |
| SPORT-02 | Basi presenti, flusso reale e ranking completo non attestati | Verifica identità/fonte, criteri per disciplina, invalidazione/revoca, integrazione e prova reale |
| SEO-01 | Canonical ricevuta, redirect coerenti, richiesta inviata e sitemap riuscita; tre guide specifiche su GitHub | Osservare nuova scansione, canonical e pagine prioritarie. Non chiedere di nuovo i dati già ricevuti |
| AFF-01 | Causa storica ignota; riprodotta separatamente una pagina bianca quando un modulo della UI fallisce | Recupero manuale su GitHub (`82caa1c`) e testato, vedere PAGE_RECOVERY_V1; non dedurre la causa del vecchio episodio, raccogliere dati se ricapita |
| SOC-01 | Concept approvato; possibile trial da 100 crediti comunicato, video non prodotto | Storyboard e scena campione; verificare crediti/costo reale della generazione prima dell’uso, nessuna spesa attivata |
| ECO-01 / INT-01 | Modello economico e mercati da validare | Utilizzo reale, costi e disponibilità a pagare; fonti aggiornate prima di domande di fondi o spese |

Ulteriori direttive restano nel [backlog completo](PRODUCT_DIRECTION.md):
learning/credenziali futuri, team, formazione ENCI, biblioteca, tessere/campagne,
editoria, ricerca, commercio e rete di centri. La loro presenza nel piano non è
prova di implementazione. Priorità e criteri: [EXECUTION_PRIORITIES](EXECUTION_PRIORITIES_2026_10.md).

## Incremento immagini preparato il 9 ottobre, ora presente su GitHub

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

Il fetch successivo osserva il commit remoto `e6e38c9` con questo incremento.
Resta distinta la verifica del database e del deploy reali.
Da questo ambiente manca l'autenticazione GitHub in scrittura. L'installer WSL
ha consentito il passaggio a GitHub osservato nel fetch. Per chiudere la verifica
di IMG-01 registrare gli esiti Supabase e Vercel effettivi, senza ripetere il rilascio
in assenza di un difetto concreto.
Nessuna spesa, invio esterno o modifica delle tariffe autorizzata da questo incremento.

## Rex e il Clicker — 10 ottobre, pubblicato su GitHub

Sostituisce il vecchio gioco dello shaping nella lezione 8 con il file HTML fornito
da Luigi, conservando cane e scenario. Gioco isolato, nessuna richiesta a Supabase,
progressi Rex per fase e compatibilità con il vecchio completamento. Audio
facoltativo, pausa, tastiera/tocco, dimensioni responsive e modalità senza fretta.

Superati TypeScript, build/SEO, test dei progressi e prova browser desktop/mobile:
partita completa, click anticipato, ripresa parziale, vecchio completamento,
quaderno/backup e isolamento del gioco. API browser simulate. Non è un collaudo
online con account. Il fetch del 10 ottobre osserva `d3517b5`; GET pubblico del
gioco (redirect a `/games/rex-clicker`) e della lezione
`/impara/stage-1/osservazione-timing-marker` restituiscono HTTP 200 e contengono
Rex. Il gioco è noindex; la lezione è indicizzabile. Nessuna osservazione del
pannello Vercel Ready. Dettagli in [REX_CLICKER_V1](REX_CLICKER_V1.md).

## Ottimizzazione foto — 10 ottobre, presente su GitHub

Corretto il caricamento delle foto del cane: copia WebP entro 512 × 512 e
160 KiB, anteprima dei byte effettivi, aggiornamento della scheda dopo una
sostituzione sullo stesso percorso. La copia non viene compressa due volte.
Editor professionale/cliente: elaborazioni serializzate, movimenti del ritaglio
accorpati, lavoro obsoleto annullato e salvataggio legato all’anteprima corrente.

Browser reale desktop/mobile con API simulate: formati falsi respinti, invio
esattamente della copia mostrata, dimensioni/byte, sostituzione senza nuovo file,
rimozione, annullamento e massimo un decoder attivo per editor. TypeScript,
build e HTML SEO superati. Nessun nuovo test SQL: schema e policy invariati.
Il fetch successivo osserva il commit remoto `0f51f98`; il rilascio Git è avvenuto.
Non ripetere l’installer per aggiornare lo stato. Resta distinto il collaudo
del frontend pubblicato e dello Storage reale.
[Specifica, limiti e rilascio](PHOTO_UPLOAD_OPTIMIZATION_V1.md).

## Recupero pagine — 10 ottobre, presente su GitHub

Riproduzione sulla build precedente: una risposta 404 al modulo di Impara
svuotava l’interfaccia React. Aggiunti confini di errore per pagina e applicazione,
recupero manuale, avviso offline e indicazione dopo 10 secondi di caricamento.
Navigazione fra le altre pagine mantenuta quando fallisce soltanto il contenuto.
Nessun refresh automatico o reinvio di operazioni. Query dei passaggi guidati
non rimontano il modulo, preservando le bozze esistenti.

Browser reale: modulo mancante, rete assente e ripristinata, caricamento lento,
errore di rendering, ricarica manuale e navigazione. Regressioni pertinenti:
profilo guidato con bozze e recupero password. API e guasti simulati; nessun
servizio online o account modificato. TypeScript, build e HTML SEO superati.
Nessuna nuova migration, dipendenza o spesa. Installer WSL:
`aggiorna_recupero_pagine.py`. Push osservato nel fetch: `82caa1c`. Deploy e pannello Ready non osservati.
[Specifica, prove e limiti](PAGE_RECOVERY_V1.md).

## Valutazioni per prestazione — 10 ottobre, presenti su GitHub

La richiesta di Luigi sostituisce il voto al rapporto con un giudizio sulla
singola lezione/servizio svolto. Centri inclusi dalla seconda prestazione formativa;
altre categorie dal primo servizio. Contesto congelato all’accettazione, schede
distinte, storico precedente preservato, voti privati isolati. Rimossi punteggi
generali e filtri/ordinamenti per valutazione del professionista.

Nuova migration `20261010113000_booking_service_reviews.sql`, successiva alle
55 presenti nella base osservata. Test SQL su storia completa, API browser
simulate, TypeScript e build/SEO; dettagli in [SERVICE_REVIEWS_V2](SERVICE_REVIEWS_V2.md).
Installer `aggiorna_valutazioni_prestazioni.py` per il rilascio coordinato da WSL.
Fetch del 10 ottobre: push osservato nel commit `3a6674b`. Applicazione online
e deployment di REV-02 non osservati direttamente.
Nessun allegato multimediale, contatto esterno, nuova spesa o modello team aggiunto.

## Ricerca addestratori — TRAIN-01, preparata il 10 ottobre

Ricerca quotidiana immediata, collegamenti facoltativi bestiame/caccia, preferenze
professionali indipendenti e sezioni ENCI con prova/stato distinti. Filtri aggiuntivi
richiusi su mobile; guida in Impara senza cambiare ordine o progressi.
[Specifica, prove e limiti](TRAINER_SPECIALIZATIONS_V1.md). Migration aggiuntiva
`20261010170000_trainer_specializations.sql`; installer `aggiorna_ricerca_addestratori.py`.
Nessun push, SQL online o deploy eseguito da questo ambiente per TRAIN-01.
