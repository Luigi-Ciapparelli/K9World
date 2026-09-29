# Primo gruppo di professionisti — 29 settembre 2026

## Stato e decisione proposta

Base letta da GitHub: `0d113db` su `main`. Comprende Home con media,
profilo guidato, SEO e tag di verifica Google. Luigi ha confermato la proprietà
Search Console e l'inserimento della sitemap. Questo non dimostra che tutte le
pagine siano già indicizzate.

Il prossimo passo è una **beta accompagnata con pochi professionisti**, dopo
la pubblicazione di queste correzioni e una prova reale di accesso/prenotazione.
Non dichiarare il sito interamente collaudato né avviare invii massivi.
Questa è una raccomandazione operativa; nessun invito è stato inviato.

## Cosa è stato osservato sul sito online

Controllo pubblico in browser il 29 settembre 2026:

| Percorso | Esito e limite |
| --- | --- |
| Home e navigazione | Caricamento riuscito. Aiuto quotidiano e Sport cinofili distinti. |
| Per i professionisti → Entra nella beta | Si apre `/#/signup?role=professional`. Riscontrata assenza della scelta attività; il codice impostava `walker`. |
| Ricerca addestratore | Un risultato visibile nel controllo senza filtri geografici: Davide Logrieco, Polignano a Mare. Non è un censimento del database. |
| Profilo e servizi pubblici | Profilo, tariffe, disponibilità, prenotazione e invito alla relazione visibili. Nessuna richiesta inviata. |
| Qualità dei contenuti | Nel profilo osservato compaiono `New service` e `Passeggiaa educativa`; presentazione e durata/tipo dei servizi vanno rivisti dal titolare prima di usarlo negli inviti. Non dedurre che sia un account di prova, non cancellarlo automaticamente. |
| Registrazione, email, strumenti privati online | Non completati in questo controllo: nessun account reale creato, nessuna credenziale richiesta. Le prove automatiche usano API simulate. |

## Correzioni di questo incremento

- Scelta esplicita dell'attività nel modulo professionista, anche dall'invito
  diretto. Nessuna preselezione dog walker. Controllo aggiuntivo nel client Auth.
- Attività con etichette italiane; indicazione del referente e del successivo
  passaggio per registrare centro, azienda o pensione. Il backend resta invariato.
- Etichette associate ai campi, autocompletamento, errori accessibili e ripristino
  del pulsante dopo errore. Conferma email descritta senza promettere un SMS.
- Se la registrazione restituisce una sessione, apertura del profilo guidato;
  se richiede conferma email, resta il percorso di conferma e accesso.
- Stato approvazione visibile nella panoramica. Link al profilo pubblico soltanto
  se approvato. I quattro progressi misurano dati salvati, non verifiche.
- Pagina professionisti aggiornata agli strumenti presenti: calendario, messaggi,
  rubrica, pacchetti e abbonamenti alle lezioni. Contatto per iniziare e indicazioni
  semplici per le strutture. La missione educativa gratuita rimane centrale.

Non corregge retroattivamente le attività di account già creati: chiedere ai
professionisti interessati di controllare **Profilo guidato → Identità**.
Nessuna migration, modifica SQL, email inviata o aggiornamento a profili reali.
Le modifiche frontend restano da pubblicare tramite lo script di consegna.

## Verifiche eseguite sul pacchetto

- TypeScript e build, con generazione di 395 pagine HTML e sitemap di 391 URL.
- `scripts/tests/test_professional_signup_ui.mjs`: accesso dall'invito,
  attività obbligatoria, `trainer` e `boarding` nel payload Auth, errore/retry,
  conferma email simulata, percorso proprietario senza registrazione prematura,
  assenza di overflow a 390 e 1440 px.
- `scripts/tests/test_professional_guided_ui.mjs`: stati approvato/in attesa/da
  rivedere, link pubblici, progressi, salvataggio, bozze, guide e responsive.
- `scripts/tests/test_seo.mjs`: HTML pubblico, link, metadati, hash precedenti,
  avanti/indietro, profilo pubblico e 404; include le due suite precedenti.

Ambiente sintetico `pc-home-test.supabase.co`, richieste intercettate.
Questi test non verificano consegna email, configurazione Supabase online,
Storage reale o autorizzazioni reali del database.

## Prima di inviare il primo invito

1. Pubblicare il pacchetto su `main` e attendere Ready per quel commit su Vercel.
2. Con un professionista consenziente o un account controllato da Luigi, provare
   **una nuova iscrizione**, ricezione email, conferma e accesso. Attività attesa
   visibile in Identità. Non usare un indirizzo appartenente ad altri senza accordo.
3. Completare identità, zona, presentazione e un servizio reale con nome, durata
   e prezzo comprensibili. Per un centro/pensione impostare anche il tipo profilo
   e il nome dell'attività; foto e competenze possono essere aggiunte dopo.
4. Approvare dall'area admin dopo il controllo e verificare il profilo dalla
   ricerca normale. Con un account proprietario controllato inviare una richiesta
   concordata con una nota; il professionista deve poter leggere nota/nome,
   rispondere e accettare, e il proprietario deve vedere risposta e stato.
   Controllare che l'appuntamento compaia nel calendario. Usare un orario di prova
   concordato e annullare la richiesta a fine collaudo quando previsto.

Registrare qui data ed esito di questa prova; non ricominciare tutti i test SQL
se non emerge un errore concreto. Non chiedere password in chat.

## Apertura accompagnata

Proposta: contattare individualmente 3–5 professionisti già conosciuti e una
struttura; nessun invio automatico. Presentazione in
[PILOT_INVITATIONS.md](PILOT_INVITATIONS.md). Iniziare da chi accetta di dare
un riscontro sul proprio lavoro, senza promettere clienti o risultati garantiti.

Per ogni partecipante annotare solo ciò che serve: invitato, interessato,
account confermato, profilo pronto/approvato, primo contatto gestito, ostacolo
segnalato e ritorno al portale entro una settimana. Tenere i dati personali
fuori dal repository pubblico. Niente nuovi tracker o campagne introdotti qui.

Il primo obiettivo è che il professionista completi il profilo e gestisca un
contatto senza bloccarsi. Dopo le prime prove,
correggere gli ostacoli ricorrenti prima di allargare gli inviti.

## Limiti da non nascondere

- Il recupero password autonomo non risulta implementato in AuthPages/App a
  questa base. È il prossimo intervento sull'accesso, da completare prima di
  un'apertura ampia. L'assistenza non deve mai chiedere la password.
- Mancano in questa verifica le prove reali di consegna email e dei flussi
  privati/Storage: completare il breve collaudo sopra, non dichiararle superate.
- Le strutture usano un account referente: non promettere accessi separati
  per collaboratori o gestione multi-sede.
- Audio/video dell'archivio e verifica automatica universale dei risultati
  Working-Dog non devono essere venduti come completati.
- I pagamenti delle prestazioni restano fuori dal portale. I pacchetti e gli
  abbonamenti alle lezioni non implicano addebiti automatici.
- Beta gratuita per il primo gruppo: non trasformare questa formula in una
  promessa di gratuità perpetua di tutti gli strumenti professionali.

## Esito online da completare dopo il rilascio

- Commit/deployment di queste correzioni: da registrare.
- Nuova iscrizione e conferma email reali: da registrare.
- Prima richiesta, risposta e calendario reali: da registrare.
- Contenuti dei profili scelti per gli inviti: da rivedere con i titolari.
- Inviti inviati: nessuno da questo intervento.
