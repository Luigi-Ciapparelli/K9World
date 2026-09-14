# Area professionista — richieste operative del 13 settembre 2026

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
