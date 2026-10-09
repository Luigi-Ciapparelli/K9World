# Tre guide razza specifiche — 9 ottobre 2026

Base GitHub verificata: `204441b`. Incremento SEO/editoriale richiesto nel
proseguimento del lavoro sugli URL scansionati ma non indicizzati.

## Cosa cambia

- Shikoku, Clumber Spaniel e Dobermann ricevono contenuti originali su origine,
  funzione, vita quotidiana e domande concrete da portare all'allevatore.
- I fatti di razza hanno riferimenti FCI visibili; gli spunti pratici sono
  presentati come elaborazione di PortaleCinofilo. Nessuna approvazione FCI/ENCI
  attribuita al portale, nessuna promessa sul temperamento del singolo cane.
- Ogni guida collega due lezioni pertinenti, il percorso pre-cane e la ricerca
  addestratori. Il percorso rimane facoltativo e senza passaggi obbligatori.
- Titoli e descrizioni specifici sono presenti sia nei metadata sia nell'HTML
  iniziale prerenderizzato. Restano invariati URL, canonical e sitemap da 392 URL.
- Le altre 361 schede mantengono il contenuto esistente; nessuna riscrittura in massa.

File principali: `src/lib/breedGuides.ts`,
`src/components/BreedGuideContent.tsx`, `src/pages/BreedPage.tsx` e
`src/seo/metadata.ts`.

## Fonti verificate

Consultate il 9 ottobre 2026. Sintesi originali; non sono traduzioni integrali
degli standard. Le date sotto sono quelle dello standard e dell'edizione inglese,
distinte dalla data di consultazione.

| Razza | Standard valido / edizione inglese | Fonte primaria |
| --- | --- | --- |
| Shikoku, FCI 319 | 30 ottobre 2016 / 10 febbraio 2017 | [Nomenclatura](https://www.fci.be/en/nomenclature/SHIKOKU-319.html) · [PDF](https://www.fci.be/nomenclature/Standards/319g05-en.pdf) |
| Clumber Spaniel, FCI 109 | 8 settembre 2026 / 6 ottobre 2026 | [Nomenclatura](https://www.fci.be/en/nomenclature/CLUMBER-SPANIEL-109.html) · [PDF](https://www.fci.be/Nomenclature/Standards/109g08-en.pdf) |
| Dobermann, FCI 143 | 13 novembre 2015 / 17 dicembre 2015 | [Nomenclatura](https://www.fci.be/en/nomenclature/DOBERMANN-143.html) · [PDF](https://www.fci.be/Nomenclature/Standards/143g02-en.pdf) |

Per il Clumber è stata verificata l'edizione 2026, distinta dalle copie del
2011 ancora reperibili nei risultati di ricerca. Non sono state copiate immagini
degli standard. Non si introducono prescrizioni mediche o attestazioni sanitarie.

## Verifiche e confini

Superati TypeScript, build di produzione e test SEO: contenuti presenti
nell'HTML delle tre pagine, canonical stabili, link alle lezioni, fonti e scheda
generica di controllo preservata. Build: 396 HTML e 392 URL nella sitemap.

`scripts/tests/test_breed_guides_ui.mjs` verifica le tre guide su desktop
1440 px e mobile 390 px, link reali, passaggio alla lezione, aggiornamento
metadata e assenza di overflow orizzontale. Screenshot desktop/mobile esaminati.
Test eseguiti sulla build di produzione con API simulate: nessun account reale,
contenuto riservato o servizio Supabase coinvolto.

La richiesta di indicizzazione della home è già inviata e la sitemap risulta
riuscita secondo Luigi. Questi testi affrontano una debolezza editoriale concreta;
non dimostrano che fosse la causa dell'esclusione né assicurano l'indicizzazione.
Per lo stato Google leggere [SEO_INDEXATION_2026_10_09](SEO_INDEXATION_2026_10_09.md).

## Rilascio

Installer WSL `aggiorna_guide_razze.py`: controlla la compatibilità prima di
scrivere, crea backup e preserva lo staging estraneo. `--publish` esegue
TypeScript, build e test SEO, poi commit dei soli file dell'incremento e push
su main. Nessuna migration, modifica DNS, spesa o pubblicazione social.
Il test browser è già eseguito nell'ambiente di preparazione; l'installer non
scarica browser nel computer di Luigi. Vercel Ready e risultato Google sono
riscontri successivi distinti dal test locale e dal push.
