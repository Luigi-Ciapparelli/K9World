# Impara — percorso operativo v3

Data: 27 settembre 2026. Base esaminata: `fa43378` (`origin/main`).
Stato di questo incremento: implementato e collaudato nella copia di lavoro;
la pubblicazione sul dominio non è dichiarata eseguita da questo documento.

## Cosa viene ripristinato e completato

La richiesta riguarda Impara: riportare le funzioni previste a un uso reale,
prima delle attività di lancio. Non riabilita abbonamenti, pagamenti, campagne
o altri moduli professionali beta disattivati.

- Quattro moduli, otto lezioni pubbliche. Stessi URL e identificatori delle
  lezioni precedenti; 25 parti di lettura con esempi e domande applicative.
- Otto attività di osservazione con quaderno compilabile, checklist di
  riflessione e salvataggio automatico; utilizzabili anche senza un cane,
  dichiarando di lavorare sul caso della lezione. Glossario e piano personale
  nell’ultima attività. Nessuna falsa verifica del lavoro sul campo.
- Un laboratorio di timing reale: filmato astratto originale incluso nel
  progetto (circa 24 KB), animazione equivalente se il video non si carica,
  input mouse/tocco/tastiera, velocità normale/lenta, click sonoro facoltativo,
  confronto anticipo/ritardo, massimo un click valido per passaggio.
- Quattro quesiti per lezione (32 totali), casi applicativi, tutte le risposte
  obbligatorie, soglia 3/4, spiegazioni, ripetizione. Le risposte già corrette
  vengono mostrate, quelle errate sono indicate. L’ultima verifica inviata
  determina il risultato; iniziare un nuovo tentativo non cancella il precedente.
- Progressi derivati da letture + attività + quiz, ripresa dell’ultima lezione
  incompleta, ricerca per argomento, riepilogo a percorso completato.
- Download del quaderno in testo, backup/import JSON validato, azzeramento
  con conferma. I testi importati sono renderizzati come testo, non HTML.
- Collegamenti diretti all’addestratore per la gestione quotidiana, a Prima del
  cane e agli approfondimenti pertinenti. Sport resta un percorso distinto.
- Layout desktop/mobile e tema scuro, pulsanti con focus e campi etichettati.

## Come funziona il progresso

Chiave corrente: `portalecinofilo-impara-v3`. Non occorre un account.
La vecchia `pawconnect-impara-stage1-v2` viene letta solo se manca quella nuova:
si recuperano le letture note, deduplicate; le vecchie spunte di attività e
"verified" non equivalgono a prove svolte nelle nuove attività.
Il dato vecchio non viene cancellato, ma dopo un salvataggio/azzeramento
viene usata la chiave nuova. Nessuna scrittura in Supabase.

I progressi sono dati locali non certificati, modificabili dal proprietario del
browser. Non sono credenziali e non influenzano ranking/badge professionali.
La milestone significa autoverifica completata, mai qualifica o competenza
supervisionata. Stage successivi e Credential Wallet restano nel piano di
`LEARNING_CREDENTIAL_CORE.md`; nessun attestato ufficiale viene simulato.

Il quaderno può essere letto da chi usa lo stesso profilo del browser: questa
informazione compare nell’interfaccia. Non viene inviato al server; non è
cifrato né sincronizzato. Backup e quaderno possono essere scaricati.
Se il salvataggio è bloccato/quota esaurita, compare un avviso e la copia resta
in memoria durante la navigazione; esportare prima di chiudere.

Un’attività modificata richiede una nuova conferma. Una lezione perde lo stato
completato se si annulla una lettura, si modifica un’attività o l’ultima verifica
inviata non supera la soglia. Un tentativo di timing fallito non cancella una
precedente prova riuscita. Sono conservati gli ultimi cinque quiz per lezione.

## Laboratorio e contenuti

`public/media/impara/timing-linea-v1.mp4` è generato da
`scripts/media/generate_impara_timing.sh`, senza materiale esterno.
La sfera attraversa la linea a 2/5/8/11 secondi; tolleranza didattica ±350 ms,
almeno tre passaggi centrati senza click extra. La modalità lenta usa gli stessi
istanti del video. Dispositivo e riproduzione incidono sulla precisione: non è
uno strumento di misura professionale. Cambiare finestra interrompe il tentativo.
Nessun video può essere caricato dagli utenti. Il supporto ai video del portale
resta nel modello di attività; non sono stati inventati filmati di cani reali.
L’esercizio astratto allena occhio/mano, non certifica abilità con il cane.

Riferimenti pubblici RSPCA, Dogs Trust e FCI sono collegati nelle lezioni per
approfondire. Esempi, casi e quaderni sono formulazioni editoriali del portale.
I contenuti non si presentano come materiale approvato ENCI. Resta opportuna la
revisione editoriale con un professionista prima di trasformarli in corsi
accreditati. Il percorso non insegna a provocare reazioni per fare una prova.

## Verifiche effettuate

- `npm run typecheck` e build di produzione con continuità attiva.
- `node scripts/tests/test_impara_progress.mjs`: importazione legacy, dati
  corrotti, salvataggio bloccato, completamento derivato, quiz, timing e export.
- `scripts/tests/test_impara_ui.mjs` in Chromium: percorso pubblico, prerequisiti,
  appunti dopo reload, risposte/feedback e cambio lezione, video realmente
  riprodotto, click ripetuti, backup/import/azzeramento, sincronizzazione fra
  schede del browser, mobile 390 px, tema scuro, video assente e tastiera.
- Ispezione visiva screenshot desktop, mobile e tema scuro; nessun overflow.
  Supabase intercettato con risposte sintetiche. Nessun account reale utilizzato.

Comando di base per i test browser (Playwright disponibile esternamente):

```bash
VITE_SUPABASE_URL=https://pc-impara-test.supabase.co \
VITE_SUPABASE_ANON_KEY=synthetic VITE_PROFESSIONAL_CONTINUITY=true \
npm run dev -- --host 127.0.0.1 --port 5189 --strictPort
```

In un secondo terminale della stessa macchina:

```bash
PC_TEST_BASE_URL=http://127.0.0.1:5189 node scripts/tests/test_impara_ui.mjs
```

Variabili facoltative: `PC_PLAYWRIGHT_MODULE`, `PC_CHROMIUM_PATH`,
`PC_SCREENSHOTS`. I test interrompono richieste dirette a un backend diverso
da `pc-impara-test.supabase.co`. Nessuna nuova dipendenza di produzione.

## Applicazione e pubblicazione

L’installer `aggiorna_impara.py` controlla tutti gli hash prima di modificare
file, crea un backup sotto `.git/codex-backups`, applica solo l’incremento Impara
ed è idempotente. Con `--publish` esegue test locali, TypeScript e build, controlla
il rapporto con `origin/main`, committa solo i file dell’incremento e pusha `main`.
Rifiuta branch diversi, file cambiati in modo inatteso o altri file già in staging.
Gli output dei comandi sono visibili: nessun prompt Supabase nascosto.

Nessuna migration, funzione Edge, variabile o credenziale è necessaria. Vercel
riceve il commit tramite la connessione Git già in uso. Registrare commit e stato
del deployment dopo il push: build locale e push non provano da soli che il
nuovo sito sia già servito. In caso di errore non azzerare il database.
