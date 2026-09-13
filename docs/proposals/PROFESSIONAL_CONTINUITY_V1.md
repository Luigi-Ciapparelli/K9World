# Sessioni e note professionali — proposta SQL 01

Stato: proposta da revisionare e testare, NON migration pronta al deploy. La collocazione in docs/proposals impedisce che il normale db push applichi questo SQL. Non eseguirlo nel SQL Editor di produzione.

## Base verificata

Repo pulito sul branch signup-dog-profile, documentazione approvata nel commit 5ef4903; migration locali/remoto allineate fino a 20260912223818. Sono stati letti schema iniziale, policy accesso cani e foto, privilegi predefiniti, CRM e codice DogsPage. Non è stato interrogato direttamente il catalogo del database remoto; eventuali modifiche manuali fuori Git restano da escludere prima dell'implementazione.

Il codice elimina direttamente dogs e poi tenta di cancellare la foto. Le FK di booking_dogs cancellano il collegamento al cane; non cancellano direttamente bookings. Eliminare profiles può invece eliminare cani, prenotazioni e note CRM. Il nuovo dominio non deve ereditare queste cascata.

## Scelta tecnica proposta

Sei tabelle: identità storica persona, identità storica cane, relazione autorizzata, sessione, nota, revisioni. Gli identificatori storici non sono una nuova anagrafica pubblica e non danno permessi.

Le identità conservano solo UUID d'origine, nome acquisito e data. Le FK operative usano SET NULL. I collegamenti interni all'archivio usano RESTRICT: una cancellazione interna deve essere intenzionale e gestita, non propagata accidentalmente. SET NULL e UUID storici non anonimizzano i dati. Conservazione e cancellazione del contenuto restano processi da implementare.

Non copiare foto, medical_notes, contatti o l'intero profilo. I nomi storici devono poter essere rettificati con una procedura tracciata, non aggiornati automaticamente in base al profilo corrente.

### Risultato in caso di eventi

| Evento | Archivio | Accesso |
| --- | --- | --- |
| Fine relazione | Sessioni e note restano | Autore legge il proprio lavoro; non crea nuove sessioni in quella relazione |
| Revoca proprietario | Contributi esistenti non cancellati automaticamente | Niente nuovi contributi/accessi derivati dalla relazione |
| Eliminazione cane operativo | live_dog_id diventa NULL, identità storica resta | Niente nuove sessioni/concessioni; archivio autore limitato al proprio lavoro |
| Eliminazione proprietario account | Può eliminare cane e booking operativi; archivio separato resta | Autorizzazione precedente non vale per creare nuovo lavoro |
| Eliminazione account autore | live_profile_id diventa NULL | Nessun login/accesso recuperato automaticamente; contenuti soggetti alla procedura di conservazione |
| Eliminazione booking | Solo collegamento operativo svuotato | Non cancella sessione o nota |
| Cambio proprietario | Non riscrive il concedente storico | Vecchie autorizzazioni non valgono per il nuovo proprietario |

Il cambio proprietario o la cancellazione non devono ricongiungere automaticamente un archivio a un nuovo cane con lo stesso nome. Non usare email o nomi per ripristinare l'identità. Recupero account e trasferimenti richiedono un processo distinto.

## Relazione proposta

Primo caso d'uso: trainer. Il proprietario account corrente autorizza, il professionista accetta. La presenza di una vecchia prenotazione, da sola, non rende attiva una relazione permanente. Nessun backfill di autorizzazioni basato automaticamente sullo storico booking.

La tabella person_dog_relationships è inizialmente limitata al tipo trainer. Non sostituisce dogs.owner_id, non implementa il binomio sportivo e non attiva co-owner o handler. Gli altri tipi richiedono un'estensione successiva con le proprie regole.

Le date stored sono evidenze, non prova sufficiente dell'autorizzazione corrente. Una relazione risulta effettivamente attiva solo se stato/date sono coerenti, cane e account operativi esistono, il concedente coincide ancora con dogs.owner_id, l'account professionista è abilitato e non revocato. Questi controlli sono obbligatori nelle future RPC, non già implementati dagli FK.

## API da implementare e verificare PRIMA del rilascio

Nessuna API è inclusa nella proposta SQL. I nomi seguenti sono contratti proposti:

