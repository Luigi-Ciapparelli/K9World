# PortaleCinofilo — ordine operativo

10 ottobre 2026. Stato e prove in [CURRENT_STATE](CURRENT_STATE.md); decisioni in
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
| TRAIN-01 | Prima direttiva da eseguire, approvata da Luigi | Ricerca quotidiana diretta, bestiame/caccia facoltativi e qualifiche ENCI distinte; implementazione locale TRAINER_SPECIALIZATIONS_V1 | Rilascio coordinato senza scelta obbligatoria per il proprietario; fonti e stati delle qualifiche verificabili |
| AFF-01 | Recupero frontend prioritario per un difetto riprodotto | Pagina vuota quando fallisce un modulo: correttivo manuale su GitHub (`82caa1c`); PAGE_RECOVERY_V1. Causa del downtime storico ancora ignota | Rilascio del correttivo testato; nessuna attribuzione causale al vecchio episodio o acquisto di hosting |
| SEO-01 | Canonical ricevuta; richiesta inviata e sitemap riuscita; guide specifiche su GitHub | Osservazione di nuova scansione/canonical, poi pagine prioritarie; vedere SEO_INDEXATION_2026_10_09 | Diagnosi per famiglia/URL, interventi mirati e misurazione successiva; nessuna promessa di indicizzare tutto |
| IMG-01 | Identità visiva (`e6e38c9`) e ottimizzazione (`0f51f98`) su GitHub | Foto cani compresse e aggiornate dopo sostituzione, anteprime serializzate; PHOTO_UPLOAD_OPTIMIZATION_V1 | Non ripetere sviluppo/rilascio; restano distinti gli esiti Storage reali non osservati |
| MEDIA-01 | Implementazione rinviata per decisione del 9 ottobre | Quote per piano di abbonamento, tipi di file utili, compressione misurata, conservazione e costo totale prima della pipeline | Matrice approvata; solo dopo costruire flusso privato, revoca/download, limiti, cancellazione e ripristino |
| REV-02 | Presente su GitHub (`3a6674b`); esiti online distinti | Valutazioni per singola prestazione, anche nei centri; SERVICE_REVIEWS_V2 | Migration e frontend coordinati; un voto non si sposta sulla lezione successiva e non genera una media dell’attività |
| TEAM-01 | Successivo o anticipato da un centro reale | Persona, appartenenza al team e istruttore assegnato alla prenotazione; indipendente da REV-02 | Tracciabilità organizzativa e permessi limitati; nessun trasferimento di meriti o voti dal servizio alla persona |
| SPORT-03 | Correzione sicurezza preparata con TRAIN-01 | Credenziali modificate tornano da verificare; revisione e commit atomico, storico privato, pannello admin ripristinato; CREDENTIAL_VERIFICATION_INTEGRITY_V1 | Test nativi del pacchetto e rilascio DB → Edge → frontend; non dichiarare completato SPORT-02 |
| SPORT-02 | Blocco separato dopo verifica dei consumer esistenti | Identità Working-Dog, accesso ammesso alla fonte, parser reale e regole per disciplina | Collegamento → verifica → badge/ranking e revoca, con prova reale; casi ambigui rimangono non verificati |
| SOC-01 | Preparazione commerciale in parallelo; trazione solo TikTok segnalata | Storyboard e scena campione; possibile trial 100 crediti, costo monetario proposto zero; verificare disponibilità effettiva prima di generare | Prodotto riconoscibile, contenuto corretto, ritagli/testi curati, destinazione funzionante e misurazione distinta dalle visualizzazioni |
| ECO-01 | In parallelo all'utilizzo italiano | Conversazioni autorizzate e un problema professionale concreto; costi reali | Offerta B2B facoltativa e disponibilità a pagare documentate, senza attivare incassi automaticamente |
| INT-01 | Dopo una prima prova utile italiana | Confronto di due mercati, lingua/assistenza/offerta e costo incrementale | Un mercato testato con decisione motivata; nessuna rete di siti acquistata in anticipo |

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
