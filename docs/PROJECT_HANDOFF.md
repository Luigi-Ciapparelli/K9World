# PawConnect / Portalecinofilo — Project Handoff

## Passaggio di consegne: nuove direttive, nessuna esecuzione — 8 ottobre 2026

Decisioni di Luigi del 7 ottobre registrate in
[FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md](FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md):
campagna Higgsfield con portale e binomi; Addestratori/Pensioni come soli box
della ricerca quotidiana; Esposizioni per Toelettatura/Handler; export dello
storico autorizzato; valutazioni reciproche dalla seconda esperienza con lo
stesso addestratore e recensioni unidirezionali per le pensioni.

Luigi riferisce di aver pubblicato i primi tre post, con visualizzazioni soltanto
su TikTok. Profili social salvati nella specifica; nessun dato quantitativo
verificato e nessuna deduzione sul numero di post per singolo canale.
I vecchi resoconti «solo Instagram» sono storici. Il nuovo concept video riguarda
i social e non modifica la home statica. La ZIP allegata non è stata letta.

Ambito autorizzato: solo documenti e loro pubblicazione su GitHub, su base
remota `5edfd4c`. Non implementare né produrre il video senza una nuova richiesta.
Restano da definire dettagli dei download, visibilità del rating sul cliente,
cadenza degli inviti e soglia per le pensioni: non inventare decisioni di Luigi.
I precedenti checkpoint tecnici non costituiscono test di queste nuove funzioni.

## Impresa, ricavi e sviluppo della rete — 6 ottobre 2026

GitHub `main` riletto al commit `431713d508219392d0b657e9abd961537ddc8ae0`:
la home statica e l'orizzonte imprenditoriale sono già nel repository remoto.
Questo supera i precedenti checkpoint che li descrivevano solo come preparati;
lo stato del deployment Vercel non è stato verificato in questo intervento.

Luigi conferma il primo post Instagram; Facebook, LinkedIn e TikTok non hanno
ancora contenuti. Richiede un piano per mantenere il portale gratuito, generare
ricavi, valutare fondi e arrivare in seguito a un'attività internazionale con
centri, eventuale allevamento, franchising e componente immobiliare.

