# Correzioni audit Supabase — 27 settembre 2026

Stato: migrazione applicata al database online. Il 27 settembre 2026 Luigi ha
confermato `Applying migration 20260927131000_harden_client_privileges_and_rls.sql`
e `Finished supabase db push`. Prima dell’applicazione sono passati tutti e
sette i gruppi di test nel PostgreSQL nativo locale e il dry-run ha elencato
soltanto questa migrazione. Le prove ricostruiscono 46 migrazioni precedenti
più la correzione; sono passate anche su PostgreSQL 18.3 via PGlite 0.5.8.
L’export online dichiara PostgreSQL 17.6. Auth/Storage sono simulati nei test;
una verifica applicativa dopo il rilascio non è ancora documentata.
Questo checkpoint Git registra l’applicazione, senza eseguire nuovamente SQL.
Il frontend non è modificato.

## Fonte e ambito

Analizzati i cinque report linter (244 segnalazioni) e l'export del catalogo
online consegnato dal proprietario: 54 definizioni di funzioni, tre viste,
111 policy, permessi di tabelle/colonne e default. L'export non contiene dati
operativi degli utenti. Non viene incluso nel repository.

Migrazione nuova: `20260927131000_harden_client_privileges_and_rls.sql`.
Nessuna migrazione precedente viene modificata. Nessuna modifica al frontend.

## Correzioni

- I controlli `auth.uid()` delle 85 policy segnalate diventano subquery scalari
  indipendenti dalla riga. Ruoli, comandi, predicati e autorizzazioni restano
  invariati. Prima di ogni modifica si confronta la definizione con l'export:
  una differenza interrompe e annulla l'intera migrazione.
- Quattro policy duplicate vengono eliminate solo dopo aver verificato che
  comando, ruoli e SQL canonico delle espressioni coincidano con la policy mantenuta.
  Rimangono quindi 81 policy ottimizzate e quattro duplicati eliminati.
- `admin_set_professional_approval` e `is_admin` perdono l'accesso anonimo.
  Gli utenti autenticati mantengono la chiamata e il controllo interno del
  ruolo amministratore; un proprietario non può approvare professionisti.
- Le tre funzioni trigger di onboarding/verifica email e il trigger di evento
  `rls_auto_enable`, se presente, perdono EXECUTE per i client. Trigger,
  registrazione, aggiornamento email e attivazione automatica RLS restano attivi.
- Rimossi TRUNCATE, REFERENCES, TRIGGER e, su PostgreSQL 17+, MAINTAIN dai ruoli
  PUBLIC/anon/authenticated sulle tabelle pubbliche. SELECT e le operazioni
  applicative già consentite non sono estese. I permessi di service_role restano.
- Nuovi oggetti creati dal ruolo delle migrazioni e da postgres, quando
  applicabile, richiedono grant espliciti. Revocato correttamente anche il default
  globale EXECUTE a PUBLIC: la sola revoca per schema non lo annulla.
  I default del ruolo gestito `supabase_admin` non vengono modificati.
- Rimossa, se presente e con definizione nota, la vecchia policy
  `profiles."View professional profiles"`: è già assente online ma era ancora
  ricreata dalla storia Git. Esponeva l'intera riga dei profili professionali
  agli autenticati. La nuova migrazione allinea anche le installazioni da zero.

Tutto è in transazione, con lock timeout di 5 secondi e statement timeout
di 90 secondi. Un errore richiede di esaminarne il motivo prima di proseguire;
non rimuovere i controlli di compatibilità e non marcare una migrazione fallita
come applicata. Non usare reset del database o rollback distruttivi.

## Segnalazioni che rimangono e perché

- Le tre viste pubbliche sono proiezioni esplicite per professionisti approvati,
  recensioni e merito verificato/pubblico. Si mantengono definizioni e grant
  attuali. La segnalazione `security_definer_view` rimarrà: questo incremento
  non converte le viste a invoker e non concede lettura delle tabelle private
  per farle funzionare. Un eventuale rifacimento delle API pubbliche richiede
  un incremento separato. Non dichiarare risolti tutti gli ERROR del linter.
- Otto RPC pubbliche intenzionali (ricerca, catalogo, disponibilità, servizi,
  credenziali e identità pubbliche) conservano EXECUTE anonimo. Le RPC private
  continuano a verificare identità, proprietà e relazioni.
- Le 21 tabelle senza policy sono chiuse ai client e servite da RPC autorizzate.
  Non si aggiungono policy permissive per eliminare una segnalazione informativa.
- Le policy distinte per proprietario/professionista/amministratore restano.
- I 38 indici FK suggeriti e i 12 indici segnalati come inutilizzati richiedono
  valutazione del carico; questo incremento non crea o cancella indici in massa.
- La protezione password compromesse è una configurazione Auth, non una
  migrazione SQL. Non è stata attivata e non è stato modificato il piano Supabase.

## Prove eseguite

`scripts/tests/test_supabase_audit_fixes.py` ricostruisce tutte le migrazioni
in un database isolato e riproduce i grant/event trigger rilevati nell'export.
Verifica definizioni pubbliche preservate, equivalenza dei predicati, visibilità
del proprio profilo, approvazione riservata agli admin, onboarding/verifica email,
trigger RLS e default privati per nuove tabelle, sequenze e funzioni.

Riutilizza anche le regressioni esistenti per sessioni/revisioni/archivio,
prenotazioni, calendario/assenze, messaggi/risposte automatiche, condivisione e
revoca della continuità, ricerca quotidiana e sport. Sette gruppi superati.
Auth e Storage sono simulati a livello SQL: browser, servizi Supabase effettivi,
latenza sotto carico e database remoto non sono verificati da questi test.

## Applicazione sul computer di Luigi

Nel terminale Bash/WSL:

```bash
python3 /mnt/c/Users/Lugi/Downloads/prepara_correzioni_supabase.py ~/K9World
python3 ~/K9World/scripts/tests/test_supabase_audit_fixes.py ~/K9World
cd ~/K9World && git diff --check && npx supabase db push --dry-run
```

Il dry-run deve elencare solo la nuova migrazione. Non ripetere build del frontend
per questo incremento SQL. Se i test sono superati e il dry-run è quello atteso,
applicare con `npx supabase db push`, poi registrare l'esito e committare i soli
file dell'incremento. I test locali non dichiarano applicato il database online.

Il ripristino degli strumenti professionali rimane la prossima richiesta aperta.
Queste correzioni non aggiungono abbonamenti, pacchetti, campagne o nuove UI.


## Correzione del controllo duplicati — 27 settembre 2026

Il primo test nativo dell’utente si è interrotto prima del dry-run remoto:
confrontava `pg_node_tree::text`, che include dettagli interni del parser.
Ora confronta `pg_get_expr(..., false)` sullo stesso oggetto, mantenendo i
controlli di comando, ruoli e permissività. Non si elimina il controllo di
equivalenza. La migrazione non era stata applicata online: resta lo stesso file,
senza creare una seconda migrazione o riscrivere la storia applicata.
Verifica PGlite ripetuta e test nativi dell’utente superati dopo la correzione.
Successivamente il dry-run e l’applicazione online sono stati completati.
