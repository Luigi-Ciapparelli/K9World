# RPC relazioni professionali — proposta eseguibile solo in test

Dipende dalla proposta professional_continuity_v1.sql. Non è una migration. Nessuna API in produzione è stata creata.

Implementa invito del proprietario verificato a professionista approvato, accettazione/rifiuto del solo destinatario, chiusura/revoca e lista minima delle proprie relazioni. La lista mostra nomi storici cane/professionista e date/stato, non contatti o note. Vecchio proprietario e autore conservano la visibilità del proprio evento storico; il proprietario corrente può revocare inviti precedenti. Non ottiene note o materiali privati da questa funzione.

Sono scelte iniziali: owner come ruolo tecnico del concedente, professional come ruolo del destinatario e conferma email del concedente. Non aggiunge requisiti di verifica telefono. Nessun invito a se stessi. Non invia notifiche o messaggi esterni.

Inviti ripetuti restituiscono la relazione aperta già esistente. Una relazione revocata non si riattiva con una vecchia accettazione: serve una nuova autorizzazione. La titolarità del cane viene ricontrollata sotto lock prima di accettare. Le mutazioni bloccano professionista, cane, relazione quando disponibili. Nessuna policy concede accesso alle tabelle private.

Test locale: python3 scripts/tests/test_relationship_rpcs.py ~/K9World. La fixture auth.uid() simula il soggetto JWT con un parametro PostgreSQL, solo nell'istanza temporanea; non va installata in Supabase. I test usano realmente SET ROLE authenticated e controllano che anon non abbia EXECUTE. Coprono estraneo, proprietario non verificato, professionista non approvato, accettazione per conto altrui, rifiuto, revoca, richiesta ripetuta e cambio proprietario.

Limiti: non sono ancora incluse prove concorrenti su più connessioni, integrazione con tutte le migration, disattivazione/recupero account e trasporto PostgREST. Non implementa creazione/lettura note, condivisione storica, media, UI o audit completo. Non promuovere in produzione prima di completare tali verifiche e il flusso utente. Stato della verifica SQL sul computer dell'utente: da eseguire.
