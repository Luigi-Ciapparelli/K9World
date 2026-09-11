# PawConnect Core Data Model v1

> **Stato:** blueprint architetturale.  
> **Non applica migration.**  
> Serve a guidare l'evoluzione del database esistente senza rompere ciò che funziona.

## Obiettivo

Portare PawConnect da uno schema nato attorno a profili, professionisti e prenotazioni a un Core globale in cui le entità centrali siano:

**Persona → Cane → Binomio → Learning → Credential → Organization → Sport → Media → Research → Commerce → Country**

Il booking rimane un dominio importante, ma non deve più definire l'identità del prodotto.

---

# 1. Mappa: oggi → Core futuro → azione

| Oggi | Core futuro | Azione |
|---|---|---|
| `profiles` | `Person / Account Profile` | **Conserva ed estendi con cautela.** Rimane il profilo account applicativo, ma non deve contenere tutta l'identità cinofila futura. |
| `professionals` | `Professional Profile` | **Conserva.** Deve diventare una specializzazione di Persona, non una seconda identità separata. |
| `dogs` | `Dog` | **Conserva ed espandi.** È una delle entità centrali del Core. |
| `fci_breeds` | `Breed Reference` | **Conserva.** Tassonomia interna canonica; in futuro deve supportare country/registry mappings senza duplicare la razza. |
| `services` | `Professional Service` | **Conserva nel dominio Services.** |
| `availability` | `Professional Availability` | **Conserva nel dominio Services.** |
| `resources` | `Bookable Resource` | **Conserva se realmente usato.** Non fa parte del Core identitario. |
| `bookings` | `Service Booking` | **Conserva.** Dominio transazionale separato. |
| `booking_dogs` | `Booking ↔ Dog relation` | **Conserva.** Buon modello relazionale. |
| `reviews` | `Service Review` | **Conserva.** Recensione di una transazione, non misura generale della competenza. |
| `client_notes` | `Professional Client Note` | **Conserva nel CRM.** Mai riusarlo come nota professionale sul cane. |
| `client_tags` | `Professional CRM Tag` | **Conserva.** |
| `client_groups` | `CRM Segment` | **Congela finché serve.** Non Core. |
| `membership_tiers` | `Commerce / Professional CRM` | **Fuori dal Core.** Attualmente beta congelata. |
| `client_memberships` | `Commerce / Professional CRM` | **Fuori dal Core.** |
| `passes` | `Commerce / Professional CRM` | **Fuori dal Core.** |
| `client_passes` | `Commerce / Professional CRM` | **Fuori dal Core.** |
| `subscription_plans` | `Commerce / Professional CRM` | **Fuori dal Core.** |
| `client_subscriptions` | `Commerce / Professional CRM` | **Fuori dal Core.** |
| `email_campaigns` | `Marketing` | **Fuori dal Core.** Congelato finché non serve. |
| `booking_rules` | `Services Policy` | **Conserva solo se necessario al booking.** |
| `chat_logs` | `Support / AI domain` | **Separare concettualmente.** Non usare come knowledge base o Research. |
| `verification_codes` | `Identity / Verification` | **Conserva come infrastruttura privata.** |

---

# 2. Entità Core future

## 2.1 Person

`profiles` rimane il profilo account, ma il Core deve distinguere:

### Account identity
- `id`
- email
- nome visualizzato
- lingua
- country
- privacy settings
- account role tecnico

### Cynology identity
Da aggiungere in un'entità separata in futuro, ad esempio:

`person_cynology_profiles`

Campi concettuali:
- `person_id`
- bio cinofila
- experience_since
- public_profile_enabled
- primary_country
- profile_slug
- visibility
- created_at / updated_at

**Perché separarlo:** un account può esistere senza avere ancora una vera identità cinofila pubblica.

---

## 2.2 Dog

`dogs` deve diventare una vera entità persistente.

Già oggi contiene:
- owner
- nome
- razza
- identità FCI
- età/data di nascita
- peso
- note
- foto

