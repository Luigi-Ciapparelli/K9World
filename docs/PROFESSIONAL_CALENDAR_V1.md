# Calendario professionale, colori e indisponibilità — V1

Incremento successivo alla continuità privata rilasciata con `427ff8d`.
Preparazione locale: database online e deployment non vengono modificati dallo script.

## Comportamento

- Nuova pagina `#/pro/calendar`, voce **Calendario** nel menu professionista e collegamento dalla dashboard.
- Vista mensile e dettaglio del giorno: servizio, nome del richiedente, note della prenotazione, stato, inizio, fine e prezzo. Accettazione, rifiuto e completamento usano la stessa RPC delle altre schermate.
- Colore configurabile per singolo servizio in **Profilo e servizi**. Categoria e colore possono essere diversi tra pensione, addestramento, corso ENCI e gli altri servizi. I colori vengono proposti per categoria e sono modificabili. La categoria corso ENCI non modifica qualifiche, credenziali o approvazione del profilo.
- Salvataggio esplicito del servizio. Un servizio nuovo viene inserito al salvataggio; i retry aggiornano lo stesso UUID. Disattivazione disponibile; l'interfaccia conserva i servizi esistenti invece di cancellarli. Le modifiche al nome/colore si riflettono anche sul calendario dei vecchi impegni; il prezzo e la durata delle prenotazioni già create rimangono quelli registrati.
- La durata in minuti stabilisce l'intervallo occupato. Il prezzo è per l'intera prenotazione, come nella RPC precedente. Il tipo giornaliero non moltiplica automaticamente prezzo o durata. Una pensione di 24 ore richiede 1440 minuti; più giorni compaiono sulle date attraversate. Selezione libera della data di uscita, ricorrenze e capienza sono incrementi successivi.
- **Sospendi nuove richieste** blocca la creazione di nuove prenotazioni fino alla riattivazione. Il professionista rimane approvato e ricercabile. Le richieste ricevute prima della pausa possono essere gestite.
- **Indisponibilità**: prima e ultima data comprese, massimo 366 giorni. Termine automatico a mezzanotte successiva all'ultimo giorno. Blocca sia la creazione sia l'accettazione di prenotazioni che si sovrappongono, anche solo in parte.
- Appuntamenti già accettati conservati; il calendario segnala quanti attraversano l'assenza. Nessuna cancellazione automatica. Il professionista concorda gli eventuali cambiamenti con i clienti.
- I periodi vengono mostrati nella vista del mese e nella scheda pubblica per i successivi 60 giorni. Il controllo server copre qualsiasi data richiesta, anche oltre questa anteprima.
- Tutto il calendario e le assenze usano `Europe/Rome`, incluso il cambio ora. La finestra di prenotazione mantiene il fuso del dispositivo già dichiarato all'utente e invia l'istante UTC; il server verifica la sovrapposizione reale.
- Nessun nuovo flag. Il flag della continuità già rilasciata resta invariato.

## Dati e accessi

Migration: `20260913191311_professional_calendar_availability.sql`.

- `services.calendar_color`: codice esadecimale validato; i servizi esistenti ricevono un colore per categoria.
- `professional_schedule_settings` e `professional_time_off`: RLS attiva, accessi diretti revocati a `PUBLIC`, `anon`, `authenticated`.
- RPC private basate su `auth.uid()`, senza parametro per scegliere un altro professionista: `get_my_schedule`, `get_my_booking_calendar`, `set_my_booking_pause`, `add_my_time_off`, `remove_my_time_off`, `save_my_calendar_service`.
- `get_my_booking_calendar`: intervallo massimo 62 giorni, pagine fino a 200 righe. L'interfaccia recupera tutte le pagine della vista; le letture restano limitate al professionista autenticato.
- `get_public_booking_availability`: solo pausa e date di assenza di profili approvati. Non restituisce promemoria privati, nomi clienti, note, prenotazioni, identità dei periodi o dettagli degli impegni.
- `create_booking_with_dog` e `change_booking_status`: conservano firme e risultati precedenti; aggiungono controlli per pausa/assenza. Codici `PCA01` e `PCA02` permettono di mostrare un rifiuto esplicito senza trattarlo come invio dall'esito incerto.
- Le operazioni di pausa, assenza e prenotazione serializzano sul professionista. Se l'assenza viene registrata prima, una successiva accettazione viene respinta; nell'ordine inverso l'appuntamento accettato viene conservato e segnalato.
- Il promemoria dell'assenza è distinto dalle note del cliente e dalle note private dell'archivio professionale. Nessuna modifica alle sei tabelle della continuità, ai loro dati o ai permessi dei media.

## Verifica e rilascio

Già eseguiti durante la preparazione:

- TypeScript strict e build Vite sulla copia fornita, con configurazione di verifica temporanea. Le configurazioni reali del repository non sono state sostituite.
- Replay delle 38 migration in PostgreSQL WASM (PGlite), con dipendenze SQL Auth/Storage simulate; test precedenti di sessioni e prenotazioni, nuovi test di colori, autorizzazioni, pausa, assenza, retry, confini a mezzanotte, ora legale e RLS.
- Controlli delle date della vista calendario, degli impegni su più giorni e dei colori.

Da eseguire nel repository reale:

```bash
npm run typecheck
npm run build
python3 scripts/tests/test_professional_calendar.py ~/K9World
npx supabase db push --dry-run
```

Il test nativo usa il PostgreSQL già installato, un'istanza temporanea con socket privato e nessuna porta TCP. Include quattro prove concorrenti con due connessioni, da verificare su PostgreSQL nativo: assenza prima dell'accettazione, ordine inverso, pausa prima della richiesta e doppio invio dell'assenza. Queste prove concorrenti non sono eseguite da PGlite.

Applicare al database la sola nuova migration dopo il dry-run, quindi pubblicare il frontend. Pubblicare il frontend prima del database lascia le nuove schermate senza le RPC necessarie. Nessun nuovo flag o modifica delle variabili Vercel è richiesto. Dopo il rilascio aggiornare lo snapshot tramite `scripts/update_project_state.py` e verificare i codici di uscita.

I test automatici non rappresentano una verifica del browser, dei dati reali o dei servizi Supabase online. In caso di rollback frontend lasciare la migration applicata: non annullare i controlli server né cancellare le assenze già registrate.

## Prossimo incremento

Risposte ai clienti dalla richiesta, messaggi personalizzati e modelli salvati, incluso il testo con recapito WhatsApp. Non ancora implementati da questa V1. Restano inoltre i media privati/compressi e la condivisione autorizzata per la continuità tra professionisti, secondo i documenti di architettura.

Riferimento dell'ambiente di verifica SQL: [PGlite](https://pglite.dev/docs/). Non è una dipendenza aggiunta all'applicazione.
