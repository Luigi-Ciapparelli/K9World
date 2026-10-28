# PortaleCinofilo — ordine operativo

28 ottobre 2026. Email sospese su richiesta di Luigi; proseguire il lavoro tecnico.
Stato e prove in [CURRENT_STATE](CURRENT_STATE.md); decisioni in
[PRODUCT_DIRECTION](PRODUCT_DIRECTION.md). Questa è la coda operativa unica,
non un'autorizzazione generale a spendere, pubblicare o contattare terzi.

## Chiusi sul repository, non da reimplementare

NAV-01 / PRO-01 (`7f11610`), EXP-01 (`3ec87ad`) e REV-01 individuali/pensioni
(`fd619e4`) sono su `main`. Le regole sono superate dalla decisione REV-02 del
10 ottobre: voto alla prestazione prenotata; i centri non attendono TEAM-01.
Anche il riordino Impara (`204441b`) e le tre guide razza (`558e0d5`) sono su `main`.
Non ripetere l'installer di una funzione già presente per correggere un documento.
La conferma dell'ambiente online, dove manca, è un controllo circoscritto, non
un nuovo sviluppo né una ragione per negare i test locali già eseguiti.

## Lavori residui

L'ordine tecnico seguente è una proposta di esecuzione; un difetto concreto di
accesso, dati o prenotazioni ha precedenza. Non attendere tutte le capacità
future per dimostrare quelle già utilizzabili.

