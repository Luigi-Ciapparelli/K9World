# Ricerca quotidiana ed Esposizioni — NAV-01 / PRO-01

Stato al 9 ottobre 2026: implementazione presente su GitHub in `7f11610`.
Le istruzioni di rilascio sotto descrivono il procedimento dell'incremento;
non sono una richiesta di rieseguirlo. Evidenze online e residui nel
[registro corrente](CURRENT_STATE.md).

## Stato e perimetro — 8 ottobre 2026

Implementazione preparata sulla base GitHub `85cd0a7`, dopo l'istruzione di Luigi
«continua ad eseguire le direttive». Supera lo stato esclusivamente documentale
per NAV-01/PRO-01. La presenza di questi file non dimostra che la nuova migrazione
sia applicata al progetto online o che il deployment Vercel sia Ready.

La home statica, Impara e gli strumenti professionali già disponibili restano
nel percorso esistente. Questo incremento realizza ricerca e attività offerte.
Export e valutazioni sono stati aggiunti dai due incrementi successivi già su
GitHub; internazionalizzazione, campagne e finanziamenti restano nel piano operativo.

## Mappatura applicata

| Attività / identificativo | Ingresso pubblico | Comportamento |
| --- | --- | --- |
| Addestramento `trainer` | Trova aiuto per il cane | Ricerca predefinita, senza scelta preliminare o click aggiuntivo |
| Addestramento sportivo `trainer` + discipline offerte | Sport cinofili | Preferenza indipendente e disciplina; nessun badge implicito |
| Pensione `boarding` | Trova aiuto per il cane → Pensioni | Stesso profilo, calendario e prenotazione esistenti |
| Toelettatura `groomer` | Esposizioni → Toelettatura | Accessibile anche senza partecipare a una gara |
| Handler `handler` | Esposizioni → Handler per esposizioni | Preparazione/presentazione sul ring; distinto dal conduttore sportivo |
| Corso `enci_course` già supportato | Servizi del profilo | La categoria non certifica il riconoscimento ENCI; nessun nuovo catalogo corsi in questo rilascio |
| Pet sitting, passeggiate e categorie non presenti nel catalogo | Storico nell'account | Esclusi da offerta e nuove prenotazioni; record precedenti conservati |

Un professionista può avere servizi in più aree. L'attività principale non
impedisce di aggiungere altri servizi ammessi. Nessuna opzione «Entrambi».
I due controlli quotidiano/sport riguardano soltanto l'addestramento; pensioni,
toelettatura e handler dipendono dalla categoria del servizio attivo.

## Interfaccia e collegamenti

- Quattro ingressi nella navigazione: Trova aiuto per il cane (verde), Impara,
  Sport cinofili, Esposizioni. Collegamenti anche nel footer.
- `/search` offre solo Addestratori e Pensioni; `/esposizioni` offre
  Toelettatura e Handler. Filtri di zona, prezzo ed esperienza restano disponibili.
- Da un risultato al profilo e ritorno vengono conservati area, categoria,
  località, coordinate di ricerca, prezzo, rating, tipo di risultato,
  esperienza e ordinamento. Le coordinate non vengono aggiunte ai dati pubblici
  dei professionisti.
- I vecchi link `/search?type=groomer` (anche con hash) vengono normalizzati
  verso Esposizioni, mantenendo i parametri e mostrando l'avviso del trasferimento.
  Pet sitting/passeggiate mostrano un messaggio esplicito, senza cercare
  silenziosamente un addestratore o inventare risultati.
- Nei servizi guidati la categoria anticipa dove il servizio sarà visibile.
  Le attività storiche restano leggibili e possono essere disattivate; non
  possono essere riattivate tramite l'API come nuovi servizi pubblici.
- Handler compare nella registrazione e nell'identità del professionista.
  Un nuovo handler è in attesa di approvazione e deve confermare la propria email.
