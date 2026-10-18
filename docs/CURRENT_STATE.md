# PortaleCinofilo — stato corrente

Aggiornato il **18 ottobre 2026**. Base verificata con fetch di `origin/main`:
`f79320f` (Clienti e cani incluso).
Questo registro è mantenuto manualmente; il generatore scrive in
[TECHNICAL_SNAPSHOT](TECHNICAL_SNAPSHOT.md). I checkpoint precedenti sono nello
[storico](PROJECT_HISTORY.md), non sono ulteriori istruzioni da eseguire.

## Guida rapida — incremento locale corrente

[SITE_HELP_V1](SITE_HELP_V1.md): il vecchio assistente inglese prometteva
rimborsi, sconti e prenotazioni ricorrenti non implementati. Sostituito da una
guida italiana disponibile prima e dopo l'accesso, con argomenti per ruolo,
ricerca sul dispositivo e collegamenti alle pagine effettive.
Test Node, TypeScript, lint mirato, build/SEO e browser 1440/390 per quattro
ruoli con API simulate. Nessuna migration, provider AI o invio automatico.
Installer: `aggiorna_guida_portale.py`. Pubblicazione di questo incremento
ancora da eseguire; il test locale non certifica Vercel Ready.

## Clienti e cani — presente su GitHub

Il fetch del 18 ottobre osserva `f79320f`. Non ripetere il pacchetto precedente.
Presenza su GitHub, SQL online e deployment Ready sono evidenze distinte.

[PROFESSIONAL_CLIENTS_V2](PROFESSIONAL_CLIENTS_V2.md): appunti e tag confermati dal
server, retry con UUID stabile, schede e ricerca paginata, euro e ultimo/prossimo
appuntamento distinti. Protezione dei cani passati a un altro proprietario anche
nella API legacy. Nessuna estensione della condivisione delle note private.
71ª migration `20261017220000_professional_client_workspace.sql`.

Prove locali: 70 migration precedenti più nuova su PGlite, fixture di permessi,
ricerca, retry, revoca e cani trasferiti; browser 1440/390 con API simulate;
contratti Node, TypeScript, lint mirato e build/SEO. Runner PostgreSQL nativo
incluso come gate dell'installer, non eseguito qui. Nessuna prova online dichiarata.
Installer precedente: `aggiorna_clienti_professionali.py`; ora presente su GitHub.

## Statistiche professionali — presenti su GitHub

Il fetch del 17 ottobre osserva `216c760`. [PROFESSIONAL_ANALYTICS_V1](PROFESSIONAL_ANALYTICS_V1.md):
aggregati privati per periodo italiano, clienti tornati calcolati sul totale,
valore dei servizi distinto dagli incassi; 70ª migration.
Non ripetere l'installer precedente. Il push non certifica applicazione SQL
online, test nativo sul PC di Luigi o Vercel Ready.

## Coordinamento agenda — presente su GitHub

Il fetch del 17 ottobre osserva `3b62ddd`. [CENTRE_AGENDA_DELEGATION_V1](CENTRE_AGENDA_DELEGATION_V1.md):
permesso revocabile per agenda e assegnazioni future agli altri istruttori,
autore reale, turni/assenze e versioni. Migration 69ª.
Non ripetere l’installer precedente. Il push non certifica da solo applicazione
SQL online, test nativi eseguiti sul PC di Luigi o deployment Ready.

## Note e turni degli istruttori — presenti su GitHub

Il fetch del 17 ottobre osserva `10163b9`, che comprende anche `7b0603d`.
[CENTRE_LESSON_NOTES_V1](CENTRE_LESSON_NOTES_V1.md): note con autore personale,
revisioni, archivio del centro/persona e consenso selettivo, migration 67ª.
[INSTRUCTOR_WEEKLY_SHIFTS_V1](INSTRUCTOR_WEEKLY_SHIFTS_V1.md): giorni e fasce
ricorrenti gestiti dal centro, lettura per il collega e blocco delle nuove
assegnazioni fuori fascia, migration 68ª. Lezioni già fissate conservate.
Il push osservato non certifica da solo SQL online e deployment Ready.

## Messaggi delle lezioni assegnate — presenti su GitHub

