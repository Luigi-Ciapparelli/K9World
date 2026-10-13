# Working-Dog: identità e integrità della verifica

13 ottobre 2026. Base esaminata: `7521dd3`. Incremento preparato localmente;
non equivale a pubblicazione GitHub, applicazione SQL o deployment Ready.
Email e campagne restano sospese su richiesta di Luigi.

## Problema e comportamento

Il verificatore precedente poteva attestare un collegamento confrontando un nome
modificabile con una pagina pubblica. Un link non prova il controllo dell’account.
Inoltre un cambio URL poteva conservare un’attestazione precedente.

Il professionista invia il collegamento personale HTTPS. Il server ricava l’ID
Working-Dog e lascia la richiesta da verificare. Nell’area admin il revisore
apre il profilo e registra come ha verificato la titolarità: per esempio una
prova concordata controllabile sul profilo, se il provider lo consente, oppure
un controllo diretto documentato. Non raccogliere password, cookie, documenti
di identità o codici di accesso. La sola somiglianza di nome o foto non basta.
La conferma usa la versione esaminata: se il link cambia, la revisione va rifatta.

Un’identità verificata può appartenere a un solo professionista; richieste
pendenti di terzi non ne riservano l’uso. URL modificato o revoca invalidano
le attestazioni automatiche dipendenti. La revisione manuale delle credenziali
rimane distinta. Un risultato revocato o rifiutato dall’amministratore non viene
riattivato da un controllo automatico.

## Confine della verifica dei risultati

Il parser seleziona una sola riga con ID stabile del conduttore e link del cane,
nomi esatti normalizzati, gara e livello coerenti. Righe ambigue, squalifiche,
ritiri, esiti negativi e punteggi non esplicitamente etichettati non attestano nulla.
Il percorso positivo coperto dalle fixture riguarda Obedience classi 1–3 con
qualifica esplicita EX e totale 256–320. Non generalizzare questo controllo
ad altre discipline: in IGP servono anche le condizioni delle singole fasi.
Il motore di merito resta una proposta separata, non collegata a ricerca o badge.

`WORKING_DOG_RESULT_AUTOVERIFY_ENABLED` deve essere esattamente `true` per
contattare il provider. L’installer imposta **false**. Senza una fonte reale
accessibile secondo le modalità ammesse e una fixture rappresentativa, mantenere
la revisione manuale. Non aggirare login, blocchi o limitazioni del provider.

Il fetch ammette soltanto HTTPS sui domini base/www Working-Dog .com/.eu e
percorsi risultato validi. Ogni redirect è controllato prima di seguirlo, deve
mantenere l’ID risultato e non può superare tre salti. Timeout complessivo 12 s;
HTML massimo 2,5 MB controllato anche durante la lettura. Impronta dell’intera fonte.

## Database e dati esistenti

Nuova migration: `20261013083000_working_dog_identity_binding.sql`.
Nessuna migration già applicata viene riscritta. Storico in `pc_private`, RLS
attiva e nessun accesso diretto client. Scritture identità solo tramite RPC
controllate; il vecchio ingresso del verificatore non può attestare nuovi risultati.
Il commit del risultato controlla attore, versione della credenziale e dell’identità,
e ID conduttore sotto lock, nello stesso ordine della revoca.

Tutti i vecchi collegamenti verificati tornano da controllare, anche quelli
manuali: il precedente URL era modificabile senza invalidarne l’attestazione.
Le credenziali con metodo `working_dog_auto` tornano pendenti. Credenziali
manuali e contenuti sono conservati. Snapshot prima/dopo e revisioni future
restano privati; nessuna cancellazione di risultati o account.

## Prove e limiti

- Ricostruzione su PGlite delle 58 migration precedenti e della nuova: permessi,
  titolarità, duplicati, versioni, revoche, vecchio ingresso disabilitato,
  conservazione dello storico e ricerca quotidiana invariata.
- Edge e parser con provider/DB simulati: nome e ID non corrispondenti,
  esiti negativi, sorgente indisponibile, errori atomici e flag disattivato.
- Fetch simulato: destinazioni, redirect, MIME e limiti effettivi del corpo.
- TypeScript, build e SEO; browser desktop/mobile con sessione e API simulate:
  conferma con prova, conflitto di versione, aggiornamento e nuova revisione.
- `test_working_dog_identity.py` contiene due prove PostgreSQL native a due
  connessioni: revoca prima della verifica e verifica prima della revoca.
  L’installer le esegue sul PC di Luigi; non sono attestate dal test PGlite.

Questi controlli non verificano Auth/Storage online, delivery email o fonte
Working-Dog live. Non aggiungono test a ogni funzione storica senza rischio nuovo.

## Rilascio e ripresa

Usare il pacchetto con `--publish` dal repository WSL su main. Confronta i file
con la base esaminata, preserva modifiche estranee e crea un backup in Git.
Esegue test nativi, regressioni pertinenti, TypeScript, build/SEO e dry-run SQL.
Accetta soltanto questa migration come nuova; altre modifiche richiedono esame.
Poi crea un commit locale recuperabile, applica SQL, spegne il flag automatico,
pubblica `verify-working-dog` e spinge i soli file previsti su main. Nessun reset,
force push, cambio ramo automatico o rollback distruttivo. I comandi hanno timeout.

Dopo un’interruzione leggere l’esito: il pacchetto accetta contenuti già applicati
e il suo commit locale non ancora inviato. Vercel Ready è un passaggio distinto.
Verificare il pannello admin e registrare commit/SQL/Edge/Ready in CURRENT_STATE.
La prossima parte di SPORT-02 riguarda fonte reale e regole per disciplina:
non attivarla cambiando soltanto il flag e non chiamare questa correzione un
importatore completo di risultati.
