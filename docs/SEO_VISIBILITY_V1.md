# Visibilità sui motori di ricerca — SEO v1

## Riscontro e priorità correnti — 8 ottobre 2026

Verifica Google e invio sitemap sono stati confermati da Luigi nella conversazione;
i passaggi del 29 settembre sotto rimangono il resoconto storico dell'implementazione.
Il report corrente dell'utente contiene 264 URL rilevati non indicizzati,
3 scansionati non indicizzati e 1 duplicato con canonica diversa. Gli URL non sono
ancora disponibili; non è stato confermato un errore unico per tutte le pagine.

Vedere [INTERNATIONAL_SEO_AND_HOSTING_V1.md](INTERNATIONAL_SEO_AND_HOSTING_V1.md)
per audit pubblico, sequenza di lavoro e fonti. Il campione HTML controllato
risponde correttamente; le 364 schede razza su 391 URL di sitemap e i testi
condivisi per gruppo FCI richiedono una valutazione editoriale mirata.
Non ampliare il catalogo multilingue né deindicizzare in massa prima di esaminare
gli URL. Nessuna correzione al codice SEO applicata da questo aggiornamento.

29 settembre 2026. Base GitHub esaminata: `5bfe88b` (profilo professionista guidato).
Incremento frontend e configurazione Vercel, senza migrazioni o scritture al database.

## Problema osservato

Prima dell'intervento, la Home pubblica restituiva un contenitore React vuoto,
`lang="en"`, descrizioni inglesi PawConnect e un'immagine Open Graph bolt.new.
Le pagine usavano frammenti `#/`; `/impara`, `/robots.txt` e `/sitemap.xml`
restituivano 404. Il dominio senza www reindirizzava già a
`https://www.portalecinofilo.com`: questo è il dominio canonico adottato.

## Comportamento implementato

- URL pubblici reali: `/impara`, `/sport`, `/search`, `/razze/...` e le altre
  pagine pubbliche. I vecchi link pubblici `/#/...` vengono riconosciuti e
  sostituiti nell'indirizzo senza aggiungere un passaggio alla navigazione.
- Gli indirizzi personali `/#/owner/...`, `/#/pro/...` e i frammenti Auth
  restano compatibili. Restano le protezioni sulle modifiche non salvate.
- `npm run build` produce il bundle Vite e poi esegue `scripts/build_seo.mjs`.
  Il secondo passaggio renderizza gli stessi componenti React pubblici,
  senza sessioni, chiamate al database o contenuti riservati.
- Sono generati **395 documenti pubblici**, di cui **391 nella sitemap**:
  9 pagine principali, 8 lezioni, 10 gruppi FCI e 364 schede razza.
  Le 4 pagine legali restano accessibili ma non indicizzabili.
- Ogni pagina ha titolo, descrizione, canonical, lingua italiana, anteprima
  Open Graph/Twitter e dati strutturati coerenti con i contenuti esistenti.
  Le lezioni sono `LearningResource`; sono presenti Organization, WebSite
  e breadcrumb. Nessuna recensione, valutazione o qualifica inventata.
- I collegamenti verso lezioni, schede razza, gruppi e profili sono link HTML
  seguibili anche dai crawler. La separazione fra gestione quotidiana e Sport
  resta invariata; il proprietario non deve effettuare scelte aggiuntive.
- Sitemap e robots.txt sono rigenerati dalla stessa lista delle pagine.
  Non sono inventate date `lastmod`. I filtri della ricerca hanno canonical
  alla pagina base e `noindex` nel browser, evitando combinazioni illimitate.
- Le aree private ricevono `noindex`; nessun dato personale entra nell'HTML
  generato. `noindex` non sostituisce autenticazione, RLS o autorizzazioni.
- Gli URL sconosciuti restituiscono 404 anziché la Home. Il service worker
  non trasforma gli errori HTTP in una Home salvata e non memorizza dati privati.

## Confini di questa versione

I profili professionali `/p/:id` e i risultati della ricerca restano dinamici:
il browser carica la proiezione pubblica già prevista dalle API. Il profilo
aggiorna titolo, descrizione e canonical; un profilo assente riceve `noindex`.
Questi profili non sono ancora inseriti automaticamente nella sitemap né
prerenderizzati sul server. La relativa risposta HTTP iniziale è una shell,
quindi non equivale all'indicizzabilità senza JavaScript delle guide.

