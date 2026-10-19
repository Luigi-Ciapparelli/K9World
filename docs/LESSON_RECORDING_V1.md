# Registrazione delle lezioni — recupero e orari italiani

19 ottobre 2026. Base esaminata: `origin/main` a `24aa9a4`.
Incremento frontend, preparato localmente. Stato del rilascio in CURRENT_STATE.

## Problema corretto

Il modulo di pacchetti e periodi di abbonamento conservava il proprio UUID
soltanto finché i dati non cambiavano e la finestra restava montata. Se il server
registrava una lezione ma la risposta andava persa, cambiare descrizione o
riaprire il modulo poteva generare una nuova operazione e scalare due lezioni.

La RPC esistente `record_pass_use` riconosce già UUID e dati invariati. Il frontend
ora conserva quel contratto: dopo un esito incerto blocca i campi e presenta
**Riprova lo stesso invio**. Il controllo riguarda la lezione già inviata, anche
quando era l'ultima disponibile. L'elenco mostra **Verifica registrazione** finché
il tentativo non riceve conferma. Nessun retry viene eseguito automaticamente.

## Comportamento e confini

- Dati e UUID rimangono in memoria, separati per account e pacchetto/periodo.
  Si recuperano chiudendo/riaprendo il modulo o navigando nello stesso sito.
  Non vengono scritti in localStorage o sessionStorage.
- Un rifiuto esplicito della prima operazione permette di correggere i campi.
  Se c'è già stata una risposta incerta, un rifiuto successivo non basta a
  dimostrare che il primo invio non abbia registrato la lezione: si conserva il tentativo.
- Solo il ritorno dell'UUID atteso conferma la registrazione. Risposte errate,
  errori di rete e timeout lasciano disponibile il recupero. Richieste annullate
  e risposte tardive non devono ripristinare un tentativo già sostituito.
- Timeout di 15 secondi su registrazione e caricamento delle prenotazioni
  compatibili; l'interfaccia offre un nuovo tentativo esplicito.
- Le prenotazioni si caricano soltanto scegliendo quel metodo. Errori e dati
  malformati non diventano un elenco vuoto apparentemente valido.
- Modulo manuale e storico usano `Europe/Rome`, come il calendario. Un orario
  inesistente al cambio primaverile viene rifiutato; al cambio autunnale si
  sceglie prima o seconda occorrenza. Nessuna conversione dal fuso del dispositivo.
- Il browser blocca date future e descrizioni vuote; periodo, credito, stato,
  prenotazione compatibile e autorizzazione restano controlli del database.

**Limite dichiarato:** un ricaricamento completo, una nuova scheda o la chiusura
del browser perdono il tentativo in memoria. Prima di reinserire una lezione dopo
una risposta persa, verificare lo storico. Non si promette idempotenza fra nuove
istanze dell'applicazione. Nessuna bozza privata persistente introdotta.

Non cambiano assegnazioni, rinnovi, storni, pagamenti, consensi o permessi.
Nessuna migration, funzione Edge o servizio a pagamento aggiunto.

## Prove locali

- `node scripts/tests/test_lesson_time.mjs`: inverno/estate, cambio ora,
  anno bisestile e date invalide con fusi dispositivo Italia, New York e Tokyo.
- `test_lesson_recording_ui.mjs`: SDK reale con API sintetiche, pacchetti e
  abbonamenti a 1440 e 390 px, risposta persa dopo registrazione, ultima lezione,
  chiusura/riapertura, UUID e parametri identici, risposta con ID errato,
  rifiuto esplicito iniziale/successivo, ora ambigua/inesistente, data futura,
  errore e risposta malformata delle prenotazioni, timeout e navigazione durante invio.
- Regressioni `test_professional_passes_ui.mjs` e
  `test_professional_subscriptions_ui.mjs`: assegnazione, rinnovo, uso, storno,
  storico, annullamento e proprietario mobile. Fixture profilo allineata alla
  lettura singola di AuthContext; nessuna modifica del comportamento Auth.
- TypeScript, lint mirato, build produzione e controllo SEO.

I test browser usano esclusivamente account e dati sintetici. Nessuna registrazione
nel database online; le proprietà SQL esistenti sono state lette, non viene
ripetuta né dichiarata una nuova prova SQL per questo incremento frontend.

## Applicazione

Scaricare `aggiorna_registro_lezioni.py` nella cartella Download Windows. In WSL:

```bash
cd ~/K9World && python3 /mnt/c/Users/Lugi/Downloads/aggiorna_registro_lezioni.py ~/K9World --publish
```

Lo script verifica file e dipendenze contro la copia esaminata, conserva backup,
esegue test orari/TypeScript/build/SEO e pubblica soltanto i percorsi inclusi.
Si ferma davanti a versioni incompatibili o lavoro estraneo da pubblicare.
Nessun comando Supabase. Attendere Vercel Ready per il commit stampato.
Il pacchetto preparato non è una dichiarazione di pubblicazione già avvenuta.
