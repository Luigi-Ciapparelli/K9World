# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-13T21:16:25+02:00`

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
 M docs/PROFESSIONAL_OPERATIONS_NEXT.md
 M docs/PROJECT_HANDOFF.md
 M src/App.tsx
 M src/pages/ProfessionalProfile.tsx
 M src/pages/pro/ProBookings.tsx
 M src/pages/pro/ProDashboard.tsx
 M src/pages/pro/ProLayout.tsx
 M src/pages/pro/ProSettings.tsx
?? docs/PROFESSIONAL_CALENDAR_V1.md
?? scripts/tests/test_professional_calendar.py
?? src/components/CalendarServices.tsx
?? src/components/PublicBookingAvailability.tsx
?? src/lib/professionalCalendar.ts
?? src/pages/pro/ProCalendar.tsx
?? supabase/migrations/20260913191311_professional_calendar_availability.sql
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
427ff8d (HEAD -> signup-dog-profile, origin/signup-dog-profile, origin/main, origin/HEAD, main) Add private professional continuity and invitation flow
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
d968f78 Add PawConnect core data model
e6eae6d Add PawConnect core blueprint
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
✓ 1564 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 1.53 kB │ gzip:   0.61 kB
dist/assets/index-B7wyZoyw.css                 48.05 kB │ gzip:   9.37 kB
dist/assets/check-UMoo28uE.js                   0.29 kB │ gzip:   0.24 kB
dist/assets/activity-CoQqcacS.js                0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js               0.31 kB │ gzip:   0.25 kB
dist/assets/plus-sws3R8Ue.js                    0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-CmZ_3-Tv.js              0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-DGJ4cQes.js             0.33 kB │ gzip:   0.26 kB
dist/assets/search-tqcidL4m.js                  0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-CSBEq4XG.js          0.34 kB │ gzip:   0.27 kB
dist/assets/clock-UCj68xl3.js                   0.35 kB │ gzip:   0.27 kB
dist/assets/clock-3-BIst7eUL.js                 0.35 kB │ gzip:   0.27 kB
dist/assets/map-pin-CKUfWRmB.js                 0.37 kB │ gzip:   0.29 kB
dist/assets/lock-D6m8hWxE.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/star-G-_4MCN1.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/home-Bjo20vOm.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-DaXuMepg.js               0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-Cd6jxCD2.js             0.40 kB │ gzip:   0.29 kB
dist/assets/heart-Bwjut-Nn.js                   0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-d5_xFbAw.js           0.42 kB │ gzip:   0.30 kB
dist/assets/calendar-CyLrRtF_.js                0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-_zSifiKI.js          0.43 kB │ gzip:   0.31 kB
dist/assets/users--qKKiNQ3.js                   0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-BOwOGz9E.js             0.48 kB │ gzip:   0.31 kB
dist/assets/graduation-cap-YEj-VQs2.js          0.50 kB │ gzip:   0.35 kB
dist/assets/phone-CDz7h3St.js                   0.56 kB │ gzip:   0.36 kB
dist/assets/calendar-days-C779uxvY.js           0.66 kB │ gzip:   0.37 kB
dist/assets/target-CXYzFHuK.js                  0.71 kB │ gzip:   0.35 kB
dist/assets/dog-pGYqwQL9.js                     0.89 kB │ gzip:   0.52 kB
dist/assets/DogPhoto-XDigVOrB.js                1.19 kB │ gzip:   0.71 kB
dist/assets/professionalCalendar-CiVuepea.js    1.96 kB │ gzip:   0.90 kB
dist/assets/OwnerBookings-DBXqW7kA.js           3.91 kB │ gzip:   1.69 kB
dist/assets/ProLayout-BKr4-HQ0.js               4.24 kB │ gzip:   1.63 kB
dist/assets/VerificationModal-Duer1zci.js       4.82 kB │ gzip:   1.86 kB
dist/assets/ProAnalytics-C4OXCIwn.js            5.38 kB │ gzip:   2.09 kB
dist/assets/DogDetailPage-BBGhKa1z.js           5.72 kB │ gzip:   2.18 kB
dist/assets/BreedPage-0jIKU02c.js               6.51 kB │ gzip:   2.21 kB
dist/assets/SearchCard-hnuvyt7q.js              7.10 kB │ gzip:   2.91 kB
dist/assets/ProBookings-DQiOrACS.js             7.30 kB │ gzip:   2.97 kB
dist/assets/FciGroupPage-Ch6cMpy5.js            7.43 kB │ gzip:   2.69 kB
dist/assets/fciGroups-BHmHcsg7.js               7.55 kB │ gzip:   2.69 kB
dist/assets/ImparaHomePage-BwyV_l8v.js          7.82 kB │ gzip:   2.74 kB
dist/assets/AdminDashboard-pPcq7VEq.js          8.02 kB │ gzip:   2.25 kB
dist/assets/SearchPage-L4OwFdJz.js              8.15 kB │ gzip:   3.38 kB
dist/assets/ProCRM-ZMoZC3Gn.js                  8.49 kB │ gzip:   2.75 kB
dist/assets/LegalPages-BtV3FoVQ.js              8.74 kB │ gzip:   2.98 kB
dist/assets/BreederGuidePage-BnTFkgIG.js        9.53 kB │ gzip:   3.46 kB
dist/assets/BecomeProPage-DlGsjoEC.js          10.16 kB │ gzip:   3.20 kB
dist/assets/ProDashboard-DyOdeKGZ.js           10.70 kB │ gzip:   3.56 kB
dist/assets/AuthPages-cRGlttAF.js              11.21 kB │ gzip:   3.38 kB
dist/assets/OwnerDashboard-Dz9PfG7C.js         13.39 kB │ gzip:   4.22 kB
dist/assets/ContinuityPage-JSZV9LrU.js         13.64 kB │ gzip:   4.67 kB
dist/assets/DogsPage-D_bTEDRn.js               14.58 kB │ gzip:   4.71 kB
dist/assets/HomePage-BfDzeL_Z.js               15.20 kB │ gzip:   4.79 kB
dist/assets/ProCalendar-DeTK01eC.js            15.92 kB │ gzip:   5.48 kB
dist/assets/ImparaLessonPage-CugPfxfw.js       17.95 kB │ gzip:   5.23 kB
dist/assets/ProSettings-BofnLO-H.js            21.18 kB │ gzip:   6.31 kB
dist/assets/ProfessionalProfile-CCVdmsbn.js    23.52 kB │ gzip:   6.87 kB
dist/assets/imparaContent-DIr_gzCv.js          29.42 kB │ gzip:   9.28 kB
dist/assets/BeforeDogPage-5AbbfVcX.js          30.03 kB │ gzip:   9.16 kB
dist/assets/index-CCr7o3n4.js                 388.02 kB │ gzip: 110.42 kB
✓ built in 4.01s
```

