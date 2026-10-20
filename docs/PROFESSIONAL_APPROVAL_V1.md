# Approvazione dei profili professionali

20 ottobre 2026. Base esaminata: `7155fb9`. Correzione del percorso amministratore,
senza nuove migration né modifiche delle autorizzazioni.

## Difetto riprodotto

Il pannello usava due `window.prompt`. Il valore `null` restituito da Annulla
diventava un motivo predefinito o note vuote: la chiamata di rifiuto partiva
comunque. Inoltre il cambio di stato poteva cancellare le note precedenti.
La prova browser sul codice precedente ha rilevato una scrittura dopo
l'annullamento, quando ne erano attese zero.

## Comportamento corretto

- Approva, Rimetti in attesa e Rifiuta aprono un modulo con nome dell'attività,
  effetto della decisione, stato corrente e note lette dal server.
- Annulla ed Escape chiudono senza scrivere. Durante l'invio la conferma e
  la chiusura sono disabilitate; anche eventi ripetuti non duplicano la richiesta.
- Il rifiuto richiede un motivo non vuoto. Le note esistenti sono precaricate
  e conservate, a meno che l'amministratore le modifichi esplicitamente.
- Prima dell'invio si ricontrollano stato e note. Se sono cambiati, si aggiorna
  il modulo e si richiede di rileggere i dati, senza inviare la vecchia decisione.
- Il successo viene mostrato dopo aver riletto stato, approvazione e note
  corrispondenti. Un HTTP riuscito con una modifica non osservata non basta.
- Letture e scritture hanno un limite di 15 secondi per richiesta. Dopo un
  esito incerto, **Verifica esito** legge lo stato: non ripete la modifica.
  Errori, dati mancanti o risposte malformate non diventano un successo.
- La riga amministrativa viene aggiornata con il record osservato. L'interfaccia
  amministrativa usa etichette italiane e il modulo resta utilizzabile su mobile.

## Perimetro e limiti

La RPC esistente `admin_set_professional_approval` continua a verificare il ruolo
amministratore nel database; il frontend non concede nuovi permessi. Il confine
`pc_private` resta invariato. L'approvazione del profilo non verifica automaticamente
credenziali o risultati sportivi; i relativi pannelli rimangono separati.

Il ricontrollo precedente all'invio **non è un lock atomico** fra amministratori:
una scrittura concorrente successiva alla lettura può ancora prevalere. Un timeout
o la chiusura dell'app non dimostrano che il server abbia annullato la modifica.
Il controllo esito mostra lo stato osservato, senza attribuire al proprio tentativo
un cambiamento incerto. Non esistono retry automatici della modifica o conservazione
di note nel localStorage. Un'eventuale futura API con versione e audit è un
intervento separato, non una capacità dichiarata di questa correzione.

Questo incremento non rifà statistiche o paginazione degli elenchi amministrativi,
non invia notifiche e non modifica profili reali durante i test.

## Verifiche e rilascio

Test mirato: `scripts/tests/test_professional_approval_ui.mjs`. Browser Chromium,
pagina e SDK reali, sessioni e API sintetiche; viste 1440 e 390 pixel. Casi:
annullamento, Escape, note correnti, modifica prima della conferma, motivo vuoto,
invio ripetuto, risposta persa, controllo esito senza reinvio, letture mancanti/
malformate/negate/in timeout, risposta riuscita senza effetto, ruolo proprietario.
Regressione del pannello Working-Dog con il test esistente.

TypeScript, lint mirato, build e verifica SEO accompagnano il pacchetto.
Nessuna prova sul database online o su account reali è implicita.

Installer: `aggiorna_approvazioni_professionisti.py`, con backup e controllo
dell'impronta dei file prima di scrivere. `--publish` esegue TypeScript, lint,
build/SEO, commit dei soli file indicati e push su `main`; non esegue Supabase.
Dopo il push attendere Vercel Ready per quel commit. Lo stato effettivamente
osservato del rilascio rimane in [CURRENT_STATE](CURRENT_STATE.md).
