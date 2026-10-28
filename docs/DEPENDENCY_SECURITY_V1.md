# SEC-03 — dipendenze riproducibili e server di sviluppo

28 ottobre 2026. Base: `09faf22`. Preparazione di una correzione tecnica;
esiti CI, merge e deploy vanno letti nella PR del blocco. Nessuna migration,
modifica di account, raccolta di dati o invio di messaggi.

## Problema verificato

L'installazione locale precedente risolveva Vite `5.4.21` ed esbuild `0.21.5`.
`npm audit --json` ha riportato due pacchetti vulnerabili: Vite (high) ed esbuild
(moderate), con più advisory associati. Entrambi sono dipendenze di sviluppo.
I nove avvisi del vecchio run CI appartenevano a un'altra installazione:
non vanno sommati o considerati automaticamente risolti dal solo cambio di conteggio.

Gli advisory riguardano il server di sviluppo, le sue richieste e integrazioni.
Vercel serve l'output statico `dist`, non il processo Vite usato sul computer
di sviluppo. Non è stata osservata una violazione del sito e un audit npm non
controlla RLS, dati Supabase, contratti o conformità legale.

## Correzione

- Vite `~6.4.5`: ramo che riceve aggiornamenti di sicurezza al controllo del
  28 ottobre. Il plugin React già risolto a `4.7.0` lo supporta. La `6.4.4`
  è esclusa: l'advisory GHSA-8g5g-mxqh-grgj indica la correzione in `6.4.5`.
- esbuild risolto a `0.25.12` tramite Vite, senza override incompatibili.
- `package-lock.json` versionato: dipendenze e integrità riproducibili.
  React, Supabase e le altre versioni della precedente risoluzione restano
  preservate; cambiano Vite, la relativa catena e lo strumento browser di test.
  Anche l'installazione Vercel è esplicitamente `npm ci`.
- Playwright `1.56.1` diventa dipendenza di sviluppo esplicita: è la stessa
  versione già usata dalle workflow. Le tre workflow esistenti usano `npm ci`
  e si attivano anche per modifiche a manifest, lockfile o configurazione Vite.
- Nuova CI `Dependency security`: audit, regressione del server di sviluppo,
  TypeScript, build/SEO, ricerca e percorso prenotazione/messaggi sul compilato.
  Nessun `npm audit fix --force` e nessun aggiornamento generale a Vite 8.

Per installare il progetto usare `npm ci`, che richiede coerenza fra manifest
e lockfile. CI usa Node 22. Il lockfile vincola le versioni anche quando il manifest
permette aggiornamenti: una nuova risoluzione richiede diff, audit e verifiche.
Non usare il server di sviluppo come hosting pubblico; per accesso da WSL/telefono
limitare l'esposizione alla rete necessaria e arrestarlo al termine.

## Prove e limiti

L'audit della nuova risoluzione riporta **0 vulnerabilità note**, sia completo
sia con `--omit=dev`, al 28 ottobre. È una fotografia del database advisory,
non una garanzia di assenza di vulnerabilità future o non catalogate.

`test_dev_server_boundary.mjs` crea una directory temporanea con soli dati
sintetici: otto richieste a file riservati vengono respinte con HTTP 403 anche
con parametri di importazione; il codice pubblico rimane disponibile e manca
l'autorizzazione CORS per un'origine estranea. Non legge file riservati del progetto.

Build e prove browser devono riuscire prima del merge; gli esiti sono nella PR.
Le fixture browser bloccano i servizi esterni e simulano Supabase: non provano
invii email, permessi o migration nel database reale. TRUST-01/02 restano aperti
per i rispettivi controlli. L'avviso di deprecazione di ESLint 9 è distinto dagli
advisory: il suo aggiornamento maggiore richiede compatibilità dei plugin e non
viene mascherato come parte della correzione Vite.

## Fonti primarie consultate il 28 ottobre 2026

- [Versioni supportate Vite](https://vite.dev/releases).
- [Migrazione Vite 5 → 6](https://v6.vite.dev/guide/migration.html).
- [Regressione corretta in Vite 6.4.5](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj).
- [Advisory esbuild](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).

Il controllo del registry npm ha confermato le versioni e i peer ammessi dal
plugin React. Gli output integrali locali non contengono prove di dati utenti
o di accesso a infrastrutture di produzione.
