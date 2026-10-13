# Istruttori del centro — prima fase TEAM-01

14 ottobre 2026. Base esaminata: `origin/main` a `8a482aa`.
Stato del rilascio in [CURRENT_STATE](CURRENT_STATE.md).

## Comportamento

Un account professionale registrato come **centro cinofilo** trova “Istruttori
del centro” nel proprio menu (`/pro/team`). Aggiunge un nome alla volta, può
correggerlo, renderlo inattivo e riattivarlo. Il massimo è 200 voci per centro,
incluse quelle inattive. L’inattività impedisce nuove assegnazioni; le lezioni
già assegnate rimangono visibili con un avviso e un conteggio nel roster.

Nelle **lezioni accettate** di addestramento/corso ENCI, richieste e calendario
consentono di indicare uno degli istruttori attivi. L’assegnazione è facoltativa,
modificabile o rimovibile prima del completamento; il proprietario legge il nome
nella propria prenotazione. Le richieste in attesa non impongono un nuovo passaggio.
Una lezione conclusa conserva l’assegnazione, che non può essere riscritta.

Il nome salvato al momento dell’assegnazione resta nello storico anche quando
il centro modifica successivamente il proprio elenco. L’export autorizzato
del cane include questo nome e la data dell’ultima assegnazione, in JSON e nel
documento stampabile. Non aggiunge nominativi alle vecchie lezioni prive di dati.
Lo storico privato delle modifiche non è esposto al cliente come elenco di persone.

Le valutazioni rimangono riferite alla **singola prestazione prenotata**.
Nessuna nuova media personale, voto al centro o trasferimento di meriti.

## Confini e dati

Questo elenco contiene indicazioni organizzative dichiarate dal centro. Non
crea account, non verifica qualifiche e non certifica l’appartenenza di una
persona. Nessun nome inserito ottiene accesso a messaggi, note o clienti.
Account del personale, consenso di appartenenza, deleghe, turni e calendario
del singolo istruttore sono la fase successiva: TEAM-01 non è completato integralmente.

Migration nuova: `20261013180000_centre_instructor_assignments.sql`.
Tabelle `pc_private.centre_instructors`, `booking_instructors` e
`centre_team_history`, RLS attiva e accesso diretto revocato. Le quattro RPC
pubbliche sono invoker; le implementazioni private controllano il chiamante.
Solo il centro modifica il proprio elenco e le proprie lezioni; lettura della
prenotazione limitata a centro e proprietario. Nessun catalogo pubblico del team.

Gli aggiornamenti portano la versione letta. Una modifica concorrente produce
un conflitto da ricaricare, senza sovrascrittura silenziosa. Retry identici non
duplicano assegnazioni o audit. Assegnazione, disattivazione e completamento
bloccano prima la riga del centro; una voce divenuta inattiva non è assegnabile.
La cancellazione del centro rimuove elenco/assegnazioni operative e conserva
il registro privato delle modifiche secondo il modello di audit corrente.
Nessuna politica di conservazione indefinita o accesso globale è introdotta.

L’export preesistente è esteso con una sostituzione controllata di due frammenti
univoci: se il contratto è diverso la transazione si interrompe. I permessi e i
limiti dell’export rimangono quelli originali. Nessuna migration passata è modificata.

## Verifiche e limiti

- PGlite: 59 migration precedenti + nuova; ruoli, isolamento, retry, versioni,
  istruttori inattivi, nomi storici, blocco dopo completamento, export,
  cancellazione centro e compatibilità con la recensione della seconda lezione.
- Browser con API/sessioni sintetiche: creazione, conflitto/ripresa salvataggio,
  richieste, calendario e lettura proprietario; desktop 1440 e mobile 390 px.
- TypeScript, build e SEO: 396 HTML e 392 URL canonici; area personale esclusa.
- `test_centre_team.py` ricostruisce PostgreSQL temporaneo via socket privato e
  aggiunge due ordini concorrenti assegnazione/disattivazione. Esecuzione nativa
  richiesta dall’installer sul PC di Luigi, non eseguita nell’ambiente PGlite.

Auth e Storage simulati. Queste prove non attestano Supabase online o Vercel.

## Rilascio

Installer: `aggiorna_istruttori_centro.py ~/K9World --publish`, da WSL.
Verifica compatibilità, conserva backup, esegue test SQL nativi/TypeScript/build/SEO,
controlla che il dry-run contenga soltanto questa migration. Prepara il commit
locale recuperabile, applica SQL, quindi pubblica i soli file del pacchetto.
Non distribuisce Edge Functions. Attendere Vercel Ready per il commit risultante.

Dopo il rilascio, il punto di ingresso è “Istruttori del centro” per un account
con tipo attività centro cinofilo. L’account addestratore individuale non riceve
questa voce. Email, raccolta contatti e campagne restano sospese.
