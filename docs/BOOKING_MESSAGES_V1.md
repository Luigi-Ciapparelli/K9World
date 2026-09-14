# Messaggi delle prenotazioni e risposte professionali

## Stato e dipendenze

Incremento successivo al calendario `a712352`, confermato su `main` dal terminale dell'utente. La disponibilità del deployment Vercel non è stata verificata dall'ambiente di sviluppo dell'assistente.

Nuova migration: `supabase/migrations/20260914013218_private_booking_messages.sql`. Le 38 migration precedenti restano immutate. Questo documento descrive la preparazione del rilascio: non attesta l'applicazione al database online.

Nessun nuovo flag. Le funzioni di continuità già rilasciate continuano a utilizzare `VITE_PROFESSIONAL_CONTINUITY=true`.

## Comportamento

- Nelle prenotazioni di proprietario e professionista compare **Messaggi**. Anche il calendario e le richieste nella dashboard professionale permettono di aprire la conversazione.
- Le due dashboard mostrano **Messaggi da leggere** vicino all'inizio della pagina, con nome dell'altro partecipante e data della prenotazione. Aprire la conversazione non la chiude quando il contatore viene aggiornato.
- Le note originali della richiesta restano visibili e non vengono sostituite dai messaggi.
- Entrambi i partecipanti possono scrivere anche dopo il rifiuto, l'annullamento o il completamento per chiarire i dettagli. Inviare un messaggio non accetta la prenotazione e non attiva una relazione con il cane.
- **Profilo e servizi → Messaggi e risposte automatiche** permette di creare fino a 50 modelli, ciascuno con titolo e testo. Selezionare un modello nella conversazione prepara un testo modificabile prima dell'invio.
- Ogni modello è manuale per impostazione iniziale. Il professionista può assegnarlo alla ricezione di una richiesta, all'accettazione oppure al rifiuto. Il salvataggio esplicita l'attivazione. Un solo modello per evento; assegnarne un altro sostituisce il precedente.
- Nessun invio retroattivo alla ricezione per prenotazioni già esistenti. Le successive accettazioni o i rifiuti utilizzano il modello attivo in quel momento.
- **Prepara modello WhatsApp** inserisce nel testo il numero indicato dal professionista, con prefisso internazionale. Il messaggio viene inviato nel sito; il cliente contatta poi WhatsApp. Non è un collegamento a un account WhatsApp, un invio di SMS o un invio tramite API esterne.
- I messaggi sono solo testo, massimo 4000 caratteri. La conversazione carica 50 messaggi alla volta e permette di recuperare quelli precedenti. Le prenotazioni del proprietario hanno pagine da 20 elementi.
- L'aggiornamento è periodico mentre la pagina è visibile: 15 secondi nella conversazione, 30 secondi nei contatori e nella raccolta dei messaggi. Sono disponibili aggiornamento manuale e aggiornamento al ritorno nella finestra. Non ci sono notifiche email, push o allegati in questo incremento.

## Dati e autorizzazioni

Le nuove tabelle `professional_reply_templates`, `booking_messages` e `booking_message_reads` hanno RLS abilitata e nessun accesso diretto per `anon` o `authenticated`, incluso `TRUNCATE`. Tutte le operazioni client passano dalle RPC. Nessuna chiave privilegiata entra nel frontend.

Ogni lettura, invio e aggiornamento di lettura ricava l'identità da `auth.uid()` e controlla che corrisponda al proprietario o al professionista della prenotazione. Il client non può scegliere un mittente o aggiungere destinatari. Le risposte salvate appartengono solo al professionista autenticato. Gli account amministratori non ricevono un accesso generale alle conversazioni da queste RPC.

Il testo viene visualizzato tramite React senza HTML eseguibile. Le risposte automatiche sono copie del testo salvato al momento dell'evento: modificare o eliminare un modello non modifica un messaggio già inviato.

I messaggi sono comunicazioni operative legate alla prenotazione e ne seguono le cancellazioni a cascata già previste dallo schema. Non vengono copiati automaticamente nell'archivio professionale. La conservazione delle sessioni, delle note private e delle revisioni dopo revoca o cancellazione continua a essere responsabilità del sottosistema descritto in `PROFESSIONAL_CONTINUITY_MEDIA.md`. La condivisione del percorso con professionisti futuri e i media compressi rimangono nel programma dedicato alla continuità.

## Retry e concorrenza

Gli invii manuali riutilizzano lo stesso UUID e lo stesso corpo quando l'esito di rete è incerto. Il server restituisce il messaggio già creato; un UUID riutilizzato con un contenuto o un mittente diverso viene rifiutato. L'interfaccia blocca la modifica del testo durante un retry incerto e avverte prima di chiudere una bozza non inviata.

Il lock sulla prenotazione ordina gli invii rispetto agli aggiornamenti di stato e ai messaggi automatici. La sequenza è univoca per prenotazione. Il vincolo per evento impedisce duplicazioni automatiche. Il contatore di lettura può solo avanzare fino a una sequenza già presente; le risposte arrivate dopo restano da leggere.

Le modifiche ai modelli bloccano il professionista. Una collisione concorrente sullo stesso UUID fra due professionisti non può sovrascrivere il modello dell'altro.

## Verifica e rilascio

La proposta SQL è stata eseguita in PostgreSQL WASM (PGlite) dopo le 38 migration reali, senza modificarle, con i test precedenti di sessioni, prenotazioni e calendario. Sono state verificate autorizzazioni, nomi e note, automatismi, retry, paginazione, limiti, contatori, conservazione dei testi inviati e cancellazioni delle conversazioni operative.

Il test `scripts/tests/test_booking_messages.py` ricostruisce le 39 migration in un PostgreSQL temporaneo privato usando l'installazione nativa dell'utente. Aggiunge cinque casi con due connessioni: retry simultaneo, invio/accettazione nei due ordini, letture fuori ordine e collisione UUID fra professionisti. Include anche i quattro casi concorrenti del calendario. Le prove native non sono dichiarate superate fino all'esito di questo script nel terminale dell'utente.

Auth e Storage nei test SQL sono dipendenze simulate. Queste verifiche non equivalgono a una prova dei servizi Supabase online o del browser di produzione.

Sequenza del rilascio:

1. Preparazione locale con l'installatore, che controlla i file di partenza e crea un backup.
2. Typecheck, build con il flag di continuità, test nativo e `npx supabase db push --dry-run`.
3. Applicazione della sola nuova migration con `npx supabase db push`.
4. Aggiornamento dello stato tramite `scripts/update_project_state.py`, controllo dei singoli exit code, commit e push del branch di lavoro.
5. Fast-forward di `main` e push per il deployment, mantenendo il backup del precedente commit di produzione. Conservare a parte i metadati temporanei Supabase.

In caso di problema del frontend, si può ripristinare il precedente deployment senza eliminare la nuova struttura o i messaggi già salvati. Non riscrivere una migration applicata. Registrare l'esito effettivo del rilascio nei documenti di continuità.