- Corretto il menu dei suggerimenti città su mobile: non copre il pulsante Cerca.
  Gli errori di ricerca hanno un pulsante Riprova.

## Database e sicurezza

Migration: `20261008120000_exhibitions_and_service_catalog.sql`.

Non cancella o riclassifica account, servizi, prenotazioni, note, messaggi,
pacchetti o recensioni. Gli identificativi rimangono invariati. Un vecchio
servizio può avere ancora `active=true` nel record storico: il nuovo contratto
pubblico lo esclude comunque se la categoria non è ammessa. Non dedurre
prenotabilità dal solo flag.

La ricerca quotidiana mantiene firma e proiezione pubblica ma accetta soltanto
trainer/boarding. La nuova RPC `search_exhibition_professionals` mantiene la
medesima proiezione e i controlli di approvazione, zona e prezzo. Il wrapper
pubblico è SECURITY INVOKER; l'implementazione privilegiata è in `pc_private`,
con search_path fisso e concessioni esplicite. Nessuna nuova lettura diretta
delle tabelle viene concessa ad anon/authenticated.

`get_public_professional_services` e `create_booking_with_dog` applicano la
stessa lista di categorie prenotabili: nascondere il pulsante non è l'unica
protezione. Il salvataggio servizi conserva controllo di proprietà e idempotenza.
Le modifiche acquisiscono prima il lock sul professionista, come le prenotazioni.

Onboarding e prenotazione vengono aggiornati con punti di inserimento controllati,
conservando le logiche successive di verifica recapiti, FCI, calendario e messaggi.
La migrazione si interrompe se questi punti sono cambiati; non li riscrive alla cieca.

## Verifiche e limiti

- TypeScript e build di produzione, inclusa generazione HTML senza richieste DB.
- 396 file HTML generati; 392 URL canonici nella sitemap. Esposizioni ha titolo,
  descrizione, canonical e contenuto iniziale; ricerche filtrate sono noindex.
  Questo non garantisce indicizzazione Google e non risolve automaticamente
  il report Search Console in attesa di URL.
- Ricostruzione delle 51 migrazioni precedenti + nuova migrazione in PostgreSQL
  isolato tramite PGlite. Prove su ruoli anon/authenticated, nuovo handler,
  filtri, servizio misto, sport, nuove prenotazioni e conservazione dello storico.
  Il runner Python incluso ripete il contratto su PostgreSQL nativo locale.
- Browser con API simulate: desktop/mobile, ricerca diretta, pensioni,
  Esposizioni, filtri al ritorno, link precedenti, errori, servizio guidato,
  registrazione trainer/pensione/toelettatore/handler e regressione profilo guidato.
- Auth/Storage e risposte API dei test sono simulati. Non sono stati creati
  account reali, inviate email o interrogati dati privati online.

## Rilascio

L'installer `aggiorna_ricerca_esposizioni.py` controlla tutti i file prima di
scrivere e conserva copie in `.git/codex-backups`. Senza argomenti aggiuntivi
prepara soltanto i file locali. Con `--publish`:

1. Controlla branch main, origin previsto, progetto Supabase collegato e compatibilità.
2. Esegue test SQL nativi isolati, TypeScript, build e controllo SEO.
3. Esegue un dry-run limitato a questa migrazione. Se ne compaiono altre si ferma.
4. Registra un commit locale recuperabile, applica la migrazione e invia il commit
   a GitHub. Un'interruzione conserva file e commit; il comando può essere ripreso.
5. La conferma finale del sito richiede il deployment Vercel Ready dello stesso commit.

Non usare un rollback distruttivo del database. Se il rilascio si interrompe dopo
l'applicazione SQL, correggere/riprendere il push; non cancellare record storici.
Per una correzione successiva creare una nuova migrazione, senza modificare
quella già applicata. Il controllo live mirato riguarda ricerca handler/toelettatura
ed eventuale servizio reale autorizzato; nessuna prenotazione fittizia automatica.
