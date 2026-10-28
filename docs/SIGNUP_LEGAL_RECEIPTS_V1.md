# Ricevute iniziali dei termini — 28 ottobre 2026

Incremento di TRUST-02 sulla base `5c0849d`. Applicazione al database remoto
non osservata: il codice su GitHub e un deploy Vercel non applicano una migration.
Il risultato dei test e l'eventuale rilascio sono riportati nella PR del blocco.

## Risultato concreto

La dichiarazione inviata dalla registrazione esistente viene validata e copiata
in una tabella privata dal server, nella stessa transazione che crea l'account.
Le successive modifiche di `user_metadata` non riscrivono la ricevuta.
Questo supera il limite della sola dichiarazione modificabile descritto in
PRIVACY_OPERATIONS_V1, **per le nuove registrazioni web dopo la migration**.

Si conservano soltanto ID account, data server, ruolo dichiarato in fase di
registrazione, versione, accettazione dei termini e hash dei testi applicabili.
Il ruolo registrato è una fotografia del tipo di iscrizione, non una fonte di
permessi. Non vengono copiati email, telefono, IP, user agent, note libere o
un eventuale campo marketing inviato dal client.

Il catalogo server contiene gli hash dell'archivio `docs/legal/2026-10-21.1/`;
il test verifica i file reali, il manifest e la versione usata dal frontend.
La ricevuta del proprietario non comprende il contratto professionale.
La versione dell'informativa indica quale testo accompagnava la dichiarazione:
**non è un consenso al trattamento in generale o al marketing, né prova di lettura**.
Email confermata e approvazione del professionista mantengono controlli separati.

## Accessi e conservazione

- RLS attiva e nessun accesso diretto per `anon`, `authenticated` o `service_role`
  alle due nuove tabelle. Nessun nuovo endpoint pubblico o permesso admin dal client.
- Funzione trigger con `search_path` vuoto e riferimenti qualificati, non invocabile
  dai ruoli client. Un amministratore del database mantiene accesso di manutenzione:
  “non modificabile dall'utente” non significa registro notarile o immutabile per DBA.
- Una dichiarazione web assente, falsa, malformata o di versione non accettata
  annulla l'intera registrazione, compresi profilo e cane eventualmente creati
  dagli altri trigger. Errori infrastrutturali non vengono silenziati.
- Nessun recupero retroattivo da metadati attuali. Gli account già esistenti non
  ricevono una falsa accettazione datata al passato.
- La cancellazione effettiva dell'account Auth rimuove questa ricevuta tramite FK.
  Non viene attivata alcuna cancellazione di account né una conservazione illimitata.
  Backup e richieste di conservazione per contestazioni concrete restano nel processo
  privacy: questa modifica non introduce una deroga o un archivio legale permanente.

## Confini da non confondere

Il trigger segue il marcatore di onboarding `pawconnect_onboarding_version=1`,
già usato dal sito. Flussi Auth amministrativi, OAuth o importazioni senza quel
marcatore non creano una ricevuta inventata. Non è un controllo universale che
impedisce qualunque creazione di un record Auth o sostituisce le policy sui profili.
Prima di introdurre altri flussi, progettare la loro accettazione esplicita.
Nuove accettazioni di account esistenti e aggiornamenti contrattuali sostanziali
richiedono un flusso separato: non simularli modificando `user_metadata`.

Per una nuova versione, archiviare i testi, aggiornare il catalogo e coordinare
la versione del client. Il catalogo può ammettere un periodo di sovrapposizione
esplicito; non rimuovere una versione ancora inviata dal client senza valutarne
gli effetti. Il testo già pubblicato non cambia in questo incremento.

## Verifiche e rilascio

`python3 scripts/tests/test_signup_legal_receipts.py` ricostruisce tutte le
74 migration in PostgreSQL privato. Verifica ruoli, input contraffatti, rollback,
onboarding del cane da un ruolo Auth senza privilegi sul registro, isolamento,
cancellazione, regressioni di ammissione e concorrenza approvazione/revoca.
Auth e Storage sono dipendenze SQL simulate: il test non prova i servizi online.
La suite precedente di ammissione ricostruisce esplicitamente il proprio prefisso
storico; la nuova suite esegue nuovamente le sue asserzioni sullo schema aggiornato.

1. Confermare progetto Supabase, storia remota e presenza della migration di
   ammissione `20261021100000_verified_trainer_admission.sql`.
2. Esaminare il piano `db push --dry-run`. Non applicare automaticamente migration
   non identificate. Se manca l'ammissione, considerare il suo effetto dichiarato:
   i profili che offrono addestramento tornano in attesa di verifica.
3. Applicare la migration delle ricevute solo dopo il collaudo e con il frontend
   che invia la dichiarazione `2026-10-21.1` (presente dalla PR #5).
4. Eseguire `scripts/audit/real_use_privacy_status.sql` in sola lettura. Restituisce
   solo stati strutturali, anche prima della migration; non restituisce persone,
   recapiti, documenti o note. Non prova contratti, backup o correttezza delle fonti.
5. Provare una registrazione concordata e la consegna email reale; verificare la
   ricevuta in un canale amministrativo privato e riesaminare l'ammissione del
   primo professionista. Non pubblicare queste prove personali nella PR.

Il vecchio `release_trainer_admission.py --publish` è legato al branch storico:
non riutilizzarlo alla cieca su `main` né confondere deploy frontend e database.

## Prima dei dati reali: cosa resta da verificare

L'uso non diventa automaticamente “conforme” grazie alla ricevuta. Restano le
evidenze già elencate in PRIVACY_OPERATIONS_V1: ruoli e basi, informazioni del
gestore, fornitori/DPA e regioni effettive, conservazione, gestione dei diritti,
minori e ripristino. Sono fatti dell'attività e degli account, non caselle da
segnare “OK” sulla base di un test del codice. La revisione fiscale/legale resta
distinta dalle verifiche tecniche.

Cookie: mantenere l'inventario e i comandi di cancellazione già presenti in
`/cookies`. Nessun nuovo banner, pixel o tracciamento viene aggiunto. Per strumenti
strettamente necessari al servizio richiesto serve un'informativa; il banner di
consenso non è obbligatorio per il solo uso tecnico. Ogni nuova finalità va valutata
prima dell'attivazione, anche se usa local storage invece di cookie.

SEC-03 è stato rilasciato con `5c0849d` (PR #7), con audit datato 28 ottobre:
non riaprire gli advisory già corretti per il vecchio elenco in PRIVACY_OPERATIONS_V1.

Fonti primarie ricontrollate il 28 ottobre 2026:
- [Supabase: dati utente e rischi dei trigger](https://supabase.com/docs/guides/auth/managing-user-data).
- [Supabase: metadati modificabili e autorizzazioni](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Garante: cookie e strumenti di tracciamento](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876).
- [EDPB: minimizzazione e responsabilità](https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en).
