# Confine API Supabase — 28 settembre 2026

Stato: incremento preparato e verificato in un database isolato. **Non applicato
al database online da questo lavoro.** Base GitHub: `db2e010`.

## Report da risolvere

Gli export Security Advisor del 27 settembre (osservazione 18:40 UTC) contengono:

| Regola | Prima | Dopo nei test |
| --- | ---: | ---: |
| security_definer_view | 3 ERROR | 0 |
| anon_security_definer_function_executable | 8 WARN | 0 |
| authenticated_security_definer_function_executable | 50 WARN | 0 |
| auth_leaked_password_protection | 1 WARN | Richiede impostazione Auth |

Gli otto avvisi anonimi riguardano funzioni incluse nelle cinquanta autenticate.
La prima migrazione audit aveva lasciato intenzionalmente queste API e viste:
non aveva risolto tutti gli ERROR. Questo incremento completa quel confine.
Un risultato locale non attesta il risultato dell'Advisor online.

## Modifica

Nuova migrazione: `20260928100000_private_api_boundary.sql`.

- Le implementazioni privilegiate esaminate passano a `pc_private`. Gli OID,
  proprietari, corpi SQL, controlli di identità/proprietà, lock e configurazioni
  rimangono; `search_path` viene fissato vuoto anche nei due vecchi helper admin.
- In `public` rimangono funzioni **SECURITY INVOKER** con gli stessi nomi,
  parametri/default, tipi di ritorno, volatilità e autorizzazioni esplicite.
  Le chiamate del sito e le Edge Function non cambiano.
- Le tre viste pubbliche diventano `security_invoker=true` e
  `security_barrier=true`. Leggono tre funzioni interne che restituiscono
  esclusivamente le proiezioni pubbliche già esistenti. Profili non approvati,
  credenziali private, email, telefoni e note private non vengono aggiunti.
- Non vengono concessi nuovi permessi sulle tabelle, né cambiate le policy RLS.
  `anon` e `authenticated` hanno USAGE sullo schema interno, mai CREATE;
  EXECUTE resta esplicito. Le operazioni private conservano le verifiche
  del chiamante anche se invocate direttamente da una connessione SQL.

**Non aggiungere `pc_private` agli Exposed schemas di Supabase/PostgREST.**
Non è una rinomina che sostituisce l'autorizzazione: i controlli rimangono nelle
implementazioni private. I wrapper sono l'interfaccia API pubblica autorizzata.
Le proiezioni pubbliche con funzione possono limitare il pushdown dei filtri:
misurare la latenza con un catalogo grande prima di ulteriori ottimizzazioni.

La migrazione confronta gli hash dei corpi esaminati e le definizioni delle
viste, interrompendosi su divergenze. È atomica, con lock timeout 5s e statement
timeout 90s. Non riscrive migrazioni applicate e non elimina dati.

## Verifiche

Ricostruite le 47 migrazioni precedenti, inclusi grant/event trigger dell'export
online, poi applicata la nuova. Verificati:

- contratti di 50 RPC, privilegi anon/authenticated/service_role, OID e corpi;
- righe e colonne delle proiezioni prima/dopo, filtri approvazione e privacy;
- proprietario senza accesso admin, admin operativo, nome/note prenotazione
  disponibili soltanto al professionista destinatario;
- policy e permessi tabelle invariati, nuovi oggetti interni privati;
- onboarding, sessioni/revisioni, archivio, prenotazioni, calendario/assenze,
  messaggi, condivisione/revoca, ricerca quotidiana e sport.

Eseguite anche le tre query ufficiali Splinter senza modifiche: 3/8/50 → 0/0/0.
Fonte: https://github.com/supabase/splinter, commit
`e74a9e36cb12258cb67d1464bc1cb196e9cd8446`, regole 0010, 0028 e 0029.
Il runner consegnato verifica gli stessi predicati nel catalogo applicativo.

Prove eseguite con PostgreSQL 18 tramite PGlite. Il runner Python esegue le
stesse fixture su PostgreSQL nativo in WSL, senza porte TCP e senza credenziali
online. Auth/Storage sono dipendenze SQL simulate: servizi remoti, browser,
carico e dashboard Auth non sono attestati da queste prove.

## Compatibilità con pacchetti lezioni

Supportata e verificata anche la variante con la migrazione già consegnata
`20260927170000_restore_professional_passes.sql`: dieci ulteriori RPC passano
al confine interno e superano le prove di crediti, storico e isolamento.
Questa correzione non installa i pacchetti da sola.

Se i pacchetti non sono ancora stati installati, il vecchio installer dovrà
venire aggiornato alla nuova base e all'ordine delle migrazioni prima dell'uso.
Non usare `--include-all`, non togliere controlli e non spostare timestamp di
migrazioni già applicate. Le future migrazioni devono aggiornare i corpi in
`pc_private` e mantenere i wrapper, senza ricreare definer pubblici.

## Applicazione e chiusura

Nel terminale Bash/WSL:

```bash
cd ~/K9World && python3 /mnt/c/Users/Lugi/Downloads/correggi_api_supabase.py ~/K9World && python3 scripts/tests/test_private_api_boundary.py && git diff --check && npx supabase db push --dry-run
```

Il dry-run deve contenere la nuova migrazione; può elencare anche il pacchetto
lezioni solo se preparato localmente ma non ancora applicato. Controllare
l'elenco prima di `npx supabase db push`. Nessuna build/deploy frontend serve
per questo incremento. Dopo l'applicazione riaprire Security Advisor,
aggiornare i controlli ed esportare il nuovo risultato. La query in
`scripts/audit/private_api_status.sql` è in sola lettura e verifica il confine.
Registrare esito remoto e commit dei file; non dichiarare finito senza esito.

## Avviso password: configurazione separata

In Supabase Auth, impostazioni password del provider Email, abilitare
**Leaked password protection** se disponibile. La documentazione ufficiale
indica disponibilità dal piano **Pro**. Con Free questo singolo avviso resta
un limite del piano: nessuna migrazione SQL abilita il servizio e non è stato
eseguito alcun upgrade a pagamento.

Fonte: https://supabase.com/docs/guides/auth/password-security

Questo rilascio non nasconde l'avviso, non modifica le password degli utenti
e non autorizza l'accesso pubblico a dati privati per silenziare il linter.