| ID | Priorità e ambito | Dipendenza / prossimo risultato concreto | Criterio di chiusura |
| --- | --- | --- | --- |
| TRUST-01 | Priorità corrente autorizzata il 21 ottobre | TRAINER_ADMISSION_V1 su main a510771: qualifica ENCI/CSEN/OPES/FISC e identità; applicazione remota da confermare con il controllo strutturale scripts/audit/real_use_privacy_status.sql | Test SQL/browser e rilascio coordinato; riesame dei profili esistenti senza cancellazioni |
| TRUST-02 | Privacy operativa e registrazione, autorizzate il 21 ottobre | Browser su main 41273c1 e pagine osservate online. PRIVACY_OPERATIONS_V1: termini per ruolo, informativa prima della raccolta, modelli diritti e procedura. SIGNUP_LEGAL_RECEIPTS_V1 aggiunge la ricevuta iniziale server; rilascio DB da verificare. Restano aggiornamenti contrattuali/account esistenti, informazioni del gestore, fornitori, conservazione, backup, minori/ruoli e revisione professionale | CI e deploy frontend distinti dalle evidenze operative; nessuna autocertificazione legale. Metadati Auth modificabili distinti dalla ricevuta privata; nessuna accettazione retroattiva o cancellazione automatica |
| SEC-03 | Rilasciato il 28 ottobre su main 5c0849d; CI e produzione confermate nella PR #7 | DEPENDENCY_SECURITY_V1: Vite 6.4.5, esbuild 0.25.12, lockfile e npm ci. Audit locale completo/produzione: zero vulnerabilità note; regressione server, TypeScript e build/SEO passati | Prove browser e rilascio verificati; audit datato, distinta esposizione degli strumenti di sviluppo. Nessun audit fix forzato né attestazione di conformità |
| ADMIN-01 | Presente su GitHub (`ff529e9`) | PROFESSIONAL_APPROVAL_V1: Annulla senza scrittura, note correnti, conferma esplicita e lettura dell’esito incerto | Test browser desktop/mobile e regressione Working-Dog; rilascio frontend senza migration |
| TRAIN-01 | Presente su GitHub (`d21abc5`, `d2f5b2b`) | Ricerca quotidiana diretta, bestiame/caccia facoltativi e qualifiche ENCI distinte; TRAINER_SPECIALIZATIONS_V1 | Rilascio coordinato senza scelta obbligatoria per il proprietario; fonti e stati delle qualifiche verificabili |
| ARCH-01 | Registrazione e lettura condivisa su GitHub (`9ed53bc`, `7155fb9`) | CONTINUITY_ACCESS_RECOVERY_V1: timeout, scadenza e rivalidazione del lettore, risposte controllate | Test browser desktop/mobile, regressione archivio; rilascio frontend senza migration |
| LESSON-01 | Presente su GitHub (`3ca2e4c`) | LESSON_RECORDING_V1: recupero della stessa registrazione, orari italiani, retry prenotazioni | Test browser desktop/mobile e regressioni; rilascio frontend, nessuna nuova migration |
| BOOK-02 | Presente su GitHub (`24aa9a4`) | BOOKING_DETAILS_V1: servizio, cane e fine prevista nelle prenotazioni; orari italiani e annullamento incerto | Proiezione privata, test SQL/browser e rilascio coordinato DB → frontend |
| AUTH-02 | Presente su GitHub (`f3e8aa2`) | ACCOUNT_STATE_RECOVERY_V1: isolamento richieste profilo, retry e timeout senza perdita sessione | Cambio account/uscita senza risposte residue; accesso, recupero e iscrizione preservati; rilascio frontend |
| HELP-01 | Presente su GitHub (`eb21b04`) | SITE_HELP_V1: sostituire risposte inglesi e promesse inesatte con guida italiana per ruolo | Link effettivi, ricerca locale, tastiera e mobile verificati; rilascio frontend |
| CRM-01 | Presente su GitHub (`f79320f`) | PROFESSIONAL_CLIENTS_V2: errori di salvataggio, retry, schede paginabili, dati dei cani trasferiti | Test locali mirati e rilascio coordinato DB/frontend; privacy delle note conservata |
| STAT-01 | Presente su GitHub (`216c760`) | PROFESSIONAL_ANALYTICS_V1: eliminare metriche inesatte e falsi zeri; aggregati privati per periodo, valore distinto dagli incassi | Conteggi completi, confini italiani, accesso limitato e UI desktop/mobile verificati; rilascio coordinato |
| AFF-01 | Recupero frontend prioritario per un difetto riprodotto | Pagina vuota quando fallisce un modulo: correttivo manuale su GitHub (`82caa1c`); PAGE_RECOVERY_V1. Causa del downtime storico ancora ignota | Rilascio del correttivo testato; nessuna attribuzione causale al vecchio episodio o acquisto di hosting |
| SEO-01 | Canonical ricevuta; richiesta inviata e sitemap riuscita; guide specifiche su GitHub | Osservazione di nuova scansione/canonical, poi pagine prioritarie; vedere SEO_INDEXATION_2026_10_09 | Diagnosi per famiglia/URL, interventi mirati e misurazione successiva; nessuna promessa di indicizzare tutto |
| IMG-01 | Identità visiva (`e6e38c9`) e ottimizzazione (`0f51f98`) su GitHub | Foto cani compresse e aggiornate dopo sostituzione, anteprime serializzate; PHOTO_UPLOAD_OPTIMIZATION_V1 | Non ripetere sviluppo/rilascio; restano distinti gli esiti Storage reali non osservati |
| MEDIA-01 | Implementazione rinviata per decisione del 9 ottobre | Quote per piano di abbonamento, tipi di file utili, compressione misurata, conservazione e costo totale prima della pipeline | Matrice approvata; solo dopo costruire flusso privato, revoca/download, limiti, cancellazione e ripristino |
| REV-02 | Regole su GitHub (`3a6674b`); recupero invii in PR #1 | SERVICE_REVIEW_RECOVERY_V1: esiti incerti, timeout, riapertura e isolamento fra prestazioni; backend invariato | Test browser desktop/mobile, stessi dati e riferimento al retry, un solo invio confermato; esito dell’ultima CI e deployment distinti dal collaudo online |
| TEAM-01 | Note, turni e coordinamento agenda su GitHub (`3b62ddd`) | CENTRE_AGENDA_DELEGATION_V1: grant/revoca per assegnazioni future agli altri, autore reale e controllo turni/assenze; ruoli più ampi richiedono perimetro distinto | Permesso minimo, revoca e storico; nessuna autoassegnazione per accedere agli archivi e valutazione sempre per prestazione |
| SPORT-03 | Presente su GitHub (`d2f5b2b`) | Credenziali modificate tornano da verificare; revisione e commit atomico, storico privato, pannello admin ripristinato; CREDENTIAL_VERIFICATION_INTEGRITY_V1 | Test nativi del pacchetto e rilascio DB → Edge → frontend; non dichiarare completato SPORT-02 |
| SPORT-02 | Identità su GitHub (`8a482aa`); fonte live e ranking restano separati | WORKING_DOG_IDENTITY_V1: revisione titolarità, ID stabile, versioni/revoche; automazione disattivata. Poi fonte ammessa e parser reale, regole per disciplina | Collegamento → verifica → badge/ranking e revoca, con prova reale; casi ambigui rimangono non verificati |
| SOC-01 | Preparazione commerciale in parallelo; trazione solo TikTok segnalata | Storyboard e scena campione; possibile trial 100 crediti, costo monetario proposto zero; verificare disponibilità effettiva prima di generare | Prodotto riconoscibile, contenuto corretto, ritagli/testi curati, destinazione funzionante e misurazione distinta dalle visualizzazioni |
| ECO-01 | Preparazione del primo uso, precisazione del 27 ottobre | BUSINESS_ROADMAP_V1 §4: dimostrazione breve e percorso essenziale verificato; TRUST-01/02 restano prioritari. Tre dimostrazioni concordate come obiettivo proposto, nessun contatto o annuncio automatico | Richieste con risposta e uso ripetuto distinti dai test; un bisogno documentato prima di scegliere una singola offerta facoltativa. Nessuna spesa o incasso attivato automaticamente |
| INT-01 | Dopo una prima prova utile italiana | Confronto di due mercati, lingua/assistenza/offerta e costo incrementale | Un mercato testato con decisione motivata; nessuna rete di siti acquistata in anticipo |
| MATCH-01 | Direttiva futura registrata il 19 ottobre 2026; progettazione e implementazione non avviate | Abbinamento tra proprietario, cane e professionista in PRODUCT_DIRECTION: conoscenze del cliente, esigenze del cane, obiettivi, attività offerte e vicinanza | Conservare la ricerca autonoma e la semplicità; resta da decidere se integrare il suggerimento o offrirlo come opzione. Nessun algoritmo o flusso da definire ora |
| PLUTO-01 | Direttiva futura del 21 ottobre 2026; attività sospesa | Assistente cinofilo educativo per adulti e bambini, conversazione limitata ai cani e tono giocoso; riferimento Clara Studio in PRODUCT_DIRECTION | Solo registrazione della direttiva. Nessuna ricerca, progettazione o implementazione prima del comando esplicito di Luigi; priorità correnti invariate |

