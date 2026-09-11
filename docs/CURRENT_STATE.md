# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-12T00:40:24+02:00`

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
?? docs/AI_CONTINUITY_PROTOCOL.md
?? docs/CURRENT_STATE.md
?? scripts/
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
52406ab (HEAD -> signup-dog-profile) Update project continuity documentation
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
ac2cfc2 Harden public data access and dog onboarding
4f52f42 (origin/signup-dog-profile) Add dog onboarding and FCI education
656fb6b (origin/test-national-cities-v2, origin/main, origin/HEAD, test-national-cities-v2, main) Add national city search and improved geolocation
aaa6e74 Protect environment files
c10c099 Fix local excellence light and dark theme styles
47f7ecd Add theme toggle and simplify professional navigation
768d214 Polish professional profile hero image
dd42e5a Add professional listing type fields
e079d23 Redesign professional profile page
0bb5e9e Add footer privacy terms and contact pages
71d12a2 Rebrand platform to PawConnect
f7fc122 Localize site and add premium local exellence showcase
0570bcc Fix pubblic navigation and professional signup flow
6187b27 Add become a professional landing page
57be413 Search professionals by active services
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
✓ 1555 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                1.51 kB │ gzip:   0.58 kB
dist/assets/index-BIzsutqk.css                38.56 kB │ gzip:   7.10 kB
dist/assets/check-BhZWpkXM.js                  0.29 kB │ gzip:   0.24 kB
dist/assets/activity-BOq3HkmF.js               0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js              0.31 kB │ gzip:   0.25 kB
dist/assets/plus-DnbhQVwn.js                   0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-za2Cl2-_.js             0.33 kB │ gzip:   0.26 kB
dist/assets/arrow-right-CG6kzLJ0.js            0.33 kB │ gzip:   0.26 kB
dist/assets/search-DeiI69B9.js                 0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-Br75tsA3.js         0.34 kB │ gzip:   0.27 kB
dist/assets/clock-DYiwzwnG.js                  0.35 kB │ gzip:   0.27 kB
dist/assets/clock-3-Cxqbj0f5.js                0.35 kB │ gzip:   0.27 kB
dist/assets/map-pin-DBG15RJv.js                0.37 kB │ gzip:   0.29 kB
dist/assets/lock-DRrrTnbi.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/star-DvNMHYbU.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/home-X0C0vdnT.js                   0.38 kB │ gzip:   0.29 kB
dist/assets/target-Ded2rWan.js                 0.39 kB │ gzip:   0.26 kB
dist/assets/heart-ZVQ3JfC1.js                  0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-B_Wedj39.js          0.42 kB │ gzip:   0.30 kB
dist/assets/calendar-Cm7z5Gi-.js               0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-BE9lEKtF.js         0.43 kB │ gzip:   0.31 kB
dist/assets/users-hS7bR561.js                  0.47 kB │ gzip:   0.32 kB
dist/assets/badge-check-BjFxR-1M.js            0.48 kB │ gzip:   0.31 kB
dist/assets/graduation-cap-Ce6RKL9x.js         0.50 kB │ gzip:   0.35 kB
dist/assets/locations-C_cr3ump.js              0.51 kB │ gzip:   0.30 kB
dist/assets/trash-2-BOvxa2kM.js                0.53 kB │ gzip:   0.35 kB
dist/assets/phone-VsjIcZiu.js                  0.56 kB │ gzip:   0.36 kB
dist/assets/trending-up-BAktBXzm.js            0.71 kB │ gzip:   0.37 kB
dist/assets/dog-hIrx36Ic.js                    0.89 kB │ gzip:   0.53 kB
dist/assets/DogPhoto-BNb0nfWU.js               1.19 kB │ gzip:   0.71 kB
dist/assets/OwnerBookings-D6-0-Pb3.js          3.84 kB │ gzip:   1.66 kB
dist/assets/ProBookings-CtkqtqJV.js            3.89 kB │ gzip:   1.65 kB
dist/assets/ProLayout-ChOf6NSm.js              4.35 kB │ gzip:   1.61 kB
dist/assets/ProAnalytics-B209PEik.js           4.70 kB │ gzip:   1.80 kB
dist/assets/VerificationModal-DJ6LsZsu.js      4.82 kB │ gzip:   1.86 kB
dist/assets/imparaContent-C106kGAv.js          5.05 kB │ gzip:   2.13 kB
dist/assets/SearchPage-CsP-aV9I.js             5.50 kB │ gzip:   2.24 kB
dist/assets/ProDashboard-6fpVkFOt.js           5.90 kB │ gzip:   2.05 kB
dist/assets/DogDetailPage-DMFvomgc.js          6.28 kB │ gzip:   2.30 kB
dist/assets/ImparaHomePage-oLW1jvSd.js         6.34 kB │ gzip:   2.28 kB
dist/assets/BreedPage-Dwwdu4Ld.js              6.50 kB │ gzip:   2.22 kB
dist/assets/ImparaLessonPage-C1raNA5O.js       6.76 kB │ gzip:   2.20 kB
dist/assets/SearchCard-C0oej6x7.js             6.95 kB │ gzip:   2.82 kB
dist/assets/FciGroupPage-BCUYCIYd.js           7.42 kB │ gzip:   2.69 kB
dist/assets/OwnerDashboard-DtcUg22r.js         7.47 kB │ gzip:   2.53 kB
dist/assets/fciGroups-BHmHcsg7.js              7.55 kB │ gzip:   2.69 kB
dist/assets/AdminDashboard-VsMYMrT5.js         8.02 kB │ gzip:   2.25 kB
dist/assets/ProCRM-RDIqEph5.js                 8.42 kB │ gzip:   2.72 kB
dist/assets/LegalPages-Cn6dpO4g.js             8.70 kB │ gzip:   2.99 kB
dist/assets/BreederGuidePage-BNU9jzGU.js       9.52 kB │ gzip:   3.45 kB
dist/assets/BecomeProPage-DKTFSFkq.js         10.15 kB │ gzip:   3.20 kB
dist/assets/AuthPages-De0-2zNK.js             11.19 kB │ gzip:   3.38 kB
dist/assets/DogsPage-CBZHfPVP.js              14.15 kB │ gzip:   4.58 kB
dist/assets/ProfessionalProfile-BECy47XH.js   16.26 kB │ gzip:   4.55 kB
dist/assets/ProSettings-Cu4Gbkd3.js           17.37 kB │ gzip:   4.87 kB
dist/assets/BeforeDogPage-uXdRQiSl.js         18.74 kB │ gzip:   6.11 kB
dist/assets/HomePage-CcuWiwKx.js              19.31 kB │ gzip:   6.43 kB
dist/assets/index-Dah0kDQf.js                386.38 kB │ gzip: 109.77 kB
✓ built in 2.87s
```