[CENTRE_INSTRUCTOR_MESSAGES_V1](CENTRE_INSTRUCTOR_MESSAGES_V1.md): permesso separato
per le conversazioni delle sole lezioni assegnate, autore reale e letture distinte.
66ª migration `20261016110000_centre_instructor_messages.sql`. Il fetch del
16 ottobre osserva `9855c8f`; non ripetere il pacchetto precedente. SQL online e
Vercel Ready restano evidenze distinte dal fetch.

## Indisponibilità per fasce orarie — presenti su GitHub

[INSTRUCTOR_HOURLY_TIME_OFF_V1](INSTRUCTOR_HOURLY_TIME_OFF_V1.md): centro e persona
collegata possono indicare alcune ore dello stesso giorno, oltre alle giornate intere.
Il calendario distingue le fasce dall’assenza totale; le assegnazioni e gli avvisi
usano l’intervallo preciso. Prenotazioni già accettate conservate. Orari italiani,
confini adiacenti ammessi e gestione esplicita del cambio dell’ora.
Nuova migration `20261016090000_instructor_hourly_time_off.sql` (65ª).

Prove: 64 migration precedenti più nuova su PGlite, regressioni team/collegamenti,
completamento e assenze; test di confini, isolamento, retry e ora legale/solare.
Browser desktop/mobile con API simulate, anche con fuso del browser estero;
TypeScript e build/SEO. Test nativo incluso con tredici casi concorrenti,
non eseguito qui; richiesto dall’installer sul PC di Luigi. Auth/Storage simulati.
Il fetch del 16 ottobre osserva `b4b8b6f` su `origin/main`. Non ripetere il
pacchetto precedente; esiti SQL online e Ready restano distinti dal fetch.

## Conferma delle lezioni assegnate — presente su GitHub

[CENTRE_LESSON_PERMISSIONS_V1](CENTRE_LESSON_PERMISSIONS_V1.md): il centro concede
un permesso esplicito, inizialmente disattivato. L’istruttore collegato può segnare
come svolte solo le proprie lezioni accettate, dopo l’orario di fine. Versioni,
revoca e audit con autore reale; nessun accesso aggiuntivo a note o messaggi.
La valutazione resta riferita alla singola prestazione, con le soglie già previste.
Nuova migration `20261014210000_centre_lesson_completion_permissions.sql` (64ª).

Prove locali: storia SQL completa su PGlite e regressioni team/calendario/assenze;
UI desktop/mobile con API simulate, concessione, conflitto recuperabile, conferma
con autore e revoca contro pagina obsoleta; TypeScript e build/SEO passati.
Il test PostgreSQL nativo include undici casi concorrenti, quattro nuovi su
completamento/revoca e completamento/riassegnazione. Non eseguito qui: è un gate
dell’installer sul PC di Luigi. Auth/Storage simulati, nessuna prova online implicita.
Il fetch del 16 ottobre osserva `b8b30c2` su `origin/main`. Non ripetere il
pacchetto precedente. SQL online e Vercel Ready restano evidenze distinte dal push.

## Indisponibilità istruttori — presenti su GitHub

[INSTRUCTOR_TIME_OFF_V1](INSTRUCTOR_TIME_OFF_V1.md): date di assenza per singolo
istruttore, inseribili dal centro o dalla persona collegata. Blocco nuove assegnazioni,
avvisi sulle lezioni già fissate, calendario filtrato e audit privato. Migrazione 63ª.
Il fetch del 16 ottobre osserva `9216c48`. Non ripetere l’installer precedente.
Applicazione SQL e Ready di Vercel non sono dimostrati dal fetch.

## Ricerca e verifica credenziali — presenti su GitHub

Pacchetto unico TRAIN-01 + SPORT-03: ricerca educatori immediata e specializzazioni
facoltative; verifiche legate alla revisione dei dati e storico privato. Ripristinato
il pannello di revisione nella dashboard admin. Il fetch del 13 ottobre osserva
`d21abc5` e `d2f5b2b` su `origin/main`. Applicazione SQL, deploy Edge e Vercel
restano esiti distinti, non verificati con il solo fetch.

