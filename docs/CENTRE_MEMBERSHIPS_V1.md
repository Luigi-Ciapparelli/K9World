# Account degli istruttori e agenda assegnata

14 ottobre 2026. TEAM-01, incremento successivo a elenco e calendario. Base
GitHub osservata: `b6b4c0c`. Registro del rilascio in [CURRENT_STATE](CURRENT_STATE.md).

## Percorso utilizzabile

1. La persona entra con il proprio account, apre **Profilo e recapiti →
   Collaborazioni con i centri** e seleziona **Mostra il mio codice**.
2. Comunica il codice al responsabile del centro. Il codice dura sette giorni;
   una nuova lettura dopo la scadenza lo rigenera. Non è una password e da solo
   non concede accesso. Non viene pubblicato nel profilo.
3. Il centro, in **Istruttori del centro → Collega un account**, sceglie una voce
   attiva e inserisce il codice. Compare la proposta nell’account della persona.
4. La persona vede centro, nome nell’elenco e ambito di accesso; accetta o rifiuta.
5. Dopo l’accettazione consulta l’agenda mensile delle sole lezioni assegnate.
   Il professionista trova anche **Le mie collaborazioni** nel menu di lavoro.

Un account proprietario può essere collegato: la persona non deve creare un
secondo account o una falsa attività pubblica per collaborare. La email deve
risultare confermata in Auth. Gli amministratori non ricevono accessi impliciti.
Il flusso non invia email, messaggi o notifiche esterne.

## Permesso concesso

Solo lettura di data/ora, servizio, stato, centro, nome assegnato dell’istruttore,
nome del cliente e nomi dei cani. Sono visibili lezioni accettate o completate,
che iniziano dopo l’accettazione della collaborazione. Non si apre lo storico
precedente. Il mese è limitato a 32 giorni e 300 lezioni; l’interfaccia indica
l’eventuale troncamento. Il registro dei collegamenti restituisce al massimo
400 voci, privilegiando quelle aperte rispetto allo storico chiuso.

Recapiti, note della prenotazione, foto, messaggi, CRM, continuità, documenti,
prezzi e modifiche delle prenotazioni non sono delegati. Le RPC e le policy
esistenti mantengono i propri destinatari. Non si trasferiscono credenziali,
meriti, valutazioni o proprietà degli appunti. Questa è una collaborazione
confermata dai due account, non una verifica d’identità civile o qualifica ENCI.

Centro e persona possono revocare il collegamento. La lettura viene negata
alle richieste successive; la pagina aggiorna i dati al ritorno in primo piano
e ogni minuto quando visibile. I dati già letti non possono essere ritirati
retroattivamente. Disattivare la voce del roster sospende l’agenda; riattivarla
ripristina solo una collaborazione ancora attiva, mai una revocata.
La revoca non annulla appuntamenti né cancella le assegnazioni: il centro deve
riorganizzarle. Una nuova collaborazione richiede una nuova conferma.

## Implementazione e sicurezza

Nuova migration `20261014090000_centre_account_memberships.sql`, la 62ª.
Tabelle `pc_private.centre_link_codes`, `centre_memberships` e
`centre_membership_events`: RLS attiva, nessun accesso diretto client/service_role.
Le cinque RPC pubbliche sono invoker, con implementazioni private e search_path
vuoto. Nessuna ricerca di email o directory privata di account.

Vincoli univoci impediscono due collegamenti aperti sullo stesso nominativo
o sullo stesso account per centro. Le scritture bloccano prima il centro e poi
la relazione; accettazione/revoca controllano la versione attesa. Retry della
stessa operazione non duplicano audit. Le richieste scadute non si accettano;
nessuna riconferma di una relazione revocata. La lettura verifica ogni volta
account, assegnazione, appartenenza, centro e stato attivo dell’istruttore.
La cancellazione dell’account elimina codice/relazione operativa; l’audit resta
privato secondo il modello già adottato, senza una nuova promessa di durata.

`/account/centres` è una pagina privata lazy; riusa noindex/no-store dei percorsi
account. Lo stato React è ricreato al cambio account. Una lettura fallita svuota
l’agenda precedente invece di presentarla come aggiornata.

## Verifiche

- PGlite: 61 migration precedenti e la nuova; compatibilità elenco/calendario,
  consenso, isolamento, scadenze, retry, revoca, inattività, proiezione minima,
  storico precedente escluso e audit singolo.
- Browser desktop 1440 e mobile 390 px con API sintetiche: codice, proposta,
  conflitto recuperabile, accettazione, agenda, errore di lettura e revoca.
- TypeScript, build e SEO verificati; nessun URL privato aggiunto alla sitemap.
- Test PostgreSQL nativo fornito: mantiene i tre casi concorrenti del calendario
  e aggiunge accettazione/revoca in entrambi gli ordini. Non eseguito qui;
  obbligatorio nell’installer sul PC di Luigi prima della pubblicazione.

Auth/Storage e API browser simulati. Nessuna prova online implicita.

## Rilascio e confini successivi

`aggiorna_account_istruttori.py ~/K9World --publish`: compatibilità con la base
GitHub, backup, test nativi/TypeScript/build/SEO, commit locale recuperabile,
dry-run della sola migration nuova, SQL e push GitHub. Nessuna Edge Function,
nuova dipendenza npm, SMS o costo aggiuntivo attivato. Attendere Vercel Ready.

TEAM-01 comprende ora un primo accesso personale alla sola agenda. Restano
future deleghe operative (modifica lezioni, messaggi, note con autore personale),
ruoli organizzativi e disponibilità del singolo. Non descrivere questo blocco
come una gestione completa delle autorizzazioni del centro.
