# Home e navigazione — correzione del 28 settembre 2026

## Feedback vincolante di Luigi

Il rilascio `c5285ca` è stato caricato su GitHub dall’utente. Luigi ha approvato
lo stile dei pulsanti superiori ma ha rifiutato il resto della revisione Home:
troppi blocchi ripetevano le destinazioni già raggiungibili dal menu.
La richiesta attuale è rifinire lo stile e riprendere l’identità precedente,
senza aggiungere moduli, menu secondari o riquadri promozionali ridondanti.
Questa correzione sostituisce le decisioni Home descritte in precedenza qui.

## Intervento

- Pulsanti superiori, account e ingresso professionisti mantenuti.
- `Servizi` è un link semplice a `/search`, la ricerca esistente con selettore
  delle categorie. Eliminata la tendina dal menu principale.
- Eliminati il modulo di ricerca nella Home, la riga di servizi quotidiani,
  il blocco promozionale professionisti e gli altri rimandi ripetuti al menu.
- Ripreso il titolo precedente: «Conosci meglio il cane. Costruisci un binomio
  più consapevole.» La prima parte è il titolo, la seconda il sottotitolo.
- Composizione editoriale con caratteri e colori del progetto, spaziature
  regolari, un riquadro sintetico sui bisogni quotidiani e tre testi brevi
  non interattivi. Questi testi non sono nuove funzioni né passaggi obbligatori.
- Un solo collegamento nel corpo Home: Prima del cane, assente dal menu
  principale. Nessun ripristino di Evidence layer o dei grandi blocchi statistici.
- Sport resta una destinazione autonoma del menu. La ricerca ordinaria apre
  direttamente gli addestratori senza chiedere di scegliere una modalità.
- Homepage pubblica e rimandi owner/pro/admin conservati.

## Verifiche e rilascio

Base esaminata: `c5285ca`. Solo Navbar, Home, CSS dedicato e documentazione.
TypeScript, build con continuità attiva, ESLint sui due componenti e diff check
superati. Chromium con API simulate: percorsi dei pulsanti, menu mobile ed
Escape, assenza dei blocchi rimossi, nessuno sconfinamento da 320 a 1920 px,
tema scuro e rimandi ai tre ruoli. Anteprime ispezionate.

Nessun database o dato online modificato. Nessuna migrazione necessaria.
Correzione preparata per applicazione dal WSL dell’utente tramite installer
con verifica dei file, backup, build e pubblicazione opzionale. Non dichiararla
online senza il nuovo commit dell’utente e il deployment Vercel Ready.