Dettagli: [TRAINER_SPECIALIZATIONS_V1](TRAINER_SPECIALIZATIONS_V1.md) e
[CREDENTIAL_VERIFICATION_INTEGRITY_V1](CREDENTIAL_VERIFICATION_INTEGRITY_V1.md).
Verifiche locali: 58 migrazioni ricostruite su PGlite, test Edge, browser desktop/mobile,
TypeScript e build/SEO. Auth/Storage/provider simulati; concorrenza PostgreSQL nativa
richiesta dall’installer sul PC di Luigi, non eseguita qui. Il pacchetto include
anche la migrazione TRAIN-01, se ancora mancante. Nessuna fonte sportiva live verificata.

## Working-Dog — presente su GitHub

[WORKING_DOG_IDENTITY_V1](WORKING_DOG_IDENTITY_V1.md): collegamento tramite
identificativo stabile, revisione della titolarità, storico privato e invalidazione
dei risultati quando il collegamento cambia. Il semplice nome non è più una prova.
Le richieste pendenti non riservano il profilo di altri professionisti. La revisione
admin e il verificatore usano versioni attese; un controllo automatico non annulla
una revoca amministrativa. Pannello admin e messaggi al professionista aggiornati.

La nuova migration è `20261013083000_working_dog_identity_binding.sql`:
59ª nella storia locale. Riporta da verificare tutti i vecchi collegamenti
verificati, il cui URL era modificabile, e i risultati attestati automaticamente.
Conserva dati e storico; le credenziali verificate manualmente restano tali.
`WORKING_DOG_RESULT_AUTOVERIFY_ENABLED=false` nel rilascio: fonte live non
collaudata, nessun nuovo ranking o badge attivato. Verifica manuale disponibile.

Prove: 58 migration precedenti più la nuova su PGlite con ruoli, isolamento,
invalidazione e compatibilità ricerca; Edge/parser/fetch con fixture sintetiche;
TypeScript, build/SEO e browser desktop/mobile con API simulate. Il test nativo
include due casi concorrenti e deve passare sul PC di Luigi prima del rilascio.
Supabase online, accesso reale al provider e deployment non verificati da questi test.

Il fetch del 13 ottobre osserva il commit remoto `8a482aa`. La presenza su
GitHub non dimostra da sola esito SQL, deploy Edge o Vercel Ready. Non ripetere
il rilascio senza un difetto: registrare gli esiti effettivi quando disponibili.

## Istruttori e calendario del centro — presenti su GitHub

[CENTRE_INSTRUCTORS_V1](CENTRE_INSTRUCTORS_V1.md): area `/pro/team`, nomi
interni attivi/inattivi, assegnazione facoltativa alle lezioni accettate da
richieste e calendario, lettura del cliente e nome storico nell’export del cane.
Le assegnazioni concluse sono bloccate; rinomina e inattività non cambiano il
nome salvato. Le recensioni restano sulla singola prestazione.
[CENTRE_CALENDAR_V1](CENTRE_CALENDAR_V1.md) aggiunge filtri per istruttore e
lezioni accettate da assegnare. Le sovrapposizioni richiedono una conferma
esplicita del centro, registrata nell’audit, per consentire le lezioni di gruppo.

60ª e 61ª migration locali: `20261013180000_centre_instructor_assignments.sql`
e `20261014004500_centre_instructor_calendar.sql`. PGlite: storia completa,
ruoli, versioni, isolamento, export, cancellazione centro, recensioni e
sovrapposizioni, compresi retry e compatibilità della vecchia RPC. Browser
desktop/mobile con API simulate: creazione, conflitto, conferma di gruppo,
filtri, errore di lettura e vista proprietario. TypeScript, build e SEO superati.
Tre casi concorrenti PostgreSQL nativi sono forniti e richiesti dall’installer:
non eseguiti in questo ambiente. Nessun test online effettuato.

Il fetch del 14 ottobre osserva `5abbe6f` (elenco e assegnazioni) e
`b6b4c0c` (calendario e sovrapposizioni) su `origin/main`. Non ripetere i vecchi
installer. SQL online e Vercel Ready restano evidenze distinte dal push.

## Collegamento degli account istruttore — presente su GitHub

