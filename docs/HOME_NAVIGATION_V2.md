# Home e navigazione — revisione visiva del 29 settembre 2026

## Richiesta corrente di Luigi

Base `c75d0c1`, dopo la correzione dei blocchi duplicati. Conservare i pulsanti
superiori apprezzati e rendere lo stile più moderno con contenuti visivi
pertinenti. Servizi e Trova aiuto per il cane non devono essere due ingressi.
Questa specifica sostituisce le precedenti decisioni su questa Home.

## Comportamento implementato

- Tre voci principali: **Trova aiuto per il cane** verde (ricerca diretta
  `/search?type=trainer`), **Impara**, **Sport cinofili**. Rimossa Servizi.
- Account, tema e ingresso professionisti restano nel menu delle utilità.
- Hero verde con titolo sans, immagine illustrativa responsive e compressa.
- Movimento lento della foto con comando pausa/ripresa; nessun movimento
  quando il dispositivo richiede di ridurlo.
- Anteprima animata dello shaping di 12 secondi, facoltativa. Video e poster
  vengono richiesti solo aprendo la finestra. Nessun player esterno o tracker.
- Controlli video nativi, chiusura con Escape o pulsante, ripristino del focus,
  pausa quando la scheda viene nascosta, descrizione completa testuale.
- Avvio del video dopo apertura; con riduzione movimento parte in pausa.
- Restano tre brevi principi non interattivi e il richiamo Prima del cane.
  Nessun nuovo elenco servizi, search form, Evidence layer o blocco pro.
- Home pubblica e rimandi autenticati owner/pro/admin conservati.

## Media e limiti

Foto generata e identificata come immagine illustrativa; non è una foto di un
professionista reale. Il video è un’animazione tratta dal DogScene della lezione
Impara, non una ripresa reale. File, pesi e provenienza in
[HOME_MEDIA_ASSETS.md](HOME_MEDIA_ASSETS.md). La lezione non viene modificata.

## Verifica e rilascio

TypeScript, build con continuità attiva, ESLint mirato e diff check.
Browser Chromium isolato con API simulate: menu e link, 320–1920 px senza
sconfinamenti, tema scuro, immagine caricata, video riproducibile di 12 secondi
solo dopo apertura, riduzione movimento, pausa, chiusura e focus.
Anteprime desktop, mobile, scuro e finestra video ispezionate.

Nessuna migrazione, API o dato online modificato. La pubblicazione avviene dal
repository WSL dell’utente tramite installer con controllo hash, backup,
TypeScript/build e commit/push dei soli file dell’incremento. Il nuovo frontend
non va dichiarato online fino a push e deployment Ready confermati.
