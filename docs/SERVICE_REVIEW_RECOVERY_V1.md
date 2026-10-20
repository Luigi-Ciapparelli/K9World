# Recupero delle valutazioni — 20 ottobre 2026

## Problema e risultato

Una recensione poteva essere salvata dal server senza che il browser ricevesse
la risposta. Chiudendo il modulo si perdeva il riferimento dell’invio; riprovare
generava un riferimento diverso. Una richiesta senza risposta poteva inoltre
lasciare il modulo in attesa indefinita.

L’invio conserva ora account, prestazione, versione, voto, commento e riferimento.
Dopo un esito incerto i campi restano fermi e compare **Verifica invio**.
Chiudendo il modulo o navigando nell’app, **Riprendi verifica** riapre lo stesso
tentativo, anche se il server mostra già la recensione salvata.

Le richieste hanno un limite di 15 secondi. Il superamento non prova che il
server abbia annullato l’operazione. Le risposte vengono validate prima di
mostrare un successo. Un rifiuto esplicito al primo invio permette di correggere
i dati; un rifiuto successivo a un esito incerto non cancella il riferimento.
Invii doppi bloccati; prestazioni diverse conservano tentativi separati.

## Regole conservate

- Giudizio sulla prestazione prenotata, nessuna media generale dell’attività.
- Soglie, completamento del servizio e finestra di rettifica invariati.
- Voto del professionista privato; commento del cliente e voto pubblico secondo
  le regole esistenti. Nessuna estensione dei permessi.
- Date delle prenotazioni mostrate nel fuso italiano.
- Tentativi solo in memoria: niente testo delle recensioni in localStorage,
  sessionStorage o log. Cambio account/uscita rimuovono i tentativi.
- Ricaricare completamente la pagina o chiudere la scheda perde la memoria
  locale; un’eventuale recensione già salvata rimane sul server. Limite indicato
  nel modulo. Non è una sincronizzazione fra dispositivi.

Le RPC esistenti mantengono l’idempotenza e i controlli lato server.
Nessuna migration, funzione Edge o nuova dipendenza di produzione.

## Prove e limiti

La prima verifica [GitHub Actions](https://github.com/Luigi-Ciapparelli/K9World/actions/runs/39460404902)
ha riprodotto il difetto sulla base `ff529e9` e superato TypeScript, build/SEO
e tre suite browser con API sintetiche. La revisione successiva elimina il
warning del lint mirato e aggiunge un caso con due prestazioni e doppio submit.
Il workflow ripete le prove per il nuovo commit: consultare i controlli
della [PR #1](https://github.com/Luigi-Ciapparelli/K9World/pull/1) per l’esito finale.

Copertura: risposta persa dopo salvataggio, riapertura, timeout reale,
navigazione interna, risposta malformata, conflitto tardivo, primo rifiuto
correggibile, lettura bloccata/malformata, logout, ricaricamento, isolamento
di due prestazioni e doppio invio. Regressioni delle valutazioni private e
pubbliche su desktop/mobile. Nessuna chiamata al database o agli account reali.

Gli avvisi npm dell’installazione restano un lavoro distinto (SEC-03);
il superamento dei test non equivale a un audit di tutte le dipendenze.

## Consegna

Codice e documentazione vengono integrati tramite PR GitHub dopo i controlli.
La pubblicazione Vercel viene verificata separatamente; nessun comando Supabase
è richiesto da questo incremento. Per aggiornare una copia locale pulita:
`git pull --ff-only origin main`, dal ramo main.

Email sospese, MEDIA-01 rinviata, MATCH-01 soltanto documentale.
