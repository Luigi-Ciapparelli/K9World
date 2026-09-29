# START HERE — PawConnect / Portalecinofilo

## Primo contatto proprietario/professionista — 29 settembre 2026

Base GitHub verificata: `4c951a9` (recupero password già su main).
Corretto il rientro alla richiesta dopo accesso/registrazione: si conserva
soltanto il profilo pubblico scelto, con destinazione limitata a `/p/UUID`.
L'invio della richiesta resta un'azione esplicita del proprietario.
Aggiunto Aggiorna richieste nell'elenco professionale.
Specifica e limiti del collaudo: [BOOKING_ENTRY_V1.md](docs/BOOKING_ENTRY_V1.md).
Questo incremento frontend resta da pubblicare; nessuna migration.
Consegna email e collaudo privato online restano da confermare.

## Recupero password — 29 settembre 2026

Base GitHub verificata: `e999041`; le correzioni di ingresso professionisti
sono già su main. Aggiunti richiesta email, nuova password e gestione link
scaduti, con ripresa dopo ricarica e controllo dell'account prima del cambio.
Nessuna migration. Configurazione Redirect URLs di Supabase e consegna email
reale da verificare al rilascio: [PASSWORD_RECOVERY_V1.md](docs/PASSWORD_RECOVERY_V1.md).
Il collaudo automatico usa API simulate e non invia email. Questo incremento
resta da pubblicare. I checkpoint sottostanti sono storici.

## Ingresso professionisti e prima beta accompagnata — 29 settembre 2026

Base remota riletta: `0d113db` (`main`), dopo `2cfc932` (SEO) e
`5bfe88b` (profilo guidato). Luigi conferma Search Console verificata e sitemap
inserita. Home, ricerca, profilo e ingresso professionisti osservati online.
Questo supera gli stati di pubblicazione ancora incerti nei checkpoint storici.

Corretto nell'incremento corrente l'ingresso diretto che assegnava `walker`
senza scelta; attività obbligatoria, modulo accessibile, stato approvazione
in panoramica e pagina professionisti allineata alle funzioni presenti.
TypeScript, build e test browser isolati superati. Nessuna migration.
Dettagli, prove reali ancora da completare e piano d'invito:
[PILOT_READINESS_V1.md](docs/PILOT_READINESS_V1.md).
Bozze: [PILOT_INVITATIONS.md](docs/PILOT_INVITATIONS.md).
Questo incremento resta da applicare/pubblicare; nessun invito inviato.

## SEO e accessibilità ai motori — 29 settembre 2026

Base GitHub verificata: `5bfe88b`; il precedente profilo guidato è già su main.
URL pubblici senza hash, HTML generato dagli stessi componenti React, 395
pagine pubbliche (391 nella sitemap), titoli e descrizioni specifici, dati
strutturati, robots.txt e 404. Link privati e frammenti Auth compatibili.
Specifica, limiti e istruzioni Search Console: [SEO_VISIBILITY_V1.md](docs/SEO_VISIBILITY_V1.md).
Nessuna migrazione o accesso al database online. Test frontend e browser
isolati; pubblicazione di questo incremento e Vercel Ready da confermare.
I checkpoint sottostanti descrivono momenti precedenti.

## Profilo e strumenti professionali guidati — 29 settembre 2026

Base corrente GitHub: `b512eb9`, comprensiva della Home con media richiesta da Luigi.
Nuovo incremento frontend: **Profilo guidato**, quattro attività di base con
progressi sui dati salvati, schermate separate, servizi e attestati in tre passi,
guide dentro gli strumenti, menu raggruppato e protezione delle bozze.
Specifica e limiti: [PROFESSIONAL_GUIDED_WORKSPACE_V1.md](docs/PROFESSIONAL_GUIDED_WORKSPACE_V1.md).
TypeScript, build e prove browser con API simulate superati. Nessuna migration.
Codice pronto da applicare/pubblicare; commit remoto e Vercel Ready di questo
incremento non ancora osservati. I checkpoint sottostanti restano storici.

## Home con media e navigazione unificata — 29 settembre 2026

Base GitHub esaminata: `c75d0c1`. Luigi ha chiesto di eliminare la voce Servizi
perché duplicava Trova aiuto per il cane: resta il pulsante verde che apre
subito `/search?type=trainer`. Impara e Sport cinofili rimangono separati.
La Home usa un’immagine illustrativa compressa, tipografia sans più netta,
movimento disattivabile e una breve animazione dello shaping aperta su richiesta.
Specifica corrente: [HOME_NAVIGATION_V2.md](docs/HOME_NAVIGATION_V2.md).
Provenienza dei media: [HOME_MEDIA_ASSETS.md](docs/HOME_MEDIA_ASSETS.md).
Verifiche locali frontend; nessuna migrazione necessaria. Pubblicazione di
questo incremento ancora da registrare con commit e deployment Vercel Ready.
Le descrizioni precedenti della Home sono storiche.

