# CURRENT STATE — PawConnect / Portalecinofilo

## Checkpoint esclusivamente documentale — 8 ottobre 2026

Base remota letta: `5edfd4c` su `origin/main`. Direttive future aggiunte in
[FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md](FUTURE_PRODUCT_AND_SOCIAL_DIRECTION_2026_10.md)
e collegate ai documenti di continuità. Ricerca a due categorie, area Esposizioni,
export completo autorizzato, nuove valutazioni e campagna Higgsfield sono requisiti
futuri; questa modifica non ne attesta l'implementazione o il rilascio.

Riscontro utente: primi tre post pubblicati; visualizzazioni soltanto su TikTok,
senza conteggi o attribuzione dettagliata dei post. ZIP esclusa e non letta.
Nessuna modifica a codice, database o account; nessuna generazione o pubblicazione
social. Verifica limitata a diff e coerenza/rimandi dei documenti. Nessun nuovo
test applicativo, accesso Supabase o deploy avviato manualmente. Lo snapshot
tecnico sottostante resta storico e non è stato rigenerato.

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

## Checkpoint UI manuale — 28 settembre 2026

Revisione Home/navigazione su base GitHub `ff721ce`. Codice, criteri e verifiche:
[HOME_NAVIGATION_V2.md](HOME_NAVIGATION_V2.md). TypeScript, build, ESLint mirato
e prove browser isolate superati. Nessuna migrazione introdotta o eseguita.
Lo snapshot automatico seguente è precedente a questo incremento; la sua
storia migrazioni non è stata riletta online durante la revisione frontend.
Deployment del nuovo frontend da identificare prima di dichiararlo Ready.

> Auto-generated repository snapshot. Generated: `2026-09-28T16:39:13+02:00`

This file records the **implemented state**, not future plans.
If it conflicts with code, Git history or migrations, inspect the repository directly and regenerate it.

## Current branch

Command:

```bash
git branch --show-current
```

Exit code: `0`

```text
main
```

## Working tree

Command:

```bash
git status --short
```

Exit code: `0`

```text
M START_HERE.md
 M docs/CURRENT_STATE.md
 M docs/PROFESSIONAL_OPERATIONS_NEXT.md
 M docs/PROJECT_HANDOFF.md
 M src/App.tsx
 M src/components/PassDialogs.tsx
 M src/pages/owner/OwnerDashboard.tsx
 M src/pages/pro/ProLayout.tsx
 M supabase/.temp/cli-latest
?? docs/PROFESSIONAL_SUBSCRIPTIONS_V1.md
?? scripts/tests/__pycache__/
?? scripts/tests/professional_subscriptions_assertions.sql
?? scripts/tests/test_professional_subscriptions.py
?? scripts/tests/test_professional_subscriptions_ui.mjs
?? src/components/SubscriptionDialogs.tsx
?? src/lib/professionalSubscriptions.ts
?? src/pages/SubscriptionsPage.tsx
?? supabase/migrations/20260928120000_professional_subscriptions.sql
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
f7d94f4 (HEAD -> main, origin/main, origin/HEAD) Restore professional lesson packages and secure API boundary
db2e010 Record applied Supabase privilege and RLS fixes
5725b5e Teach shaping with platform timing lab and learning foundations
1e8cbb3 Restore Impara lessons activities progress and timing lab
fa43378 Add discipline-specific sport merit verification foundation
8d1baf9 Separate canine sports search and professional visibility
f8d4766 Clarify separate sports search experience
1559768 Define discipline-based professional search and merit
bae0798 Use official PortaleCinofilo contact email
3adcf5d Add public contact phone and remove unused import
f1966ae (origin/mvp-acquisition-01, mvp-acquisition-01) Turn professional signup into MVP acquisition landing
54caa74 (origin/mvp-launch-legal-brand, mvp-launch-legal-brand) Prepare MVP legal and brand launch foundation
378b230 (origin/ecosystem-pass-v1, ecosystem-pass-v1) Add professional merit and Working-Dog verification
5f1ee90 Document PortaleCinofilo product direction
6cc448a (origin/signup-dog-profile, signup-dog-profile) Add selected professional continuity sharing and revocable access
82eb5ac (backup-production-before-sharing-20260914112404) Add private booking messages and automatic professional replies
a712352 (backup-production-before-booking-messages) Add professional calendar service colors and unavailability
427ff8d (backup-production-before-calendar-v1) Add private professional continuity and invitation flow
6d69285 Add continuity integration tests against complete migration history
019d2a9 Add concurrent continuity RPC regression tests
7c59e2a Add tested private professional session and note RPC proposal
9d5f44e Add tested professional relationship RPC proposal
51e85da Add isolated continuity schema regression test
438c550 Propose private professional sessions and archive schema
5ef4903 Define professional archive dog continuity and private media architecture
9b23833 (backup-production-before-427ff8d) Update project state after booking fixes
1ce28af Fix professional booking names notes and request priority
a8414f3 Polish professional profile and booking request modal
bbc2231 (backup-production-before-booking-fixes) Update project state snapshot
a2edde0 Refine professional dashboard and booking actions
```

