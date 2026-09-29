# Area professionista — richieste operative del 13 settembre 2026

## Ingresso professionisti e prima beta accompagnata — 29 settembre 2026

Base remota riletta: `0d113db` (`main`), dopo `2cfc932` (SEO) e
`5bfe88b` (profilo guidato). Luigi conferma Search Console verificata e sitemap
inserita. Home, ricerca, profilo e ingresso professionisti osservati online.
Questo supera gli stati di pubblicazione ancora incerti nei checkpoint storici.

Corretto nell'incremento corrente l'ingresso diretto che assegnava `walker`
senza scelta; attività obbligatoria, modulo accessibile, stato approvazione
in panoramica e pagina professionisti allineata alle funzioni presenti.
TypeScript, build e test browser isolati superati. Nessuna migration.
Dettagli, prove reali ancora da completare e piano d'invito:
[PILOT_READINESS_V1.md](PILOT_READINESS_V1.md).
Bozze: [PILOT_INVITATIONS.md](PILOT_INVITATIONS.md).
Questo incremento resta da applicare/pubblicare; nessun invito inviato.

## Profilo e strumenti professionali guidati — 29 settembre 2026

Base corrente GitHub: `b512eb9`, comprensiva della Home con media richiesta da Luigi.
Nuovo incremento frontend: **Profilo guidato**, quattro attività di base con
progressi sui dati salvati, schermate separate, servizi e attestati in tre passi,
guide dentro gli strumenti, menu raggruppato e protezione delle bozze.
Specifica e limiti: [PROFESSIONAL_GUIDED_WORKSPACE_V1.md](PROFESSIONAL_GUIDED_WORKSPACE_V1.md).
TypeScript, build e prove browser con API simulate superati. Nessuna migration.
Codice pronto da applicare/pubblicare; commit remoto e Vercel Ready di questo
incremento non ancora osservati. I checkpoint sottostanti restano storici.

## Correzione pronta nel codice

Mostrare bookings.notes anche sulle richieste in attesa della dashboard, prima
dei pulsanti Accetta/Rifiuta. La pagina Richieste gia mostra questo campo.
Nessuna nuova query, API o modifica dei permessi. Se il messaggio manca anche
in Richieste, verificare la richiesta specifica e la versione del frontend.

## Funzioni richieste, ancora da implementare

- Calendario degli impegni, con colori distinguibili per servizio/categoria:
  pensione, addestramento, corso ENCI e gli altri servizi offerti.
- Scelta del colore durante creazione/modifica servizio. Mostrare anche nome
  servizio e stato, senza affidare la comprensione al solo colore.
- Risposte del professionista sulla prenotazione: messaggio personalizzato e
  modelli riutilizzabili, incluso invito a contattare il proprio WhatsApp.
  Invio automatico vero, eventi di invio e canale richiedono una scelta esplicita;
  non presumere una integrazione WhatsApp attiva o inviare messaggi da tool.
- Possibilita di mettersi inattivo e impostare un periodo di indisponibilita.
  Distinguere inattivita volontaria da approvazione/verifica amministrativa.
  Bloccare lato server nuove prenotazioni incompatibili e mostrare il periodo;
  non cancellare automaticamente appuntamenti gia accettati.

Ordine di lavoro: visibilita note; calendario e colori insieme a indisponibilita;
risposte e modelli. Sono requisiti di sviluppo, non funzioni gia rilasciate.
Servono API per dettagli servizio e durata appuntamenti: l'attuale proiezione
get_professional_bookings non restituisce end_at e identificativo servizio.
Progettare e testare le estensioni prima di applicare nuove migration.

## Chiarimento continuita

Registra sessione compare in Relazioni e archivio per una relazione active.
Accettare una prenotazione non equivale ad accettare un invito a seguire il cane.
Il proprietario invia l'invito dal profilo pubblico; il professionista lo accetta
in Relazioni e archivio. La UI richiede il flag di continuita attivo nel frontend.
Il backend di continuita risulta applicato dall'output utente (migration
20260913121224). Restano da verificare nel browser sessioni e revisioni.

<!-- professional-calendar-v1 -->
## Calendario professionale e indisponibilità

Implementazione e rilascio: `docs/PROFESSIONAL_CALENDAR_V1.md`. Include colori per servizio, impegni con nome e note, pausa e assenze con termine. Preparazione locale: verificare e applicare la nuova migration prima del frontend. Le risposte ai clienti e i modelli di messaggio restano il prossimo incremento.

<!-- booking-messages-v1 -->
## Messaggi delle prenotazioni e risposte professionali

Incremento successivo al calendario `a712352`: conversazioni fra i partecipanti, messaggi da leggere nelle dashboard, modelli privati e risposte automatiche facoltative. Riferimento: `docs/BOOKING_MESSAGES_V1.md`. Preparazione locale: applicare la nuova migration dopo i test e prima del frontend. Non dichiarare il rilascio concluso senza registrarne l’esito. La continuità condivisa e i media compressi restano nel percorso dedicato.

<!-- continuity-sharing-v1 -->
## Continuità condivisa fra professionisti

Revisioni scelte dall’autore e concessioni del proprietario a destinatari specifici, con durata e revoca. Riferimento: `docs/CONTINUITY_SHARING_V1.md`. PostgreSQL nativo: regressioni e sette casi concorrenti superati dall’utente il 14 settembre 2026. Incremento preparato localmente; applicare la nuova migrazione prima del frontend e registrare l’esito del rilascio. Archivio originale conservato; media e compressione restano nel passo successivo.


## Ripristino strumenti: pacchetti di lezioni — 27 settembre 2026

Primo incremento completo: modelli, assegnazioni, lezioni residue, scadenze,
storico, storni e vista proprietario. Specifica e stato verifiche:
[PROFESSIONAL_PASSES_V1.md](PROFESSIONAL_PASSES_V1.md).
Preparato localmente su base `db2e010`; nuova migration da testare nel WSL
e applicare prima del frontend. Nessuna pubblicazione online attestata qui.
Abbonamenti, tessere e campagne rimangono i prossimi strumenti da ripristinare.

<!-- professional-subscriptions-v1 -->
## Abbonamenti professionali — 28 settembre 2026

Nuovo incremento: piani settimanali, quindicinali o mensili, primo periodo,
rinnovi confermati, lezioni e storni per periodo, chiusura, annullamento e vista
proprietario. Specifica, limiti e rilascio: `docs/PROFESSIONAL_SUBSCRIPTIONS_V1.md`.
Base verificata: `f7d94f4`. Preparato e testato in ambiente isolato; migrazione
`20260928120000_professional_subscriptions.sql` da applicare prima del frontend.
Nessun pagamento automatico. Non dichiarare online finché non è confermato.
