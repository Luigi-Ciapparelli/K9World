# PortaleCinofilo — passaggio di consegne

20 ottobre 2026. Leggere prima [CURRENT_STATE](CURRENT_STATE.md) e
[PRODUCT_DIRECTION](PRODUCT_DIRECTION.md). Questo documento spiega come lavorare;
lo stato e l'ordine delle priorità non sono duplicati qui.

Email sospese su richiesta esplicita. Elenco, agenda, account, assenze anche orarie,
completamento, messaggi, [note attribuite](CENTRE_LESSON_NOTES_V1.md) e
[turni settimanali](INSTRUCTOR_WEEKLY_SHIFTS_V1.md) sono su GitHub (`10163b9`).
Anche [CENTRE_AGENDA_DELEGATION_V1](CENTRE_AGENDA_DELEGATION_V1.md) è su GitHub
(`3b62ddd`): coordinamento revocabile con minimo accesso e autore reale.
Anche [PROFESSIONAL_ANALYTICS_V1](PROFESSIONAL_ANALYTICS_V1.md) è su GitHub (`216c760`).
Anche [PROFESSIONAL_CLIENTS_V2](PROFESSIONAL_CLIENTS_V2.md) è su GitHub (`f79320f`).
Anche [SITE_HELP_V1](SITE_HELP_V1.md) è su GitHub (`eb21b04`).
Anche [ACCOUNT_STATE_RECOVERY_V1](ACCOUNT_STATE_RECOVERY_V1.md) è su GitHub (`f3e8aa2`).
Anche [BOOKING_DETAILS_V1](BOOKING_DETAILS_V1.md) è su GitHub (`24aa9a4`).
Anche [LESSON_RECORDING_V1](LESSON_RECORDING_V1.md) è su GitHub (`3ca2e4c`).
Anche [CONTINUITY_RECORDING_RECOVERY_V1](CONTINUITY_RECORDING_RECOVERY_V1.md)
è su GitHub (`9ed53bc`). Anche [CONTINUITY_ACCESS_RECOVERY_V1](CONTINUITY_ACCESS_RECOVERY_V1.md)
è su GitHub (`7155fb9`). Anche [PROFESSIONAL_APPROVAL_V1](PROFESSIONAL_APPROVAL_V1.md)
è su GitHub (`ff529e9`). Incremento corrente: [SERVICE_REVIEW_RECOVERY_V1](SERVICE_REVIEW_RECOVERY_V1.md),
recupero delle valutazioni con esito incerto, tracciato nella PR #1.
Le prove sono eseguite da GitHub Actions; non serve un nuovo installer WSL.
Rilascio soltanto frontend. Dipendenze da analizzare come prossimo blocco SEC-03.
La persona deve già essere collegata al centro; non si condividono credenziali.
Segreteria generale e altre azioni amministrative non sono incluse.
[WORKING_DOG_IDENTITY_V1](WORKING_DOG_IDENTITY_V1.md) è su GitHub (`8a482aa`);
il flag della verifica automatica resta spento fino alla prova sulla fonte reale.

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
| Ricerca addestratori / ENCI | [TRAINER_SPECIALIZATIONS_V1](TRAINER_SPECIALIZATIONS_V1.md); ricerca diretta, attività e qualifiche distinte |
| Sessione e recupero del profilo | [ACCOUNT_STATE_RECOVERY_V1](ACCOUNT_STATE_RECOVERY_V1.md) |
| Aiuto e orientamento | [SITE_HELP_V1](SITE_HELP_V1.md), guida locale per ruolo e link reali |
| Home e navigazione | [HOME_PORTAL_V1](HOME_PORTAL_V1.md), [EXHIBITIONS_RELEASE_V1](EXHIBITIONS_RELEASE_V1.md) |
| Impara e scelta del cane | [REX_CLICKER_V1](REX_CLICKER_V1.md), [IMPARA_LESSON_ORDER_V1](IMPARA_LESSON_ORDER_V1.md), [IMPARA_RELEASE_V3](IMPARA_RELEASE_V3.md), [IMPARA_SHAPING_V1](IMPARA_SHAPING_V1.md), [LEARNING_CREDENTIAL_CORE](LEARNING_CREDENTIAL_CORE.md) |
| Profilo e strumenti | [PROFESSIONAL_GUIDED_WORKSPACE_V1](PROFESSIONAL_GUIDED_WORKSPACE_V1.md), [PROFESSIONAL_OPERATIONS_NEXT](PROFESSIONAL_OPERATIONS_NEXT.md) |
| Foto dei profili | [PROFILE_IMAGES_V1](PROFILE_IMAGES_V1.md): pubblico professionale, privato cliente; [PHOTO_UPLOAD_OPTIMIZATION_V1](PHOTO_UPLOAD_OPTIMIZATION_V1.md): foto cani, anteprime, cache e rilascio |
| Istruttori dei centri | [CENTRE_INSTRUCTORS_V1](CENTRE_INSTRUCTORS_V1.md), [CENTRE_CALENDAR_V1](CENTRE_CALENDAR_V1.md): nomi storici, filtri e conferme; [account/agenda](CENTRE_MEMBERSHIPS_V1.md), [assenze](INSTRUCTOR_TIME_OFF_V1.md), [fasce orarie](INSTRUCTOR_HOURLY_TIME_OFF_V1.md) e [delega di completamento](CENTRE_LESSON_PERMISSIONS_V1.md); [messaggi delegati](CENTRE_INSTRUCTOR_MESSAGES_V1.md) |
| Calendario / messaggi | [PROFESSIONAL_CALENDAR_V1](PROFESSIONAL_CALENDAR_V1.md), [BOOKING_MESSAGES_V1](BOOKING_MESSAGES_V1.md) |
| Richieste e dettagli prenotazioni | [BOOKING_DETAILS_V1](BOOKING_DETAILS_V1.md): servizio storico dove registrato, cane, orari italiani e annullamento recuperabile |
| Pacchetti / abbonamenti | [PROFESSIONAL_PASSES_V1](PROFESSIONAL_PASSES_V1.md), [PROFESSIONAL_SUBSCRIPTIONS_V1](PROFESSIONAL_SUBSCRIPTIONS_V1.md), [recupero registro lezioni](LESSON_RECORDING_V1.md) |
| Archivio e media | [PROFESSIONAL_CONTINUITY_MEDIA](PROFESSIONAL_CONTINUITY_MEDIA.md), [CONTINUITY_SHARING_V1](CONTINUITY_SHARING_V1.md), [DOG_HISTORY_EXPORT_V1](DOG_HISTORY_EXPORT_V1.md) |
| Valutazioni | [SERVICE_REVIEWS_V2](SERVICE_REVIEWS_V2.md): singola prestazione, non persona/struttura; [recupero invii](SERVICE_REVIEW_RECOVERY_V1.md); V1 solo storico |
| Approvazione dei profili | [PROFESSIONAL_APPROVAL_V1](PROFESSIONAL_APPROVAL_V1.md): annullamento, note correnti e controllo esito; separato dalla verifica delle credenziali |
| Integrità credenziali | [CREDENTIAL_VERIFICATION_INTEGRITY_V1](CREDENTIAL_VERIFICATION_INTEGRITY_V1.md); revisione, concorrenza, storico privato e rilascio coordinato |
| Sport / Working-Dog | [SPORT_SEARCH_AND_WORKING_DOG_V1](SPORT_SEARCH_AND_WORKING_DOG_V1.md), [SPORT_MERIT_AND_VERIFICATION_V2](SPORT_MERIT_AND_VERIFICATION_V2.md) |
| Accesso e recapiti | [ACCOUNT_CONTACTS_V1](ACCOUNT_CONTACTS_V1.md), [PASSWORD_RECOVERY_V1](PASSWORD_RECOVERY_V1.md), [BOOKING_ENTRY_V1](BOOKING_ENTRY_V1.md) |
| Foglio inviti e privacy | [PROFESSIONAL_CONTACT_INVITATIONS_V1](PROFESSIONAL_CONTACT_INVITATIONS_V1.md): mittente e risposte già provati; registro privato, autorizzazioni e collegamento dell'informativa |
| Clienti e cani | [PROFESSIONAL_CLIENTS_V2](PROFESSIONAL_CLIENTS_V2.md): note private affidabili, ricerca e schede |
| Statistiche professionali | [PROFESSIONAL_ANALYTICS_V1](PROFESSIONAL_ANALYTICS_V1.md): aggregati privati, periodo italiano, clienti tornati e valore dei servizi |
| API e sicurezza | [SUPABASE_PRIVATE_API_V2](SUPABASE_PRIVATE_API_V2.md), [SUPABASE_AUDIT_FIXES_V1](SUPABASE_AUDIT_FIXES_V1.md) |
| Recupero errori frontend | [PAGE_RECOVERY_V1](PAGE_RECOVERY_V1.md): pagine mancanti/in errore, offline, bozze, prove e limiti |
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
