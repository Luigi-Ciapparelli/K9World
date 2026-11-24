# Il calendario sul telefono

Il proprietario apre **Prenotazioni e messaggi → Collega il tuo calendario**. Il professionista usa **Calendario e disponibilità → Collega il tuo calendario**. Entrambi scelgono l’app, creano il proprio link privato e lo sottoscrivono una volta. Il portale non chiede la password del provider. È un abbonamento al calendario, non un invito al singolo appuntamento o un file statico.

| App | Primo collegamento |
| --- | --- |
| Google Calendar | Da browser su computer: Altri calendari → + → Da URL. Attiva la visualizzazione nell’app con lo stesso account. |
| Apple Calendario / iCloud | Da iPhone: Apri in Calendario Apple oppure Calendari → Aggiungi calendario → Aggiungi calendario con iscrizione. Seleziona iCloud per gli altri dispositivi. |
| Microsoft Outlook | Dal calendario di Outlook sul Web: Aggiungi calendario → Sottoscrivi dal Web. Selezionalo anche sul telefono nello stesso account. Alcune organizzazioni limitano gli abbonamenti esterni. |
| Samsung Calendar | Tramite un account Google sincronizzato con Galaxy. Abbonati in Google da computer e rendi visibile il calendario su Samsung. La disponibilità può dipendere da modello e impostazioni. Non aggiungerlo due volte se esiste già in Google. |

Gli orari vanno dal trentesimo giorno precedente ai prossimi 365 giorni. Restano visibili le prenotazioni confermate o svolte, una sola volta per evento. Nel calendario del titolare compaiono anche gli appuntamenti manuali e i periodi di indisponibilità dell’attività. I turni di lavoro, le assenze del singolo istruttore e le richieste in attesa non sono appuntamenti confermati. Al collaboratore spettano solo le lezioni prenotate effettivamente assegnategli, dopo l’accettazione del collegamento. La funzione non riversa l’intera agenda del centro sull’account di un collaboratore.

Dopo una rettifica si aggiorna lo stesso evento. Gli eventi annullati/rimossi e gli assegnamenti revocati spariscono dalla successiva lettura completa. Per un cambio urgente vale il portale: il provider decide ogni quanto rilegge il feed (anche oltre 24 ore su Outlook). Non leggiamo il calendario personale, non verifichiamo se contiene altri impegni e non inviamo notifiche o inviti a terzi.

## Protezione e operatività

La connessione è facoltativa, per account e app. Il servizio esterno riceve orari, categoria generica e identificatori opachi; nessun contatto, nome cliente/cane, nota, importo, contenuto di messaggi, nome libero del servizio o sede. Il link è un segreto: non inoltrarlo e non allegarlo a segnalazioni. Nel database resta solo un digest. La sostituzione/revoca richiede una sessione ed è limitata all’app scelta. Chiavi, URL privati e contenuti non vengono scritti nei log dell’applicazione. L’infrastruttura di transito e il provider ricevono l’URL della sottoscrizione: limitarne l’accesso operativo. Le copie già acquisite dal provider non possono essere cancellate a distanza. Il cliente elimina il calendario dalla propria app.

L’endpoint Edge `calendar-feed` autentica l’URL privato perché i lettori iCal non inviano il JWT di PortaleCinofilo. Solo questo servizio legge la proiezione con il ruolo server. La versione del collegamento impedisce che due operazioni concorrenti sostituiscano silenziosamente il link. Una revoca viene ricontrollata anche se il provider presenta un ETag. In caso di guasto o oltre 10.000 righe la risposta è temporaneamente non disponibile anziché un falso calendario vuoto. Non usare il feed come backup o per importazioni manuali.

Prove sintetiche: ruoli e appartenenze reali nello schema ricostruito; orari, fuso e fine esclusiva; accesso altrui negato; rotazione e revoche; cambi orario e rimozioni; primo collegamento e disattivazione su schermo piccolo e desktop. La prima visita registra separatamente esito, app e ora effettiva di aggiornamento su un telefono reale (senza conservare il link). Per disabilitare il servizio in emergenza, restituire 503 prima di una lettura; non rispondere con un calendario vuoto e non eliminare prenotazioni.
