# CURRENT STATE — PawConnect / Portalecinofilo

> Auto-generated repository snapshot. Generated: `2026-09-14T03:35:49+02:00`

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
 M src/pages/owner/OwnerBookings.tsx
 M src/pages/owner/OwnerDashboard.tsx
 M src/pages/pro/ProBookings.tsx
 M src/pages/pro/ProCalendar.tsx
 M src/pages/pro/ProDashboard.tsx
 M src/pages/pro/ProSettings.tsx
?? docs/BOOKING_MESSAGES_V1.md
?? scripts/tests/test_booking_messages.py
?? src/components/BookingConversation.tsx
?? src/components/BookingMessageInbox.tsx
?? src/components/ProfessionalReplyTemplates.tsx
?? src/lib/bookingMessages.ts
?? supabase/migrations/20260914013218_private_booking_messages.sql
```

## Recent commits

Command:

```bash
git log --oneline --decorate -n 30
```

Exit code: `0`

```text
a712352 (HEAD -> signup-dog-profile, origin/signup-dog-profile, origin/main, origin/HEAD, main) Add professional calendar service colors and unavailability
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
d968f78 Add PawConnect core data model
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
✓ 1568 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                 1.53 kB │ gzip:   0.61 kB
dist/assets/index-CnhilZzH.css                 48.29 kB │ gzip:   9.42 kB
dist/assets/check-DeTPmdcA.js                   0.29 kB │ gzip:   0.24 kB
dist/assets/activity-DQzL9ctw.js                0.31 kB │ gzip:   0.25 kB
dist/assets/fciBreeds-DhDJr-DH.js               0.31 kB │ gzip:   0.25 kB
dist/assets/plus-D2FXbDCw.js                    0.32 kB │ gzip:   0.25 kB
dist/assets/arrow-left-BzQLvqLl.js              0.33 kB │ gzip:   0.27 kB
dist/assets/arrow-right-BzAget-M.js             0.33 kB │ gzip:   0.27 kB
dist/assets/search-BVjtFqvr.js                  0.34 kB │ gzip:   0.27 kB
dist/assets/check-circle-2-Dw6fiYCD.js          0.34 kB │ gzip:   0.27 kB
dist/assets/clock-32rEIbHT.js                   0.35 kB │ gzip:   0.27 kB
dist/assets/clock-3-Cj6Uz3Rv.js                 0.35 kB │ gzip:   0.27 kB
dist/assets/map-pin-0TQxpSft.js                 0.37 kB │ gzip:   0.29 kB
dist/assets/lock-CoZhN3gp.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/star-DNoorzZN.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/home-TYcYPuOm.js                    0.38 kB │ gzip:   0.29 kB
dist/assets/book-open-DQtDzbZL.js               0.39 kB │ gzip:   0.29 kB
dist/assets/bar-chart-3-PPfrld7H.js             0.40 kB │ gzip:   0.29 kB
dist/assets/heart-C3zkxAx2.js                   0.41 kB │ gzip:   0.31 kB
dist/assets/external-link-DKtphjBP.js           0.42 kB │ gzip:   0.30 kB
dist/assets/calendar-CT2rmuH_.js                0.43 kB │ gzip:   0.30 kB
dist/assets/alert-triangle-DMSyyN0R.js          0.43 kB │ gzip:   0.31 kB
dist/assets/users-DF82YbEt.js                   0.47 kB │ gzip:   0.33 kB
dist/assets/badge-check-BR7XceVE.js             0.48 kB │ gzip:   0.31 kB
dist/assets/graduation-cap-D1Ek7SC9.js          0.50 kB │ gzip:   0.35 kB
dist/assets/phone-nun8sxjO.js                   0.56 kB │ gzip:   0.36 kB
dist/assets/calendar-days-iCy6J9V6.js           0.66 kB │ gzip:   0.37 kB
dist/assets/target-n1xj6m-Z.js                  0.71 kB │ gzip:   0.35 kB
dist/assets/dog-D_cHOj0k.js                     0.89 kB │ gzip:   0.53 kB
dist/assets/DogPhoto-JnwSEVn2.js                1.19 kB │ gzip:   0.71 kB
dist/assets/bookingMessages-BIqDAtSh.js         1.47 kB │ gzip:   0.81 kB
dist/assets/professionalCalendar-CiVuepea.js    1.96 kB │ gzip:   0.90 kB
dist/assets/ProLayout-Bihs8Qzh.js               4.24 kB │ gzip:   1.63 kB
dist/assets/VerificationModal-DCl2ddlK.js       4.82 kB │ gzip:   1.86 kB
dist/assets/ProAnalytics-DLg_5dKK.js            5.38 kB │ gzip:   2.10 kB
dist/assets/OwnerBookings-CrkDSnc2.js           5.69 kB │ gzip:   2.32 kB
dist/assets/DogDetailPage-DIadIVhw.js           5.72 kB │ gzip:   2.18 kB
dist/assets/BreedPage-CV7LWYyh.js               6.51 kB │ gzip:   2.21 kB
dist/assets/SearchCard-Bab5-3p3.js              7.10 kB │ gzip:   2.92 kB
dist/assets/FciGroupPage-BZvgFavb.js            7.43 kB │ gzip:   2.69 kB
dist/assets/ProBookings-CGTBhM3l.js             7.50 kB │ gzip:   3.07 kB
dist/assets/fciGroups-BHmHcsg7.js               7.55 kB │ gzip:   2.69 kB
dist/assets/ImparaHomePage-Tb-UDhFt.js          7.82 kB │ gzip:   2.74 kB
dist/assets/AdminDashboard-17eCGC8G.js          8.02 kB │ gzip:   2.25 kB
dist/assets/SearchPage-OrLFwm9n.js              8.15 kB │ gzip:   3.38 kB
dist/assets/ProCRM-Cx8BRNTO.js                  8.49 kB │ gzip:   2.76 kB
dist/assets/LegalPages-Dk35JKRC.js              8.74 kB │ gzip:   2.98 kB
dist/assets/BreederGuidePage-sg0YJrE-.js        9.53 kB │ gzip:   3.46 kB
dist/assets/BecomeProPage-Dh8UXljJ.js          10.16 kB │ gzip:   3.20 kB
dist/assets/ProDashboard-CUrvTSkQ.js           10.90 kB │ gzip:   3.63 kB
dist/assets/AuthPages-C3LhIEjy.js              11.21 kB │ gzip:   3.38 kB
dist/assets/BookingMessageInbox-DYTBPpj-.js    11.81 kB │ gzip:   4.19 kB
dist/assets/OwnerDashboard-Dl_YMT7C.js         13.49 kB │ gzip:   4.28 kB
dist/assets/ContinuityPage-V4Ox8wry.js         13.64 kB │ gzip:   4.67 kB
dist/assets/DogsPage-DJ5Mg1Cf.js               14.58 kB │ gzip:   4.71 kB
dist/assets/HomePage-LtGSmy7m.js               15.20 kB │ gzip:   4.79 kB
dist/assets/ProCalendar-r9TxDDMG.js            16.07 kB │ gzip:   5.55 kB
dist/assets/ImparaLessonPage-bDnXVz-e.js       17.95 kB │ gzip:   5.22 kB
dist/assets/ProfessionalProfile-U490Dlzp.js    23.52 kB │ gzip:   6.87 kB
dist/assets/ProSettings-ZwxKi6w6.js            27.53 kB │ gzip:   7.97 kB
dist/assets/imparaContent-DIr_gzCv.js          29.42 kB │ gzip:   9.28 kB
dist/assets/BeforeDogPage-1yA99Qa7.js          30.03 kB │ gzip:   9.16 kB
dist/assets/index-DP4bKxka.js                 388.14 kB │ gzip: 110.47 kB
✓ built in 3.69s
```

