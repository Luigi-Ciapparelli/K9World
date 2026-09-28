# Home e navigazione — 28 settembre 2026

## Problema e decisione

Luigi ha chiesto una revisione netta della Home: menu desktop poco riconoscibile,
inviti ripetuti alle stesse destinazioni e grandi blocchi editoriali interrompevano
la ricerca di informazioni o di un professionista. La Home deve orientare verso
azioni concrete per il proprietario e rendere evidente il valore educativo gratuito.

## Cosa cambia

- Menu desktop con pulsanti delimitati, icone, stati attivi e ricerca quotidiana
  in evidenza. Account, tema e ingresso professionisti sono separati dalle
  destinazioni del proprietario. Menu mobile utilizzabile anche da tastiera.
- Primo schermo: proposta chiara, accesso a Impara e ricerca immediata di un
  addestratore. La città è facoltativa; suggerimenti dal catalogo italiano già
  presente e coordinate solo per una corrispondenza univoca.
- Pensioni, pet sitting, passeggiate e toelettatura portano alle categorie reali.
  Il vecchio link `/?section=services`, privo di una destinazione operativa,
  è sostituito da un menu con accessi diretti alle ricerche.
- Impara mostra tre lezioni esistenti con accesso diretto; Prima del cane ha
  uno spazio dedicato a chi deve ancora scegliere.
- Sport ha un blocco autonomo e un ingresso distinto nel menu. Non compare
  alcuna scelta Gestione/Sport nel percorso di ricerca quotidiano.
- Area professionisti distinta: presentazione competenze e strumenti di lavoro.
- Eliminati dalla Home i grandi blocchi statistici, `Evidence layer`, la
  progressione illustrativa non operativa e gli inviti finali ripetuti.
  Le pagine educative e di verifica conservano il proprio contenuto.
- Colori coerenti nei temi chiaro/scuro e layout provato da 320 a 1920 pixel.
  Link reali per mantenere apertura in nuova scheda, copia indirizzo e tastiera.

## Ambito

Base: `ff721ce`, abbonamenti professionali. Modifiche frontend e documentazione;
nessuna migrazione, modifica ai dati, politica di accesso o configurazione Vercel.
L'accesso dalla Home degli utenti autenticati continua a portare all'area owner,
professional o admin. La Home pubblica si vede senza sessione autenticata.

Il merito Working-Dog multi-disciplina rimane incompleto; nessun testo nuovo
presenta come verificato un badge non ancora operativo. Non promettere una
sincronizzazione dei progressi Impara: i progressi attuali restano nel browser.

## Verifiche

- TypeScript e build Vite superati, flag continuità attivo e configurazione
  Supabase sintetica per le prove isolate.
- ESLint sui componenti modificati, controllo whitespace Git.
- Chromium con API simulate: ricerca con/senza città, coordinate Rimini,
  servizi, Sport, apertura lezione, menu mobile, Escape, chiusura su navigazione.
- Nessuno sconfinamento della Home a 320, 390, 768, 1024, 1280 e 1920 pixel;
  immagini desktop/mobile/tema scuro ispezionate.
- Accessi automatici ai tre ruoli conservati; nessun errore JavaScript raccolto.

Le prove non interrogano il database online. Dopo il push identificare il
deployment Vercel tramite il commit del rilascio prima di dichiararlo Ready.