If you are a new developer, collaborator, or AI assistant, read these files in order:

1. `docs/PROJECT_HANDOFF.md`
2. `docs/PAWCONNECT_CORE_BLUEPRINT.md`
3. `docs/PAWCONNECT_CORE_DATA_MODEL.md`
4. `docs/PERSON_DOG_RELATIONSHIPS.md`
5. `docs/LEARNING_CREDENTIAL_CORE.md`

Then establish the exact live repository state with:

```bash
git status --short
git branch --show-current
git log --oneline -n 20
npx supabase migration list
npm run typecheck
npm run build
```

These documents describe:
- what the project is today;
- what it must become;
- architectural decisions already taken;
- security constraints;
- current roadmap;
- person-to-dog relationship design;
- learning and credential design;
- important migration and workflow warnings.

Do not start by rewriting the application or database.

The repository name may still be `K9World`, but the product direction is PawConnect / Portalecinofilo.

## Continuation rule

A future AI assistant should treat the repository and these documents as the source of truth.

If this document and the code disagree:
1. inspect the latest Git history;
2. inspect the actual code;
3. inspect the latest Supabase migration history;
4. update the documentation after understanding the difference.

Never assume a planned feature is already implemented merely because it appears in a blueprint.


## Continuity

For exact implemented state, read:

- `docs/CURRENT_STATE.md`
- `docs/AI_CONTINUITY_PROTOCOL.md`

Then verify the repository directly.

## Professional continuity and media

For professional notes, dog history, permissions and private media, also read [Professional continuity and media](docs/PROFESSIONAL_CONTINUITY_MEDIA.md). This is an approved product direction with a proposed technical design, not implemented schema.


## Interfaccia continuità — incremento locale

Vedi [stato UI, attivazione e verifiche](docs/CONTINUITY_UI_V1.md). Interfaccia implementata dietro flag disattivato di default; SQL ancora nelle proposte, nessuna attivazione online dichiarata. Condivisione dello storico e media restano da implementare.

<!-- professional-calendar-v1 -->
## Calendario professionale e indisponibilità

Implementazione e rilascio: `docs/PROFESSIONAL_CALENDAR_V1.md`. Include colori per servizio, impegni con nome e note, pausa e assenze con termine. Preparazione locale: verificare e applicare la nuova migration prima del frontend. Le risposte ai clienti e i modelli di messaggio restano il prossimo incremento.

<!-- booking-messages-v1 -->
## Messaggi delle prenotazioni e risposte professionali

Incremento successivo al calendario `a712352`: conversazioni fra i partecipanti, messaggi da leggere nelle dashboard, modelli privati e risposte automatiche facoltative. Riferimento: `docs/BOOKING_MESSAGES_V1.md`. Preparazione locale: applicare la nuova migration dopo i test e prima del frontend. Non dichiarare il rilascio concluso senza registrarne l’esito. La continuità condivisa e i media compressi restano nel percorso dedicato.

<!-- continuity-sharing-v1 -->
## Continuità condivisa fra professionisti

Revisioni scelte dall’autore e concessioni del proprietario a destinatari specifici, con durata e revoca. Riferimento: `docs/CONTINUITY_SHARING_V1.md`. PostgreSQL nativo: regressioni e sette casi concorrenti superati dall’utente il 14 settembre 2026. Incremento preparato localmente; applicare la nuova migrazione prima del frontend e registrare l’esito del rilascio. Archivio originale conservato; media e compressione restano nel passo successivo.

<!-- sport-search-and-working-dog-v1 -->

## Nuova direttiva: ricerca gestione cane e sport

Il proprietario che cerca aiuto quotidiano entra direttamente in **Trova aiuto
per il cane**: non deve scegliere una modalità e non compie click aggiuntivi.
**Sport cinofili** è una sezione autonoma nel menu e nella Home; solo entrando
lì il proprietario sceglie una disciplina. Nel pannello professionista ci sono
due selettori indipendenti per apparire in una o in entrambe le sezioni.
Working-Dog e i badge sono verificati e calcolati per singola disciplina;
IGP non ha una gerarchia generale sopra le altre discipline.

La specifica completa è in `docs/SPORT_SEARCH_AND_WORKING_DOG_V1.md`. È una
direttiva da approvare: non confonderla con codice o migration già applicati.


<!-- sport-search-owner-ux-v2 -->


## Sport cinofili: incremento ricerca e visibilità — 26 settembre 2026

Il primo blocco della direttiva è implementato nella copia di lavoro: area Sport
autonoma, catalogo dinamico, due checkbox professionista e ricerca quotidiana
senza priorità IGP generale. Stato di test, migrazione e pubblicazione:
[SPORT_SEARCH_RELEASE_V1.md](docs/SPORT_SEARCH_RELEASE_V1.md). Il nuovo verifier Working-Dog e il ranking
per disciplina restano il blocco successivo. Nessun rilascio remoto è implicito.


