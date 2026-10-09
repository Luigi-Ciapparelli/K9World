# Storico del cane scaricabile — EXP-01

Stato al 9 ottobre 2026: implementazione presente su GitHub in `3ec87ad`.
La preparazione/test dell'8 ottobre usavano come base `7f11610`.
Stato online distinto in [CURRENT_STATE](CURRENT_STATE.md); non rieseguire
il rilascio soltanto perché queste istruzioni ne descrivono la procedura.

## Dove si trova

- Proprietario: **I miei cani → scheda del cane → Scarica storico**; lo stesso
  comando è presente nello storico condiviso del cane selezionato.
- Professionista: **Relazioni e archivio → relazione → Scarica il tuo archivio**.
  Ogni file riguarda quella relazione, comprese quelle concluse o revocate.
- Professionista destinatario: **Storico ricevuto → Scarica la selezione autorizzata**,
  per una concessione ancora attuale. Il server controlla sempre l'accesso.

Il riepilogo precede il download e conta solo elementi effettivamente accessibili.
Nessun contenuto delle note viene conservato nell'anteprima. Il periodo facoltativo
si riferisce all'inizio degli appuntamenti e alla data delle attività; per gli
appuntamenti selezionati si includono tutti i messaggi. Anagrafica e relazioni
non sono filtrate per data. Le date inserite usano il fuso del dispositivo; il
documento mostra gli orari in Europe/Rome e il JSON conserva gli istanti completi.

## Contenuti e autorizzazioni

| Percorso | Incluso | Confine |
| --- | --- | --- |
| Proprietario attuale | Anagrafica del cane, informazioni inserite dal proprietario, relazioni da lui autorizzate, proprie prenotazioni collegate al cane e relative conversazioni, revisioni pubblicate dagli autori per quel proprietario | Nessuna nota privata, revisione ritirata, conversazione del proprietario precedente o elenco di metadati delle note riservate |
| Archivio dell'autore | Sessioni della relazione, tutte le proprie revisioni e motivi di rettifica, autore/editore, date, riferimenti storici; appuntamenti collegati alle sessioni e relative conversazioni se ancora esistenti | Nessuna anagrafica attuale del cane o nota privata di altri professionisti; nessuna espansione agli altri cani dello stesso cliente |
| Selezione ricevuta | Soltanto revisioni esplicitamente selezionate nella concessione, ancora pubblicate e consentite, con autore, attività e date | Consenso valido, relazione attiva, stesso proprietario, destinatario approvato, concessione non revocata né scaduta; nessuna conversazione o anagrafica aggiuntiva |

L'archivio dell'autore resta esportabile dopo la chiusura della relazione e la
cancellazione del cane/proprietario, finché l'autore dispone del proprio account
collegato. Gli elementi operativi già cancellati non vengono ricostruiti.
L'export non cancella, trasferisce o modifica l'archivio originale.

Questa è un'esportazione dello **storico disponibile del cane**, non una copia
integrale dell'account. CRM, abbonamenti e crediti non associati a un cane non
vengono attribuiti arbitrariamente a quell'animale. Non sono nuove prove di
prestazione, certificazioni, valutazioni o risultati di gara.

## Documento, foto e limiti reali

- **Documento HTML** autonomo, leggibile offline, con impaginazione per la stampa.
  Per un PDF: aprire il file e scegliere Stampa → Salva come PDF. Non viene
  dichiarata una generazione nativa PDF o creata una dipendenza a pagamento.
- **JSON** con versione dello schema, perimetro, periodo, identificativi consentiti,
  dati e limiti espliciti. Non è ancora disponibile un'importazione nel portale.
- La foto del cane può essere incorporata nei due formati dal proprietario.
  Si usa soltanto il percorso canonico owner/dog/profile nel bucket privato:
  JPEG/PNG/WebP fino a 8 MiB, con attesa massima di 15 secondi per l'acquisizione.
  Percorsi precedenti/esterni, formato non supportato, foto cambiata o recupero
  fallito sono segnalati, senza impedire il download dei dati testuali.
- Nessun URL firmato o percorso Storage finisce nel file. Nessuna immagine esterna
  viene richiesta automaticamente dal documento. Testi HTML escapati e CSP locale
  restrittiva impediscono di trasformare una nota in codice eseguibile.
