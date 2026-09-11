# Person ↔ Dog Relationships — PawConnect Core v1

> Design document only.  
> No database migration is applied by this document.

## Why this exists

Today `dogs.owner_id` expresses one primary owner.

That is useful and should remain for compatibility and simple ownership checks, but it is not enough for the future PawConnect Core.

A dog may also have:
- a co-owner;
- a handler;
- a trainer;
- a breeder;
- a caretaker;
- historical relationships that begin and end over time.

These are not all the same thing and should not be collapsed into one `owner_id`.

---

## Core rule

`dogs.owner_id` remains the **primary account owner** for now.

Future relationships are modeled separately.

Do not replace `dogs.owner_id` immediately.

Instead add, when needed:

```text
person_dog_relationships
```

This gives PawConnect a migration path without breaking current bookings, RLS, onboarding or dog ownership logic.

---

## Proposed relationship types

### owner

The primary legal / household owner represented in PawConnect.

Typical permissions:
- manage dog profile;
- control privacy;
- upload dog media;
- authorize relationships;
- manage services and bookings.

For the current system this is normally the same person as `dogs.owner_id`.

---

### co_owner

A second person who legitimately shares ownership or long-term responsibility.

Examples:
- partner;
- family member;
- formally shared ownership.

This role may later receive delegated permissions, but should not automatically have every permission of the primary owner.

---

### handler

The person who actually conducts the dog in training, sport or official activity.

Important principle:

**owner ≠ handler**

A dog can be owned by one person and handled by another.

This distinction is essential for:
- sport;
- events;
- results;
- practical evaluations;
- history of the binomio.

---

### trainer

A professional or instructor who works with the dog.

This relationship:
- does not imply ownership;
- does not automatically imply permanent access to private dog data;
- should have a start/end date;
- may originate from bookings, courses, stages or explicit owner authorization.

Future professional notes should belong to a separate domain such as:

```text
dog_professional_notes
```

Do not reuse `client_notes`.

---

### breeder

The breeder associated with the dog.

This may represent:
- breeder of origin;
- breeding organization/person;
- verified source of registry or litter information.

It is primarily historical/provenance information, not day-to-day management permission.

---

### caretaker

A person with temporary or recurring responsibility.

Examples:
- family member;
- pet sitter;
- boarding professional;
- trusted person.

This role should be time-bounded and permission-limited.

---

## Possible future roles

Do not add until a real use case exists, but the model can later support:

- `veterinarian`
- `groomer`
- `assistant_handler`
- `foster`
- `organization`

Professional access should normally be granted through explicit relationships and policies, not by adding every profession as an ownership role.

---

# Proposed table

Future conceptual schema:

