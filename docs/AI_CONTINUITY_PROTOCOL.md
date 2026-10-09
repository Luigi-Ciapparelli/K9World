# Protocollo di continuità — PortaleCinofilo

Versione consolidata: 9 ottobre 2026. Scopo: permettere a un nuovo account o
collaboratore di proseguire senza la vecchia chat e senza rifare lavori conclusi.

## Una responsabilità per documento

| Documento | Contiene | Non contiene |
| --- | --- | --- |
| `START_HERE.md` | Ordine di lettura e controllo iniziale | Cronologia completa dei rilasci |
| `docs/CURRENT_STATE.md` | Fatti correnti, evidenze, limiti | Output grezzo riscritto automaticamente |
| `docs/PRODUCT_DIRECTION.md` | Decisioni attive e perimetro futuro | Claim di pubblicazione senza evidenza |
| `docs/EXECUTION_PRIORITIES_2026_10.md` | Unico ordine operativo e dipendenze | Una seconda visione di prodotto |
| `docs/PROJECT_HANDOFF.md` | Ambiente, vincoli e mappa delle specifiche | Un altro elenco discordante degli stati |
| `docs/TECHNICAL_SNAPSHOT.md` | Output datato del generatore diagnostico | Prova automatica che il sito funzioni online |
| `docs/PROJECT_HISTORY.md` | Riferimenti immutabili agli stati precedenti | Istruzioni operative correnti |

Le specifiche mantengono il dettaglio del loro dominio. Le indicazioni recenti
di Luigi prevalgono sui checkpoint precedenti; il comportamento implementato
si verifica nel codice. Se codice, direttive e rilascio divergono, registrarne
la differenza: non usare una roadmap come prova che il codice esista.

## Apertura del lavoro

1. Leggere START_HERE e la sua sequenza breve; poi la specifica pertinente.
2. Controllare branch, stato e commit effettivi; fare fetch quando serve confrontare GitHub.
3. Ispezionare file interessati, contratti e vincoli. Non leggere automaticamente
   file esclusi né interrogare dati privati non necessari.
4. Recuperare autorizzazioni già presenti. Chiedere solo dettagli che cambiano
   concretamente il lavoro; non far approvare di nuovo ciò che è stato deciso.

## Chiusura di un incremento

- Aggiornare **la riga esistente** in CURRENT_STATE con data, commit, esito e limite.
  Se il commit non esiste ancora, dirlo; dopo il push registrare il commit osservato
  al successivo aggiornamento utile, senza cicli di commit solo per il proprio hash.
- Aggiornare la decisione pertinente in PRODUCT_DIRECTION e la priorità collegata,
  senza copiare lo stesso resoconto in cinque file.
- Separare implementazione, prove locali, applicazione database, deploy frontend
  e riscontro utente. Registrare chi ha osservato cosa e quando.
- Eseguire solo test pertinenti al rischio o al gate richiesto. Una revisione
  documentale non richiede build, ricostruzione SQL o accesso Supabase.
- Commit con percorsi espliciti e push del lavoro autorizzato; nessuna modifica
  estranea inclusa, nessun force push. Se manca accesso al remoto, consegnare un
  aggiornamento applicabile nel WSL e non dichiararlo già pubblicato.

## Rapporto tecnico facoltativo

Quando serve un nuovo rapporto di branch, Git, migration, TypeScript e build:

```bash
cd ~/K9World && VITE_PROFESSIONAL_CONTINUITY=true python3 scripts/update_project_state.py
```

L'output è **`docs/TECHNICAL_SNAPSHOT.md`**, non CURRENT_STATE. Il comando consulta
la storia migration tramite la CLI e svolge build/test di compilazione: non va
lanciato per ogni modifica testuale. Controllare gli exit code nel rapporto;
un file scritto non significa che tutti i comandi siano riusciti. Il generatore
non applica SQL, non esegue deploy e non decide quali funzioni siano complete.

## Confini permanenti

Non riscrivere migration applicate; non confondere tabelle/RPC con autorizzazione
nel frontend; non esporre note, foto o documenti privati. Conservare identità di
autori, revisioni e concessioni, con revoca e limiti espliciti. La condivisione
non rende disponibili i contributi futuri automaticamente.

Niente segreti, dati identificativi dei clienti o dettagli finanziari personali
nel Git pubblico. Nessuna spesa o comunicazione esterna dedotta da una roadmap.
Le fonti normative, finanziamenti, prezzi e condizioni dei fornitori sono datati:
verificarli nuovamente prima di un'azione che ne dipende.

Ricerca quotidiana diretta; Sport separato; nessun merito acquistabile o punteggio
universale fra discipline. Learning non equivale a qualifica ufficiale. Tenere
distinti profilo approvato, identità, evidenza verificata e risultato sportivo.

I documenti tecnici storici restano consultabili, ma «prossimo passo» o «da
pubblicare» scritti durante una preparazione non prevalgono sul registro attuale.
