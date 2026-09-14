# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-14T13:31:24+02:00`

This file records the **implemented state**, not future plans.
If it conflicts with code, Git history or migrations, inspect the repository directly and regenerate it.

## Current branch

Command:

```bash
git branch --show-current
```

Exit code: `0`

```text
signup-dog-profile
```

## Working tree

Command:

```bash
git status --short
```

Exit code: `0`

```text
M START_HERE.md
 M docs/PROFESSIONAL_CONTINUITY_MEDIA.md
 M docs/PROFESSIONAL_OPERATIONS_NEXT.md
 M docs/PROJECT_HANDOFF.md
 M src/pages/continuity/ContinuityPage.tsx
 M supabase/.temp/cli-latest
?? docs/CONTINUITY_SHARING_V1.md
?? scripts/tests/test_continuity_sharing.py
?? src/components/ContinuitySharingCommon.tsx
?? src/components/OwnerContinuitySharing.tsx
?? src/components/ProfessionalContinuitySharing.tsx
?? src/lib/continuitySharing.ts
?? supabase/migrations/20260914112404_selected_professional_continuity.sql
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
82eb5ac (HEAD -> signup-dog-profile, origin/signup-dog-profile, origin/main, origin/HEAD, main) Add private booking messages and automatic professional replies
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
3b9a021 Refine public home and returning user entry
6770dd3 Introduce PortaleCinofilo design system v2
b1681c4 Rebrand Italian experience as PortaleCinofilo
a044eb9 Upgrade Impara with practical learning and clicker lab
31bfb82 Upgrade pre dog compatibility guidance
60926a3 Secure public professional services API
d8e6730 Polish professional search flow for MVP
994aa13 Polish homepage for MVP launch
de5cde6 Remove unused professional beta pages
af3c723 Add deterministic project continuity system
52406ab Update project continuity documentation
17b2a89 Define learning and credential core
e0edbc8 Define person dog relationship model
da24e91 Add project continuity handoff
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
✓ 1572 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 1.53 kB │ gzip:   0.61 kB
dist/assets/index-BbniOVwp.css                 48.49 kB │ gzip:   9.46 kB
dist/assets/check-C_-zpepf.js                   0.29 kB │ gzip:   0.24 kB
dist/assets/activity-C1Wd4Kpi.js                0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js               0.31 kB │ gzip:   0.25 kB
dist/assets/plus-DCApVvJj.js                    0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-CBCajpL4.js              0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-DixB27vl.js             0.33 kB │ gzip:   0.26 kB
dist/assets/search-BGCRB0uW.js                  0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-CxPDyBtH.js          0.34 kB │ gzip:   0.27 kB
dist/assets/clock-DrXuKsi1.js                   0.35 kB │ gzip:   0.27 kB
dist/assets/clock-3-sPklVow2.js                 0.35 kB │ gzip:   0.27 kB
dist/assets/map-pin-DzaGeIgq.js                 0.37 kB │ gzip:   0.29 kB
dist/assets/lock-DMobMsFx.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/star-BU5FMWen.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/home-DRzzMinp.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-BpictC9P.js               0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-CbXWYsKO.js             0.40 kB │ gzip:   0.29 kB
dist/assets/heart-B1JL7wt8.js                   0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-CExbmoPG.js           0.42 kB │ gzip:   0.30 kB
dist/assets/calendar-ztb8VsD5.js                0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-BobJAgIi.js          0.43 kB │ gzip:   0.31 kB
dist/assets/users-DNa95ubc.js                   0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-DNCF7_vs.js             0.48 kB │ gzip:   0.31 kB
dist/assets/graduation-cap-Be8r66oY.js          0.50 kB │ gzip:   0.35 kB
dist/assets/phone-CpNduHFn.js                   0.56 kB │ gzip:   0.36 kB
dist/assets/calendar-days-tVIW8tVX.js           0.66 kB │ gzip:   0.37 kB
dist/assets/target-DovVeRQd.js                  0.71 kB │ gzip:   0.35 kB
dist/assets/dog-VvoLs90P.js                     0.89 kB │ gzip:   0.53 kB
dist/assets/DogPhoto-DbjrgmoF.js                1.19 kB │ gzip:   0.71 kB
dist/assets/bookingMessages-5ooHUGjE.js         1.47 kB │ gzip:   0.81 kB
dist/assets/professionalCalendar-CiVuepea.js    1.96 kB │ gzip:   0.90 kB
dist/assets/ProLayout-BxZxkYva.js               4.24 kB │ gzip:   1.63 kB
dist/assets/VerificationModal-DFnl9fkS.js       4.82 kB │ gzip:   1.86 kB
dist/assets/ProAnalytics-BXUVO1jx.js            5.38 kB │ gzip:   2.10 kB
dist/assets/OwnerBookings-B3ux3sXf.js           5.69 kB │ gzip:   2.31 kB
dist/assets/DogDetailPage-CwiQvrej.js           5.72 kB │ gzip:   2.18 kB
dist/assets/BreedPage-f25wS4Iw.js               6.51 kB │ gzip:   2.22 kB
dist/assets/SearchCard-CBdjaRmp.js              7.10 kB │ gzip:   2.91 kB
dist/assets/FciGroupPage-Bzl4hg4i.js            7.43 kB │ gzip:   2.69 kB
dist/assets/ProBookings-Y5GaDHiO.js             7.50 kB │ gzip:   3.07 kB
dist/assets/fciGroups-BHmHcsg7.js               7.55 kB │ gzip:   2.69 kB
dist/assets/ImparaHomePage-COWhtHBa.js          7.82 kB │ gzip:   2.74 kB
dist/assets/AdminDashboard-AhuVxmTU.js          8.02 kB │ gzip:   2.25 kB
dist/assets/SearchPage-CliBfnZV.js              8.15 kB │ gzip:   3.38 kB
dist/assets/ProCRM-CS6GQNyE.js                  8.49 kB │ gzip:   2.76 kB
dist/assets/LegalPages-hTPKFxie.js              8.74 kB │ gzip:   2.98 kB
dist/assets/BreederGuidePage-B3O1xY7A.js        9.53 kB │ gzip:   3.46 kB
dist/assets/BecomeProPage-BGL00F4B.js          10.16 kB │ gzip:   3.20 kB
dist/assets/ProDashboard-DCBqzgBe.js           10.90 kB │ gzip:   3.63 kB
dist/assets/AuthPages-CtvvZf2e.js              11.21 kB │ gzip:   3.38 kB
dist/assets/BookingMessageInbox-CSYgUCoQ.js    11.81 kB │ gzip:   4.19 kB
dist/assets/OwnerDashboard-LFhPhRX5.js         13.49 kB │ gzip:   4.27 kB
dist/assets/DogsPage-DTB7sh9_.js               14.58 kB │ gzip:   4.71 kB
dist/assets/HomePage-Bot5xolJ.js               15.20 kB │ gzip:   4.79 kB
dist/assets/ProCalendar-gIR_9Bts.js            16.07 kB │ gzip:   5.55 kB
dist/assets/ImparaLessonPage-DDjs1bVs.js       17.95 kB │ gzip:   5.23 kB
dist/assets/ProfessionalProfile-CEYF3ja0.js    23.52 kB │ gzip:   6.87 kB
dist/assets/ProSettings-BBguZkBG.js            27.53 kB │ gzip:   7.97 kB
dist/assets/imparaContent-DIr_gzCv.js          29.42 kB │ gzip:   9.28 kB
dist/assets/BeforeDogPage-DS6NdJ7u.js          30.03 kB │ gzip:   9.15 kB
dist/assets/ContinuityPage-sF-_qRz-.js         37.85 kB │ gzip:  10.50 kB
dist/assets/index--9v3aMO9.js                 388.14 kB │ gzip: 110.47 kB
✓ built in 3.68s
```