[CENTRE_MEMBERSHIPS_V1](CENTRE_MEMBERSHIPS_V1.md): codice personale a scadenza,
proposta del centro, accettazione/rifiuto e revoca da entrambe le parti. L’account
collegato legge soltanto l’agenda delle lezioni assegnate che iniziano dopo
l’accettazione, con servizio e nomi di cliente/cane. Nessun accesso a recapiti,
note o messaggi. Il completamento è una delega separata, presente su GitHub;
il collegamento da solo non la concede. I ruoli account restano invariati.

Nuova 62ª migration `20261014090000_centre_account_memberships.sql`.
PGlite: 61 precedenti più nuova, consenso/versioni, permessi, scadenze e revoche,
calendario e storico preservati. Browser desktop/mobile con API simulate,
TypeScript e build/SEO passati. Il test nativo comprende cinque casi concorrenti,
forniti per il PC di Luigi, non eseguiti qui. Nessuna prova online implicita.

Il fetch del 16 ottobre osserva `b08aabf` su GitHub. Non ripetere il pacchetto
account. SQL online e Ready restano evidenze distinte. Le indisponibilità sono
ora su GitHub, insieme alla delega di completamento; le assenze per alcune ore
sono su GitHub. Messaggi nel pacchetto corrente; restano note, ruoli e turni ricorrenti.

## Email sospese

Luigi ha chiesto di lasciare da parte le email e proseguire le direttive tecniche.
Non inviare inviti e non riprendere raccolta contatti, fogli o campagne.
L’aggiornamento privacy è su GitHub (`7521dd3`); non prova un invio.
Il materiale precedente rimane in [PROFESSIONAL_CONTACT_INVITATIONS_V1](PROFESSIONAL_CONTACT_INVITATIONS_V1.md).

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

La base GitHub contiene **64 migration**, fino a
`20261014210000_centre_lesson_completion_permissions.sql`. Il pacchetto corrente
aggiunge la 65ª. Un file nel repository non dimostra l’applicazione online.

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
| TRAIN-01 | Ricerca quotidiana immediata, collegamenti bestiame/caccia e qualifiche ENCI distinte su GitHub (`d21abc5`, `d2f5b2b`) | Registrare solo gli esiti Supabase/Vercel non osservati; non ripetere lo sviluppo |
| IMG-01 | Foto professionali/banner e foto cliente privata su GitHub (`e6e38c9`) | Confermare soltanto gli esiti non osservati: applicazione migration, Ready e prova Storage reale; non ripetere lo sviluppo |
| MEDIA-01 | Allegati delle sessioni rinviati per decisione di Luigi | Prima matrice quote per abbonamento, utilità dei file, compressione, conservazione e costo totale; nessuna pipeline audio/video avviata |
| REV-02 | Presente su GitHub (`3a6674b`): voto alla specifica prestazione | Esiti online distinti; non ripetere sviluppo o rilascio senza un difetto |
| TEAM-01 | Elenco, calendario, account, assenze anche orarie e completamento su GitHub; messaggi nel pacchetto corrente | Rilascio messaggi delegati; poi note, ruoli e turni ricorrenti. Nessun voto alla persona |
| SPORT-02 | Titolarità/versioni su GitHub (`8a482aa`); fonte live e ranking completo non attestati | Verifica identità/fonte, criteri per disciplina, invalidazione/revoca, integrazione e prova reale |
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

## Ricerca addestratori — TRAIN-01, presente su GitHub al 13 ottobre

Ricerca quotidiana immediata, collegamenti facoltativi bestiame/caccia, preferenze
professionali indipendenti e sezioni ENCI con prova/stato distinti. Filtri aggiuntivi
richiusi su mobile; guida in Impara senza cambiare ordine o progressi.
[Specifica, prove e limiti](TRAINER_SPECIALIZATIONS_V1.md). Migration aggiuntiva
`20261010170000_trainer_specializations.sql`; installer `aggiorna_ricerca_addestratori.py`.
Il fetch del 13 ottobre osserva TRAIN-01 su `origin/main` (`d21abc5` e `d2f5b2b`).
Applicazione SQL e deploy non sono verificati dal solo fetch.
