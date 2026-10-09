# Valutazioni dopo i servizi — REV-01

Stato al 9 ottobre 2026: implementazione presente su GitHub in `fd619e4`.
La preparazione/test usavano come base `3ec87ad`. Presenza sul remoto,
applicazione Supabase e deployment Vercel restano evidenze distinte:
vedere [CURRENT_STATE](CURRENT_STATE.md).

## Regole approvate da Luigi

| Esperienza | Chi valuta | Quando | Visibilità |
| --- | --- | --- | --- |
| Addestratore individuale | Cliente: voto e commento; addestratore: voto | Dopo il secondo servizio effettivamente concluso con quella persona | Recensione dell’attività pubblica; voto sul cliente solo tra i due partecipanti |
| Pensione, anche in un centro o attività mista | Solo cliente | Dopo il primo soggiorno effettivamente concluso | Recensione dell’attività pubblica |
| Toelettatura, handler e altre categorie precedenti | Solo cliente, come già previsto | Servizio concluso | Recensione dell’attività pubblica |
| Addestramento in un centro/attività non individuale | Nuovo invito reciproco sospeso | Serve l’identificativo del singolo istruttore nella prenotazione | Nessuna somma di esperienze con persone diverse |

Scala 1–5; commento facoltativo, massimo 500 caratteri Unicode. Il cliente può
leggere il voto privato ricevuto; altri professionisti e visitatori non possono.
Non esiste un punteggio globale del proprietario. Nessun email, SMS, pixel,
provider o costo ricorrente aggiunto.

La soglia riguarda la coppia cliente–addestratore, anche con servizi o cani
diversi. Non dipende da pacchetti acquistati. Nei profili misti conta il tipo di
servizio accettato: una pensione non genera un invito a valutare il cliente.
I corsi classificati `enci_course` di un account individuale seguono il percorso
formativo; questa classificazione non prova riconoscimenti ENCI.

## Completamento e attribuzione

Il professionista conferma che il servizio è stato svolto. La transizione
`accepted → completed` viene respinta dal database prima di `end_at`, anche
chiamando la vecchia API. Il solo trascorrere del tempo non cambia lo stato.
Prenotazioni in attesa, accettate, rifiutate o annullate non contano. Non essendoci
uno stato autonomo «mancata presenza», non va dichiarata completata; la UI lo
ricorda prima della conferma.

Tipo di servizio e natura individuale dell’account sono acquisiti
all’accettazione: modificare successivamente il catalogo non riclassifica
l’esperienza. Per gli appuntamenti precedenti al rilascio si usa lo stato
persistito e la classificazione disponibile alla migrazione; non si inventa
una data di completamento né l’identità di un istruttore sconosciuto.
Le prenotazioni già completate e trascorse contano verso la soglia, ma non
producono inviti arretrati: serve un nuovo completamento.

## Interfaccia e cadenza

- Dashboard: richiamo «Come è andata?» quando ci sono valutazioni da lasciare.
- Prenotazioni: sezione «Le vostre esperienze», cinque rapporti per pagina,
  separata dall’elenco degli appuntamenti.
- Una recensione corrente per coppia e tipo (`trainer`/`boarding`). Dopo un
  nuovo servizio si può aggiornarla senza moltiplicare il peso della stessa
  persona nella media. I voti storici preesistenti non vengono rimossi.
- Il promemoria scompare dopo l’invio o «Non ora». Non ricompare ad ogni lezione;
  la sezione resta accessibile per una scelta volontaria successiva.
- Prima valutazione possibile finché l’esperienza resta disponibile. Rettifica
  entro 7 giorni dal primo invio relativo a quell’esperienza; una rettifica
  non prolunga la finestra. Una nuova esperienza abilita un nuovo aggiornamento.
- La recensione dell’attività è pubblicata subito nella proiezione esistente,
  solo se il profilo professionale è approvato. Nessuna promessa di anonimato,
  pubblicazione cieca o certificazione della competenza.
- Segnalazioni tramite il contatto di assistenza esistente. Nessun filtro
  automatico che cancelli giudizi negativi; non viene introdotto un sistema
  completo di moderazione o un termine garantito di risposta.

La cadenza, la rettifica a 7 giorni e l’assenza di inviti arretrati sono scelte
operative di questo incremento, documentate per poterle rivedere. Il limite
centri è reale: il modello corrente non assegna gli istruttori alle prenotazioni;
non considerare conclusa quella estensione di REV-01.

## Dati e compatibilità

Migration: `20261008220000_completed_service_reviews.sql`.

Tre tabelle in `pc_private`, RLS attiva e nessun accesso diretto per `anon` o
`authenticated`: contesto dell’esperienza, valutazioni del rapporto e registro
degli invii/rettifiche. I nuovi wrapper pubblici sono `SECURITY INVOKER`, con
implementazioni a privilegi controllati nello schema privato e `search_path=''`.

RPC: `get_my_service_reviews`, `write_service_review`,
`dismiss_service_review`, `get_legacy_review_bookings`.
La vecchia `submit_review` resta compatibile ma non aggira la soglia. Il voto
sul cliente non entra in `public.reviews`, nella media del professionista, nei
risultati della ricerca, nei badge o negli export del cane. Le revisioni
conservano il valore precedente nel registro privato, non nel profilo pubblico.
Le cancellazioni seguono i legami con account/prenotazioni; non promettere una
conservazione permanente delle recensioni equivalente all’archivio formativo.

Gli invii usano un identificativo stabile per i retry e una versione attesa.
Le scritture sullo stesso professionista sono serializzate; due modifiche con
la stessa versione non si sovrascrivono. Le credenziali del chiamante sono
verificate nel database. La UI rimuove dati e dialoghi al cambio account.

## Verifiche e rilascio

- Ricostruzione delle 53 migration precedenti, poi nuova migration e assert SQL
  su soglie, pensioni, attività miste, centri, vecchia API, storico, aggregati,
  autorizzazioni, retry, conflitti di versione e rettifiche.
- Browser con account e risposte API sintetici, desktop 1440 px e mobile 390 px:
  voto, commento, limiti, invio ripetuto, errori, riservatezza e uscita account.
- TypeScript, build con continuità attiva e controlli SEO.

Auth/Storage sono simulati nei test SQL; nel browser le API sono simulate.
La serializzazione concorrente su due connessioni native e l’utilizzo su
Supabase online non sono attestati da questi controlli. Non dichiarare la
funzione online prima del rilascio coordinato.

L’installer `aggiorna_valutazioni_servizi.py ~/K9World --publish` verifica i file,
crea un backup, esegue il test PostgreSQL nativo in WSL, typecheck e build,
controlla il dry-run, crea il commit dei soli file previsti, applica la sola
migration attesa e invia `main` a GitHub. Si ferma su divergenze o migration
estranee; non forza push, non cancella account e non invia messaggi.
Il database deve precedere il frontend. Attendere Vercel Ready per quel commit.

Percorso essenziale dopo il rilascio: due appuntamenti di prova realmente
conclusi con un addestratore individuale, recensione proprietario e voto privato
professionista; verificare che un altro account non legga quest’ultimo.
Non creare appuntamenti fittizi nei profili pubblici di professionisti reali.

Restano separati: assegnazione istruttori ai centri, strumenti di moderazione,
export Search Console e diagnosi del downtime. Nessuna campagna sociale o
promessa di indicizzazione è inclusa nel rilascio.
