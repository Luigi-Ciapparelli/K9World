# Clienti e cani — salvataggi affidabili

17 ottobre 2026. Base verificata `216c760`; incremento per funzionamento,
ottimizzazione e protezione dei dati. Non introduce costi o servizi esterni.

## Problemi corretti

Il vecchio CRM cancellava l'appunto dopo un inserimento senza controllare l'errore;
le etichette venivano aggiunte sullo schermo anche quando il database le rifiutava.
Un errore di lettura sembrava assenza di clienti. Gli importi erano in dollari,
il testo in parte inglese e una prenotazione futura poteva diventare “ultima visita”.
La query dei cani includeva anche animali nel frattempo passati a un altro proprietario.

## Comportamento

- Schede responsive, apribili da tastiera, ricerca esplicita per nome del cliente,
  cane o etichetta; 20 clienti per pagina. La ricerca opera sull'intera rubrica
  pertinente al professionista, non soltanto sulla pagina caricata.
- Accesso del titolare professionale verificato, ricavato da `auth.uid()`.
  Richieste in attesa/rifiutate/annullate non aggiungono clienti. Nessun accesso
  aggiuntivo per collaboratori, proprietari, amministratori o utenti anonimi.
- Ultimo servizio segnato come svolto e prossimo appuntamento accettato separati.
  Euro e orari Europe/Rome, anche con browser in un altro fuso.
  Valore delle prenotazioni completate distinto dagli incassi: prezzi nulli,
  negativi o non finiti sono esclusi e segnalati.
- Scheda in dialog nativo, chiusura da tastiera, protezione della bozza in uscita,
  blocco dei doppi clic. Nessun appunto memorizzato nel browser o nei log.
- Appunti privati caricati soltanto nella scheda, 20 per volta. Errore, caricamento
  e lista vuota distinti; pulsante per riprovare.
- Salvataggio con ricevuta dal database. Un errore conserva il testo. Ripetere
  l'identico invio nella scheda riutilizza lo stesso UUID: una risposta HTTP persa
  non produce un secondo appunto. Cambiare testo o riaprire la scheda genera una
  nuova richiesta; non è una sincronizzazione delle bozze tra dispositivi.
- Nuovi appunti: massimo 5.000 caratteri; nuove etichette: 60. Etichette duplicate
  ignorando maiuscole/spazi esterni riutilizzate dalle nuove RPC. Righe preesistenti
  preservate. Nessuna migrazione distruttiva o deduplicazione dello storico.
- Un cane deve risultare ancora del cliente ed essere collegato a una prenotazione
  accettata/completata con il professionista. Non basta una vecchia associazione.
  Il filtro protegge anche la vecchia API usata da pacchetti e abbonamenti.
- Foto cliente tramite il meccanismo esistente di URL privati. Segnaposto locale
  neutro per il cane senza foto; nessuna foto generica di un altro cane.

Gli appunti CRM sono relativi al cliente e privati dell'attività. Le note delle
lezioni con autore, revisioni e consenso restano nell'archivio già implementato.
Questo intervento non li unisce e non estende la condivisione.

## Database e compatibilità

71ª migration: `20261017220000_professional_client_workspace.sql`.
Nuove funzioni `get_professional_client_page` e `save_professional_client_item`:
wrapper pubblico invoker, implementazione definer in `pc_private`, search_path
vuoto, esecuzione concessa solo ad authenticated con controlli interni.
Una prenotazione qualificante rimane bloccata fino a fine salvataggio; un lock
per coppia professionista/cliente serializza le scritture della nuova API.

Contratto di `get_professional_clients()` conservato. Le sue letture legacy restano
compatibili; il riepilogo ora usa solo servizi completati per ultima visita e valore.
Le policy RLS e i permessi diretti esistenti restano per compatibilità durante il
deploy. L'idempotenza e la normalizzazione descritte riguardano la nuova RPC,
non vecchi client che continuassero a scrivere direttamente sulle tabelle.
L'elenco è limitato nel trasporto: l'aggregazione della rubrica avviene nel database;
non si dichiara una scansione SQL limitata a soli 20 clienti.

## Prove e rilascio

Storia delle 70 migration precedenti più la nuova eseguita su PGlite con fixture:
ricerca/pagine, isolamento, proprietario cambiato, nomi non inferibili, RLS,
retry, UUID riutilizzato con dati diversi, prezzi invalidi, revoca e conservazione.
Browser 1440/390 px con API simulate: nota salvata con risposta persa e retry,
etichetta fallita non mostrata, bozza preservata, paginazione, ricerca, errori e
orari italiani. Contratti Node, TypeScript, lint mirato, build e SEO.
Nessuna prova di concorrenza multi-connessione nuova dichiarata in questo blocco.

Runner PostgreSQL nativo incluso come gate dell'installer, non eseguito qui.
Auth/Storage simulati; nessun test con credenziali o dati reali durante la preparazione.
Installer `aggiorna_clienti_professionali.py --publish`: compatibilità e backup,
test nativi/Node/TypeScript/build/SEO, dry-run solo della migration prevista,
commit recuperabile, applicazione SQL e push esplicito. Nessun merge automatico.
Attendere Ready per il commit pubblicato. La disponibilità online non è certificata
prima dell'esecuzione sul PC di Luigi e del deployment.
