# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-28T10:31:54+02:00`

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
 M docs/SUPABASE_AUDIT_FIXES_V1.md
 M src/App.tsx
 M src/pages/owner/OwnerDashboard.tsx
 M src/pages/pro/ProLayout.tsx
 M supabase/.temp/cli-latest
?? docs/PROFESSIONAL_PASSES_V1.md
?? docs/SUPABASE_PRIVATE_API_V2.md
?? scripts/audit/
?? scripts/tests/__pycache__/
?? scripts/tests/private_api_assertions.sql
?? scripts/tests/private_api_before.sql
?? scripts/tests/private_api_lint_assertions.sql
?? scripts/tests/professional_passes_assertions.sql
?? scripts/tests/professional_passes_fixture.sql
?? scripts/tests/test_private_api_boundary.py
?? scripts/tests/test_professional_passes.py
?? scripts/tests/test_professional_passes_ui.mjs
?? src/components/PassDialogs.tsx
?? src/lib/professionalPasses.ts
?? src/pages/PassesPage.tsx
?? supabase/migrations/20260927170000_restore_professional_passes.sql
?? supabase/migrations/20260928100000_private_api_boundary.sql
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
db2e010 (HEAD -> main, origin/main, origin/HEAD) Record applied Supabase privilege and RLS fixes
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
472b4ee Refine owner dashboard and fix booking summaries
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
✓ 1586 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 1.56 kB │ gzip:   0.61 kB
dist/assets/impara-XUiVz4k1.css                16.78 kB │ gzip:   4.04 kB
dist/assets/index-rgeshr4i.css                 54.33 kB │ gzip:  10.74 kB
dist/assets/check-CHX5MT32.js                   0.29 kB │ gzip:   0.24 kB
dist/assets/activity-DAUKfO8f.js                0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js               0.31 kB │ gzip:   0.25 kB
dist/assets/plus-zEzqn0ri.js                    0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-C052OCJ1.js              0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-qf54T_tB.js             0.33 kB │ gzip:   0.27 kB
dist/assets/search-BCWdLMDE.js                  0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-BswJn2vZ.js          0.34 kB │ gzip:   0.27 kB
dist/assets/clock-Db0N-Stv.js                   0.35 kB │ gzip:   0.27 kB
dist/assets/rotate-ccw-CoHQQ_Ja.js              0.37 kB │ gzip:   0.29 kB
dist/assets/map-pin-Lf57Pxf1.js                 0.37 kB │ gzip:   0.29 kB
dist/assets/star-5FrSu9yI.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-DO9izhX5.js               0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-D4kTaW7H.js             0.40 kB │ gzip:   0.29 kB
dist/assets/heart-CKWnx33O.js                   0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-BLd-gl_u.js           0.42 kB │ gzip:   0.30 kB
dist/assets/upload-DUL8n69j.js                  0.43 kB │ gzip:   0.32 kB
dist/assets/calendar-5HeScRCU.js                0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-BRKyOLSj.js          0.43 kB │ gzip:   0.31 kB
dist/assets/users-DW22vHTb.js                   0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-B-h9_PWe.js             0.48 kB │ gzip:   0.31 kB
dist/assets/sportSearch-OQXAGqnQ.js             0.49 kB │ gzip:   0.34 kB
dist/assets/refresh-cw-D4Lb2lhG.js              0.49 kB │ gzip:   0.33 kB
dist/assets/file-text-DXhjpXv_.js               0.50 kB │ gzip:   0.32 kB
dist/assets/paw-print-MNjKP7j9.js               0.51 kB │ gzip:   0.35 kB
dist/assets/trash-2-B3gbkCy5.js                 0.53 kB │ gzip:   0.35 kB
dist/assets/scale-CDbTHQDQ.js                   0.53 kB │ gzip:   0.34 kB
dist/assets/phone-XzqzDkPp.js                   0.56 kB │ gzip:   0.36 kB
dist/assets/medal-CkKXQtrI.js                   0.60 kB │ gzip:   0.39 kB
dist/assets/calendar-days-BOgpgesT.js           0.66 kB │ gzip:   0.37 kB
dist/assets/target-DjwuwA_U.js                  0.70 kB │ gzip:   0.31 kB
dist/assets/home-BH5hUmnm.js                    0.83 kB │ gzip:   0.43 kB
dist/assets/trophy-Oc9-TAgs.js                  0.95 kB │ gzip:   0.47 kB
dist/assets/DogPhoto-DwhGbaa3.js                1.19 kB │ gzip:   0.71 kB
dist/assets/bookingMessages-CtX5JQhX.js         1.47 kB │ gzip:   0.81 kB
dist/assets/professionalCalendar-CiVuepea.js    1.96 kB │ gzip:   0.90 kB
dist/assets/ProfessionalBridge-DMZ_Oa0o.js      2.19 kB │ gzip:   1.14 kB
dist/assets/ProLayout-CGrUJerp.js               4.78 kB │ gzip:   1.77 kB
dist/assets/VerificationModal-WnLhqoWL.js       4.82 kB │ gzip:   1.86 kB
dist/assets/DogDetailPage-CyCL4FJt.js           5.31 kB │ gzip:   1.96 kB
dist/assets/ProAnalytics-DbI9kkYQ.js            5.38 kB │ gzip:   2.09 kB
dist/assets/OwnerBookings-DATpTp1-.js           5.66 kB │ gzip:   2.30 kB
dist/assets/BreedPage-EfYUQ1Pq.js               6.55 kB │ gzip:   2.24 kB
dist/assets/FciGroupPage-Dv0D2OWi.js            7.47 kB │ gzip:   2.72 kB
dist/assets/ProBookings-4LgG-dDz.js             7.47 kB │ gzip:   3.06 kB
dist/assets/fciGroups-BHmHcsg7.js               7.55 kB │ gzip:   2.69 kB
dist/assets/ProCRM-q7HWNFo_.js                  8.49 kB │ gzip:   2.76 kB
dist/assets/SearchCard-CuAWG7fn.js              8.64 kB │ gzip:   3.44 kB
dist/assets/BreederGuidePage-cA-v5C97.js        9.53 kB │ gzip:   3.46 kB
dist/assets/ImparaHomePage-BEK6WUIh.js         10.01 kB │ gzip:   3.84 kB
dist/assets/ProDashboard-Rw-7UWtO.js           10.90 kB │ gzip:   3.63 kB
dist/assets/AuthPages-CzYonc7J.js              11.54 kB │ gzip:   3.59 kB
dist/assets/BookingMessageInbox-DKZAPCOv.js    11.81 kB │ gzip:   4.19 kB
dist/assets/AdminDashboard-DL4yDNMs.js         13.63 kB │ gzip:   4.08 kB
dist/assets/DogsPage-UyTX0yjS.js               14.15 kB │ gzip:   4.58 kB
dist/assets/BecomeProPage-DA0STad4.js          14.35 kB │ gzip:   4.48 kB
dist/assets/OwnerDashboard-DX0oNxEe.js         14.48 kB │ gzip:   4.81 kB
dist/assets/ProCalendar-BR7agy9b.js            15.66 kB │ gzip:   5.44 kB
dist/assets/HomePage-D0ygy06L.js               16.59 kB │ gzip:   5.13 kB
dist/assets/LegalPages-fPx-1Bfs.js             21.71 kB │ gzip:   6.87 kB
dist/assets/SearchPage-xEQV9eVL.js             22.30 kB │ gzip:   7.07 kB
dist/assets/ImparaLessonPage-BKOlVNly.js       22.30 kB │ gzip:   8.02 kB
dist/assets/PassesPage-BA24hreH.js             23.25 kB │ gzip:   6.98 kB
dist/assets/ProfessionalProfile-fDXIcF-G.js    29.05 kB │ gzip:   8.41 kB
dist/assets/BeforeDogPage-lQ0R2QDY.js          31.79 kB │ gzip:   9.74 kB
dist/assets/ContinuityPage-B5SX1h0k.js         37.85 kB │ gzip:  10.50 kB
dist/assets/ProSettings-BFMUV1Ca.js            57.59 kB │ gzip:  15.49 kB
dist/assets/impara-B-NYfy7-.js                 58.66 kB │ gzip:  18.93 kB
dist/assets/index-D_tqivCU.js                 390.07 kB │ gzip: 111.05 kB
✓ built in 3.78s
```
