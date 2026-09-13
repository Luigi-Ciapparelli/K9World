# PawConnect / Portalecinofilo — Project Handoff

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
