# Strumenti professionali — mappa e lavoro residuo

Consolidato il 9 ottobre 2026. Lo stato di rilascio è mantenuto soltanto in
[CURRENT_STATE](CURRENT_STATE.md); l'ordine è in
[EXECUTION_PRIORITIES](EXECUTION_PRIORITIES_2026_10.md).

## Già presenti nel repository

| Strumento | Punto di ingresso / specifica |
| --- | --- |
| Profilo guidato e servizi per attività | `/pro/settings`; [workspace](PROFESSIONAL_GUIDED_WORKSPACE_V1.md), [catalogo/Esposizioni](EXHIBITIONS_RELEASE_V1.md) |
| Richieste, nome e note del cliente | `/pro/bookings`, dashboard; [lettura prenotazioni](PROFESSIONAL_BOOKING_READ.md) |
| Calendario, colori, pause e indisponibilità | `/pro/calendar`; [specifica](PROFESSIONAL_CALENDAR_V1.md) |
| Messaggi, inbox e modelli | Prenotazione/dashboard/impostazioni; [specifica](BOOKING_MESSAGES_V1.md) |
| CRM autorizzato | `/pro/crm`; accesso ai clienti pertinenti |
| Relazioni, sessioni, note e revisioni | `/pro/archive`; [continuità](CONTINUITY_UI_V1.md) |
| Condivisione selettiva e archivio scaricabile | Relazione/storico ricevuto; [sharing](CONTINUITY_SHARING_V1.md), [export](DOG_HISTORY_EXPORT_V1.md) |
| Pacchetti | `/pro/passes`; [specifica](PROFESSIONAL_PASSES_V1.md) |
| Abbonamenti | `/pro/subscriptions`; [specifica](PROFESSIONAL_SUBSCRIPTIONS_V1.md) |
| Valutazioni | Dashboard e «Le vostre esperienze»; [specifica](SERVICE_REVIEWS_V1.md) |
| Statistiche | `/pro/analytics`; leggere il codice prima di promettere metriche ulteriori |

## Chiarimenti che evitano diagnosi errate

Una richiesta accettata è un appuntamento; non attiva automaticamente una
relazione di continuità. L'invito proprietario e l'accettazione del professionista
rendono attiva la relazione; da lì si registrano sessioni. Il flag di continuità
deve essere attivo nel build. Gli account admin e professionista non sostituiscono
l'area proprietario per inviare l'invito per un cane.

Note del richiedente, conversazioni, appunti CRM e revisioni professionali sono
oggetti distinti. Non allargare i permessi di uno per risolvere la visibilità
di un altro. I modelli di risposta non sono un'integrazione WhatsApp.

I pacchetti/abbonamenti gestiscono prestazioni e periodi, non incassi automatici.
Calendario, messaggi e abbonamenti non sono ancora «da ripristinare» perché
una lista di settembre usava quell'espressione.

## Da completare

- **MEDIA-01:** allegati delle sessioni privati, compressione e quote, conservazione,
  condivisione e download; non basta la foto profilo del cane già esistente.
- **REV-02:** valutazioni riferite alla singola prestazione prenotata, anche nei centri,
  senza voto a persona/struttura: [SERVICE_REVIEWS_V2](SERVICE_REVIEWS_V2.md).
- **TEAM-01:** professionisti nel centro e istruttore assegnato al servizio per
  organizzazione e tracciabilità. Non è una dipendenza delle valutazioni REV-02.
- **SPORT-02:** identità/fonte reale e merito per disciplina, senza auto-verifiche.
- **Tessere e campagne:** vecchi strumenti rimossi, non dichiarati ripristinati.
  Valutare il problema reale prima di riportarli nella navigazione; campagne
  richiedono destinatari, autorizzazioni e canali espliciti.
- **Letture/riferimenti e ulteriori percorsi formativi:** requisiti di prodotto
  da confrontare con il codice quando affrontati; nessun badge per quantità di libri.

Ogni incremento mantiene la procedura guidata, schermate separate, campi
contestuali e avanzamento basato sui dati salvati. Non reintrodurre un modulo
unico con decine di campi né pulsanti che promettono funzioni non operative.
