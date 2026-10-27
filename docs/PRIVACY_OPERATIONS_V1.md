# Privacy operativa e registrazione — 21 ottobre 2026

Stato: correzioni frontend e procedura predisposte sulla base `41273c1`.
Non è una certificazione di conformità e non sostituisce la revisione del
trattamento effettivo. Esiti di CI e rilascio sono registrati nella PR del blocco.
Nessuna migration, cancellazione di dati o invio di messaggi in questo rilascio.

## Cosa cambia per chi usa il sito

- Informativa sintetica prima dei campi account e dei dati del cane.
- Accettazione esplicita e non preselezionata dei termini: quelli professionali
  sono richiesti solo ai professionisti. La privacy non è un consenso marketing.
- Link ai testi in una nuova scheda, senza perdere il modulo di registrazione.
- Revisione dei testi `2026-10-21.1`, inviata nella dichiarazione di iscrizione.
- Pagina `/privacy#richieste-privacy` con sei modelli e destinatario ufficiale:
  accesso, rettifica, cancellazione, limitazione, portabilità, opposizione/revoca.
  Copia e apertura dell'app email **non inviano** la richiesta; l'interfaccia lo dice.
- Link legali nelle normali aree personali. `/professional-terms` mantiene il
  footer pubblico: non è una sottopagina dell'area `/pro`.
- Esplicitato che note, revisioni e riferimenti possono sopravvivere alla chiusura
  di relazioni/account, senza diventare dati conservabili per sempre.

### Limite della dichiarazione di iscrizione

`legal_declaration` è trasmessa dal client in Supabase `user_metadata`, che
l'utente può modificare. Non è una ricevuta immutabile, un consenso marketing,
una prova di lettura o una barriera server. Non va usata per autorizzare accessi.
Il blocco del modulo impedisce l'invio accidentale senza accettazione nel sito;
non impedisce chiamate dirette all'API Auth. Nessun assenso retroattivo è attribuito
agli utenti esistenti. Il prossimo incremento dovrà definire e collaudare una
registrazione server della dichiarazione iniziale e degli aggiornamenti, separata
dai metadati modificabili, con rilascio coordinato Auth/database/frontend.

I testi della revisione sono archiviati in `docs/legal/2026-10-21.1/`.
Ad ogni modifica sostanziale cambiare versione, conservare i testi precedenti
e valutare comunicazione/nuova accettazione; non falsificare la data di un consenso.

## Gestione delle richieste: responsabile operativo Luigi Ciapparelli

1. Controllare la casella `info@portalecinofilo.com`. All'arrivo aprire una pratica
   privata e segnare data di ricezione, ambito e scadenza ordinaria di **un mese
   di calendario**. Non far partire il termine dalla lettura dell'email.
2. Confermare la ricezione e chiarire l'ambito solo se necessario. Il sito non
   richiede un account attivo o l'uso del modello. Non chiedere motivazioni per
   il semplice accesso né un documento d'identità a tutti indistintamente.
3. Verificare l'identità in misura proporzionata al rischio e ai dubbi concreti.
   Privilegiare una sessione autenticata o il recapito già confermato; una email
   qualsiasi non autorizza a consegnare un archivio. Non chiedere password o OTP.
4. Cercare i dati nei sistemi pertinenti alla richiesta, comprese copie e archivi
   professionali. Distinguere i ruoli di portale, centro e istruttore per quel
   trattamento: non presumere che siano sempre titolari congiunti o responsabili.
5. Preparare una risposta comprensibile, proteggendo i dati di terzi. Accesso e
   portabilità non hanno lo stesso perimetro. Consegnare eventuali esportazioni
   tramite un canale verificato e con accesso limitato, non con link pubblici.
6. Eseguire solo operazioni individuate e autorizzate nella pratica. Conservare
   la traccia minima delle azioni, del motivo di eventuali esclusioni e degli esiti.
   Per rettifica/cancellazione/limitazione valutare la comunicazione ai destinatari
   prevista dall'articolo 19 GDPR, salvo le eccezioni applicabili.
7. Rispondere entro un mese anche in caso di diniego, con motivazione e indicazione
   del reclamo al Garante e degli altri rimedi. Per complessità o numero di richieste
   l'estensione può arrivare ad altri due mesi; comunicare motivo ed estensione
   entro il primo mese. Nessuna proroga automatica per mancanza di tempo.

