# Recupero delle pagine in errore

10 ottobre 2026. Base remota esaminata: `0f51f98`. Correttivo preparato;
lo stato di pubblicazione è mantenuto in CURRENT_STATE.

## Difetto osservato

Nella build precedente, rispondere 404 al modulo JavaScript di una pagina
visitata con caricamento differito svuotava la radice React. Il caso è stato
riprodotto in Chromium con la pagina Impara. Il progetto usava Suspense per
l’attesa, ma non aveva un Error Boundary per il fallimento.

Un modulo può mancare durante problemi di rete o per riferimenti a una vecchia
build dopo un deploy. Non è stata accertata la causa del disservizio storico
segnalato da Luigi; questo intervento non prova un guasto Vercel/Supabase, né
motiva il passaggio a un piano a pagamento o a un home server.

## Comportamento

- Errore nel caricamento della pagina: messaggio comprensibile, pulsante per
  ricaricare, collegamento alla home e contatto ufficiale. Nessun URL interno,
  messaggio grezzo dell’eccezione, token o dato personale viene riportato nella UI.
- Errore di rendering: testo distinto, senza dichiarare che sia una nuova
  versione o un problema di connessione. Il confine della pagina conserva
  navigazione/footer; un confine esterno copre anche errori dei provider/shell.
- Navigazione su un’altra pagina: il confine locale si reinizializza. Un cambio
  del solo query parameter (per esempio i passi del profilo guidato) non rimonta
  il contenuto e non elimina la bozza. Nessuna modifica alle guardie del router.
- Rete assente: avviso e pulsante di ricarica disabilitato finché il browser
  segnala offline. Tornare online non ricarica e non invia nulla automaticamente.
  Lo stato di rete del browser è un indizio, non una prova che Supabase sia raggiungibile.
- Caricamento oltre 10 secondi: indicazione di attesa prolungata e scelta di
  ricaricare. Il caricamento originale può ancora completarsi e togliere l’avviso.
- Ricarica solo su azione dell’utente, sull’URL corrente, senza cancellare storage
  locale o sessione. Avviso esplicito sulle modifiche non salvate. Un errore che
  smonta il modulo può già averne perso lo stato in memoria: nessun recupero delle
  bozze dopo crash viene promesso. Una pagina aperta e funzionante resta montata
  quando cambia soltanto la connessione.

I due import asincroni dei metadati (generale e profilo professionale) gestiscono
anche il fallimento della Promise: non generano eccezioni globali durante una
perdita di rete. Rimane l’ultimo head disponibile finché una successiva lettura
riesce o si ricarica; il documento HTML pubblico conserva i metadati prerenderizzati.
Non si promette che la navigazione offline aggiorni titolo/canonical della nuova pagina.

## Perché il recupero è manuale

React.lazy conserva il risultato della Promise, inclusi gli errori. Rimontare
soltanto lo stesso componente lazy non garantisce un nuovo tentativo di import.
La ricarica esplicita ottiene un nuovo documento senza loop o cancellazioni di
cache generalizzate. Non intercettare il preload per nascondere l’errore e
lasciare un modulo indefinito; il confine React gestisce il fallimento.

## Verifiche

- `test_page_recovery_ui.mjs`: build reale, Chromium desktop e mobile, risposta
  404, offline/online, modulo lento, eccezione sintetica di rendering.
  Verifica shell/focus, ricarica manuale, URL/progresso locale, altra navigazione,
  campi già compilati conservati quando cambia la rete, nessun refresh/invio automatico.
- `test_professional_guided_ui.mjs`: salvataggi, passi del profilo, bozza conservata
  cambiando passo, annullamento uscita, errori/retry, servizi e permessi della UI.
- `test_password_recovery_ui.mjs`: callback e guardie del recupero password restano
  funzionanti dopo l’inserimento del confine anche nelle pagine di recupero.
- TypeScript, build, controlli HTML SEO e `git diff --check`.

I test usano errori e API simulati; nessuna credenziale o richiesta al progetto
Supabase reale. Le schermate sintetiche non attestano il funzionamento dei
servizi online. Nessun test SQL necessario: schema, RPC e RLS invariati.

## Limiti

Gli error boundary React coprono rendering/lifecycle e gli import lazy rifiutati;
non sostituiscono la gestione degli errori dei singoli eventi o delle chiamate API.
Se il documento, lo script iniziale, il browser o l’intero server non rispondono,
questa interfaccia potrebbe non avviarsi. Nessuna promessa di disponibilità
assoluta, monitoraggio remoto o riparazione automatica del backend.

Il service worker esistente, i cookie, i dati locali e i token non sono modificati.
Nessuna nuova dipendenza, telemetria, servizio esterno o invio automatico introdotto.
Le recensioni dei centri e TEAM-01 rimangono un blocco separato da implementare;
questo correttivo rispetta la precedenza assegnata ai difetti concreti.

## Rilascio

Nel terminale WSL:

```bash
cd ~/K9World && python3 /mnt/c/Users/Lugi/Downloads/aggiorna_recupero_pagine.py ~/K9World --publish
```

L’installer controlla il remoto e tutti i file prima di scrivere, crea backup,
preserva lavoro estraneo e verifica typecheck/build/SEO. Commit e push solo dei
percorsi inclusi. Nessuna migration o chiamata Supabase. Senza `--publish`
prepara soltanto. Dopo il push attendere il relativo deploy Vercel, registrando
l’esito senza confonderlo con i test locali.

Riferimenti primari consultati il 10 ottobre 2026:
- https://v5.vite.dev/guide/build#load-error-handling
- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