## Supabase migration history

Command:

```bash
npx supabase migration list
```

Exit code: `0`

```text
Local            | Remote           | Time (UTC)
  ------------------|------------------|-----------------------
   `20260417230919` | `20260417230919` | `2026-04-17 23:09:19`
   `20260417233753` | `20260417233753` | `2026-04-17 23:37:53`
   `20260504163000` | `20260504163000` | `2026-05-04 16:30:00`
   `20260504170000` | `20260504170000` | `2026-05-04 17:00:00`
   `20260504230000` | `20260504230000` | `2026-05-04 23:00:00`
   `20260506120000` | `20260506120000` | `2026-05-06 12:00:00`
   `20260506130000` | `20260506130000` | `2026-05-06 13:00:00`
   `20260506133000` | `20260506133000` | `2026-05-06 13:30:00`
   `20260512223000` | `20260512223000` | `2026-05-12 22:30:00`
   `20260909003000` | `20260909003000` | `2026-09-09 00:30:00`
   `20260909014500` | `20260909014500` | `2026-09-09 01:45:00`
   `20260909180000` | `20260909180000` | `2026-09-09 18:00:00`
   `20260909183000` | `20260909183000` | `2026-09-09 18:30:00`
   `20260909190000` | `20260909190000` | `2026-09-09 19:00:00`
   `20260909193000` | `20260909193000` | `2026-09-09 19:30:00`
   `20260909200000` | `20260909200000` | `2026-09-09 20:00:00`
   `20260909210000` | `20260909210000` | `2026-09-09 21:00:00`
   `20260909213000` | `20260909213000` | `2026-09-09 21:30:00`
   `20260909220000` | `20260909220000` | `2026-09-09 22:00:00`
   `20260909223000` | `20260909223000` | `2026-09-09 22:30:00`
   `20260909230000` | `20260909230000` | `2026-09-09 23:00:00`
   `20260910120000` | `20260910120000` | `2026-09-10 12:00:00`
   `20260910123000` | `20260910123000` | `2026-09-10 12:30:00`
   `20260910130000` | `20260910130000` | `2026-09-10 13:00:00`
   `20260910133000` | `20260910133000` | `2026-09-10 13:30:00`
   `20260910153329` | `20260910153329` | `2026-09-10 15:33:29`
   `20260910185620` | `20260910185620` | `2026-09-10 18:56:20`
   `20260910201921` | `20260910201921` | `2026-09-10 20:19:21`
   `20260910205118` | `20260910205118` | `2026-09-10 20:51:18`
   `20260911010021` | `20260911010021` | `2026-09-11 01:00:21`
   `20260911010056` | `20260911010056` | `2026-09-11 01:00:56`
   `20260911014731` | `20260911014731` | `2026-09-11 01:47:31`
   `20260911023829` | `20260911023829` | `2026-09-11 02:38:29`
   `20260911023856` | `20260911023856` | `2026-09-11 02:38:56`
   `20260912013839` | `20260912013839` | `2026-09-12 01:38:39`
   `20260912223818` | `20260912223818` | `2026-09-12 22:38:18`
   `20260913121224` | `20260913121224` | `2026-09-13 12:12:24`
   `20260913191311` | `20260913191311` | `2026-09-13 19:13:11`
   `20260914013218` | `20260914013218` | `2026-09-14 01:32:18`
   `20260914112404` | `20260914112404` | `2026-09-14 11:24:04`
   `20260914203000` | `20260914203000` | `2026-09-14 20:30:00`
   `20260914212000` | `20260914212000` | `2026-09-14 21:20:00`
   `20260914223000` | `20260914223000` | `2026-09-14 22:30:00`
   `20260914234000` | `20260914234000` | `2026-09-14 23:40:00`
   `20260915002000` | `20260915002000` | `2026-09-15 00:20:00`
   `20260926220000` | `20260926220000` | `2026-09-26 22:00:00`
   `20260927131000` | `20260927131000` | `2026-09-27 13:10:00`
   `20260927170000` | `20260927170000` | `2026-09-27 17:00:00`
   `20260928100000` | `20260928100000` | `2026-09-28 10:00:00`
   `20260928120000` | `20260928120000` | `2026-09-28 12:00:00`


Initialising login role...
Connecting to remote database...
```