La gestione è di regola gratuita. Eccezioni, rifiuti e dubbi sui diritti vanno
valutati sul caso concreto con supporto qualificato, non decisi dal generatore email.
Non inviare automaticamente un riscontro che prometta cancellazioni già completate.

### Registro privato: schema minimo

Creare il registro effettivo in uno spazio riservato con accesso limitato a chi
gestisce le richieste. **Non inserire pratiche, email, export o documenti in GitHub.**

| Campo | Contenuto minimo |
| --- | --- |
| Riferimento pratica | Identificativo interno senza nome nel titolo |
| Ricezione e scadenza | Data, canale, scadenza ordinaria, eventuale proroga e motivo |
| Tipo e ambito | Diritto esercitato e sistemi da controllare |
| Verifica identità | Metodo, esito e data; evitare copie del documento salvo necessità |
| Responsabile e stato | Presa in carico, verifica, azione, risposta, chiusura |
| Esito per sistema | Rettificato, cancellato, limitato o conservato con motivazione |
| Comunicazioni | Date di riscontri e riferimenti alle prove private |
| Riesame conservazione | Data/criterio di eliminazione della pratica stessa |

Questa tabella è un modello vuoto: non prova che la casella sia monitorata o che
una richiesta reale sia stata gestita. Prima di dichiarare il processo operativo,
eseguire una prova interna autorizzata e conservarne l'esito privatamente.

## Conservazione e cancellazione: perimetro da completare

La politica quantitativa non è ancora approvata. Non inventare periodi standard
di 30 giorni o 10 anni per tutte le categorie e non pubblicare promesse ineseguibili.
Definire per ogni riga finalità, base, evento iniziale, durata/criterio, azione,
responsabile e verifica dell'esito; aggiornare poi l'informativa pubblica.

| Categoria | Controllo necessario prima di chiudere una richiesta |
| --- | --- |
| Account e recapiti | Auth, profilo, vecchi recapiti, sessioni e metadati di onboarding; considerare anche dati del cane duplicati nei metadati |
| Foto e documenti | Oggetti Storage, varianti, riferimenti, eventuali file di verifica; eliminare un record non elimina necessariamente il file |
| Prenotazioni e messaggi | Servizi ancora in corso, riferimenti a proprietario/cane, copie nel centro; conservare solo ciò che ha ancora una finalità documentata |
| Archivio professionale | Sessioni, note, revisioni, nomi salvati al momento dell'evento, autore, concessioni e audit; scollegare l'account non anonimizza il contenuto |
| Valutazioni e qualifiche | Contenuti pubblici, documentazione privata, fonti e moderazione; distinguere contenuto da prova strettamente necessaria |
| Inviti e opposizioni | Registro Google e posta: invii sospesi, riesaminare necessità e autorizzazioni; eventuale elenco di opposizioni minimo e separato |
| Log e fornitori | Durate e cancellazioni reali nei pannelli, destinatari/subfornitori e accessi amministrativi |
| Backup ed esportazioni | Durata delle copie, scadenza, accesso, trattamento al ripristino e copie scaricate dai professionisti |
| Richieste privacy | Prova minima della gestione, durata motivata, accesso riservato |

La conservazione per una contestazione concreta richiede ambito e riesame:
non autorizza a trattenere ogni dato. Le copie dei professionisti richiedono
valutazione dei rispettivi ruoli e basi, non una promessa di richiamare file già
scaricati. Revocare accessi, cancellare e anonimizzare sono azioni diverse.

Non eseguire cancellazioni massive prima della mappatura e di una prova isolata.
Questo non sospende i diritti né le scadenze delle richieste che arrivano oggi:
gestirle manualmente e coinvolgere tempestivamente un referente qualificato.

## Fornitori, accessi e ripristino

Per Vercel, Supabase, Resend e Google raccogliere **evidenze dell'account usato**:
contraente, piano, servizi, DPA applicabile e modalità di adesione, regioni,
subfornitori, meccanismi di trasferimento, retention, esportazione/cancellazione,
amministratori e MFA. Un DPA pubblicato può essere incorporato nei termini:
non presumere né che manchi una firma né che il contratto sia già quello corretto.
Per Google verificare se si tratta di Workspace o di un account consumer;
l'indirizzo con dominio personalizzato da solo non lo dimostra.

