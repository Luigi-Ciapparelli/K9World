# Lancio PortaleCinofilo — 30 settembre 2026

## Decisione corrente

Luigi chiede di arrivare agli inviti e al marketing contenendo i costi. Il
prodotto si presenta come **PortaleCinofilo**, senza etichette pubbliche
“beta” o “MVP”. Si descrivono le funzioni disponibili e i limiti concreti.
Questo documento aggiorna PILOT_READINESS_V1 e i checkpoint precedenti.

Non acquistare Twilio, gateway, numeri, CRM, newsletter o pubblicità per
questo lancio. Utilizzare sito, casella info@portalecinofilo.com, WhatsApp
Business +39 353 407 7841 e profili social già creati. Nessun nuovo tracker.
Non è una promessa di costi operativi nulli: restano limiti e consumi dei
piani già in uso. Controllarne le dashboard senza attivare upgrade automatici.

## Stato verificato e limiti delle prove

| Elemento | Evidenza disponibile |
| --- | --- |
| GitHub main | `49f22f7` riletta il 30 settembre; nessun push online da questa lavorazione |
| Email registrazione e recupero password | Luigi ha confermato ricezione, conferma e funzionamento, anche in inbox |
| Auto-conferma | Diagnosi fornita da Luigi: email false, telefono false; registrazioni aperte |
| Dominio | Canonico www.portalecinofilo.com; Luigi ha confermato il ritorno al .com |
| Search Console | Proprietà verificata e sitemap inserita da Luigi; non garantisce indicizzazione o posizionamento |
| Pagina professionisti | Osservata online il 30 settembre: presente, ma ancora con testi “beta” prima di questo rilascio |
| Invii Edge Resend | Nomi dei secret presenti secondo la diagnosi; resta da verificare un codice reale con il nuovo endpoint |
| SMS | Non configurati; in questo rilascio disattivati per default anche in presenza delle credenziali |
| Percorsi prenotazioni/messaggi | Funzionamento confermato da Luigi in precedenza; correzioni ingresso/accesso su main; test attuali con API simulate |
| Nuovo rilascio | File e installer preparati; non dichiarare database/Edge/frontend pubblicati prima dell'esecuzione e dell'esito |

## Cosa si può presentare

- Proprietari: formazione di base gratuita, ricerca diretta per aiuto nella
  vita quotidiana, Sport cinofili separato, profili e richiesta appuntamento.
- Professionisti: profilo guidato, servizi, zona, presentazione e competenze;
  richieste con note, conversazioni, calendario e indisponibilità.
- Strumenti già presenti: rubrica, pacchetti di lezioni, abbonamenti alle
  lezioni e archivio privato con revisioni. Condivisione selettiva tramite
  relazioni e consensi, non accesso indiscriminato al lavoro altrui.
- Strutture: account del referente, nome/tipo dell'attività e servizi.
- Iscrizione e strumenti attuali gratuiti, senza carta. Eventuali futuri
  servizi a pagamento richiedono adesione separata. La formazione di base
  per i proprietari resta gratuita; posizioni e verifiche non si comprano.

La rete è in costruzione, inizialmente con contatti in Romagna. Non promettere
clienti, copertura nazionale completa, risultati educativi o fatturato.
L'approvazione del profilo è distinta dalla verifica di una qualifica.
Non annunciare audio/video d'archivio, Working-Dog universale automatico,
collaboratori con accessi separati, gestione multi-sede o pagamenti integrati.
I pagamenti delle prestazioni si concordano direttamente tra cliente e professionista.

## Lancio senza SMS

- Registrazione, recupero password e richieste usano l'email confermata.
- `CONTACT_SMS_ENABLED` assente o diverso da `true` impedisce gli invii SMS
  nell'Edge. Il rilascio imposta esplicitamente `false`.
- Verifica dell'email attuale disponibile quando Resend è configurato.
- Verifica/correzione telefono e cambio email con conferma incrociata restano
  indisponibili: pulsanti disabilitati e spiegazione nel punto d'uso.
- Un telefono inserito non viene presentato come verificato. Il campo può
  essere richiesto nell'iscrizione: non confondere raccolta e verifica.
- Assistenza per indirizzi errati: verificare l'identità prima di qualunque
  intervento; non rendere vero un flag e non cambiare dati su semplice richiesta.

Le protezioni SQL della conferma incrociata restano invariate. Non c'è una
nuova migration per questa scelta: si usa quella dei recapiti già preparata,
`20260930070000_verified_account_contacts.sql`, senza riscriverla.
Effetti sui vecchi account e dettagli: ACCOUNT_CONTACTS_V1.md.

## Rilascio concreto

L'installer `prepara_lancio_portalecinofilo.py` contiene i file dei recapiti
già preparati e questo aggiornamento. Accetta la base main `49f22f7`, i file
già installati dal precedente pacchetto o la versione finale identica;
salva backup e interrompe se trova una versione diversa di un file da cambiare.

