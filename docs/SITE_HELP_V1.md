# Guida rapida — 18 ottobre 2026

Base GitHub verificata: `f79320f`. Incremento solo frontend, preparato localmente.

## Problema osservato

Il componente Chatbot proponeva risposte inglesi fisse su prenotazioni ricorrenti,
sconti automatici, rimborsi e consumo dei pacchetti che non corrispondevano al
prodotto. Era visibile solo dopo l'accesso e non guidava alle pagine effettive.

## Risultato

Pulsante **Aiuto** anche per visitatori. Finestra **Guida rapida**, con ricerca
locale, argomenti espandibili e collegamenti alle funzioni già presenti.

- Visitatori: Impara, Prima del cane, ricerca, iscrizione e recupero accesso.
- Proprietari: richieste, messaggi, pacchetti, abbonamenti, recapiti e relazione
  di continuità. Accettare un appuntamento e accettare un invito sono azioni diverse.
- Professionisti: profilo guidato, richieste, agenda, assenze, clienti e note,
  pacchetti, abbonamenti, collaborazioni e archivio.
- Amministratori: informazioni generali e propri recapiti, senza collegamenti
  impropri alle aree proprietario/professionista.

Gli argomenti di continuità rispettano il flag esistente. Le spiegazioni
precisano che rinnovi, pagamenti, prenotazioni e rimborsi non sono automatizzati.
Non promettono SMS attivi o verifiche delle qualifiche dedotte dall'approvazione.

## Interazione e dati

Dialog nativo con focus iniziale sulla ricerca, Escape, ritorno del focus e
blocco dello scroll sottostante. Altezza limitata allo schermo e contenuto
scorrevole; link HTML reali, anche apribili in una nuova scheda. La navigazione
chiude la guida, anche quando il collegamento porta alla pagina già aperta.
La ricerca ignora maiuscole e accenti, non salva il testo e non lo trasmette.
Cambio account/ruolo ricrea la guida. Nessuna chat AI o agente umano simulato.
Il collegamento assistenza apre il programma email; non invia messaggi da solo.

## Verifica e rilascio

- Contratti Node: argomenti/rotte per ruolo, flag, ricerca e stati vuoti.
- Browser Chromium 1440 e 390 px per visitatore, proprietario, professionista
  e amministratore: link, ricerca senza chiamate API, focus, Escape e layout.
- TypeScript, lint mirato, build produzione e regressione HTML/SEO.

Browser con account/API sintetici. Nessun account o dato online consultato.
Nessun test SQL necessario: tabelle, RPC e policy non cambiano.

Installer `aggiorna_guida_portale.py`: verifica compatibilità, conserva backup
e applica dieci file. Senza opzioni prepara soltanto i file locali. Con
`--publish` esegue test Node, TypeScript, build e SEO, quindi commit/push dei
soli percorsi previsti. Si ferma davanti a modifiche incompatibili; nessun
reset, force push o comando Supabase. Attendere Ready su Vercel per il commit.

Questo intervento non completa il verificatore Working-Dog, gli allegati delle
sessioni, la monetizzazione o l'invio di campagne. Email di marketing sospese.
