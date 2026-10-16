# Messaggi delle lezioni per gli istruttori del centro

16 ottobre 2026. Incremento TEAM-01 sulla base `origin/main` osservata a `b4b8b6f`.
Stato di rilascio in [CURRENT_STATE](CURRENT_STATE.md).

## Percorso e ambito

1. In **Istruttori del centro**, il responsabile sceglie un account già collegato
   e attiva **Consenti messaggi delle lezioni**. Il permesso nasce disattivato,
   anche per i collegamenti esistenti, ed è distinto dal completamento.
2. La conferma spiega che l'istruttore leggerà la conversazione completa delle
   sole lezioni assegnate, inclusi i messaggi precedenti di quelle prenotazioni.
3. In **Collaborazioni con i centri**, sulla lezione compare **Messaggi**, con
   conteggio dei messaggi da leggere. La lettura personale non segna come letta
   la conversazione per il centro o per il cliente.
4. L'istruttore scrive con il proprio account. Cliente e centro vedono
   **Nome della persona · Istruttore del centro** nella conversazione esistente.
5. Rimuovere il permesso, revocare il collegamento, disattivare l'istruttore o
   riassegnare la lezione blocca letture e nuovi invii. Le risposte già inviate
   restano nella conversazione e nell'export autorizzato del cane.

Solo servizi formativi (`trainer`, `enci_course`), lezioni accettate o completate,
con inizio successivo all'accettazione del collegamento. Email confermata e
ruolo ammesso; esclusa la delega quando la persona è essa stessa il cliente.
Il cliente e il centro mantengono la loro conversazione anche negli altri stati,
secondo il comportamento precedente. La delega non apre le richieste in attesa,
le lezioni cancellate/rifiutate, altre prenotazioni o lo storico generale del cane.

Nessun accesso aggiuntivo ai recapiti del profilo, note della richiesta, note
private, modelli di risposta del centro o gestione del servizio. Il testo libero
nella conversazione può naturalmente contenere informazioni condivise dai
partecipanti. L'informazione su chi può leggere è visibile nella chat e nella
sezione di visibilità dell'informativa. Nessun invio email/SMS o notifica esterna.

## Integrità e sicurezza

Migration aggiuntiva **20261016110000_centre_instructor_messages.sql**, 66ª:
nessuna migration precedente riscritta.

- Permesso `can_message_clients` con versione attesa e evento di audit.
- RPC dedicate agli istruttori; le API originarie di cliente/professionista
  conservano il proprio perimetro. Le API pubbliche sono invoker; implementazioni
  private definer con `search_path` vuoto. Helper interno non eseguibile dai client.
- Letture, invii e ricevute ricontrollano appartenenza, permesso, assegnazione,
  account verificato e versioni. La concessione non può essere simulata dal browser.
- Invii e ricevute bloccano prima il centro, poi la prenotazione: stesso ordine
  usato da revoca e assegnazioni. Non si impersona l'account del centro.
- UUID del tentativo conserva il risultato di un invio incerto senza duplicarlo.
  Un retry con contenuto, autore o assegnazione diversi viene respinto.
- Il messaggio conserva il vero `sender_id`; `booking_message_actors` conserva
  nome all'invio, autore, appartenenza e versione dell'assegnazione. Tabella privata
  con RLS, senza accessi diretti per anon/authenticated/service_role.
- La cancellazione dell'account di un istruttore scollega il mittente live e non
  cancella le conversazioni dei clienti del centro. Nome e testo storico restano;
  la cancellazione della prenotazione continua a eliminare la relativa chat.
  I nomi dei normali partecipanti conservano il comportamento precedente.
- Export: aggiunto solo il nome storico dell'istruttore per i messaggi già inclusi
  dall'autorizzazione esistente; nessun identificativo account/audit aggiunto.
- Chat con pagine da 50 messaggi e testo entro 4000 caratteri. Contatori nell'agenda
  già limitata a 300 lezioni; nessun caricamento globale delle conversazioni.

Al primo rifiuto per permessi/versioni la chat svuota i messaggi caricati e blocca
la scrittura. Risposte di rete ormai obsolete non possono ripopolare l'elenco.
La revoca è applicata dal server a ogni richiesta; non può ritirare copie già lette.
Errori temporanei richiedono aggiornamento prima di un nuovo invio. Il refresh
periodico dell'agenda non rimonta il dialogo quando l'assegnazione non è cambiata.

## Prove

- PostgreSQL WASM/PGlite: 65 migration precedenti più nuova; regressioni team,
  assegnazioni, account, completamento, assenze giornaliere e orarie.
- Test nuovi: permesso iniziale negato, concessione e versioni, isolamento,
  lezione non assegnata/storica, cliente coincidente con istruttore, email non
  confermata, admin senza delega, retry, pagine precedenti/successive, letture
  separate, revoca, riassegnazione, nome dopo rinomina/cancellazione ed export.
- Browser reale 1440/390 px con API simulate: concessione, dialogo nell'agenda,
  risposta visibile al cliente con autore, retry dopo esito incerto, niente
  modelli/note del centro, errore recuperabile e revoca con chat aperta. Regressione
  permesso/completamento precedente passata; nessun overflow o errore JS osservato.
- TypeScript, build/SEO (396 HTML, 392 URL) e lint dei componenti modificati
  passati. Le aree personali restano escluse dalla sitemap.
- Runner PostgreSQL nativo incluso con **cinque casi su due connessioni**:
  invio/revoca permesso e invio/riassegnazione in entrambi gli ordini, doppio invio
  concorrente dello stesso tentativo. Non eseguito qui: server nativo assente;
  viene richiesto prima della pubblicazione dal terminale di Luigi.

Auth/Storage e risposte API browser simulati. Nessun account, messaggio reale,
Supabase online o deployment Vercel modificato durante questa preparazione.

## Rilascio e residui

`aggiorna_messaggi_istruttori.py ~/K9World --publish` verifica base/file, salva
backup, esegue PostgreSQL nativo, TypeScript/build/SEO e dry-run. Esegue poi commit
locale recuperabile, db push e push su main. Accetta solo questa migration ed
eventualmente quella delle fasce orarie, se ancora in attesa; nessun altro SQL.
Nessuna nuova dipendenza, Edge Function, secret, servizio a pagamento o campagna.
Dopo Vercel Ready verificare il percorso con centro/istruttore/cliente autorizzati.

Restano separati: note professionali con autore e concessioni, ruoli organizzativi
più ampi e turni ricorrenti. Il permesso messaggi non abilita nessuno di questi.