```sql
person_dog_relationships (
  id uuid primary key,
  person_id uuid not null,
  dog_id uuid not null,
  relationship_type text not null,
  started_at timestamptz,
  ended_at timestamptz,
  is_primary boolean default false,
  verification_status text default 'self_declared',
  visibility text default 'private',
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Recommended constraints later:

```text
relationship_type:
owner
co_owner
handler
trainer
breeder
caretaker
```

Verification may use:

```text
self_declared
owner_confirmed
document_verified
issuer_verified
official
```

---

# The Binomio

A relationship row is not necessarily a "binomio".

The word **binomio** should be reserved for a person-dog pair that has a meaningful shared activity/history.

Examples:
- sport;
- training path;
- practical stage;
- official test;
- competition;
- long-term working relationship.

Possible future entity:

```text
dog_partnerships
```

Conceptual fields:

```text
id
person_id
dog_id
partnership_type
started_at
ended_at
primary_discipline_id
status
visibility
```

A partnership can then be referenced by:
- learning;
- sport entries;
- results;
- practical assessments;
- media;
- credentials.

This prevents us from calling every owner-dog relationship a sporting/training binomio.

---

# Current database mapping

## `dogs.owner_id`

Keep it.

Purpose today:
- primary owner;
- simple ownership;
- existing RLS;
- onboarding;
- bookings;
- dog photo path ownership.

Future:
- acts as canonical primary owner until relationship model is mature.

---

## `bookings.owner_id`

Keep it.

This is the customer/account responsible for the transaction.

It should not be reinterpreted as the only human related to the dog.

---

## `booking_dogs`

Keep it.

This is a good relational table:

```text
Booking ↔ Dog
```

It answers:
"Which dogs are part of this booking?"

It should not become the general person-dog relationship model.

---

## professional access

Professional dog access must remain contextual.

Examples:
- accepted/completed booking;
- explicitly authorized training relationship;
- future course/stage relationship.

A trainer relationship should not grant unlimited historical access forever.

---

# Permissions philosophy

The primary owner controls privacy by default.

Relationship does not automatically equal full access.

Future access should be scoped.

Examples:

### co_owner
May:
- view dog;
- possibly edit selected fields;
- participate in bookings.

### handler
May:
- see sport/training information;
- create activity records when authorized.

Should not automatically:
- see medical/private owner notes;
- change ownership;
- expose the dog publicly.

### trainer
May:
- see information necessary for the professional relationship;
- add professional observations if authorized.

Should not automatically:
- edit the owner's dog identity;
- change breed/registry;
- access unrelated private history.

### breeder
May:
- be displayed as origin/provenance;
- potentially verify litter/registry information.

Should not automatically:
- access current private data.

### caretaker
May:
- receive temporary operational information.

Access should expire with the relationship when appropriate.

---

# History matters

Do not overwrite relationships when they end.

Use:

```text
started_at
ended_at
```

This allows PawConnect to represent history.

Example:

```text
Dog: Ulf
2026–present: Luigi — owner
2027–present: Luigi — handler
2027–2028: Trainer X — trainer
2028: Event Y — handler Luigi
```

This becomes valuable later for:
- sport history;
- research;
- professional portfolios;
- dog history;
- verified results.

---

# Public profile philosophy

Public display must be much simpler than the underlying model.

Example dog profile:

```text
Ulf
German Shepherd Dog
FCI Group 1

Owner: Luigi
Handler: Luigi
Activities: Obedience
```

Professional relationships should appear only when:
- visibility allows it;
- the relationship is legitimate;
- both privacy and verification rules are satisfied.

The database may be rich.
The public profile should remain simple.

---

# What not to do

1. Do not replace `dogs.owner_id` now.
2. Do not add `trainer_id`, `handler_id`, `breeder_id`, `caretaker_id` columns to `dogs`.
3. Do not use `profiles.role` to encode person-dog relationships.
4. Do not make `booking_dogs` serve as the general relationship table.
5. Do not give a trainer permanent access merely because one booking existed.
6. Do not treat every relationship as public.
7. Do not call every owner-dog pair a "binomio" in the data model.
8. Do not destroy historical relationships when they end.
9. Do not mix credentials with relationships.
10. Do not infer official ownership from a self-declared relationship.

---

# Recommended implementation order

When this domain becomes necessary:

### Step 1
Create `person_dog_relationships`.

### Step 2
Backfill one `owner` relationship from every existing `dogs.owner_id`.

### Step 3
Keep `dogs.owner_id` as compatibility / primary-owner field.

### Step 4
Add explicit owner-managed relationship invitations/confirmation.

### Step 5
Introduce handler relationships when sport functionality begins.

### Step 6
Introduce trainer relationships when professional dog history/notes require them.

### Step 7
Only create `dog_partnerships` if a real binomio-specific feature needs its own identity.

---

# Decision

For PawConnect Core v1:

```text
Dog = persistent central entity
Primary owner = dogs.owner_id
All other human relationships = future person_dog_relationships
Binomio = meaningful person-dog partnership, not a synonym for ownership
```

This keeps the current product stable while allowing the future platform to represent real cynological relationships correctly.
