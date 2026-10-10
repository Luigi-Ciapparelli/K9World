# PortaleCinofilo — passaggio di consegne

9 ottobre 2026. Leggere prima [CURRENT_STATE](CURRENT_STATE.md) e
[PRODUCT_DIRECTION](PRODUCT_DIRECTION.md). Questo documento spiega come lavorare;
lo stato e l'ordine delle priorità non sono duplicati qui.

## Identità e ambiente

| Voce | Riferimento |
| --- | --- |
| Prodotto italiano | PortaleCinofilo |
| Repository / ramo remoto di riferimento | `Luigi-Ciapparelli/K9World`, `main` |
| Sito principale | `https://www.portalecinofilo.com` |
| Alias .it | Reindirizzamento al .com osservato nel controllo dell'8 ottobre; non è un secondo prodotto |
| Stack | React, TypeScript, Vite, Tailwind; Supabase Postgres/Auth/Storage/RPC; frontend Vercel |
| Supabase project ref | `tyuptbiqqhkhfsikdaeq` — identificativo pubblico, non credenziale |
| Terminale di Luigi | WSL Ubuntu, prompt `luigi@…:~/K9World$`, repository `~/K9World` |
| Download Windows da WSL | `/mnt/c/Users/Lugi/Downloads/` |
| Contatto pubblico | `info@portalecinofilo.com`, `+39 353 407 7841` |

Non confondere il titolo della finestra PowerShell con la shell attiva: il prompt
`luigi@…$` richiede comandi bash; `PS C:\…>` richiede PowerShell. Preferire un
blocco breve per il terminale già aperto, senza prompt copiati. I file scaricati
possono avere suffissi `(1)`: usare il nome effettivo, non presumere il percorso.

Il router supporta URL pubblici leggibili e compatibilità con i vecchi hash.
Destinazioni per ruolo: `/owner`, `/pro`, `/admin`. Non usare un account admin
per dedurre che manchino i cani o gli inviti dell'interfaccia proprietario.

## Regole operative

- Leggere file e stato Git reali prima di proporre correzioni. Se la schermata
  non coincide col codice, controllare server/processo/versione servita; non
  mandare Luigi a cercare pulsanti senza evidenza. Preferire diagnosi da WSL
  alla console browser quando richiesto.
- Preservare modifiche estranee e staging. Commit con percorsi espliciti;
  niente reset distruttivi, force push o stash applicati alla cieca.
- Non accumulare settimane di codice locale: chiudere incrementi piccoli con
  test pertinenti, commit remoto e stato rilascio. Un problema segnalato prevale
  sullo sviluppo di nuove funzioni non collegate.
- Rispettare le autorizzazioni già date senza chiederle nuovamente. Una proposta
  di roadmap non autorizza da sola spese, inviti, pubblicazioni o acquisti.
- Non inviare email/WhatsApp/social per il solo fatto che esista una bozza.
  Non pubblicare contatti privati, token, dati di clienti o dettagli finanziari personali.
- La ZIP esplicitamente esclusa da Luigi non va letta finché non lo richiede.
- Non chiedere una nuova descrizione completa del progetto: usare i documenti
  e chiedere solo i dati specifici che mancano al blocco in corso.

## Sicurezza, dati e rilascio

Database/RLS/RPC impongono l'accesso; un pulsante nascosto o un guard React non
sostituiscono i permessi. Usare proiezioni pubbliche autorizzate; coordinate
precise, foto dei cani, documenti e note private non diventano pubblici.
Gli asset destinati al profilo pubblico hanno un perimetro distinto.
Conservare il confine `pc_private`, gli aggregati controllati dal server e il
caricamento lazy delle pagine. Nessun `npm audit fix --force` come scorciatoia.

Non modificare, rinominare o eliminare migration già applicate, incluse quelle
vuote `20260911010021` e `20260911023829`. Prima di un nuovo cambiamento SQL
controllare storia locale/remota e migration eventualmente già preparate.
Una proposta in `docs/proposals` non si applica automaticamente.
Per rilasci con database: verificare il dry-run, pubblicare il cambiamento
compatibile prima del frontend, registrare l'esito senza confonderlo con il push Git.

La continuità usa `VITE_PROFESSIONAL_CONTINUITY=true` al build; deve essere
coerente con il backend. L'avvio locale temporaneo non aggiorna Vercel.
La modalità SMS corrente è disattivata: non abilitarla o acquistare Twilio
per rifare una verifica email. Usare i documenti recapiti per il flusso effettivo.

## Mappa delle specifiche

