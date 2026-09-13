# Integrazione archivio professionale con le migration del progetto

Stato: test preparato, da eseguire in locale. Nessuna migration nuova e nessun deploy.

Eseguire senza sudo:

```bash
python3 scripts/tests/test_continuity_integration.py ~/K9World
```

Il test crea un PostgreSQL temporaneo privato, raggiungibile solo da socket Unix
in una directory accessibile all'utente. Ignora le variabili PG dell'ambiente.
Non legge credenziali Supabase e non esegue comandi sulla CLI Supabase.
Arresta il processo e rimuove i dati temporanei a fine prova; conserva la directory
se non riesce a confermare l'arresto.

Ricostruisce lo schema applicando in ordine tutte le 36 migration fornite nello
ZIP, fino a 20260912223818 inclusa. Le due migration vuote vengono mantenute.
Verifica prima nomi e SHA-256 dei file: uno storico differente richiede di
aggiornare consapevolmente il test. Non modifica o salta migration che falliscono.
Applica poi le tre proposte SQL di struttura, relazioni e sessioni private.

Le dipendenze auth.users, auth.uid e storage sono simulazioni SQL minime.
Tabelle, vincoli, trigger, funzioni e permessi del progetto derivano invece dai
file reali di migration. Gli account sintetici vengono inseriti nella auth.users
di prova: sono i trigger di onboarding del progetto a creare i profili.
L'approvazione dei professionisti e i servizi sono fixture amministrative;
le operazioni applicative sono eseguite con ruolo authenticated e identità
simulate, non con privilegi amministrativi.

Copertura:

- Onboarding di proprietario e professionisti, verifica email e approvazione
  inizialmente pending.
- Accettazione relazione, sessione privata, retry, isolamento fra proprietario,
  autore e collega, revisioni, revoca e conservazione dopo cancellazioni.
- Prenotazione attraverso create_booking_with_dog, accettazione tramite
  change_booking_status, nome e note del richiedente nella proiezione pro.
- Collegamento della sessione a una prenotazione accepted; rifiuto di una
  prenotazione pending, di un altro cane o di un altro professionista.
- Cancellazione dell'account proprietario dalla auth.users simulata con le
  CASCADE reali: cane e prenotazioni operativi rimossi, riferimenti storici
  conservati, nota ancora leggibile e rettificabile dall'autore.
- Cancellazione account autore: revisioni conservate e accesso revocato.
- RLS attiva e assenza dei privilegi diretti anon/authenticated sulle sei
  tabelle dell'archivio.

Limiti: non confronta lo schema remoto con lo storico, non esegue i servizi
Supabase Auth/Storage o richieste HTTP/JWT reali, non prova upload, compressione,
UI, condivisione fra professionisti o tutte le combinazioni di prenotazione.
La concorrenza resta coperta dai quattro casi separati già eseguiti sulla fixture
minima; questo test non li ripete sullo schema ricostruito. Il collegamento a una
prenotazione accepted non certifica che l'appuntamento sia stato svolto.
Un esito positivo non autorizza automaticamente il deploy delle proposte.
