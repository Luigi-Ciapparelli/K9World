# Learning Core + Credential Wallet — PawConnect v1

> Design document only.  
> No database migration is applied by this document.

## Purpose

PawConnect Impara must become a real learning system, not a blog and not a game full of meaningless levels.

The learning engine should help people move from:

```text
I do not know this exists
→ I understand it
→ I can apply it
→ I can demonstrate it
```

At the same time, PawConnect must distinguish clearly between:

- learning completed inside PawConnect;
- an external course or certificate;
- a verified credential;
- an official qualification issued by an external body.

---

# 1. Learning philosophy

The visible progression should stay extremely simple.

Recommended public states:

```text
Da conoscere
Appreso
Verificato
```

Meaning:

### Da conoscere
The user has not yet completed the required learning activity.

### Appreso
The user has completed the educational content and demonstrated basic understanding.

### Verificato
The competence has been confirmed through a stronger mechanism.

Examples:
- supervised practical activity;
- verified external assessment;
- approved practical stage;
- official external test.

Not every lesson needs all three levels.

---

# 2. Gamification philosophy

Gamification is important, but it must never make PawConnect look childish.

Allowed:

- clear Stage progression;
- meaningful badges;
- medals for real milestones;
- completion streaks only if educationally useful;
- future e-store discounts or rewards tied to meaningful milestones;
- profile icon for important Stage achievements;
- progress indicators.

Avoid:

- dozens of visible levels;
- stars for professional quality;
- arbitrary leaderboards;
- fake ranks;
- points that become more important than learning;
- badges for trivial clicks.

XP may exist internally as a progression mechanic, but it does not need to dominate the interface.

---

# 3. Learning hierarchy

Canonical structure:

```text
Program
→ Stage
→ Module
→ Lesson
→ Activity
→ Verification
→ Award
```

## Program

Examples:

- PawConnect Fondamenta
- Future Sport Introduction
- Future Advanced Practice
- Country-specific preparation pathways

A Program may be global or country-specific.

## Stage

Large educational milestone.

Examples:
- Stage 1 — Fondamenta
- Stage 2 — Avvicinamento allo sport
- Stage 3 — Avanzato

## Module

A coherent area of knowledge.

Examples:
- bisogni;
- riposo;
- comunicazione;
- apprendimento;
- gruppi FCI;
- gestione degli spazi.

## Lesson

The primary educational unit.

A Lesson may include:
- text;
- images;
- diagrams;
- video;
- practical observations;
- source notes;
- references.

## Activity

Examples:
- reading;
- observation;
- reflection;
- quiz;
- practical exercise;
- upload;
- supervised stage.

## Verification

Determines whether a lesson/module/Stage can move from `appreso` to `verificato`.

## Award

A meaningful milestone:
- Stage completed;
- verified practical module;
- external official qualification;
- special educational path.

---

# 4. Suggested future tables

Do not create these yet until content and behavior are approved.

## `learning_programs`

Conceptual fields:

```text
id
code
title
description
country_scope nullable
status
created_at
updated_at
```

## `learning_stages`

```text
id
program_id
code
title
description
stage_number
order_index
status
```

## `learning_modules`

```text
id
stage_id
code
title
description
order_index
status
```

## `learning_lessons`

```text
id
module_id
slug
title
summary
content_version
status
source_status
estimated_minutes
order_index
published_at
updated_at
```

## `learning_activities`

```text
id
lesson_id
activity_type
title
instructions
completion_rule
required
order_index
```

Suggested `activity_type` values:

```text
reading
observation
reflection
quiz
practical
supervised_practical
external_test
```

## `learning_progress`

```text
person_id
lesson_id
state
started_at
learned_at
verified_at
verification_method
updated_at
```

Recommended `state` values:

```text
to_learn
learned
verified
```

## `learning_attempts`

For:
- quiz attempts;
- verification attempts;
- practical submissions.

Conceptual fields:

```text
id
person_id
activity_id
attempt_number
result
score nullable
submitted_at
reviewed_at
reviewed_by nullable
```

## `learning_stage_progress`

Optional derived/cache table later.

Do not create unless performance or reporting requires it.

Stage completion should ideally be derived from module/lesson requirements.

---

# 5. Lesson source governance

Each lesson needs an internal source status.

Recommended values:

```text
draft_notes
course_derived
needs_review
reviewed
published
```

This allows PawConnect to ingest course notes without presenting every note as authoritative truth.

Future lesson metadata may include:

```text
primary_source_type
primary_source_reference
reviewed_by
reviewed_at
content_version
```

Important:

A lesson may be educationally useful even if its source is a professional method, but method-specific claims should be clearly contextualized.

---

# 6. Stage completion

Do not define Stage completion as:

```text
opened all lessons
```

A Stage should complete only when required learning goals are satisfied.

Possible rule:

```text
all required lessons = learned
required practical activities = completed
required final verification = passed
```

Stage completion can generate a PawConnect achievement.

It must not automatically become an official qualification.

---

# 7. Credential Wallet

