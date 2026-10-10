# Integrità delle verifiche delle credenziali

10 ottobre 2026. SPORT-03, correzione tecnica distinta dal completamento
dell’importazione e del ranking Working-Dog (SPORT-02).

## Problema corretto

Una credenziale modificata poteva conservare la verifica della vecchia versione.
Anche un controllo già avviato poteva attestare dati cambiati durante il recupero
della fonte. Inoltre il pannello di revisione era collocato nel ramo «accesso
negato» di AdminDashboard: ora compare nell’area amministratore autorizzata.

## Comportamento

- Ogni cambiamento dei fatti esaminati (persona, tipo, titolo, ente, data,
  disciplina, livello, descrizione, fonte/documento, cane, evento, ambito,
  posizione, punteggio, provider o sezione ENCI) incrementa la revisione e
  rimuove l’attestazione precedente. Con una fonte torna in verifica; senza
  fonte resta una dichiarazione. La sola visibilità non cancella la verifica.
- Il database assegna un nuovo identificatore a ogni aggiornamento. Il browser
  non può scegliere revisioni o identificatori. Una decisione manuale usa
  l’identificatore della riga letta; se è cambiato richiede di aggiornare la
  schermata e riesaminare i dati.
- La funzione Edge salva tramite una RPC riservata a service_role. La RPC
  controlla attore e versione, blocca la riga e salva fatti estratti e decisione
  nella stessa transazione. Una modifica o revoca concorrente rende obsoleto
  l’esito precedente. Un errore del provider non ripristina una verifica revocata.
- Le revisioni dei fatti e delle verifiche restano in una tabella privata con
  snapshot, attore e data. Nessun accesso diretto da anon, authenticated o
  service_role; nessuna nuova pagina pubblica o esportazione di documenti.
  Lo storico è eliminato insieme alla credenziale: non è un backup permanente.
- Le verifiche esistenti sono conservate come baseline. La migrazione non
  dimostra retroattivamente la qualità delle fonti precedenti.

## Limiti espliciti

Questo rilascio **non completa** il collegamento dell’identità Working-Dog,
l’accesso autorizzato alla fonte, la copertura live del parser o il ranking.
Il confronto dei nomi nel vecchio collegamento profilo non dimostra il controllo
dell’account esterno. Le soglie sportive restano quelle del motore in bozza;
non si aggiungono badge o promesse di verifica automatica universale.
SPORT-02 resta aperto. La proposta SQL del 26 settembre è superata da questa
migrazione e non va applicata separatamente.

## File e rilascio

Migrazione: `20261010190000_versioned_credential_verification.sql`, dopo
`20261010170000_trainer_specializations.sql`. Nessuna vecchia migrazione riscritta.

Il pacchetto `aggiorna_ricerca_e_verifiche.py` include TRAIN-01 e SPORT-03,
accetta la base `3a6674b` oppure i file TRAIN-01 già applicati e conserva un backup.
Con `--publish` verifica i contenuti, esegue i test, controlla il dry-run,
crea un commit locale recuperabile, applica soltanto le due migrazioni previste
ancora mancanti, pubblica `verify-working-dog`, poi esegue il push su main.
Non introduce SMS, acquisti, nuovi account o invii di messaggi.

Ordine richiesto: database → Edge Function → frontend. Durante il breve
intervallo una vecchia schermata admin o un vecchio verificatore deve ricaricare:
le vecchie attestazioni prive di controllo versione sono respinte, non accettate
per mantenere compatibilità apparente. In caso di interruzione l’installer
conserva il commit e consente di riprendere. Non effettua rollback SQL automatici.

## Verifiche

- PostgreSQL WASM/PGlite: ricostruite le 57 migrazioni precedenti e applicata la
  nuova. Superati baseline, modifica dati, revisione server, isolamento, storico,
  decisioni obsolete, revoca, fonte non disponibile, proiezioni pubbliche e ENCI.
  Auth/Storage simulati; nessun database online usato.
- `test_credential_versions_edge.mjs`: eseguito sul codice Edge reale con
  trasporto simulato. Esito positivo, conflitto 409, commit fallito, stato effettivo
  restituito dal DB, provider indisponibile, attore estraneo e accesso anonimo.
- `test_credential_versions_ui.mjs`: Chromium desktop 1440 e mobile 390;
  dashboard admin, rifiuto della versione obsoleta, aggiornamento, errore di rete
  e verifica della nuova versione. Sessioni/API sintetiche.
- I test preesistenti del merito e parser restano superati: 69 controlli del
  motore, 9 del parser e fixture Valentina Balli. Nessuna fonte live contattata.
- `test_credential_versions.py` ricostruisce la storia su PostgreSQL nativo e
  aggiunge due prove con connessioni concorrenti: modifica prima della revisione
  e revisione prima della modifica. Queste prove native sono richieste dal
  comando di pubblicazione; non sono state eseguite in questo workspace.

TypeScript, build/SEO e controlli del pacchetto sono registrati in CURRENT_STATE.
Commit remoto, migrazioni online, deploy Edge e Ready Vercel restano da osservare
dopo l’esecuzione di Luigi; non equivalgono ai test locali.