Preparato un aggiornamento solo documentale. Nuovi riferimenti:
- [Piano d'impresa e tappe](BUSINESS_ROADMAP_V1.md).
- [Finanziamenti verificati e requisiti da chiarire](FUNDING_SCREENING_2026_10.md).
- [Piano social e prime bozze](SOCIAL_LAUNCH_30_DAYS_V1.md).

Distinguere direzione richiesta e proposte: prezzi, soglie di utilizzatori e
calendario sono ipotesi operative, non tariffe attive né risultati raggiunti.
Non comprare ranking o badge; non vendere archivi privati; nuovi servizi a
pagamento solo con adesione esplicita. Nessun ricavo o finanziamento garantito.
Autoimpiego Centro-Nord richiede prima una verifica personale e dei tempi di
avvio. I dati personali per l'ammissibilità restano fuori dal Git pubblico.

Nessun codice, database, account, campagna o contratto modificato. Nessun invito
inviato. Aggiornamento preparato su base `431713d`; verificare commit e push prima
di dichiarare pubblicate queste nuove direttive. Il collaudo tecnico precedente
rimane storico: questo checkpoint non attesta nuove prove su servizi online.

## Home statica e percorso facoltativo — 5 ottobre 2026

Ultima indicazione di Luigi: conservare titolo e composizione della proposta,
sostituire l'animazione con un'immagine statica del portone attraversato dal cane.
La precedente proposta animata è stata vista soltanto in anteprima e non
installata. Anche l'ipotesi di sostituire la home con la ricerca è superata.

Test di scelta → Impara → scelta del cane insieme a un addestratore → supporto
nella propria zona. Tutte le tappe sono liberamente accessibili. Chi ha già
un cane accede direttamente alla ricerca dal primo blocco. Sport e navigazione
approvata restano distinti e invariati. Testo principale aggiornato con la frase
richiesta «per vivere felici e sereni la vostra relazione».

Base remota: `599e152`. TypeScript, build, verifica SEO e browser desktop/mobile
superati con API simulate. Anteprime ricavate dall'interfaccia reale. Nessuna
migration. Preparato l'aggiornamento, non pubblicato da questo ambiente; il push
richiede le credenziali GitHub presenti nel computer di Luigi.
Specifiche, collaudo e rilascio: [HOME_PORTAL_V1.md](HOME_PORTAL_V1.md).

## Lancio con costi contenuti — 30 settembre 2026

Decisione di Luigi: arrivare agli inviti senza nuovi servizi a pagamento e
senza presentare il prodotto come “beta” o “MVP”. Verifica SMS disattivata
per default e controlli UI coerenti; conferma email e prenotazioni disponibili
senza telefono verificato. Le regole SQL di cambio recapito restano invariate.
Pagina professionisti, footer e informazioni pubbliche aggiornati; iscrizione
attualmente gratuita, futura adesione a pagamento solo esplicita.

Luigi ha confermato registrazione e recupero password reali, ricezione email
in inbox e ritorno al dominio .com. Ultima diagnosi fornita: auto-conferma
email false, telefono false; nomi dei secret Resend presenti. Questo supera
la precedente osservazione di auto-conferma attiva. SMTP funzionante non
prova da solo l'invio del nuovo codice Edge: resta un controllo reale finale.

Base remota riletta: `49f22f7`. Recapiti e rilascio corrente preparati, non
ancora pubblicati da questo ambiente. Nessuna email di marketing inviata,
nessun servizio acquistato. Piano operativo: [LAUNCH_READINESS_V1.md](LAUNCH_READINESS_V1.md).
Testi pronti: [LAUNCH_COPY_V1.md](LAUNCH_COPY_V1.md).
Questi documenti hanno precedenza sui checkpoint storici e sugli inviti beta.

## Verifica e modifica recapiti — 30 settembre 2026

Base remota riletta: `49f22f7`; recupero password e percorso prenotazione sono
su GitHub. Causa email osservata online: `mailer_autoconfirm: true`.
Aggiunta pagina Email e telefono e conferma incrociata con codice al nuovo
recapito e all'altro già verificato. Rimossa la verifica di sviluppo; flag
collegati a prove server, API interne protette e sincronizzazione email Auth.
Specifica, effetto sugli account autoconfermati, configurazioni richieste e
sequenza di rilascio: [ACCOUNT_CONTACTS_V1.md](ACCOUNT_CONTACTS_V1.md).
Nuova migration preparata, funzioni Edge e frontend da pubblicare dopo aver
configurato la consegna. Nessuna modifica o invio online in questo intervento.
Test SQL su 50 migration precedenti e nuova migration, handler con provider
simulati, TypeScript e UI recapiti mobile/desktop superati. Prova reale Auth,
SMTP/SMS e concorrenza multi-connessione restano da completare.
I checkpoint sottostanti sono storici.

## Primo contatto proprietario/professionista — 29 settembre 2026

Base GitHub verificata: `4c951a9` (recupero password già su main).
Corretto il rientro alla richiesta dopo accesso/registrazione: si conserva
soltanto il profilo pubblico scelto, con destinazione limitata a `/p/UUID`.
L'invio della richiesta resta un'azione esplicita del proprietario.
Aggiunto Aggiorna richieste nell'elenco professionale.
Specifica e limiti del collaudo: [BOOKING_ENTRY_V1.md](BOOKING_ENTRY_V1.md).
Questo incremento frontend resta da pubblicare; nessuna migration.
Consegna email e collaudo privato online restano da confermare.

## Recupero password — 29 settembre 2026

Base GitHub verificata: `e999041`; le correzioni di ingresso professionisti
sono già su main. Aggiunti richiesta email, nuova password e gestione link
scaduti, con ripresa dopo ricarica e controllo dell'account prima del cambio.
Nessuna migration. Configurazione Redirect URLs di Supabase e consegna email
reale da verificare al rilascio: [PASSWORD_RECOVERY_V1.md](PASSWORD_RECOVERY_V1.md).
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
[PILOT_READINESS_V1.md](PILOT_READINESS_V1.md).
Bozze: [PILOT_INVITATIONS.md](PILOT_INVITATIONS.md).
Questo incremento resta da applicare/pubblicare; nessun invito inviato.

## SEO e accessibilità ai motori — 29 settembre 2026

Base GitHub verificata: `5bfe88b`; il precedente profilo guidato è già su main.
URL pubblici senza hash, HTML generato dagli stessi componenti React, 395
pagine pubbliche (391 nella sitemap), titoli e descrizioni specifici, dati
strutturati, robots.txt e 404. Link privati e frammenti Auth compatibili.
Specifica, limiti e istruzioni Search Console: [SEO_VISIBILITY_V1.md](SEO_VISIBILITY_V1.md).
Nessuna migrazione o accesso al database online. Test frontend e browser
isolati; pubblicazione di questo incremento e Vercel Ready da confermare.
I checkpoint sottostanti descrivono momenti precedenti.

## Profilo e strumenti professionali guidati — 29 settembre 2026

Base corrente GitHub: `b512eb9`, comprensiva della Home con media richiesta da Luigi.
Nuovo incremento frontend: **Profilo guidato**, quattro attività di base con
progressi sui dati salvati, schermate separate, servizi e attestati in tre passi,
guide dentro gli strumenti, menu raggruppato e protezione delle bozze.
Specifica e limiti: [PROFESSIONAL_GUIDED_WORKSPACE_V1.md](PROFESSIONAL_GUIDED_WORKSPACE_V1.md).
TypeScript, build e prove browser con API simulate superati. Nessuna migration.
Codice pronto da applicare/pubblicare; commit remoto e Vercel Ready di questo
incremento non ancora osservati. I checkpoint sottostanti restano storici.

## Home con media e navigazione unificata — 29 settembre 2026

Base GitHub esaminata: `c75d0c1`. Luigi ha chiesto di eliminare la voce Servizi
perché duplicava Trova aiuto per il cane: resta il pulsante verde che apre
subito `/search?type=trainer`. Impara e Sport cinofili rimangono separati.
La Home usa un’immagine illustrativa compressa, tipografia sans più netta,
movimento disattivabile e una breve animazione dello shaping aperta su richiesta.
Specifica corrente: [HOME_NAVIGATION_V2.md](HOME_NAVIGATION_V2.md).
Provenienza dei media: [HOME_MEDIA_ASSETS.md](HOME_MEDIA_ASSETS.md).
Verifiche locali frontend; nessuna migrazione necessaria. Pubblicazione di
questo incremento ancora da registrare con commit e deployment Vercel Ready.
Le descrizioni precedenti della Home sono storiche.

> Canonical continuity document for developers, collaborators and future AI assistants.

## 1. What this project is

PawConnect is being developed as a global digital infrastructure for cynology.

The Italian consumer-facing brand is intended to become **Portalecinofilo**, while **PawConnect** is the global / English-market identity and Core concept.

The long-term goal is not simply a pet-services marketplace.

PawConnect should connect:

**owners → dogs → professionals → education → sport → organizations → media → research → commerce**

The core mission is to make serious cynological knowledge accessible and desirable while keeping the user experience extremely simple.

Guiding principle:

> **Make cynology simple to understand without simplifying cynology itself.**

---

## 2. Product principles

Non-negotiable principles:

1. Fundamental cynological education should remain free.
2. The dog is an individual, not a stereotype of its breed.
3. Breed, FCI group and historical function are tools for understanding, not automatic behavioral predictions.
4. Official qualifications must always be clearly separated from PawConnect achievements.
5. Professional competence must be shown through facts: education, experience, disciplines, courses, results, teaching and verified credentials.
6. Gamification must motivate real learning and practice, not create meaningless stars, ranks or decorative numbers.
7. PawConnect must be global at the Core level and local at the country layer.
8. Research data must be separated from operational user data.
9. Every important fact should have a clear source and verification level.
10. Booking is one domain of PawConnect, not the center of PawConnect.

---

## 3. Current technology

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- Hash-based routing

Backend:
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase RPC / RLS

Deployment:
- GitHub repository
- Vercel frontend
- Supabase backend
- current production domain: `portalecinofilo.it`

Local environment historically used:
- WSL2 Ubuntu
- Node 20
- npm
- Supabase CLI through `npx supabase`

Useful commands:

```bash
npm run typecheck
npm run build
npx supabase migration list
```

Do not use destructive dependency fixes such as:

```bash
npm audit fix --force
```

---

## 4. Current Git direction

The active development work described in this handoff has been happening on:

```text
signup-dog-profile
```

Important recent checkpoints include:

```text
9bfc80e  Add role based authentication navigation
28f56da  Add pre dog FCI breed journey
6d4d1eb  Add responsible breeder selection guide
1a1cbda  Add PawConnect Impara stage one prototype
5bad0b4  Add route level code splitting
```

Do not merge blindly into main without a final QA/security pass.

---

## 5. Current architecture already implemented

### Public professional access

Public professional search has been moved away from direct table exposure.

Key concepts:
- approved-only public professional projection;
- safe public RPC search;
- exact professional coordinates remain private;
- public distance is coarse/bucketed;
- direct anonymous access to private profile/professional data is closed.

### Reviews

Reviews are tied to completed bookings.

Current direction:
- secure review submission RPC;
- one review per booking;
- rating constrained;
- public review view exposes only safe fields;
- professional rating aggregates are server-controlled.

### Booking security

Bookings use:
- atomic booking creation RPC;
- controlled booking status transition RPC;
- direct unsafe booking mutation paths revoked.

### CRM

Professional CRM access is relationship-based.

Professionals only see relevant client data for accepted/completed relationships.

### Dogs

Dogs are becoming a first-class entity rather than a booking accessory.

Implemented:
- FCI breed identity;
- canonical FCI breed integrity;
- birth date;
- dog detail page;
- private dog photo storage;
- controlled professional access to dog photos when the professional has a legitimate relationship.

### FCI

The project contains a canonical list of approximately 364 ENCI/FCI breeds.

Breed data includes:
- name;
- slug;
- FCI group;
- FCI group name;
- official ENCI URL.

The database also contains an internal canonical `fci_breeds` table used to protect dog breed integrity.

### Authentication / navigation

Role-aware login and protected route behavior has been implemented.

Expected role destinations:

```text
owner        -> /owner
professional -> /pro
admin        -> /admin
```

Protected route families:
- `/owner/*`
- `/pro/*`
- `/admin*`

### Code splitting

Route-level code splitting is implemented with `React.lazy()` / `Suspense`.

This reduced the main JavaScript bundle from roughly 600 KB minified to roughly 386 KB minified and removed the Vite >500 KB chunk warning.

Do not undo route-level lazy loading.

---

## 6. Current major product areas

### A. Before the dog

Implemented public journey:

```text
/prima-del-cane
```

Purpose:
- help someone think before acquiring a dog;
- assess real-life compatibility factors;
- avoid simplistic "perfect breed" quizzes;
- connect the user to FCI groups and breed exploration.

Current flow:

```text
life profile
→ compatibility considerations
→ FCI groups
→ breed page
→ official ENCI source
→ responsible breeder guide
```

### B. FCI / breeds

Implemented:
- FCI group pages;
- breed list per group;
- breed search;
- individual breed pages;
- official ENCI links;
- responsible breeder guide.

Important principle:

PawConnect does **not** create a fake certification parallel to ENCI.

### C. PawConnect Impara

Current prototype:

```text
/impara
```

Stage 1 prototype exists with 3 lessons:
1. basic needs;
2. sleep and rest;
3. routine and safety.

Current progress is intentionally local-only (`localStorage`) and is not yet a final learning engine.

The content is explicitly marked as draft material derived from course notes and must be reviewed and expanded before becoming authoritative PawConnect content.

---

## 7. PawConnect Impara — future direction

Impara must not become a generic article collection.

Target structure:

```text
Stage
→ Module
→ Lesson
→ Activity
→ Verification
→ Completion
```

Simple visible states:

```text
Da conoscere
Appreso
Verificato
```

Gamification is important, but must remain simple and meaningful.

Possible future elements:
- Stage icon;
- meaningful badges;
- medals for real milestones;
- future e-store rewards/discounts;
- practical activities;
- account-level progress;
- future practical verification.

Avoid:
- meaningless stars;
- dozens of visible numeric levels;
- arbitrary leaderboards;
- presenting course completion as official qualification.

Long-term educational path:

### Stage 1
Foundations:
- needs;
- rest;
- routine;
- safety;
- spaces;
- communication;
- learning;
- relationship;
- prossemics;
- reading the dog;
- FCI groups;
- breed/function;
- responsible puppy/breeder choice;
- daily management.

### Stage 2
Future introduction to canine sport:
- disciplines;
- motivation;
- basics of working as a pair;
- introductory tools and handling.

### Stage 3
Future advanced/practical path:
- structured practice;
- advanced management;
- sport;
- tools;
- practical evaluation.

The long-term Italian goal is for the pathway to become genuinely preparatory to an external official milestone such as an ENCI "Cane Buon Cittadino" pathway/test, if and only if formal requirements and relationships allow it.

Never represent a PawConnect certificate as ENCI certification.

---

## 8. Educational source policy

Current source material includes ENCI course notes.

Future sources may include:
- additional handwritten notes;
- CEF training materials;
- other educational books;
- official regulations;
- scientific literature;
- instructors' material.

Rules:
- use source material to learn, structure and synthesize;
- write original PawConnect educational material;
- do not reproduce copyrighted books or illustrations;
- distinguish source-derived claims from PawConnect interpretation;
- controversial or method-specific claims require review before publication;
- professional/sport-specific material may be held back for later Stages.

The sports-dog section from the current course notes is intentionally excluded from Stage 1 for now.

---

## 9. Future Core model

Read:

```text
docs/PAWCONNECT_CORE_DATA_MODEL.md
```

Core conceptual entities:

```text
Person
Dog
Human-Dog Relationship / Binomio
Learning
Credential
Organization
Country
Sport
Media
Magazine
Research
Commerce
Services
```

Key architectural idea:

```text
PawConnect Core
→ Country configuration
→ Local brand
→ User experience
```

Italy:
- Portalecinofilo
- ENCI as national official organization reference

English-language markets:
- PawConnect

Do not hardcode ENCI as a global concept.

---

## 10. Person / Dog / Binomio

### Person

`profiles` remains account identity.

In the future, cynological identity should be conceptually separated from basic account identity.

### Dog

`dogs` must remain central and persistent.

Future dog-related domains may include:
- registry records;
- activities;
- media;
- professional notes;
- sport;
- results;
- verified information.

Do not turn `dogs` into a giant table with every possible future field.

### Binomio

The relationship between person and dog is important enough to model explicitly.

Future relationship types may include:
- owner;
- co-owner;
- handler;
- trainer;
- breeder;
- caretaker.

This becomes essential for sport, education, results and history.

---

## 11. Credential Wallet

Future PawConnect profiles should distinguish credential provenance.

Conceptual verification levels:

```text
self_declared
document_verified
issuer_verified
pawconnect_completed
official_qualification
```

A PawConnect badge, an external course certificate and an official qualification must never look equivalent.

Professional competence should be understandable in seconds without using simplistic star ratings as the primary signal.

---

## 12. Sport

Future conceptual graph:

```text
Person
→ Dog
→ Handler relationship
→ Discipline
→ Event
→ Result
→ Organization
→ Evidence
```

Possible future support:
- disciplines;
- trials;
- results;
- judges;
- organizations;
- video;
- ranking/history;
- dog/handler career.

Do not implement the full sport schema before real requirements are known.

---

## 13. Magazine

PawConnect Magazine should become a real editorial area, not a generic SEO blog.

Possible sections:
- Italian canine news;
- sport;
- results;
- events;
- interviews;
- research;
- education;
- regulations;
- official organization updates.

Every article should eventually support:
- author;
- sources;
- country;
- category;
- publication date;
- update date;
- editorial status.

---

## 14. Research

Research is a future major domain.

Principles:
- operational database is never directly "opened" to researchers;
- explicit consent;
- pseudonymization;
- derived datasets;
- controlled research access;
- project-specific permissions;
- separate rules for photos/video;
- withdrawal handling.

Research should be designed deliberately, not bolted onto the production database.

---

## 15. Commerce

The fundamental educational mission remains free.

Possible future revenue:
- practical stages;
- advanced/professional education;
- professional software;
- e-store;
- merchandise;
- events;
- premium tools;
- services/commissions where appropriate.

Future free asset:
- short PawConnect ebook on correct dog management.

The ebook should connect back into Impara.

---

## 16. Database migration warnings

Important rule:

**Never edit, rename or delete already-applied migrations.**

There are known intentional/no-op migration files that exist because remote migration history already contains them.

Examples:
- `20260911010021_secure_professional_crm.sql`
- `20260911023829_secure_dog_photo_access.sql`

These may be empty but must remain aligned with remote history.

Before creating any new migration:
1. check whether a migration for the task already exists;
2. run `npx supabase migration new ...` only once;
3. never create a second migration just because the first file appears empty until its actual state is inspected.

---

## 17. Security principles

1. RLS/database policy is the source of truth for security.
2. Frontend route guards are UX protection, not database security.
3. Avoid direct public access to private tables.
4. Prefer explicit public projections/views/RPCs.
5. Exact professional coordinates are private.
6. Dog photos are private.
7. Reviews must be transaction-backed.
8. Ratings should not be client-writable aggregates.
9. Research access must never bypass operational privacy.
10. Do not place secrets in repository documentation.

---

## 18. UI / design direction

Avoid:
- generic SaaS dashboard aesthetic;
- aggressive marketplace-first design;
- meaningless gamification;
- mixed language;
- empty states that feel unfinished.

The product has three visible souls:

```text
discover / learn
my dog
find a professional
```

They should feel like one coherent ecosystem.

Editorial / educational areas should feel curated and trustworthy.

---

## 19. Current roadmap

Current broad order:

1. strengthen PawConnect Impara architecture;
2. continue collecting and structuring educational source material;
3. define future Person–Dog–Binomio relationships;
4. define Learning Core;
5. define Credential Wallet;
6. only then create new schema migrations for these domains;
7. later expand into sport;
8. later Magazine;
9. later Research;
10. later Commerce / e-store / merchandise;
11. full UX/language/accessibility polish;
12. final security and MVP gate;
13. production launch decisions.

Do not rush into implementing all future tables at once.

---

## 20. Before changing the project

A new collaborator or AI should first read:

```text
docs/PROJECT_HANDOFF.md
docs/PAWCONNECT_CORE_BLUEPRINT.md
docs/PAWCONNECT_CORE_DATA_MODEL.md
```

Then inspect:
- current `git status`;
- current branch;
- recent commits;
- Supabase migration history;
- current route structure;
- current TypeScript/build state.

Run:

```bash
git status --short
git log --oneline -n 15
npx supabase migration list
npm run typecheck
npm run build
```

Do not assume the repository state from this document alone.

---

## Continuity protocol for a new AI account

A new AI assistant does not need access to the previous ChatGPT account if it can access this repository.

It should read:

```text
START_HERE.md
docs/PROJECT_HANDOFF.md
docs/PAWCONNECT_CORE_BLUEPRINT.md
docs/PAWCONNECT_CORE_DATA_MODEL.md
docs/PERSON_DOG_RELATIONSHIPS.md
docs/LEARNING_CREDENTIAL_CORE.md
```

Then it must verify the current repository state instead of trusting documentation blindly:

```bash
git status --short
git branch --show-current
git log --oneline -n 20
npx supabase migration list
npm run typecheck
npm run build
```

The documents explain **why** the project exists and **where it is going**.

Git, code and migrations explain **exactly what has actually been implemented**.

This separation is intentional:
- blueprint = future architecture;
- handoff = current context and decisions;
- code = implemented behavior;
- migrations = implemented database state;
- Git history = implementation chronology.

If a future assistant has only these files but no access to the repository itself, it will understand the product and architecture but cannot know whether later code changes were made after the documents were written.

---

## 21. The test for every future feature

Before implementing anything, answer:

1. Which Core entity does this belong to?
2. Is it global or country-specific?
3. Who is the source of the information?
4. What is its verification level?
5. Is it private, public or selectively shareable?
6. Does it improve dog welfare, human understanding or professional/research communication?
7. Can the user understand its purpose quickly?
8. Does it preserve the distinction between education, experience and official qualification?

If these answers are unclear, design first and code later.

## Professional archive and dog continuity — approved direction

See [Professional continuity and media](PROFESSIONAL_CONTINUITY_MEDIA.md). Professionals retain their authored work under an explicit retention policy; owners authorize successor access to shareable dog history. Private professional notes remain separate. Audio, video and photos use private storage and quality-preserving optimized variants. Reuse assets through authorized references, not recipient copies. Existing CRM and booking notes retain their current meaning and rules. This new domain is not yet implemented.


## Interfaccia continuità — incremento locale

Vedi [stato UI, attivazione e verifiche](CONTINUITY_UI_V1.md). Interfaccia implementata dietro flag disattivato di default; SQL ancora nelle proposte, nessuna attivazione online dichiarata. Condivisione dello storico e media restano da implementare.

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

## Direttiva successiva: ricerca per percorso e disciplina

È stata aggiunta la specifica `docs/SPORT_SEARCH_AND_WORKING_DOG_V1.md`.
Richiede un percorso normale e diretto per trovare aiuto nella gestione del
cane e una sezione autonoma **Sport cinofili** nel menu e nella Home. Il
proprietario sceglie la disciplina solo entrando in Sport; nel percorso normale
non ci sono domande o click aggiuntivi. Il professionista controlla la visibilità
con due selettori indipendenti. Catalogo e verifier sono ancora da implementare: la
documentazione non è prova di funzioni presenti.


<!-- sport-search-owner-ux-v2 -->


## Sport cinofili: incremento ricerca e visibilità — 26 settembre 2026

Il primo blocco della direttiva è implementato nella copia di lavoro: area Sport
autonoma, catalogo dinamico, due checkbox professionista e ricerca quotidiana
senza priorità IGP generale. Stato di test, migrazione e pubblicazione:
[SPORT_SEARCH_RELEASE_V1.md](SPORT_SEARCH_RELEASE_V1.md). Il nuovo verifier Working-Dog e il ranking
per disciplina restano il blocco successivo. Nessun rilascio remoto è implicito.


## Verifica e merito per disciplina — checkpoint 26 settembre 2026

Criteri, motore server isolato e limiti del collegamento Working-Dog: [SPORT_MERIT_AND_VERIFICATION_V2.md](SPORT_MERIT_AND_VERIFICATION_V2.md).
Nove discipline con regole testabili; Disc Dog, Flyball e ulteriori discipline
richiedono ancora definizioni/mappature. Nessun nuovo badge o importatore è stato
pubblicato. Serve una fonte reale accessibile e una prova dell’identità.

Il parser dei risultati è collegato a `supabase/functions/verify-working-dog/index.ts`:
richiede una riga univoca con conduttore e cane, estrae posizione, punteggio e
qualifica e lascia il record in attesa se la struttura del provider è ambigua.
Fixture locale basata sul risultato fornito di Valentina Balli: 4ª, 264,38, EX,
Classe 3 → Oro Obedience. Endpoint live e accesso Working-Dog non collaudati.


## Impara operativo — 27 settembre 2026

Percorso gratuito: 8 lezioni, letture applicate, quaderno con attività reali,
quiz con correzione, progressi/ripresa, backup e laboratorio video di timing.
Specifiche, verifiche e limiti: [IMPARA_RELEASE_V3.md](IMPARA_RELEASE_V3.md).
Implementato nella copia di lavoro; nessuna migration. Stato online da registrare
dopo il deployment. Le autoverifiche non sono qualifiche professionali.


## Impara: shaping e basi dell’apprendimento — 27 settembre 2026

Il nuovo laboratorio usa un cane animato: orientamento, avvicinamento, una zampa
e due zampe anteriori sulla piattaforma. Criteri facili, feedback sul click e
modalità guidata senza fretta. Condizionamento classico e operante ampliati con
esempi, attività e quiz. Stato, progressi e rilascio:
[IMPARA_SHAPING_V1.md](IMPARA_SHAPING_V1.md). Sostituisce le indicazioni
sul laboratorio astratto di Impara v3. Il ripristino degli strumenti professionali
rimane la successiva richiesta aperta; non è realizzato da questo incremento.


## Audit Supabase — migrazione applicata il 27 settembre 2026

Permessi client ridotti, controlli RLS ottimizzati e quattro policy duplicate
eliminate. Corretta anche una divergenza fra ricostruzione Git e policy online.
Test nativi superati su 46 migrazioni precedenti più la nuova. L’utente ha
confermato l’applicazione online il 27 settembre 2026: `Finished supabase db push`.
Questo checkpoint registra il rilascio; i controlli applicativi dopo il rilascio
non sono ancora documentati. Ambito e avvisi intenzionali:
[SUPABASE_AUDIT_FIXES_V1.md](SUPABASE_AUDIT_FIXES_V1.md).
Gli strumenti professionali da ripristinare rimangono il prossimo blocco.


## Ripristino strumenti: pacchetti di lezioni — 27 settembre 2026

Primo incremento completo: modelli, assegnazioni, lezioni residue, scadenze,
storico, storni e vista proprietario. Specifica e stato verifiche:
[PROFESSIONAL_PASSES_V1.md](PROFESSIONAL_PASSES_V1.md).
Preparato localmente su base `db2e010`; nuova migration da testare nel WSL
e applicare prima del frontend. Nessuna pubblicazione online attestata qui.
Abbonamenti, tessere e campagne rimangono i prossimi strumenti da ripristinare.


<!-- supabase-private-api-v2 -->
## Confine API Supabase — 28 settembre 2026

Nuova correzione per i tre ERROR sulle viste e i 58 WARN sulle funzioni
privilegiate: [SUPABASE_PRIVATE_API_V2.md](SUPABASE_PRIVATE_API_V2.md). Implementazioni interne in
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
Specifica, verifiche e limiti: [HOME_NAVIGATION_V2.md](HOME_NAVIGATION_V2.md).
Solo frontend; nessuna nuova migrazione. Base `ff721ce`; deployment da
identificare con il commit del rilascio prima di dichiararlo Ready.
