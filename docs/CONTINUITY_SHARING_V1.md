# Continuità condivisa — revisioni selezionate

## Stato e base del rilascio

Incremento successivo ai messaggi delle prenotazioni, la cui migrazione `20260914013218_private_booking_messages.sql` è stata applicata e il cui deployment è stato confermato Ready dall'utente. Hash del commit messaggi non comunicato: non inventarlo.

Nuova migrazione locale: `20260914112404_selected_professional_continuity.sql`. Il presente documento registra la preparazione del rilascio; non certifica che questa migrazione sia già stata applicata online.

Continuità privata e calendario sono già rilasciati. Rimane in uso `VITE_PROFESSIONAL_CONTINUITY=true`, senza nuovi flag. Repository reale `~/K9World`, terminale Bash in WSL, download `/mnt/c/Users/Lugi/Downloads`.

## Flusso nell'interfaccia

1. L'autore apre **Relazioni e archivio → Storico condiviso del cane → Condividi il tuo lavoro**. Legge la revisione corrente e sceglie **Prepara per lo storico**, poi conferma esplicitamente il testo reso condivisibile.
2. Il proprietario apre **Professionisti dei tuoi cani → Storico condiviso del cane**. Sceglie il cane, legge e seleziona i contributi, indica il professionista destinatario, durata e scopo, quindi autorizza la selezione.
3. Il destinatario apre **Relazioni e archivio → Storico ricevuto** e consulta la selezione autorizzata, con autore, attività, data e numero di revisione.

La concessione richiede una relazione bilaterale attiva fra destinatario e cane, un destinatario approvato e il proprietario attuale con email verificata. Il semplice invito o l'accettazione di una prenotazione non concede accesso alle note degli altri.

## Regole dei dati

- Le note nascono private. L'autore sceglie una precisa revisione finalizzata; il proprietario non può rendere pubblici appunti privati altrui.
- Una concessione comprende da 1 a 100 contributi selezionati. Durata da 1 a 365 giorni, proposta iniziale 30 giorni. Questi sono limiti implementativi, non termini di conservazione o indicazioni legali.
- Le revisioni future restano escluse. Nessuna copia del corpo della nota: concessioni e pubblicazioni referenziano l'originale nell'archivio dell'autore.
- La condivisione richiede lo stesso proprietario che autorizzò la sessione originale. Può essere preparata dall'autore anche dopo la fine della propria relazione, se tale contesto è ancora valido.
- Rettificare una nota ritira la versione condivisa precedente. La nuova revisione richiede una nuova scelta dell'autore e una nuova concessione del proprietario.
- Il ritiro dell'autore impedisce nuove letture del contributo a proprietario e destinatari. L'archivio originale rimane conservato.
- Revoca, scadenza, fine della relazione del destinatario, cambio proprietario o rimozione del cane invalidano l'accesso. Riaprire la relazione o ripristinare il vecchio proprietario non riattiva concessioni revocate.
- L'archivio conserva l'attribuzione originaria. Lo storico condiviso può essere incompleto: assenza di contributi non equivale ad assenza di addestramento precedente.
- La revoca agisce sulle nuove letture; non può richiamare informazioni già lette o copiate. Il lettore rivalida ogni 30 secondi e al ritorno alla scheda. I controlli effettivi sono nelle RPC.

## Implementazione

Quattro tabelle nuove, con RLS e privilegi diretti negati ad anon e authenticated: `professional_continuity_publications`, `continuity_access_grants`, `continuity_grant_items`, `professional_continuity_audit`.

Le RPC ricavano gli attori da `auth.uid()`, verificano proprietario e relazione e accedono soltanto alle revisioni selezionate. UUID di richiesta e controlli sulla revisione impediscono duplicati e sostituzioni silenziose. Le funzioni interne non sono eseguibili dai client. L'audit registra identificativi, evento e motivazione senza corpi delle note o URL media.

Il frontend gestisce errori e risposte tardive, paginazione e invii dall'esito incerto mantenendo lo stesso UUID. Il cambio account rimonta la pagina e rimuove i dati in memoria. Il cambio cane è disabilitato durante un invio pendente.

## Verifiche concluse

- PGlite: 39 migrazioni precedenti più la proposta, immutate; test di archivio, prenotazioni, calendario, messaggi e condivisione selettiva superati.
- PostgreSQL nativo dell'utente: **14 settembre 2026**, stesso schema e regressioni superati; sette casi con due connessioni e attesa dei lock osservata: doppio invio identico, concessione/ritiro nei due ordini, rettifica concorrente, cambio proprietario concorrente, concessione/chiusura relazione nei due ordini.
- TypeScript e build superati nella copia di lavoro con configurazioni temporanee. Ripetere soltanto typecheck e build nel checkout reale per verificare i file installati e la configurazione effettiva.
- Il test salvato in `scripts/tests/test_continuity_sharing.py` ricostruisce le 40 migrazioni reali con controllo hash. Esegue la medesima SQL già provata: cambia solo la lettura della proposta dalla nuova migrazione salvata.
- Auth e Storage sono simulati nei test SQL. Browser e servizi Supabase reali non verificati da questi test. Non presentare il risultato come un controllo completo dell'ambiente online.

## Rilascio e seguito

L'installatore controlla la base, crea backup, scrive una sola nuova migrazione e conserva i documenti esistenti. Non esegue SQL online, commit o deploy. Eseguire typecheck, build e `npx supabase db push --dry-run`; il dry-run deve proporre soltanto la nuova migrazione. Applicare il database prima del frontend. Registrare poi l'esito nel passaggio di consegne e nello snapshot corrente.

Il test nativo appena superato non richiede una nuova esecuzione identica per questa preparazione. Rimane nel repository per le regressioni future.

Foto, audio, video e compressione restano nel passo successivo previsto da `PROFESSIONAL_CONTINUITY_MEDIA.md`: file privati, quote e pipeline controllata; nessun caricamento o transcodifica media viene introdotto qui. Non usare vecchio CRM o note delle prenotazioni come archivio permanente.
