# Turni settimanali degli istruttori

17 ottobre 2026. TEAM-01. Base remota osservata `9855c8f`; pacchetto unico con le
note preparate in `64159fa`. Migration nuova 68ª:
`20261016230000_instructor_weekly_shifts.sql`. Preparato localmente; non online.

## Uso

Il centro apre **Istruttori del centro → Turni settimanali**, sceglie un giorno
e aggiunge fino a quattro fasce. Una settimana tipo vale per quel collaboratore
in quel centro. Gli orari sono italiani (Europe/Rome); ogni fascia inizia e
finisce nello stesso giorno, con opzione fino a mezzanotte. Fasce adiacenti o
sovrapposte vanno unite. Per orari notturni si configurano due giorni distinti;
una singola lezione deve comunque rientrare interamente in una fascia.

La casella **Usa questi turni per le nuove assegnazioni** parte disattivata:
nessuna nuova restrizione ai collaboratori già presenti. Con il piano attivo,
i giorni senza fasce sono fuori turno. Il calendario filtrato per istruttore
mostra giorni non lavorativi e orari del giorno selezionato. Se la lettura fallisce,
l’interfaccia avverte senza dichiarare disponibili le ore vuote.

Solo il centro modifica i turni. La persona collegata li consulta in
**Collaborazioni con i centri** e continua a poter registrare le proprie assenze.
Le assenze prevalgono sui turni; rimangono i controlli su sovrapposizioni,
attività del collaboratore e disponibilità del centro.

## Lezioni e conservazione

Il server rifiuta una **nuova assegnazione** fuori turno (`PCX04`), anche se il
centro conferma una lezione di gruppo. Questo non è un generatore di slot pubblici
né una modifica del normale modulo di richiesta: il cliente propone data/orario,
il centro conferma e assegna il collaboratore con i controlli previsti.

Cambiare un turno non cancella né sposta una lezione già accettata. Il centro vede
un avviso e il numero delle lezioni future incompatibili; controlla il calendario
e concorda eventuali cambiamenti. Ripetere la medesima assegnazione resta idempotente.
Gli orari privati non vengono mostrati al proprietario. Disattivare il piano non
annulla le assenze né i controlli sulle sovrapposizioni.

## Sicurezza e conflitti

- Due tabelle `pc_private`, RLS e nessun accesso diretto ai ruoli client/service_role.
  Wrapper pubblici invoker, implementazioni private con search_path vuoto.
- Centro con account verificato; lettura istruttore limitata a collaborazione
  attiva e confermata. Nessuna lettura per altri clienti o professionisti.
- Lock del centro condiviso con le assegnazioni; autorizzazione ricontrollata dopo
  l’attesa. Versione UUID contro modifiche concorrenti e audit delle variazioni.
- Due invii identici producono una sola variazione. Una risposta incerta conserva
  il payload per un retry identico; un conflitto mantiene la bozza e richiede una
  rilettura esplicita, senza sovrascrivere il lavoro di un’altra sessione.
- Nei cambi d’ora, una fascia con estremo ambiguo o inesistente non consente nuove
  assegnazioni per quella occorrenza. Le giornate 00:00–24:00 funzionano anche
  quando durano 23 o 25 ore.

## Prove

Ricostruite 67 migration precedenti e applicata la nuova su PGlite; regressioni
team, calendario, account, assenze, completamento, messaggi e note. Verificati
confini, pause, permessi, retry, versioni, vecchia RPC, assenze, preservazione
lezioni, revoca accessi, fuso e cambio d’ora. Corretto anche un test delle assenze
che usava il giorno UTC anziché quello italiano al confine della mezzanotte.

Browser sintetico desktop 1440 e mobile 390: modifica guidata, validazioni,
retry dopo risposta incerta, conflitto con bozza conservata, lettura sola,
calendario ed errore di caricamento. Regressione note inclusa. TypeScript e
build/SEO verificati. Lint dei file interessati senza errori, con un warning
preesistente in ProTeam sul cleanup di un ref.

`test_instructor_weekly_shifts.py` include le regressioni e **12 casi concorrenti**
PostgreSQL nativi: 8 delle note e 4 dei turni (turno prima dell’assegnazione,
assegnazione prima del turno, due modifiche diverse, due invii identici).
Qui i quattro nuovi scenari sono verificati in sequenza, non con due connessioni:
l’installer esegue la prova nativa sul PC di Luigi prima del rilascio.
Auth/Storage simulati. Nessuna prova online implicita.

## Rilascio unico

Scaricare `aggiorna_turni_istruttori.py` in Downloads. Nel terminale WSL:

```bash
cd ~/K9World && python3 /mnt/c/Users/Lugi/Downloads/aggiorna_turni_istruttori.py ~/K9World --publish
```

Sostituisce l’installer delle note. Compatibilità verificata prima di qualsiasi
scrittura; preserva modifiche estranee e staging, crea backup ed esegue test nativo,
TypeScript, build/SEO e dry-run con timeout. Crea il commit prima dell’applicazione
SQL, poi pubblica su main; nessun force push o reset. Ammette soltanto le migration
messaggi, note e turni mancanti, nell’ordine; altre migration pendenti interrompono
il rilascio. Riconosce anche il pacchetto già installato senza riscriverlo.

Dopo Ready, il centro può impostare la settimana tipo. Non servono Edge Function,
nuove dipendenze, secret o abbonamenti. Nessun messaggio o invito viene inviato.
Restano fuori da questo incremento ruoli di amministrazione/segreteria del centro,
turnazioni alternate, sostituzioni automatiche e quote/allegati delle sessioni.