## TypeScript verification

Command:

```bash
npm run typecheck
```

Exit code: `0`

```text
> vite-react-typescript-starter@0.0.0 typecheck
> tsc --noEmit -p tsconfig.app.json
```

## Production build

Command:

```bash
npm run build
```

Exit code: `0`

```text
> vite-react-typescript-starter@0.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 1589 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 1.56 kB │ gzip:   0.61 kB
dist/assets/impara-XUiVz4k1.css                16.78 kB │ gzip:   4.04 kB
dist/assets/index-iyCipT0a.css                 54.59 kB │ gzip:  10.82 kB
dist/assets/check-B-n72H_i.js                   0.29 kB │ gzip:   0.24 kB
dist/assets/activity-BFzL0S-5.js                0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js               0.31 kB │ gzip:   0.25 kB
dist/assets/plus-BiAcAbU9.js                    0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-DZlax1iE.js              0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-DoG_SObt.js             0.33 kB │ gzip:   0.26 kB
dist/assets/search-BmhT5y3w.js                  0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-DOg1JXGH.js          0.34 kB │ gzip:   0.27 kB
dist/assets/clock-BPylWAQM.js                   0.35 kB │ gzip:   0.27 kB
dist/assets/rotate-ccw-BJJmiY6d.js              0.37 kB │ gzip:   0.29 kB
dist/assets/map-pin-Z0VW32Od.js                 0.37 kB │ gzip:   0.29 kB
dist/assets/star-c_sNmlug.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-Jgwy22-h.js               0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-Cu-t1q7O.js             0.40 kB │ gzip:   0.29 kB
dist/assets/heart-CrMe35iH.js                   0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-B7t7zFRz.js           0.42 kB │ gzip:   0.30 kB
dist/assets/upload-KTX1avjD.js                  0.43 kB │ gzip:   0.32 kB
dist/assets/calendar-DTgrjJql.js                0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-DeB74A9C.js          0.43 kB │ gzip:   0.31 kB
dist/assets/users-CQWt1A7J.js                   0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-BTwA7sv1.js             0.48 kB │ gzip:   0.31 kB
dist/assets/sportSearch-bXype2bM.js             0.49 kB │ gzip:   0.34 kB
dist/assets/refresh-cw-BWWIKt7K.js              0.49 kB │ gzip:   0.32 kB
dist/assets/file-text-C-B87XFy.js               0.50 kB │ gzip:   0.32 kB
dist/assets/paw-print-BtN9Ocdo.js               0.51 kB │ gzip:   0.35 kB
dist/assets/trash-2-1vjCOKe1.js                 0.53 kB │ gzip:   0.35 kB
dist/assets/scale-DTI4_EBL.js                   0.53 kB │ gzip:   0.34 kB
dist/assets/phone-BFTz4L2o.js                   0.56 kB │ gzip:   0.36 kB
dist/assets/medal-j83Onw97.js                   0.60 kB │ gzip:   0.38 kB
dist/assets/calendar-days-TcbQOFF4.js           0.66 kB │ gzip:   0.36 kB
dist/assets/target-D7ZD8_tW.js                  0.70 kB │ gzip:   0.31 kB
dist/assets/home-D7vEiOru.js                    0.83 kB │ gzip:   0.43 kB
dist/assets/trophy-B2W6sePC.js                  0.95 kB │ gzip:   0.47 kB
dist/assets/DogPhoto-BD5c02eg.js                1.19 kB │ gzip:   0.71 kB
dist/assets/bookingMessages-BgpyiM5B.js         1.47 kB │ gzip:   0.81 kB
dist/assets/professionalCalendar-CiVuepea.js    1.96 kB │ gzip:   0.90 kB
dist/assets/ProfessionalBridge-DgHZif5d.js      2.19 kB │ gzip:   1.14 kB
dist/assets/VerificationModal-BqzjBlmu.js       4.82 kB │ gzip:   1.86 kB
dist/assets/ProLayout-DjxvGiOH.js               4.90 kB │ gzip:   1.82 kB
dist/assets/DogDetailPage-CTuwOd_O.js           5.31 kB │ gzip:   1.96 kB
dist/assets/ProAnalytics-CSLRhEO7.js            5.41 kB │ gzip:   2.11 kB
dist/assets/OwnerBookings-Br25ZWrT.js           5.66 kB │ gzip:   2.29 kB
dist/assets/BreedPage-D1QkfJoM.js               6.55 kB │ gzip:   2.24 kB
dist/assets/FciGroupPage-VYS0zWww.js            7.47 kB │ gzip:   2.71 kB
dist/assets/ProBookings-BqzoeoRa.js             7.50 kB │ gzip:   3.08 kB
dist/assets/fciGroups-BHmHcsg7.js               7.55 kB │ gzip:   2.69 kB
dist/assets/ProCRM-ClaQuERr.js                  8.52 kB │ gzip:   2.78 kB
dist/assets/SearchCard-DBGY3aUz.js              8.64 kB │ gzip:   3.44 kB
dist/assets/BreederGuidePage-D06Si9SY.js        9.53 kB │ gzip:   3.46 kB
dist/assets/ImparaHomePage-C2dupzEU.js         10.01 kB │ gzip:   3.84 kB
dist/assets/PassesPage-B2N9cX13.js             10.23 kB │ gzip:   3.38 kB
dist/assets/ProDashboard-CIFczG7Y.js           10.93 kB │ gzip:   3.65 kB
dist/assets/AuthPages-CvZGbfgs.js              11.54 kB │ gzip:   3.59 kB
dist/assets/BookingMessageInbox-B5qk7Pts.js    11.81 kB │ gzip:   4.19 kB
dist/assets/PassDialogs-BiDeIvTg.js            13.35 kB │ gzip:   4.52 kB
dist/assets/AdminDashboard-pCQghMeb.js         13.63 kB │ gzip:   4.08 kB
dist/assets/DogsPage-sLLzlFFH.js               14.15 kB │ gzip:   4.58 kB
dist/assets/BecomeProPage-RCdTb4Tz.js          14.35 kB │ gzip:   4.48 kB
dist/assets/OwnerDashboard-DBAzKOoS.js         14.67 kB │ gzip:   4.83 kB
dist/assets/ProCalendar-DQ9MsQPw.js            15.66 kB │ gzip:   5.44 kB
dist/assets/HomePage-CRHw_BYZ.js               16.59 kB │ gzip:   5.13 kB
dist/assets/LegalPages-DnSRqRKr.js             21.71 kB │ gzip:   6.87 kB
dist/assets/SearchPage-odMdQp8P.js             22.30 kB │ gzip:   7.07 kB
dist/assets/ImparaLessonPage-CiKL7Cno.js       22.30 kB │ gzip:   8.03 kB
dist/assets/SubscriptionsPage-Dc2L4JRt.js      23.28 kB │ gzip:   7.15 kB
dist/assets/ProfessionalProfile-hTPxB-wM.js    29.05 kB │ gzip:   8.41 kB
dist/assets/BeforeDogPage-DUIbXwAk.js          31.79 kB │ gzip:   9.74 kB
dist/assets/ContinuityPage-HPXUpAGu.js         37.88 kB │ gzip:  10.52 kB
dist/assets/ProSettings-GkfPQE9U.js            57.62 kB │ gzip:  15.50 kB
dist/assets/impara-BwlDNNYy.js                 58.66 kB │ gzip:  18.93 kB
dist/assets/index-Bk01ym1B.js                 390.42 kB │ gzip: 111.13 kB
✓ built in 4.34s
```
