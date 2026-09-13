# Test concorrenti dello storico professionale

Eseguire `python3 scripts/tests/test_continuity_concurrency.py ~/K9World`, senza sudo.

Lo script crea una istanza PostgreSQL temporanea senza TCP, applica le tre proposte SQL e ripete i test di sessioni/note private. Aggiunge quattro prove con due connessioni reali:

- Stesso UUID di richiesta, stessa sessione: una sola registrazione.
- Stessa revisione attesa: prima correzione salvata, seconda respinta con conflitto, originale preservato.
- Registrazione che acquisisce i lock prima della revoca: registrazione completata, revoca applicata successivamente.
- Revoca che acquisisce i lock prima: la registrazione concorrente attende e poi viene respinta.

La sincronizzazione osserva un'attesa Lock in pg_stat_activity prima di rilasciare la prima transazione: non dipende da un ritardo fisso. Se l'attesa non viene osservata, il test fallisce. Sessioni e file temporanei vengono chiusi a fine prova.

Queste prove validano quei precisi ordini di esecuzione, non ogni possibile concorrenza. Non coprono ancora trasferimento/cancellazione account contemporanei alle RPC, conflitti con trigger e funzioni reali, carico elevato o configurazioni diverse. Fixture minima e auth.uid simulata: nessuna connessione a Supabase e nessun dato reale.

Stato: da eseguire nell'ambiente dell'utente. Non costituisce autorizzazione al deploy.
