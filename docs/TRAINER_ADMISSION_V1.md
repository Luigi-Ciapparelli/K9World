# Ammissione degli addestratori — 21 ottobre 2026

Decisione di Luigi: prima della pubblicazione dei servizi di addestramento,
richiedere riscontri di identità e una qualifica nominativa ENCI, CSEN, OPES o
FISC. È una scelta di ammissione del portale, non una dichiarazione che questi
quattro enti costituiscano l'unica abilitazione prevista dalla legge.

## Comportamento

- Registrazione e preparazione del profilo rimangono possibili; non autorizzano
  automaticamente la comparsa nelle ricerche o nelle schede pubbliche.
- L'amministratore controlla prima l'attestato in **Attestati e risultati**.
  Deve essere una qualifica professionale, verificata manualmente e con fonte.
  Il campo ente va normalizzato a ENCI, CSEN, OPES o FISC: acronimi esatti,
  ignorando maiuscole e spazi esterni. Una tessera, un seminario, una semplice
  dichiarazione o un risultato sportivo non soddisfano il requisito.
- In **Approva**, seleziona la qualifica, riscontra identità e collegamento con
  l'attività, indica il titolare e registra fonte/metodo del controllo.
  Per una persona, il nome deve corrispondere al profilo; per un centro si
  registra la persona qualificata che vi opera. Non si attribuisce una
  qualifica personale alla struttura, né si verificano automaticamente tutti
  i membri del suo team.
- Email confermata necessaria. Confermare una casella prova il controllo del
  recapito, non l'identità civile, il titolo o l'assenza di un servizio temporaneo.
- Riscontro privato in `pc_private.trainer_admission_reviews`, nessuna lettura
  diretta dai client. Non raccogliere copie integrali di documenti d'identità
  per riempire il campo note; usare il minimo necessario. La durata e il
  fondamento della conservazione vanno inclusi nella revisione privacy.

## Controlli nel database

Il vecchio comando generico non può approvare un addestratore senza la nuova
verifica. Il requisito vale anche per un profilo di altra categoria che aggiunge
un servizio attivo di addestramento. Fonte e revisione, ente, conferma email e
identità sono ricontrollati durante la scrittura; dati cambiati rendono invalido
il tentativo iniziato prima. Le funzioni pubbliche sono SECURITY INVOKER, gli
accessi privilegiati restano privati e l'operatore deve essere amministratore.

Cambiare identità del referente/attività, modificare o revocare/rimuovere la
qualifica invalida la pubblicazione. Eliminare o spostare il documento Storage
azzera la verifica: ricaricarlo allo stesso percorso non la ripristina. Il
controllo di Storage deve essere confermato anche nel servizio reale; i test SQL
simulano le sue tabelle e non eseguono upload reali. La verifica di una fonte
esterna resta un riscontro manuale datato, non un monitoraggio automatico.

La migration rimette **in attesa tutti i profili già approvati che offrono
addestramento**, anche se la categoria principale è un'altra. È necessario
riesaminarli per ripubblicarli. La rimozione dalla ricerca riguarda l'intero
profilo misto, non soltanto il suo servizio di addestramento. Account, servizi,
prenotazioni e archivi rimangono conservati. I profili esclusivamente pensione,
handler o toelettatura non sono riclassificati con questa regola.

## Prove e rilascio

- Test SQL: storia delle 72 migration precedenti, fixture sintetiche, vecchia
  approvazione bloccata, titolarità, fonte, revoche, file sostituiti, accessi,
  categorie miste e conservazione delle prenotazioni.
- PostgreSQL nativo: due connessioni, approvazione prima della revoca e ordine
  inverso; osservazione effettiva dell'attesa sul lock. Esito nella CI della PR.
- Browser 1440/390: email/qualifica mancanti, campi obbligatori, dati cambiati,
  RPC assente, nessun ripiego alla vecchia approvazione; regressione del dialogo.
- TypeScript, lint mirato, build/SEO. Auth e Storage simulati, nessuna
  certificazione di conformità né prova con dati di persone reali.

Ordine: migration `20261021100000_verified_trainer_admission.sql` → frontend.
La nuova UI non consente approvazioni se l'API di controllo non è disponibile.
`python3 scripts/release_trainer_admission.py --publish`, dal branch
`codex/professional-admission-20261021`, prepara il dry-run, controlla che non ci siano altre
migration in attesa, applica questa migration e pubblica il commit su main con
push normale (mai force). Non disattivare i trigger per aggirare un rifiuto:
correggere i riscontri o rivalutare esplicitamente la politica.

## Cosa questo blocco non risolve

Restano separati: controllo email temporanee e abusi di registrazione;
verifica operativa di accessi/backup/ripristino e fornitori; accordi con
responsabili del trattamento, basi giuridiche, conservazione e informative;
requisiti delle pensioni e altri professionisti; inquadramento fiscale e
societario. Test passati o partita IVA non certificano da soli questi punti.
Non dichiarare il sito legalmente certificato o ogni utente identificato.