| Lavoro | Documenti da leggere |
| --- | --- |
| Home e navigazione | [HOME_PORTAL_V1](HOME_PORTAL_V1.md), [EXHIBITIONS_RELEASE_V1](EXHIBITIONS_RELEASE_V1.md) |
| Impara e scelta del cane | [REX_CLICKER_V1](REX_CLICKER_V1.md), [IMPARA_LESSON_ORDER_V1](IMPARA_LESSON_ORDER_V1.md), [IMPARA_RELEASE_V3](IMPARA_RELEASE_V3.md), [IMPARA_SHAPING_V1](IMPARA_SHAPING_V1.md), [LEARNING_CREDENTIAL_CORE](LEARNING_CREDENTIAL_CORE.md) |
| Profilo e strumenti | [PROFESSIONAL_GUIDED_WORKSPACE_V1](PROFESSIONAL_GUIDED_WORKSPACE_V1.md), [PROFESSIONAL_OPERATIONS_NEXT](PROFESSIONAL_OPERATIONS_NEXT.md) |
| Foto dei profili | [PROFILE_IMAGES_V1](PROFILE_IMAGES_V1.md): pubblico professionale, privato cliente, limiti e rilascio |
| Calendario / messaggi | [PROFESSIONAL_CALENDAR_V1](PROFESSIONAL_CALENDAR_V1.md), [BOOKING_MESSAGES_V1](BOOKING_MESSAGES_V1.md) |
| Pacchetti / abbonamenti | [PROFESSIONAL_PASSES_V1](PROFESSIONAL_PASSES_V1.md), [PROFESSIONAL_SUBSCRIPTIONS_V1](PROFESSIONAL_SUBSCRIPTIONS_V1.md) |
| Archivio e media | [PROFESSIONAL_CONTINUITY_MEDIA](PROFESSIONAL_CONTINUITY_MEDIA.md), [CONTINUITY_SHARING_V1](CONTINUITY_SHARING_V1.md), [DOG_HISTORY_EXPORT_V1](DOG_HISTORY_EXPORT_V1.md) |
| Valutazioni | [SERVICE_REVIEWS_V1](SERVICE_REVIEWS_V1.md) |
| Sport / Working-Dog | [SPORT_SEARCH_AND_WORKING_DOG_V1](SPORT_SEARCH_AND_WORKING_DOG_V1.md), [SPORT_MERIT_AND_VERIFICATION_V2](SPORT_MERIT_AND_VERIFICATION_V2.md) |
| Accesso e recapiti | [ACCOUNT_CONTACTS_V1](ACCOUNT_CONTACTS_V1.md), [PASSWORD_RECOVERY_V1](PASSWORD_RECOVERY_V1.md), [BOOKING_ENTRY_V1](BOOKING_ENTRY_V1.md) |
| API e sicurezza | [SUPABASE_PRIVATE_API_V2](SUPABASE_PRIVATE_API_V2.md), [SUPABASE_AUDIT_FIXES_V1](SUPABASE_AUDIT_FIXES_V1.md) |
| SEO / disponibilità / mercati | [SEO_INDEXATION_2026_10_09](SEO_INDEXATION_2026_10_09.md), [BREED_GUIDES_V1](BREED_GUIDES_V1.md), [SEO_VISIBILITY_V1](SEO_VISIBILITY_V1.md), [INTERNATIONAL_SEO_AND_HOSTING_V1](INTERNATIONAL_SEO_AND_HOSTING_V1.md) |
| Lancio / social / ricavi | [LAUNCH_READINESS_V1](LAUNCH_READINESS_V1.md), [FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10](FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md), [BUSINESS_ROADMAP_V1](BUSINESS_ROADMAP_V1.md), [FUNDING_SCREENING_2026_10](FUNDING_SCREENING_2026_10.md) |

Le sezioni «rilascio» delle specifiche sono istruzioni e resoconti datati: per
sapere se siano ancora da eseguire leggere il registro corrente. Non reinterpretare
le indicazioni storiche «solo documentazione» come un divieto contro incarichi
successivi già autorizzati.

## Architettura di lungo periodo conservata

[Blueprint](PAWCONNECT_CORE_BLUEPRINT.md), [modello dati](PAWCONNECT_CORE_DATA_MODEL.md),
[relazioni persona–cane](PERSON_DOG_RELATIONSHIPS.md) e
[learning/credenziali](LEARNING_CREDENTIAL_CORE.md) restano riferimenti di progetto.
Descrivono anche capacità future, non soltanto schema già esistente.

Core globale e configurazione locale: persona, cane, binomio, organizzazione,
apprendimento, credenziale, sport, media, editoria, ricerca e commercio. Non
hardcodare ENCI come ente mondiale e non aggiungere tutti i domini alla tabella
`dogs`. Ricerca su dataset derivati e autorizzati, mai apertura del database
operativo. PawConnect è nome storico/candidato internazionale, non marchio
già scelto o verificato. La [direzione corrente](PRODUCT_DIRECTION.md) risolve
le decisioni più recenti che superano formulazioni dei primi blueprint.

## Cosa deve sopravvivere al cambio di account

Missione, decisioni, riferimenti di codice, prove e limiti sono nel repository.
La cronologia precedente è indicizzata in [PROJECT_HISTORY](PROJECT_HISTORY.md).
Password, sessioni, pagamenti, file esterni esclusi e bozze non committate non
si trasferiscono con questo handoff. Una nuova AI deve dichiarare eventuali
limiti di accesso, senza inventare verifiche o chiedere da capo tutta la visione.
