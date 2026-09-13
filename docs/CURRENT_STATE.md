# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-13T18:24:44+02:00`

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
 M docs/PROJECT_HANDOFF.md
 M src/App.tsx
 M src/pages/ProfessionalProfile.tsx
 M src/pages/owner/OwnerDashboard.tsx
 M src/pages/pro/ProDashboard.tsx
 M src/pages/pro/ProLayout.tsx
 M supabase/.temp/cli-latest
?? docs/CONTINUITY_RELEASE_V1.md
?? docs/CONTINUITY_UI_V1.md
?? docs/PROFESSIONAL_OPERATIONS_NEXT.md
?? scripts/tests/test_continuity_migration.py
?? src/lib/continuity.ts
?? src/pages/continuity/
?? supabase/migrations/20260913121224_private_professional_continuity_v1.sql
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
6d69285 (HEAD -> signup-dog-profile, origin/signup-dog-profile) Add continuity integration tests against complete migration history
019d2a9 Add concurrent continuity RPC regression tests
7c59e2a Add tested private professional session and note RPC proposal
9d5f44e Add tested professional relationship RPC proposal
51e85da Add isolated continuity schema regression test
438c550 Propose private professional sessions and archive schema
5ef4903 Define professional archive dog continuity and private media architecture
9b23833 (origin/main, origin/HEAD, main) Update project state after booking fixes
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
5bad0b4 Add route level code splitting
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
✓ 1560 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                1.53 kB │ gzip:   0.60 kB
dist/assets/index-C29lLB4E.css                47.00 kB │ gzip:   9.26 kB
dist/assets/check-Cjibd4d4.js                  0.29 kB │ gzip:   0.24 kB
dist/assets/activity-C8vcLEfF.js               0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js              0.31 kB │ gzip:   0.25 kB
dist/assets/plus-CIY6O2VZ.js                   0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-hWAzg4vg.js             0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-BVhNdeQm.js            0.33 kB │ gzip:   0.26 kB
dist/assets/search-Cs1yJV6D.js                 0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-DDW0-1MV.js         0.34 kB │ gzip:   0.27 kB
dist/assets/clock-D7Q4oDX3.js                  0.35 kB │ gzip:   0.27 kB
dist/assets/clock-3-DR6GRqSu.js                0.35 kB │ gzip:   0.27 kB
dist/assets/map-pin-BTMt70Ya.js                0.37 kB │ gzip:   0.29 kB
dist/assets/lock-F5iZYFXY.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/star-fJlVg1m7.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/home-BxgMOoG8.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-DVVF9Dms.js              0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-3VmOzNfG.js            0.40 kB │ gzip:   0.29 kB
dist/assets/heart-BRR9NkQ2.js                  0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-CDhuWwyS.js          0.42 kB │ gzip:   0.30 kB
dist/assets/calendar-LyC3Evdv.js               0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-Bd2FDIn0.js         0.43 kB │ gzip:   0.31 kB
dist/assets/users-RpT46qHo.js                  0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-Dk9WCUAf.js            0.48 kB │ gzip:   0.31 kB
dist/assets/graduation-cap-B6DKG0DE.js         0.50 kB │ gzip:   0.35 kB
dist/assets/trash-2-DWC-O3i_.js                0.53 kB │ gzip:   0.35 kB
dist/assets/phone-CkEo2pGt.js                  0.56 kB │ gzip:   0.36 kB
dist/assets/target-zIVnhzfi.js                 0.71 kB │ gzip:   0.35 kB
dist/assets/dog-COUKNRth.js                    0.89 kB │ gzip:   0.53 kB
dist/assets/DogPhoto-CU45-829.js               1.19 kB │ gzip:   0.71 kB
dist/assets/OwnerBookings-CqzVmxg4.js          3.91 kB │ gzip:   1.70 kB
dist/assets/ProLayout-7Zfm5zS_.js              4.13 kB │ gzip:   1.60 kB
dist/assets/VerificationModal-B8Z-1zpD.js      4.82 kB │ gzip:   1.86 kB
dist/assets/ProAnalytics-Be2K4aw_.js           5.34 kB │ gzip:   2.08 kB
dist/assets/DogDetailPage-C-99XYlD.js          6.28 kB │ gzip:   2.30 kB
dist/assets/BreedPage-29CEe0CM.js              6.51 kB │ gzip:   2.22 kB
dist/assets/SearchCard-Bsw79c1d.js             7.10 kB │ gzip:   2.92 kB
dist/assets/ProBookings-rU2zAbj3.js            7.29 kB │ gzip:   2.98 kB
dist/assets/FciGroupPage-BLbgkRUb.js           7.43 kB │ gzip:   2.70 kB
dist/assets/fciGroups-BHmHcsg7.js              7.55 kB │ gzip:   2.69 kB
dist/assets/ImparaHomePage-6WqaG2fW.js         7.82 kB │ gzip:   2.74 kB
dist/assets/AdminDashboard-6fhjXNaq.js         8.02 kB │ gzip:   2.25 kB
dist/assets/SearchPage-D0YfQ1IZ.js             8.15 kB │ gzip:   3.38 kB
dist/assets/ProCRM-BlSxFXZr.js                 8.45 kB │ gzip:   2.74 kB
dist/assets/LegalPages-DUgY9t5i.js             8.74 kB │ gzip:   2.98 kB
dist/assets/BreederGuidePage-CTWyzBou.js       9.53 kB │ gzip:   3.46 kB
dist/assets/BecomeProPage-CSP8C0V8.js         10.16 kB │ gzip:   3.20 kB
dist/assets/ProDashboard-CObZJFE2.js          10.68 kB │ gzip:   3.53 kB
dist/assets/AuthPages-ChaludJo.js             11.21 kB │ gzip:   3.38 kB
dist/assets/OwnerDashboard-DL3V-hIS.js        13.39 kB │ gzip:   4.23 kB
dist/assets/ContinuityPage-ZLWseAzH.js        13.60 kB │ gzip:   4.66 kB
dist/assets/DogsPage-DiMTcnHU.js              14.15 kB │ gzip:   4.58 kB
dist/assets/HomePage-cHs20-eJ.js              15.20 kB │ gzip:   4.79 kB
dist/assets/ProSettings-BOkxOF-z.js           17.41 kB │ gzip:   4.89 kB
dist/assets/ImparaLessonPage-CdIEOcgD.js      17.95 kB │ gzip:   5.23 kB
dist/assets/ProfessionalProfile-Con7jpkD.js   21.81 kB │ gzip:   6.34 kB
dist/assets/imparaContent-DIr_gzCv.js         29.42 kB │ gzip:   9.28 kB
dist/assets/BeforeDogPage-BnfsnbT8.js         30.03 kB │ gzip:   9.16 kB
dist/assets/index-C2C1moP5.js                387.71 kB │ gzip: 110.36 kB
✓ built in 3.71s
```

