# AI Continuity Protocol

## Storico del cane scaricabile — 8 ottobre 2026

EXP-01 implementato sulla base remota `7f11610`: esportazione proprietario,
archivio dell'autore per relazione e selezioni autorizzate del destinatario.
Documento HTML stampabile in PDF e JSON, foto privata opzionale per il proprietario,
ricontrollo alla consegna, segnalazione delle omissioni e limiti espliciti.
Specifiche e rilascio: [DOG_HISTORY_EXPORT_V1.md](DOG_HISTORY_EXPORT_V1.md).

Ricerca/Esposizioni risultano su GitHub in `7f11610`. Questo nuovo incremento
è verificato localmente, ancora da pubblicare dal repository WSL con l'installer.
Nessun database online, account, campagna o nuovo deployment modificato qui.
La prosecuzione richiesta da Luigi autorizza l'implementazione di EXP-01 e supera
il precedente limite «solo documentazione» per questo blocco. Le recensioni
reciproche rimangono successive, con le decisioni aperte già registrate.

## Ordine operativo e stato delle prove — 8 ottobre 2026

Usare [EXECUTION_PRIORITIES_2026_10.md](EXECUTION_PRIORITIES_2026_10.md) come indice
del lavoro successivo. Non confondere un requisito approvato con una funzione
online, un test locale con una prova del servizio o un calendario proposto con
contenuti già pubblicati. Il piano su mercati/SEO/hosting è remoto in `821f4de`.

I vecchi backlog di settembre sono storici dove superati: calendario, messaggi,
pacchetti e abbonamenti hanno incrementi successivi, da leggere prima di agire.
Un dato mancante blocca il lavoro che ne dipende, non ogni attività del progetto.
Le nuove direttive restano documentazione; implementazione, produzione video,
spese e invii non sono eseguiti né implicitamente attivati dal piano.

## Internazionalizzazione, SEO e hosting — 8 ottobre 2026

Leggere [INTERNATIONAL_SEO_AND_HOSTING_V1.md](INTERNATIONAL_SEO_AND_HOSTING_V1.md)
prima di proporre nuovi domini, lingue, piani hosting o interventi di indicizzazione.
Distinguere raccomandazione dell'assistente, decisione di Luigi e azione eseguita.
Non trattare PawConnect come marchio disponibile o già scelto.

La base remota `5c96a79` contiene le direttive future precedenti. Il controllo HTTP
odierno non attesta il funzionamento di tutti i flussi, l'indicizzazione Google o
la causa del downtime. Gli URL Search Console interessati non sono ancora forniti.
Non promettere di risolvere l'indicizzazione acquistando potenza o un altro dominio.
In questa fase soltanto documentazione e letture pubbliche; snapshot tecnico
aggiornato manualmente, senza build, SQL o generatore di stato. ZIP non letta.

## Direzione futura del 7 ottobre, registrata l'8 ottobre 2026

Prima di toccare ricerca, social, esportazioni o recensioni leggere
[FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md](FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md).
Questo checkpoint autorizza soltanto documentazione su GitHub. Non implementare,
generare contenuti, spendere o pubblicare sui social fino a una nuova istruzione.
La ZIP allegata è esclusa e non va usata come fonte per questo aggiornamento.
Le nuove categorie prevalgono sulle precedenti indicazioni di offerta; conservare
lo storico e i permessi degli archivi. Il concept video non riapre la scelta di
una home animata. Distinguere riscontro social di Luigi, dati misurati e ipotesi.
Il checkpoint CURRENT_STATE è aggiornato manualmente per la sola documentazione:
non eseguire il generatore di build/diagnosi online in questo intervento.

## Impresa e comunicazione — regola introdotta il 6 ottobre 2026

Prima di proporre monetizzazione, finanziamenti o rete di centri leggere:
`BUSINESS_ROADMAP_V1.md`, `FUNDING_SCREENING_2026_10.md` e
`SOCIAL_LAUNCH_30_DAYS_V1.md`. Separare sempre decisioni di Luigi, ipotesi
commerciali, funzioni rilasciate, risultati misurati e domande approvate.
Rileggere fonti ufficiali per stato dei bandi e requisiti prima di suggerire
aperture, pagamenti o impegni. Un massimale non è un contributo ottenuto.
La documentazione pubblica non deve contenere redditi, stato occupazionale
dettagliato, documenti fiscali, elenchi privati di contatti o credenziali.
I piani non costituiscono autorizzazione a inviare comunicazioni o spendere.
La formazione di base e la ricerca restano gratuite; nessun pagamento compra
merito o approvazione; nuove offerte richiedono adesione esplicita.

## Recapiti — regola introdotta il 30 settembre 2026

Prima di modificare verifica, email o telefono leggere `ACCOUNT_CONTACTS_V1.md`.
Non confondere `auth.users.email_confirmed_at` con prova di ricezione quando
Auth usa autoconferma. Non ripristinare codici di sviluppo o scritture dirette
dei flag. Il cambio recapito deve rispettare la conferma dell'altro recapito
verificato e del nuovo, anche lato server. Registrare separatamente configurazione
SMTP/SMS, migration, funzioni Edge, frontend e collaudo reale.

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

<!-- sport-search-and-working-dog-v1 -->

## Regola per la ricerca sportiva e i badge

Non trattare IGP come priorità universale. Il percorso normale del proprietario
deve portare direttamente alla ricerca per gestione quotidiana del cane, senza
chiedergli di scegliere tra gestione e sport e senza aggiungere click. **Sport
cinofili** è una sezione autonoma nel menu e nella Home; la disciplina si sceglie
solo al suo interno. Il professionista controlla la visibilità con due selettori
indipendenti. Working-Dog, badge e ranking sono per disciplina, con fonte,
versione e audit propri. Dati ambigui restano in revisione. Vedi
`docs/SPORT_SEARCH_AND_WORKING_DOG_V1.md` prima di proporre codice o SQL.


<!-- sport-search-owner-ux-v2 -->