## Input che mancano davvero a Luigi

1. **SEO:** CSV, URL e canonical sono già ricevuti. Richiesta inviata e sitemap
   riuscita già confermate. Manca soltanto l'esito di una nuova scansione Google:
   non chiedere di ripetere questi passaggi o cambiare DNS senza un nuovo riscontro.
2. **Downtime:** nessun altro dato storico disponibile per ora. Se ricapita,
   annotare ora locale, URL e messaggio: senza questi dati non assegnare una causa.
3. **Social:** usare il riscontro attuale senza inventare numeri; eventuali dati
   per post servono per confrontare il prossimo esperimento, non per bloccare lo storyboard.
4. **Higgsfield:** la possibilità di 100 crediti gratuiti è già comunicata;
   verificare l’effettivo accredito e il costo di una generazione quando si attiverà
   la prova. Nessun acquisto o rinnovo autorizzato da questo piano.

**Impara:** spostamento dell'ex lezione 2 alla posizione 8 su GitHub (`204441b`);
criteri e rilascio in [IMPARA_LESSON_ORDER_V1](IMPARA_LESSON_ORDER_V1.md).
Richiesta successiva: sostituzione del laboratorio con “Rex e il Clicker”, su
GitHub (`d3517b5`); gioco/lezione raggiungibili al controllo pubblico del 10 ottobre.
Criteri in [REX_CLICKER_V1](REX_CLICKER_V1.md);
nessuna nuova migration. IMG-01 è ora presente su GitHub (`e6e38c9`).

Questi input non sono prerequisiti per consolidare le direttive, preparare uno
storyboard o progettare un blocco indipendente. Non chiedere di rispiegare il prodotto.

## MEDIA-01: progettazione prima dell’implementazione

Non avviare ora upload foto/audio/video delle sessioni. Luigi ha anticipato
IMG-01 e la solidità tecnica. Le quote riguardano futuri piani del portale, non
gli abbonamenti alle lezioni venduti dai professionisti già presenti. Prima
di attivare il dominio definire la matrice per piano e i costi di storage,
traffico, elaborazione, varianti e backup. Nessun prezzo è deciso.

Sequenza da riprendere dopo queste decisioni:

1. Leggere archivio, sharing ed export correnti; fissare il primo tipo di allegato
   supportato e il suo legame con una revisione. Non creare una seconda storia del cane.
2. Definire quote e limiti, transizioni di upload/elaborazione, permessi di lettura
   e download, revoca, conservazione degli originali e costo massimo.
3. Implementare il primo flusso completo con allegati privati, gestione errori e
   permessi verificati. Nessun archivio pubblico o accesso globale dell'amministratore.
4. Introdurre audio/video dopo campioni e misure di qualità/costo, poi integrarli
   nell'export. Non cancellare automaticamente originali o dedurre consensi AI.

## Lancio, misure e ricavi

Una funzione in sviluppo alla volta, comunicazione su funzioni già utilizzabili.
Prima della dimostrazione verificare il percorso specifico: pagina di arrivo,
eventuale conferma email, azione e risposta. Non rifare ogni regressione senza
un rischio nuovo e non attendere l'indicizzazione di tutte le schede razza.

Primi obiettivi proposti: **5 professionisti esterni disponibili e 3 richieste
reali gestite**. Non sono risultati raggiunti né prova statistica di redditività.
Registrare periodo e fonte per profili completi, richieste/risposte, tempo di
risposta, ritorno all'uso, visite/azioni attribuibili, costi e ostacoli. Se un
dato manca scrivere «non misurato», non zero. Git conserva aggregati senza nomi.

Nessun invito o messaggio esterno parte dalla sola presenza di un piano.
Finanziamenti, inquadramento e prezzo richiedono fonti correnti prima della
decisione concreta. La rete di centri/franchising non è un prerequisito per
validare il portale. Tessere/campagne, learning avanzato e ulteriori domini
restano nel backlog, senza spostare automaticamente queste priorità.