## Verifica e merito per disciplina — checkpoint 26 settembre 2026

Criteri, motore server isolato e limiti del collegamento Working-Dog: [docs/SPORT_MERIT_AND_VERIFICATION_V2.md](docs/SPORT_MERIT_AND_VERIFICATION_V2.md).
Nove discipline con regole testabili; Disc Dog, Flyball e ulteriori discipline
richiedono ancora definizioni/mappature. Nessun nuovo badge o importatore è stato
pubblicato. Serve una fonte reale accessibile e una prova dell’identità.


## Impara operativo — 27 settembre 2026

Percorso gratuito: 8 lezioni, letture applicate, quaderno con attività reali,
quiz con correzione, progressi/ripresa, backup e laboratorio video di timing.
Specifiche, verifiche e limiti: [IMPARA_RELEASE_V3.md](docs/IMPARA_RELEASE_V3.md).
Implementato nella copia di lavoro; nessuna migration. Stato online da registrare
dopo il deployment. Le autoverifiche non sono qualifiche professionali.


## Impara: shaping e basi dell’apprendimento — 27 settembre 2026

Il nuovo laboratorio usa un cane animato: orientamento, avvicinamento, una zampa
e due zampe anteriori sulla piattaforma. Criteri facili, feedback sul click e
modalità guidata senza fretta. Condizionamento classico e operante ampliati con
esempi, attività e quiz. Stato, progressi e rilascio:
[IMPARA_SHAPING_V1.md](docs/IMPARA_SHAPING_V1.md). Sostituisce le indicazioni
sul laboratorio astratto di Impara v3. Il ripristino degli strumenti professionali
rimane la successiva richiesta aperta; non è realizzato da questo incremento.


## Audit Supabase — migrazione applicata il 27 settembre 2026

Permessi client ridotti, controlli RLS ottimizzati e quattro policy duplicate
eliminate. Corretta anche una divergenza fra ricostruzione Git e policy online.
Test nativi superati su 46 migrazioni precedenti più la nuova. L’utente ha
confermato l’applicazione online il 27 settembre 2026: `Finished supabase db push`.
Questo checkpoint registra il rilascio; i controlli applicativi dopo il rilascio
non sono ancora documentati. Ambito e avvisi intenzionali:
[SUPABASE_AUDIT_FIXES_V1.md](docs/SUPABASE_AUDIT_FIXES_V1.md).
Gli strumenti professionali da ripristinare rimangono il prossimo blocco.


## Ripristino strumenti: pacchetti di lezioni — 27 settembre 2026

Primo incremento completo: modelli, assegnazioni, lezioni residue, scadenze,
storico, storni e vista proprietario. Specifica e stato verifiche:
[PROFESSIONAL_PASSES_V1.md](docs/PROFESSIONAL_PASSES_V1.md).
Preparato localmente su base `db2e010`; nuova migration da testare nel WSL
e applicare prima del frontend. Nessuna pubblicazione online attestata qui.
Abbonamenti, tessere e campagne rimangono i prossimi strumenti da ripristinare.


<!-- supabase-private-api-v2 -->
## Confine API Supabase — 28 settembre 2026

Nuova correzione per i tre ERROR sulle viste e i 58 WARN sulle funzioni
privilegiate: [SUPABASE_PRIVATE_API_V2.md](docs/SUPABASE_PRIVATE_API_V2.md). Implementazioni interne in
`pc_private`, API pubbliche invoker con contratti e controlli preservati.
Test isolati superati; database online non dichiarato aggiornato. L'avviso
password compromesse richiede una configurazione Auth, disponibile da Pro.
Le future migrazioni devono rispettare questo confine e l'ordine descritto.

<!-- professional-subscriptions-v1 -->
## Abbonamenti professionali — 28 settembre 2026

Nuovo incremento: piani settimanali, quindicinali o mensili, primo periodo,
rinnovi confermati, lezioni e storni per periodo, chiusura, annullamento e vista
proprietario. Specifica, limiti e rilascio: `docs/PROFESSIONAL_SUBSCRIPTIONS_V1.md`.
Base verificata: `f7d94f4`. Preparato e testato in ambiente isolato; migrazione
`20260928120000_professional_subscriptions.sql` da applicare prima del frontend.
Nessun pagamento automatico. Non dichiarare online finché non è confermato.

## Home e navigazione — revisione del 28 settembre 2026

Menu desktop a pulsanti, ricerca addestratore diretta, servizi operativi,
anteprima Impara, Prima del cane e spazi distinti per sport e professionisti.
Rimossi dalla Home i blocchi editoriali ripetitivi segnalati da Luigi.
Specifica, verifiche e limiti: [HOME_NAVIGATION_V2.md](docs/HOME_NAVIGATION_V2.md).
Solo frontend; nessuna nuova migrazione. Base `ff721ce`; deployment da
identificare con il commit del rilascio prima di dichiararlo Ready.