In futuro può estendersi con domini separati, non con cento colonne nella stessa tabella.

Possibili tabelle future:

### `dog_registry_records`
Per pedigree/registri ufficiali:
- dog_id
- organization_id
- registry_name
- registration_number
- country_code
- verified_at
- verification_source

### `dog_activities`
- dog_id
- activity/discipline
- started_at
- ended_at
- notes

### `dog_media`
- dog_id
- media_id
- visibility
- consent/research flags

### `dog_professional_notes`
Separata da `client_notes`.
- dog_id
- professional_id
- note
- visibility
- created_at

---

## 2.3 Human–Dog Relationship / Binomio

Questa è una delle nuove entità più importanti.

Proposta futura:

`person_dog_relationships`

Campi:
- `id`
- `person_id`
- `dog_id`
- `relationship_type`
  - owner
  - co_owner
  - handler
  - trainer
  - breeder
  - caretaker
- `started_at`
- `ended_at`
- `is_primary`
- `verified`
- `visibility`

Per lo sport e la formazione servirà distinguere il proprietario dal **conduttore reale del cane**.

Un futuro `dog_partnerships` può rappresentare il binomio sportivo/educativo se servirà una vera identità propria con carriera e risultati.

---

# 3. Learning Core

Il motore Impara non deve dipendere dal frontend.

Entità concettuali future:

## `learning_stages`
- id
- code
- title
- country_scope nullable
- status
- order

## `learning_modules`
- id
- stage_id
- title
- order

## `learning_lessons`
- id
- module_id
- slug
- title
- content_version
- status
- source_status
- order

## `learning_activities`
- id
- lesson_id
- type
  - reading
  - observation
  - quiz
  - practical
  - reflection
- completion_rule

## `learning_progress`
- person_id
- lesson_id
- state:
  - `to_learn`
  - `learned`
  - `verified`
- completed_at
- verified_at
- verifier_type

## `learning_attempts`
Per verifiche e quiz, senza trasformare la piattaforma in un gioco a punti.

## `learning_awards`
Solo per traguardi significativi:
- Stage completato
- percorso speciale
- verifica pratica
- risultato ufficiale collegato

**Nota:** XP può esistere come metrica interna, ma non deve necessariamente essere mostrato all'utente.

---

# 4. Credential Core

Serve distinguere ciò che una persona dichiara, ciò che PawConnect verifica e ciò che arriva da un ente ufficiale.

## `credentials`
Campi concettuali:
- `id`
- `person_id`
- `credential_type`
- `title`
- `issuer_organization_id`
- `issued_at`
- `expires_at`
- `verification_level`
- `source`
- `document_reference`
- `visibility`

### Verification levels

- `self_declared`
- `document_verified`
- `issuer_verified`
- `pawconnect_completed`
- `official_qualification`

Mai confondere un badge PawConnect con una qualifica ufficiale.

---

# 5. Organization Core

Serve per non hardcodare ENCI nel modello globale.

## `organizations`

Possibili categorie:
- governing_body
- kennel_club
- federation
- training_provider
- breeder
- club
- research_institution
- veterinary_body
- event_organizer

Campi:
- id
- name
- country_code
- organization_type
- website
- official
- verification_status

Esempio Italia:
- ENCI = `kennel_club / governing_body` nazionale

In altri Paesi verrà collegato l'ente locale.

---

# 6. Country Layer

## `countries`
- ISO code
- default language
- active
- local_brand_id

## `local_brands`
Esempi:
- `portalecinofilo.it` → Italia
- `PawConnect` → mercati anglofoni

## `country_organizations`
Collega:
- country
- organization
- role ufficiale

## `country_qualifications`
Mappa:
- test
- qualifiche
- prove
- regolamenti
- percorsi nazionali

Il Core rimane globale; ENCI è configurazione italiana.

---

# 7. Sport Core

Non implementare ancora, ma riservare il modello.

