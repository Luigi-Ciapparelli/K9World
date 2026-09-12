# AI Continuity Protocol

This repository must be sufficient for a new ChatGPT account, developer or collaborator to reconstruct both:

1. what PawConnect is meant to become;
2. what has actually been implemented.

No prior ChatGPT conversation should be required.

## Mandatory read order

1. `START_HERE.md`
2. `docs/CURRENT_STATE.md`
3. `docs/PROJECT_HANDOFF.md`
4. `docs/PAWCONNECT_CORE_BLUEPRINT.md`
5. `docs/PAWCONNECT_CORE_DATA_MODEL.md`
6. `docs/PERSON_DOG_RELATIONSHIPS.md`
7. `docs/LEARNING_CREDENTIAL_CORE.md`

## Sources of truth

For implemented reality:
- current source code;
- current Git history;
- current Supabase migration history;
- `docs/CURRENT_STATE.md`.

For product intent and architecture:
- `docs/PROJECT_HANDOFF.md`;
- the blueprint documents under `docs/`.

Blueprints may describe planned functionality that is not implemented yet.

## Required continuity routine

After every meaningful checkpoint:

```bash
python3 scripts/update_project_state.py
git add docs/CURRENT_STATE.md
git commit -m "Update project state snapshot"
```

If the checkpoint changes product direction, architecture, security rules or roadmap, update the relevant handoff/blueprint document before regenerating the snapshot.

## Rules for a future AI assistant

A future AI assistant must:

1. read the mandatory documents;
2. inspect `docs/CURRENT_STATE.md`;
3. inspect current Git state;
4. inspect relevant source files before editing;
5. inspect Supabase migration history before creating migrations;
6. never rewrite applied migrations;
7. never assume a blueprint feature is already implemented;
8. update continuity docs when a major decision changes;
9. preserve the distinction between planned architecture, implemented code, implemented database state and unresolved decisions.

## What must never live only in chat

The following must be written into the repository when decided:

- product principles;
- architectural decisions;
- security constraints;
- migration caveats;
- naming/branding strategy;
- learning model;
- credential model;
- person-dog relationship model;
- country/global strategy;
- major roadmap changes;
- known technical debt;
- irreversible or high-cost decisions.

## Guarantee boundary

This continuity system is complete only if the repository itself is kept current.

Uncommitted work, local files outside the repository, secrets, unpublished notes and decisions discussed only in chat cannot be reconstructed automatically.

Therefore:

> If it matters to PawConnect's future, it must be committed to the repository.

## Professional continuity and media

Mandatory additional reading before work on professional notes, dog history or media: [Professional continuity and media](PROFESSIONAL_CONTINUITY_MEDIA.md). Preserve the distinction between approved direction, technical proposals and implemented behavior.