Senza `--publish`: applicazione locale, test SQL/Edge, TypeScript, build e
controllo diff. Con `--publish`: verifica main/origin, configurazione email
e progetto Supabase, dry-run con sola migration prevista, SMS esplicitamente
spenti, applicazione della migration, deploy dei tre endpoint, commit dei
soli file del pacchetto e push main. Nessuna email di marketing inviata.
Gli output CLI sono visibili e le attese hanno un limite.

Non attivare un piano SMS, non abilitare Phone Auth, non rimuovere JWT o RLS.
Un push Git non sostituisce il deploy delle funzioni Edge.
Se un passaggio fallisce, il comando si ferma; non considerare completati
i passaggi successivi. Correggere il punto segnalato e rieseguire lo stesso
installer, senza ricopiare file o reimpostare il database.

## Verifiche locali del 30 settembre

Superati TypeScript, build (395 pagine HTML, 391 URL sitemap), test del vero
handler Edge con provider simulati e test browser a 390/1440 px: conferma
email senza SMS, azioni telefoniche disabilitate, codice errato/retry,
iscrizione trainer e pensione dall'invito, richiesta con note e conversazione,
accettazione e calendario. Controllata visivamente la pagina recapiti mobile.
La build è stata eseguita con credenziali pubbliche sintetiche; la prima
prova senza configurazione URL è stata corretta nell'ambiente di test.
La migration è identica a quella già collaudata nel precedente incremento;
l'installer ripete il test nativo nel WSL prima di applicarla online.
I log Vite di sviluppo segnalano l'import preesistente del JSON pubblico delle
razze da SEO; nessun errore pagina nelle suite, build di produzione riuscita.
Non è stata modificata la pipeline SEO in questo intervento.

## Ultimo controllo online prima degli inviti

Non ripetere tutti i test già superati. Dopo Vercel Ready del nuovo commit:

1. Con l'account controllato da Luigi aprire Email e telefono e verificare
   che la modalità senza SMS sia chiara. Se l'email richiede conferma, inviare
   il codice, riceverlo e completare la conferma. Se è già confermata, usare
   un account di prova controllato che richiede conferma, senza falsificare flag.
2. Sul profilo professionale destinato agli inviti verificare nome attività,
   città, presentazione, un servizio reale con nome/durata/prezzo e approvazione.
   Non usare profili altrui come testimonianza e non modificarli senza incarico.
3. Una richiesta concordata con una nota, lettura/risposta del professionista,
   stato visibile al proprietario e appuntamento nel calendario chiudono il
   percorso. Se Luigi conferma di averlo appena provato sulla stessa versione,
   registrare l'esito e procedere senza ripeterlo.

Registrare data, commit e risultato; nessuna password, codice, token o dato
personale nel repository. Questi esiti online non sono stati inventati dal
collaudo automatico. Le pagine non autenticate da sole non li dimostrano.

## Inviti e marketing, in ordine

1. Primo gruppo: cinque contatti pertinenti, iniziando dalle persone che
   Luigi conosce e che accettano di ricevere la presentazione. Un messaggio
   personale, un beneficio e un link: `/become-pro`. Nessuna lista comprata
   o raccolta automatica di email, nessuna campagna massiva.
2. Accompagnare chi risponde fino a profilo e primo servizio. Approvare solo
   dopo il controllo. Chiedere un riscontro concreto sul passaggio più faticoso.
3. Pubblicare i contenuti pronti in LAUNCH_COPY_V1.md sui social esistenti.
   Usare immagini proprie o autorizzate. Il primo contenuto spiega il servizio,
   il secondo gli strumenti, il terzo la formazione gratuita.
4. Dopo una settimana guardare risposte, profili completi, prime richieste
   gestite e ritorno degli utenti. Se si bloccano nello stesso punto, correggere
   quello prima di aumentare gli inviti; se il percorso funziona, ampliare il gruppo.
5. Per capire gli introiti, chiedere quale strumento fa risparmiare tempo e
   per quale miglioramento pagherebbero. Non attivare abbonamenti economici,
   addebiti o nuove condizioni prima di aver definito offerta e gestione fiscale.

Registro operativo privato: contatto, canale, consenso/interesse, data invito,
risposta, profilo pronto, prima richiesta, ostacolo, prossimo passo. Conservare
solo i dati necessari fuori da GitHub; rispettare chi non vuole altri contatti.
Non confondere numero di follower con utilizzo o disponibilità a pagare.

## Consegna al prossimo assistente

Priorità: chiudere questo rilascio e invitare i primi contatti, non aggiungere
nuove funzioni o ricominciare l'architettura. Leggere questo documento,
LAUNCH_COPY_V1.md, ACCOUNT_CONTACTS_V1.md e il nuovo checkpoint in START_HERE.
Mai dichiarare inviati messaggi, eseguiti deploy o conclusi collaudi soltanto
perché sono presenti i comandi o i testi. Nessun messaggio esterno è autorizzato
implicitamente dalla disponibilità di una bozza.

Riferimento CLI: https://supabase.com/docs/reference/cli/supabase-functions-deploy
(`--use-api` consente il bundle senza installare Docker).