1. invite_dog_professional: proprietario corrente autenticato e verificato, cane posseduto, professionista approvato; snapshot derivati sul server; inserimento idempotente e nessun privilegio fino all'accettazione. Minima visibilità dell'invito al destinatario.
2. respond_dog_relationship: solo destinatario; accetta o rifiuta dopo nuova verifica della titolarità corrente. Un proprietario non può accettare per conto del professionista.
3. end_or_revoke_dog_relationship: soggetti autorizzati secondo azione, registrazione autore/motivo e data; operazione idempotente. Revoca non è cancellazione dello storico.
4. create_professional_session: autore autorizzato, relazione attiva verificata al momento della scrittura; se booking presente, stesso professionista, cane collegato e stato consentito. Data attività coerente; niente sessioni future presentate come lavoro già svolto.
5. save_professional_note: proprietario della sessione, limite testo, controllo versione per modifiche concorrenti; revisione numerata lato server. L'autore non può cambiare cane o paternità via payload.
6. finalize_professional_note/session: transazione unica, almeno un contenuto valido, restrizioni successive chiare. Una nota finalizzata non è modificabile in place dall'app.
7. amend_professional_note: nuova revisione con motivo; distingue correzione storica da nuova attività. Specificare la possibilità di correggere il proprio archivio dopo fine rapporto senza permettere nuove sessioni.
8. list_own_professional_archive: solo autore autenticato collegato alla sua identità storica; paginazione e nessun join che esponga dati correnti extra.

Le RPC privilegiate dovranno avere search_path vuoto, riferimenti qualificati, auth.uid() come identità, EXECUTE revocato a PUBLIC/anon e grant espliciti. Non concedere accesso generale alle nuove tabelle per far funzionare la UI.

## Concorrenza e revoca

La sequenza controlla-permesso/poi-scrivi deve essere atomica: bloccare in ordine coerente account professionista, cane e relazione durante attivazione e scrittura. Le operazioni di revoca, trasferimento e cancellazione devono coordinarsi sugli stessi record. Non promettere revoca istantanea solo perché esiste revoked_at.

Una lettura già avviata può terminare prima della revoca. Per lo storico condivisibile successivo serviranno concessioni esplicite per contributi/revisioni e un contratto di revoca misurabile. Nessun grant di condivisione è presente qui.

## Cosa il file SQL garantisce e cosa no

Garantisce strutturalmente riferimenti storici separati, assenza di CASCADE nell'archivio, alcuni stati/date coerenti, indici per ricerche e revisione univoca. Abilita RLS e revoca privilegi a PUBLIC/anon/authenticated su tutte le tabelle proposte; nessuna policy le apre.

Non implementa autorizzazione, immutabilità, transizioni, audit completo, scadenze, archiviazione del cane nell'app, inviti, condivisione, cancellazione definitiva, compressione, upload o backup. Il proprietario del database e ruoli privilegiati possono aggirare RLS: questa non è cifratura end-to-end.

I limiti proposti di 200 caratteri per nomi/attività e 20.000 per nota sono parametri iniziali da valutare, non decisioni di prodotto già approvate. L'obbligo autore diverso da proprietario è una proposta per il primo flusso professionale, da rivedere se si vuole annotare professionalmente il proprio cane.

La prima versione limita visibility a private: l'approvazione della continuità condivisa resta valida, ma non viene simulata con un flag. Il passaggio al collega deve arrivare con concessioni e prove di isolamento, prima di dichiarare la funzione completa.

## Cancellazioni prima dell'uso reale

Non cambiare ancora il bottone Elimina cane: lo SQL proposto non viene applicato. Prima dell'attivazione del dominio, separare nell'app archiviazione ordinaria e richiesta di eliminazione definitiva. La possibilità di cancellare i record operativi non deve essere presentata come cancellazione di ogni archivio e backup.

Nessuna conservazione perpetua implicita. Definire procedura per cancellare/anonimizzare dati d'archivio, riferimenti interni, revisioni e copie secondo la politica applicabile, con autorizzazione e audit. Non usare RESTRICT per rendere tecnicamente impossibile una cancellazione dovuta.

## Piano di verifica in database usa e getta

Non usare dati reali. Preparare ruoli Supabase di test e tabelle base minime, o un ambiente locale isolato. Non eseguire reset sul database remoto.

- SQL applicabile senza alterare schema operativo preesistente; rollback controllato dopo test.
- Inserire attori/cane/relazione/sessione/note sintetici come fixture privilegiate, eliminare cane/account/booking operativi e verificare che i contributi restino e i link live siano NULL.
- Controllare vincoli su timestamp/stati e revisioni duplicate.
- Verificare che anon e authenticated non abbiano privilegi diretti sulle sei tabelle. L'assenza di API è intenzionale.
- Dopo sviluppo RPC: proprietario A, autore B, collega C, estraneo D e anonimo; accessi positivi e negativi, payload con ID alterati, account cancellato, cambio proprietario, revoche concorrenti, modifiche concorrenti e correzioni post-relazione.

## Ordine operativo

1. Revisionare questa proposta e verificare il catalogo/schema effettivo prima di crearne una migration.
2. Implementare le RPC e i test di isolamento in ambiente locale separato.
3. Integrare una UI minima per invito, sessione e nota privata; completare archiviazione e spiegazione della conservazione.
4. Solo allora creare una migration unica dalla versione verificata, controllare dry-run e applicarla prima del frontend.
5. Implementare storico condivisibile con autorizzazione del proprietario.
6. Aggiungere media privati/quote/pipeline a incrementi successivi.

Nessun aggiornamento del sito è necessario per questo checkpoint documentale. Non considerare questo file un'implementazione conclusa.