Le schede razza espongono il contenuto editoriale attualmente disponibile,
anche quando condiviso con il gruppo FCI: il numero di URL non dimostra
qualità o posizionamento. Approfondimenti originali per le singole razze,
fonti e aggiornamenti utili rimangono lavoro editoriale, non testo generato
in serie per riempire la sitemap.

Non è stato aggiunto un tracker, un account Search Console, una verifica DNS,
una chiave o una dipendenza npm. Questa revisione non garantisce né misura
indicizzazione, traffico o posizionamento e non è un audit SEO completo.

## Verifica e pubblicazione

```bash
npm run typecheck
VITE_PROFESSIONAL_CONTINUITY=true npm run build
node scripts/tests/test_seo_build.mjs
```

TypeScript, build, controllo HTML e prove browser descritti sotto sono stati
eseguiti con esito positivo sul pacchetto. Non è stato verificato un nuovo
deployment Vercel né contattato il database online.

Il controllo HTML verifica tutti i 391 URL, i canonical univoci, le lezioni,
i dati strutturati, i collegamenti e l'esclusione delle aree personali.
`scripts/tests/test_seo.mjs` aggiunge un server locale che riproduce le regole
di routing, prove browser con API sintetiche, lettura senza JavaScript e
le regressioni del profilo guidato. Richiede Playwright e Chromium; accetta
`PC_PLAYWRIGHT_MODULE` e `PC_CHROMIUM_PATH`. Non usare credenziali reali nella
build destinata a questi test: le fixture prevedono esclusivamente
`VITE_SUPABASE_URL=https://pc-home-test.supabase.co` e una chiave sintetica.

`vercel.json` imposta il comando di build completo, `cleanUrls` e le sole
riscritture necessarie alle aree dinamiche. Non introduce un catch-all che
nasconderebbe i 404. La configurazione è coerente con la documentazione Vercel;
il test locale non sostituisce la verifica del deployment effettivo.

Dopo il push, verificare **Ready sul commit SEO** e la risposta pubblica di
`/impara`, `/sitemap.xml`, `/robots.txt` e di un URL inesistente (404).
Non dichiarare questa versione online prima di tale riscontro.

Poi in Google Search Console, nella proprietà del dominio verificata:

1. Inviare `https://www.portalecinofilo.com/sitemap.xml`.
2. Controllare Home, Impara e una lezione con Controllo URL; richiedere
   l'indicizzazione se non ancora presenti.
3. Osservare nel tempo pagine indicizzate e query reali prima di decidere
   ulteriori interventi editoriali. Evitare pagine locali o recensioni fittizie.

Se la proprietà non è già verificata, il titolare deve completare la verifica
del dominio; nessun codice DNS è stato creato o assunto in questo intervento.

## Verifica Google Search Console — 29 settembre 2026

SEO pubblicato su GitHub nel commit `2cfc932`. La Home pubblica è stata
ricontrollata: risponde 200 e contiene l'HTML SEO generato.

Luigi ha fornito il meta tag del proprio account Google. È stato aggiunto
all'`head` di `index.html`, fuori dal blocco sostituito dal generatore SEO;
rimane quindi nell'HTML pubblicato, senza dipendere da JavaScript. Non è un
tracker né una credenziale segreta: serve a dimostrare il controllo del sito.
Non rimuoverlo dopo la verifica, né sostituire eventuali token di altri titolari.

La proprietà corretta da aggiungere è di tipo **Prefisso URL**:
`https://www.portalecinofilo.com/`. Luigi aveva indicato `/sitemap.xml/` come
proprietà: quella riguarda un percorso diverso e non rappresenta l'intero sito.
Dopo il deployment di questo tag, selezionare **Tag HTML** e premere **Verifica**.
Poi inviare `sitemap.xml` nella sezione **Sitemap** della proprietà corretta.
Il file `google105ba6469d75c570.html` fornito dall'utente è un metodo alternativo;
questo incremento usa esclusivamente il meta tag.

Il riscontro del tag sul sito e l'esito della verifica Google restano da
confermare dopo la pubblicazione; la presenza del tag locale non li dimostra.

## Riferimenti tecnici

- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: creazione e invio delle sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Vercel: vercel.json, cleanUrls e rewrites](https://vercel.com/docs/project-configuration/vercel-json)
