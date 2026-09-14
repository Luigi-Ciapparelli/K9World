# START HERE — PawConnect / Portalecinofilo

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