## `sport_disciplines`
- id
- global_code
- name
- governing organization
- country scope

## `sport_events`
- id
- discipline_id
- organizer
- location
- country
- date

## `sport_entries`
- event_id
- dog_id
- handler_person_id
- class/category

## `sport_results`
- entry_id
- result
- score
- placement
- judge
- official
- evidence

Principio:

**Person → Dog → Handler relationship → Discipline → Event → Result → Organization → Evidence**

---

# 8. Media Core

Media non deve essere un semplice URL sparso nelle tabelle.

Futuro:

## `media_assets`
- id
- owner_person_id
- storage path
- media type
- caption
- visibility
- copyright/ownership
- consent status
- research consent
- editorial consent

Poi collegamenti:
- dog_media
- person_media
- article_media
- event_media
- research_media

---

# 9. Magazine Core

## `articles`
- id
- slug
- title
- author_person_id
- country_scope
- category
- status
- published_at
- updated_at

## `article_sources`
- article_id
- source_type
- organization / URL / publication
- citation metadata

Categorie future:
- news
- sport
- research
- education
- interviews
- events
- regulations

---

# 10. Research Core

Il database operativo NON viene aperto direttamente ai ricercatori.

Futuro dominio separato:

## `research_projects`
- project
- institution
- principal investigator
- approved purpose
- start/end
- status

## `research_consents`
- person
- dog
- data category
- media category
- scope
- withdrawn_at

## `research_datasets`
Dataset derivati e pseudonimizzati.

## `research_access_grants`
Chi può accedere a cosa e per quale progetto.

---

# 11. Commerce Core

Separato da Learning e dalle qualifiche.

Possibili domini:
- products
- orders
- discounts
- merchandise
- event tickets
- professional software plans

Un premio PawConnect potrà in futuro generare un vantaggio commerciale, ma:

**badge ≠ sconto ≠ qualifica**

Sono entità diverse.

---

# 12. Services Domain

L'attuale marketplace rimane valido, ma viene riclassificato come dominio funzionale.

Contiene:
- professionals
- services
- availability
- bookings
- booking_dogs
- reviews
- CRM

Non è il Core identitario di PawConnect.

---

# 13. Cosa NON fare adesso

1. Non rinominare `profiles`, `dogs` o `professionals`.
2. Non creare subito tutte queste tabelle.
3. Non riscrivere le migration già applicate.
4. Non migrare il progresso Impara su Supabase prima di definire bene Learning Core.
5. Non inserire sport, research o magazine come colonne sparse in `profiles` o `dogs`.
6. Non usare `role` per rappresentare ogni possibile identità futura.
7. Non usare `reviews.rating` come misura della competenza professionale.
8. Non mettere ENCI direttamente in nomi di colonne globali.
9. Non rendere pubblici dati privati per facilitare Research.
10. Non trasformare XP o badge in una seconda identità professionale.

---

# 14. Primo percorso di implementazione consigliato

Quando il blueprint sarà approvato:

### Fase A — Identity foundation
- Country layer minimo
- Organization model
- Person cynology profile
- Person ↔ Dog relationship

### Fase B — Learning foundation
- Stage
- Module
- Lesson
- Progress
- Verification
- Award

### Fase C — Credential wallet
- Credentials
- Issuers
- Verification states

### Fase D — Sport
Solo quando avremo definito discipline e requisiti reali.

### Fase E — Magazine / Research / Commerce
Domini indipendenti, agganciati al Core.

---

# 15. Regola architetturale

Ogni nuova feature deve rispondere a quattro domande:

1. **Chi è il soggetto?** Persona, Cane, Binomio, Organization?
2. **Che tipo di fatto è?** Apprendimento, credenziale, attività, risultato, transazione?
3. **Chi lo afferma?** Utente, PawConnect, professionista, ente ufficiale, ricercatore?
4. **Quanto è verificato?** Dichiarato, verificato, ufficiale?

Se queste quattro risposte non sono chiare, la feature non è pronta per entrare nel database.
