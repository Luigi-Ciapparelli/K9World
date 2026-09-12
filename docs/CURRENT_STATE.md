# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-13T01:30:36+02:00`

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
(no output)
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
1ce28af (HEAD -> signup-dog-profile, origin/signup-dog-profile) Fix professional booking names notes and request priority
a8414f3 Polish professional profile and booking request modal
bbc2231 (origin/main, origin/HEAD, main) Update project state snapshot
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
1a1cbda Add PawConnect Impara stage one prototype
6d4d1eb Add responsible breeder selection guide
28f56da Add pre dog FCI breed journey
9bfc80e Add role based authentication navigation
8a323ae Add private dog photo workflow
d049679 Enforce canonical FCI breed integrity
a95314a Secure professional CRM access
3edc233 Secure reviews and lock down public data access
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
✓ 1558 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                1.53 kB │ gzip:   0.61 kB
dist/assets/index-ov_3EDJM.css                46.95 kB │ gzip:   9.25 kB
dist/assets/check-Bbhl1rRR.js                  0.29 kB │ gzip:   0.24 kB
dist/assets/activity-Bl8J8E0U.js               0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js              0.31 kB │ gzip:   0.25 kB
dist/assets/plus-rk8cbsD5.js                   0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-DBMxRoMw.js             0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-BlFolccz.js            0.33 kB │ gzip:   0.26 kB
dist/assets/search-DoYcbeqq.js                 0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-BYRhAZBs.js         0.34 kB │ gzip:   0.27 kB
dist/assets/clock-Dm3PzLid.js                  0.35 kB │ gzip:   0.27 kB
dist/assets/clock-3-trI8W-Yj.js                0.35 kB │ gzip:   0.27 kB
dist/assets/map-pin-pkpdoXcg.js                0.37 kB │ gzip:   0.29 kB
dist/assets/lock-0gFwNN_U.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/star-CsJ1bZ0H.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/home-CT0ffZ3C.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-DPceAATg.js              0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-S--hyxXQ.js            0.40 kB │ gzip:   0.29 kB
dist/assets/heart-DbyNCeKw.js                  0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-1zzEpJZi.js          0.42 kB │ gzip:   0.30 kB
dist/assets/calendar-Ck-qKTkZ.js               0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-xBXta2AN.js         0.43 kB │ gzip:   0.31 kB
dist/assets/users-ku_YVH67.js                  0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-Ci5nsxoj.js            0.48 kB │ gzip:   0.31 kB
dist/assets/graduation-cap-BkQvqyQr.js         0.50 kB │ gzip:   0.35 kB
dist/assets/trash-2-CpYLp9fR.js                0.53 kB │ gzip:   0.35 kB
dist/assets/phone-UofPGtAl.js                  0.56 kB │ gzip:   0.36 kB
dist/assets/target-CYkp4uY-.js                 0.71 kB │ gzip:   0.35 kB
dist/assets/dog-COaE9XKe.js                    0.89 kB │ gzip:   0.53 kB
dist/assets/DogPhoto-vAf_uKsO.js               1.19 kB │ gzip:   0.71 kB
dist/assets/OwnerBookings-nKbinOvZ.js          3.91 kB │ gzip:   1.69 kB
dist/assets/ProLayout-Dvpck2up.js              4.05 kB │ gzip:   1.58 kB
dist/assets/VerificationModal-B5xkTPcc.js      4.82 kB │ gzip:   1.86 kB
dist/assets/ProAnalytics-DuTge45d.js           5.34 kB │ gzip:   2.08 kB
dist/assets/DogDetailPage-DBZ2dmHM.js          6.28 kB │ gzip:   2.30 kB
dist/assets/BreedPage-CRqy7BEu.js              6.51 kB │ gzip:   2.22 kB
dist/assets/SearchCard-DFhlfMHn.js             7.10 kB │ gzip:   2.91 kB
dist/assets/ProBookings-Bp0nPKn7.js            7.29 kB │ gzip:   2.97 kB
dist/assets/FciGroupPage-C0Orb6W9.js           7.43 kB │ gzip:   2.69 kB
dist/assets/fciGroups-BHmHcsg7.js              7.55 kB │ gzip:   2.69 kB
dist/assets/ImparaHomePage-BqTAgS8-.js         7.82 kB │ gzip:   2.74 kB
dist/assets/AdminDashboard-B-EmX4l3.js         8.02 kB │ gzip:   2.25 kB
dist/assets/SearchPage-BhTzu5ma.js             8.15 kB │ gzip:   3.38 kB
dist/assets/ProCRM-DpONmia6.js                 8.45 kB │ gzip:   2.74 kB
dist/assets/LegalPages-BfECZ4kd.js             8.74 kB │ gzip:   2.98 kB
dist/assets/BreederGuidePage-cNTncLcu.js       9.53 kB │ gzip:   3.46 kB
dist/assets/BecomeProPage-CGEQhrDQ.js         10.16 kB │ gzip:   3.20 kB
dist/assets/ProDashboard-DMVUJ9K3.js          10.27 kB │ gzip:   3.43 kB
dist/assets/AuthPages-DsToODs9.js             11.21 kB │ gzip:   3.38 kB
dist/assets/OwnerDashboard-BzRYz_kh.js        13.18 kB │ gzip:   4.16 kB
dist/assets/DogsPage-BPsDu2eS.js              14.15 kB │ gzip:   4.58 kB
dist/assets/HomePage-CsBbwQGD.js              15.20 kB │ gzip:   4.79 kB
dist/assets/ProSettings-rRltVX-o.js           17.41 kB │ gzip:   4.89 kB
dist/assets/ImparaLessonPage-BhIkcyeS.js      17.95 kB │ gzip:   5.23 kB
dist/assets/ProfessionalProfile-BHBI_wiD.js   20.30 kB │ gzip:   5.91 kB
dist/assets/imparaContent-DIr_gzCv.js         29.42 kB │ gzip:   9.28 kB
dist/assets/BeforeDogPage-xU9LDktD.js         30.03 kB │ gzip:   9.16 kB
dist/assets/index-DjIQv0hl.js                386.42 kB │ gzip: 109.76 kB
✓ built in 3.56s
```