- Audio, video e documenti delle sessioni non sono implementati: non vengono
  promessi né creati segnaposto che simulino allegati. Nessuna ZIP caricata è stata letta.
- I luoghi delle singole attività non sono memorizzati in campi dedicati. Eventuali
  luoghi descritti nelle note restano nel testo; non si sostituisce la sede attuale
  del professionista al luogo dell'attività. Nessun tracciamento GPS aggiunto.
- Nomi/categorie dei servizi sono quelli attualmente registrati e vengono indicati
  come tali; non esiste uno snapshot retroattivo dei loro nomi.

Massimo 2.000 elementi per ciascuna sezione e 8 MiB di dati testuali SQL; se si
supera un limite, errore esplicito e nessun file parziale. Scegliere intervalli
più brevi; casi eccezionali con oltre 2.000 revisioni della stessa attività o
relazioni richiederanno un successivo export a blocchi, non un taglio silenzioso.
Il file finale, foto inclusa, ha un tetto di 32 MiB.

## Ricontrollo e conservazione

RPC `public.export_dog_history(text,uuid,timestamptz,timestamptz,boolean)` come
wrapper SECURITY INVOKER; implementazione SECURITY DEFINER in `pc_private`,
search_path vuoto e EXECUTE solo authenticated. Nessun nuovo privilegio sulle
tabelle. Ambiti: owner, professional, received; il subject è rispettivamente
ID cane, relazione, concessione e non costituisce un'autorizzazione.

Autorizzazione e proiezioni sono lette nello stesso snapshot SQL per ogni
richiesta. Il download esegue una richiesta nuova; per il proprietario si rilegge
nuovamente tutto **dopo** l'eventuale acquisizione asincrona della foto. Proprietà
cambiata/concessione revocata bloccano il download; pubblicazioni ritirate non
sono copiate dal riepilogo. Il controllo definisce il punto di lettura autorizzato:
non può annullare una copia già ricevuta o una revoca successiva a quel punto.

Le letture della selezione ricevuta producono l'evento audit `read` con motivo
`authorized_export`, senza testo delle note. Nessun job, bucket o archivio server
per gli export. Dati temporanei in memoria durante la richiesta; nessun localStorage,
link pubblico o cache applicativa. L'Object URL è revocato dopo il download.
Chiusura del modulo/cambio account annullano la consegna tardiva; l'identità viene
ricontrollata prima di avviare il download. Le copie scaricate restano al
responsabile del dispositivo: la revoca non può ritirarle a distanza.

## Verifiche e rilascio

- `scripts/tests/test_dog_history_export.py`: ricostruzione delle 52 migration
  precedenti e nuova migration; proprietario/autore/destinatario/estraneo/anon,
  revisioni, note non condivise, conversazioni, periodo, limiti di righe/byte,
  revoca tra riepilogo e download, ritiro di pubblicazione, cambio proprietario,
  cancellazione cane/account e conservazione dell'archivio.
- In questo ambiente lo stesso SQL è eseguito con PGlite/PostgreSQL incorporato;
  Auth e Storage sono simulati. Il runner consegnato usa PostgreSQL nativo su WSL.
- `scripts/tests/test_dog_history_export_ui.mjs`: Chromium con API sintetiche,
  desktop 1440 e mobile 390, HTML/JSON, foto e omissione, escaping, controlli
  ripetuti, revoca, date, ambiti professionali, chiusura durante una richiesta.
- TypeScript, build e verifica SEO. Nessuna prova con account o dati reali.
  Nessun servizio Supabase online, invio di messaggi o Vercel Ready verificato qui.

Nuova migration: `20261008170000_authorized_dog_history_export.sql`.
Installer: `aggiorna_storico_scaricabile.py ~/K9World --publish` da WSL.
Preflight di file e dipendenze, backup, test SQL nativo, typecheck, build,
controllo migration previsto, commit locale, db push e push GitHub. Nessun force
push, reset o cancellazione di lavoro estraneo. Richiede il precedente incremento
ricerca/Esposizioni già nel repository. Vercel Ready resta da osservare dopo il push.

EXP-01 e il successivo REV-01 sono nel repository remoto; non sono lavori da
iniziare. Restano media delle sessioni ed estensione delle valutazioni ai centri,
con le dipendenze del piano operativo. Nessun invio esterno implicito.
