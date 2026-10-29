# Ripristino e manutenzione — 29 ottobre 2026

Base `ace4afa`, 75 migration. Incremento di SEC-04/TRUST-02. Esiti della prova
isolata e dello stato del pannello vanno registrati nella PR di questo blocco.
Non sostituisce un backup reale del progetto o il controllo dei contratti.

## Stato rilevato sul progetto

Il progetto collegato al repository è attivo, nella regione `eu-central-1`,
su piano gratuito; versione gestita `17.6.1.113`, server PostgreSQL `17.6`.
Il controllo del 29 ottobre trova circa 17,6 MB di database e 70 tabelle
applicative in `public`/`pc_private`. Non sono stati letti contenuti delle persone.

Il [fornitore](https://supabase.com/docs/guides/platform/backups) raccomanda sul
piano gratuito esportazioni esterne regolari. Non dichiarare disponibili o
collaudati i backup giornalieri dei piani Pro/Team sulla base del solo piano Free.
Il 29 ottobre Luigi ha controllato il pannello e riportato il messaggio:
«Free Plan does not include project backups». Non ci sono quindi backup del
progetto disponibili tramite quella funzione del piano attuale. Non chiedere
di ripetere il controllo o di accedere nuovamente al browser dell'assistente.
Gli strumenti collegati non espongono un export completo del progetto.

Il dump PostgreSQL contiene i metadati Storage, **non i file delle foto e dei
documenti**. GitHub conserva il codice, non i dati del servizio. Una prova con
dati sintetici non è il ripristino dell'attuale progetto Supabase.

## Cosa verifica il test ripetibile

`python3 scripts/tests/test_recovery_drill.py` crea due cluster PostgreSQL
temporanei e privati, raggiungibili solo tramite socket Unix. Non accetta host,
credenziali, URL di database o dump esterni; ignora le variabili ambiente PG.

1. Ricostruisce le 75 migration con le dipendenze SQL Auth/Storage simulate.
2. Inserisce account e cane sintetici, una ricevuta iniziale, sessione e due
   revisioni di una nota. La fixture include anche prenotazioni e qualifiche.
3. Esporta ruoli senza password e archivio compresso `pg_dump --format=custom`.
4. Spegne la sorgente; ripristina ruoli e database nella seconda istanza vuota.
5. Confronta schema, proprietari, grant, funzioni, RLS, contenuto di tutte le
   tabelle e stato delle sequenze. Verifica le API autorizzate e l'isolamento
   della ricevuta e ripete la regressione di ammissione.
6. Altera intenzionalmente una nota sintetica e verifica che il confronto rilevi
   la differenza. Arresta le istanze e rimuove i dati temporanei.

La versione PostgreSQL e la durata sono stampate nel risultato. Questo non è un
test di upgrade tra versioni, un test SMTP, un ripristino Storage o una misura
del tempo necessario al progetto reale. Nessuna copia o credenziale reale viene
caricata nei job CI. Non usare la fixture Auth al posto del servizio Supabase.

Prova eseguita nella PR #10, integrata su `main` in `98ed236`: GitHub Actions
[40824382308](https://github.com/Luigi-Ciapparelli/K9World/actions/runs/40824382308)
superata con PostgreSQL 18.6 in 8,2 secondi. Il progetto online usa 17.6: non è
una prova fra versioni né una verifica della copia reale.

## Percorso a costo contenuto sul piano gratuito

La priorità è predisporre un'esportazione protetta sul computer del gestore,
senza attivare Pro, PITR o un altro progetto a pagamento. Un backup manuale
richiede esecuzione regolare e controllo dell'esito; non offre la copertura
automatica di un servizio gestito. L'automazione va aggiunta dopo la prima
copia completa e la prova di ripristino, con segnalazione degli errori e
verifica che il computer rimanga disponibile agli orari previsti.

Primo passo nel terminale WSL già usato per il progetto:

```bash
cd ~/K9World && git pull --ff-only && python3 scripts/diagnose_backup_environment.py
```

Il controllo rileva gli strumenti installati e le versioni dei client locali,
con un timeout per comando. Non apre file di account, password o chiavi e non
mostra variabili ambiente; non contatta Supabase, non installa software e non crea un backup.
La presenza del comando Docker non prova che il suo motore sia avviato.
L'output serve a scegliere fra CLI con Docker e client PostgreSQL compatibile
senza far installare strumenti alla cieca. Il PostgreSQL 16 installato in
passato nel WSL non basta per esportare il server 17.6; controllare prima se
nel frattempo è presente una versione successiva.

Dopo questo controllo occorrono connessione dal pannello **Connect**, credenziale
inserita localmente senza incollarla in chat e destinazione privata della copia.
Conservare anche una copia cifrata indipendente dal computer; scegliere fra le
risorse già disponibili prima di acquistare spazio. Le immagini e i documenti
Storage richiedono una copia distinta dal dump. Non chiamare completo il backup
finché il perimetro sotto non è stato verificato. Nessuna esportazione di record
personali nel log della chat o negli artifact pubblici di GitHub Actions.

## Procedura per la prima copia reale

Prima della manutenzione, completare in uno spazio privato questo perimetro:

| Componente | Copia necessaria | Prova prima di considerarla utilizzabile |
| --- | --- | --- |
| Database | Schema, dati, ruoli/grant necessari, sequenze, funzioni, trigger, policy e storia migration; includere il dominio privato | Restore isolato con confronti e accessi per ruolo; file integro non basta |
| Storage | Byte di ogni oggetto e inventario di bucket/percorso, dimensione e hash; configurazioni e ownership coerenti | Download e ripristino isolato di campioni privati/pubblici; controllare l'intero inventario |
| Servizi | Impostazioni Auth, redirect, SMTP, Edge Functions, domini, autorizzazioni e dipendenze | Verifiche funzionali dopo restore; chiavi e password restano nel gestore sicuro |
| Cancellazioni | Registro minimo privato delle cancellazioni/revoche successive alla copia | Rieseguire le azioni applicabili prima di riaprire l'accesso al ripristino |

Conservare la copia cifrata fuori dal repository e separare la chiave di recupero;
limitare gli accessi e prevedere una seconda copia indipendente. Le esclusioni
`.gitignore` riducono gli errori, non cifrano i dati né sostituiscono i permessi.
Non inviare dump, password, documenti o archivi via chat o nella PR pubblica.

Per il database scegliere la procedura del fornitore adatta all'ambiente:
[backup/restore CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
oppure export nativo con client PostgreSQL compatibile. Il flusso CLI documentato
richiede Docker; il semplice `psql` installato in WSL non basta a quel flusso.
Un `pg_dump` 16 non può esportare un server 17. Non resettare una password nota
solo per seguire un esempio della documentazione.

Non lanciare un comando di restore contro la produzione. Per un progetto
Supabase di prova verificare prima disponibilità e costo: nessun nuovo progetto,
branch a pagamento o upgrade di piano è autorizzato da questo documento.
Registrare privatamente ora della copia, perimetro, cifratura, integrità, esito,
destinazione, responsabile e prossima scadenza. Periodicità e conservazione vanno
decise prima dell'uso reale in base al volume e alla perdita accettabile; non
attribuire per default durata illimitata ai dati o alle loro copie.

## Aggiornamento PostgreSQL: preparazione, non riavvio automatico

`scripts/audit/maintenance_preflight.sql` controlla solo metadati. Eseguito sul
database reale il 29 ottobre: zero indici ltree, zero indici GiST su float,
zero operatori con stimatori personalizzati fuori dal catalogo e zero riferimenti
PGP nelle funzioni applicative. `pgcrypto` è installato. Non sono stati letti
cifrati, chiavi o password; query dinamiche ed elaborazioni esterne non sono
escluse dalla sola assenza di riferimenti nelle funzioni.

Questi controlli coprono i casi segnalati nel
[changelog PostgreSQL 17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes).
Non provano che tutti gli aggiornamenti siano compatibili. Prima di eseguire:

1. Verificare nel pannello versione proposta, prerequisiti e tempo stimato.
2. Completare copia reale e ripristino isolato, inclusi file/configurazioni.
3. Concordare una finestra breve: l'upgrade rende temporaneamente indisponibile
   il progetto. Non mettere in pausa il sito per forzare un aggiornamento.
4. Seguire l'upgrade gestito; non eliminare automaticamente estensioni, slot o
   indici per superare un controllo. Un rollback di versione non è garantito.
5. Verificare Auth, registrazione/ricevuta, ammissione, ricerca, prenotazioni,
   messaggi, note, immagini, confini API e log prima di chiudere la manutenzione.

Fonti: [upgrade Supabase](https://supabase.com/docs/guides/platform/upgrading),
[pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html),
[pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).

## Confini ancora aperti

Finché non esiste una copia reale protetta e ripristinata con successo, SEC-04
resta aperto. La prova sintetica è una verifica tecnica aggiuntiva, non una
spunta sostitutiva. Fornitori/DPA, conservazione, richieste e informazioni del
gestore rimangono nelle evidenze operative di TRUST-02. Non introdurre tracking
o un banner generico per compensare questi adempimenti.