The Credential Wallet stores evidence of education, experience and official qualifications.

It is distinct from the learning engine.

A person may have:

- PawConnect learning achievements;
- external courses;
- professional certifications;
- official qualifications;
- seminar attendance;
- practical stages;
- sport titles.

---

# 8. Credential types

Recommended conceptual categories:

```text
pawconnect_completion
course_certificate
seminar_attendance
practical_stage
professional_qualification
official_test
sport_title
academic_qualification
other
```

---

# 9. Verification levels

Every credential must have a clear provenance.

Recommended levels:

```text
self_declared
document_verified
issuer_verified
pawconnect_completed
official_qualification
```

Meaning:

### self_declared
The user added the credential.

### document_verified
PawConnect or an authorized reviewer checked supporting documentation.

### issuer_verified
The issuing organization confirmed it.

### pawconnect_completed
The achievement was generated directly by the PawConnect learning system.

### official_qualification
The credential comes from a recognized external official body.

These states must be visually distinct.

---

# 10. Suggested future credential table

## `credentials`

Conceptual fields:

```text
id
person_id
credential_type
title
description
issuer_organization_id nullable
country_code nullable
issued_at
expires_at nullable
verification_level
verification_status
document_reference nullable
external_reference nullable
visibility
created_at
updated_at
```

Possible `verification_status` values:

```text
pending
verified
rejected
revoked
expired
```

---

# 11. Organizations and issuers

Credentials should point to `organizations`.

Examples:
- ENCI;
- training provider;
- university;
- canine club;
- event organizer;
- federation.

Never store important issuers only as free text once the Organization Core exists.

Free text may be accepted temporarily for self-declared credentials, then reconciled later.

---

# 12. Public profile display

Public profile must remain simple.

Example owner:

```text
PawConnect Stage 1 — Fondamenta
Completed

Practical verification
Not yet completed
```

Example professional:

```text
ENCI Dog Trainer
Official qualification

Seminar X
Issuer verified

PawConnect Stage 1
PawConnect completed
```

The user should understand the difference immediately.

---

# 13. Badge philosophy

Badges should represent real milestones, not activity noise.

Good badges:

- Stage 1 completed;
- practical handling module verified;
- responsible puppy choice path completed;
- first official qualification verified;
- first sport result verified.

Bad badges:

- opened 5 pages;
- logged in 7 times;
- read 3 paragraphs;
- clicked a button.

---

# 14. Rewards

Future rewards may include:

- e-store discount;
- event access;
- merchandise;
- early access to content;
- partner benefits.

Rewards should be attached to meaningful achievements.

Example:

```text
Stage 1 completed
→ unlock 5% education-related shop discount
```

The reward is commercial.

The achievement remains educational.

Do not merge these concepts in the data model.

---

# 15. Country-specific official paths

The learning system must support country-specific final paths.

Example Italy:

```text
PawConnect education
→ practical preparation
→ external ENCI pathway/test
```

PawConnect can prepare the user.

The external organization issues the official qualification.

Other countries may connect to different organizations and tests.

---

# 16. Free vs paid

Core principle:

```text
fundamental cynological education = free
```

Possible paid areas later:

- supervised practical stages;
- advanced sport stages;
- professional-level training;
- certification review services;
- premium professional tools.

The free learning path must remain genuinely useful, not a teaser.

---

# 17. Migration from current prototype

Current state:

```text
src/lib/imparaContent.ts
localStorage progress
3 prototype lessons
```

Recommended transition:

### Phase 1
Keep content in repository while validating UX and syllabus.

### Phase 2
Create Learning Core tables only after the lesson model and completion rules stabilize.

### Phase 3
Move user progress from localStorage to authenticated account storage.

### Phase 4
Keep optional anonymous/local progress for users who are not registered.

### Phase 5
Introduce credentials and practical verification.

Do not migrate content into the database merely because a database exists.

---

# 18. What not to do

1. Do not create one giant `user_level` integer.
2. Do not create a `stars` field for competence.
3. Do not equate lesson completion with practical competence.
4. Do not equate PawConnect achievements with official qualifications.
5. Do not create dozens of badge tables before real badge rules exist.
6. Do not store credentials as plain profile text.
7. Do not let users mark official qualifications as verified by themselves.
8. Do not expose private documents publicly.
9. Do not couple learning progress to commerce.
10. Do not design Stage 2/3 in detail before real educational content exists.

---

# 19. First real implementation milestone

The first production-grade Learning milestone should eventually support:

```text
Stage 1
→ Module
→ Lesson
→ Activity
→ learned state
→ simple final verification
→ meaningful Stage completion
```

Only after this works well should PawConnect add:

```text
practical verification
credential wallet
official external paths
rewards
```

---

# 20. Decision

For PawConnect Core v1:

```text
Learning tells us what a person has learned.
Verification tells us what has been demonstrated.
Credentials tell us what has been awarded or recognized.
Official qualifications tell us what an external authority has formally certified.
```

These four concepts must never be collapsed into one field.