Le prove contrattuali vanno conservate privatamente, non insieme al codice.
L'ubicazione europea del database non dimostra da sola l'assenza di trasferimenti.
Rivedere necessità del telefono obbligatorio e campi di note libere per minimizzare
i dati: l'attuale blocco non cambia il contratto di onboarding del database.

Provare un ripristino in un ambiente isolato con accessi limitati, registrando
perimetro, tempo e risultato. Non sovrascrivere la produzione. Il piano va definito
sulle capacità del piano reale; backup presente non significa ripristino collaudato.
Le cancellazioni già eseguite devono essere considerate prima di riattivare una copia.

## Incidenti e pubblicazione di nuove funzioni

Per una possibile violazione: limitare l'esposizione, preservare le prove con
accessi ristretti, registrare quando se ne è avuta conoscenza, valutare natura e
rischio per le persone e documentare le decisioni. Se ricorrono i presupposti,
notificare al Garante senza ingiustificato ritardo e possibilmente entro 72 ore;
in caso di rischio elevato valutare anche la comunicazione agli interessati.
Anche le violazioni non notificate vanno documentate. Non attendere un audit
completo per iniziare la valutazione e non pubblicare dati dell'incidente nel repo.

Prima di aggiungere analytics, pubblicità, video esterni, profilazione o assistenti
AI, riesaminare finalità, dati, fornitori, consenso ove necessario e rischi.
Le sole funzioni tecniche non giustificano un generico pulsante «accetta tutto».
PLUTO-01, MATCH-01 e MEDIA-01 mantengono i limiti già decisi.

## Blocchi ancora aperti, senza attestazioni automatiche

1. Luigi deve indicare il domicilio/sede da rendere pubblico come gestore e il
   corretto inquadramento dell'attività. Non ricavarlo da vecchie chat o inventare
   società, partita IVA, registrazioni o un DPO. La verifica fiscale va fatta ora
   in funzione dell'attività effettiva, non soltanto quando arrivano incassi.
2. Completare ruoli e basi per ciascun trattamento, registro delle attività,
   conservazione, fornitori e rischi; valutare l'eventuale necessità di DPIA/DPO.
3. Definire accesso dei minori e contratti: la soglia per il consenso privacy non
   equivale automaticamente alla capacità di concludere contratti.
4. Classificare il servizio ai fini DSA/P2B, obblighi informativi e tutela dei
   consumatori, comprese le eventuali esenzioni applicabili. Gratuito o senza
   pagamenti integrati non significa automaticamente esente.
5. Verificare l'applicazione remota della migration di ammissione addestratori
   `20261021100000_verified_trainer_admission.sql` e riesaminare i profili esistenti.
   Il merge `a510771` prova il codice, non l'esecuzione sul database reale.
6. SEC-03 resta aperto: analizzare gli advisory senza aggiornamenti forzati.

## Fonti primarie controllate il 21 ottobre 2026

- Garante, [informativa e principi](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/8981258),
  [diritti](https://www.garanteprivacy.it/regolamentoue/diritti-degli-interessati),
  [cookie](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876),
  [violazioni dei dati](https://www.garanteprivacy.it/data-breach).
- EDPB, [titolare/responsabile](https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en),
  [misure e responsabilità](https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en),
  [trasferimenti](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en).
- Parlamento, [D.Lgs. 70/2003, art. 7](https://www.parlamento.it/parlam/leggi/deleghe/03070dl.htm).
- AGCOM, [destinatari DSA](https://www.agcom.it/competenze/piattaforme-online/digital-service-act/soggetti-destinatari).
- Testi pubblici dei fornitori, non prova del contratto del progetto:
  [Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum),
  [Vercel DPA](https://vercel.com/legal/dpa), [Resend DPA](https://resend.com/legal/dpa),
  [Google Cloud/Workspace DPA](https://cloud.google.com/terms/data-processing-addendum/).
- Supabase, [metadati utente](https://supabase.com/docs/guides/auth/managing-user-data).

## Verifiche del rilascio

TypeScript, lint mirato, build e SEO; browser con API sintetiche per registrazione
proprietario/quattro attività, consenso contrattuale non preselezionato, cambio
ruolo, errore/retry, modelli privacy e clipboard negata, desktop/mobile.
Non sono prove di consegna email reale, contratti, cancellazioni o restore online.
