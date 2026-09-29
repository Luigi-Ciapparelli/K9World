# Continuità della richiesta al professionista

Base remota esaminata: `4c951a9`, 29 settembre 2026.

## Problema e comportamento

Il visitatore che premeva Richiedi prenotazione veniva portato ad Accedi;
dopo l'accesso finiva nella dashboard e doveva cercare nuovamente il professionista.
Ora il profilo scelto viene conservato nell'URL di accesso. Al rientro di un
proprietario si riapre la richiesta con i servizi e i cani caricati per quell'account.
Nessuna richiesta viene creata senza il pulsante Invia richiesta.

Registrati mantiene la scelta e apre direttamente il percorso proprietario.
Se Supabase richiede la conferma email, la pagina iniziale torna ad Accedi
con la destinazione conservata: dopo aver confermato, si può accedere da lì.
Il contesto è nell'URL, senza note/cani/password o nuove memorie persistenti.
Se si chiude la scheda e si torna alla home senza quel link, la scelta non
viene ricostruita. Non viene introdotto un nuovo callback di conferma email.
Il recupero password resta il flusso separato documentato in PASSWORD_RECOVERY_V1.md.

Accedendo con un account professionista/admin resta la propria area, senza
prenotazioni per conto del proprietario. Sono accettati solo percorsi locali
`/p/UUID?booking=1`; indirizzi esterni, aree private e altri parametri non sono
usati come destinazioni. I controlli ruolo e autorizzazione backend restano invariati.

L'elenco Richieste e prenotazioni del professionista ha anche Aggiorna richieste,
così si possono vedere le nuove richieste senza ricaricare tutta la pagina.

## Collaudo

Nuova suite scripts/tests/test_pilot_booking_flow_ui.mjs, eseguita dal runner
scripts/tests/test_seo.mjs, con due contesti browser e stato HTTP sintetico condiviso:

- Ospite, accesso e ricarica; registrazione proprietario con cane e conferma
  email simulata; ritorno alla stessa richiesta, senza invii automatici.
- Data passata rifiutata prima della chiamata; indisponibilità del professionista
  gestita senza perdere note; invio, nome richiedente e note in entrambi gli account.
- Modello di risposta, esito di invio incerto e retry con lo stesso request_id;
  una sola copia nella fixture e messaggio visibile al proprietario.
- Accettazione, aggiornamento proprietario e calendario professionale, compresa
  conversione dell'orario locale e visualizzazione delle note.
- Errore di caricamento e Riprova; rifiuto di destinazioni arbitrarie.

TypeScript, build e regressioni SEO, profilo guidato, iscrizione e recupero
password accompagnano questo controllo. Le chiamate sono intercettate solo su
pc-home-test.supabase.co; nessun appuntamento, email o messaggio reale è stato inviato.
La fixture non prova RLS, invio email o persistenza Supabase online. Non
sostituisce i test SQL esistenti e non richiede di rieseguirli per questo frontend.

## Rilascio e prova reale minima

Il pacchetto prepara backup, typecheck/build e test HTML prima del commit/push.
Nessuna migrazione e nessuna nuova configurazione Supabase richiesta qui.
Dopo Ready, usare due account controllati o consenzienti per una richiesta
concordata con nota, una risposta e un'accettazione: controllare il risultato
nell'area proprietario e nel calendario del professionista.

Registrare in PILOT_READINESS_V1.md commit ed esito, senza dati personali.
Dopo il risultato positivo partire dal piccolo gruppo di professionisti già
conosciuti. Le bozze in PILOT_INVITATIONS.md sono preparate, non inviate.
