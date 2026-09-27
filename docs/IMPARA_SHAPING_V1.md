# Impara: shaping sulla piattaforma e basi dell’apprendimento

27 settembre 2026. Base verificata su GitHub: `1e8cbb3`, Impara v3.
Questo incremento è preparato e collaudato localmente; il documento non attesta
un deployment. Non richiede migration, account o modifiche a Supabase.

## Richiesta e risultato

La presentazione del laboratorio **Allena il tuo timing** resta nel percorso
Impara. La scena astratta viene sostituita con un cane animato originale che
raggiunge una piattaforma bassa. Il risultato didattico è capire lo shaping,
non superare una prova di riflessi o acquisire una qualifica.

Quattro criteri, mostrati uno per volta:

1. Guarda la piattaforma.
2. Si avvicina al bordo.
3. Appoggia una zampa anteriore.
4. Appoggia anche la seconda zampa anteriore.

Ogni passaggio parte su richiesta. Un click anticipato o tardivo dà un feedback
e permette di riprovare; un click corretto salva quel passaggio. Il premio segue
il click anche se impreciso: un marker appreso non deve diventare inaffidabile.
Il passaggio seguente si apre dopo il feedback corretto e il premio.
Il movimento e la valutazione usano lo stesso tempo della scena visualizzata:
criterio raggiunto da 3,2 a 5,2 secondi. La finestra ampia è deliberatamente
didattica. Nessuna valutazione della destrezza professionale.

La modalità **Senza fretta · fotogrammi guidati** avanza solo su richiesta;
non richiede velocità ed è preselezionata se il dispositivo richiede movimento
ridotto. Mouse, tocco e tastiera sono supportati; il suono è facoltativo.
Cambiare finestra interrompe il tentativo. I quattro passaggi completati e la
ripresa sono salvati nel progresso locale. Riprovare non cancella un successo.

L’animazione SVG non è un filmato di un cane reale e non richiede download
esterni. Il vecchio MP4 non viene usato dal laboratorio. È spiegato che nella
realtà servono ripetizioni e criteri adattati al soggetto: quattro click nella
simulazione non rappresentano il tempo necessario a insegnare un comportamento.

## Contenuti di base

La lezione **Come impara il cane: le basi** distingue condizionamento classico
e operante con esempi; presenta antecedente–comportamento–conseguenza, i quattro
quadranti, marker, shaping, cattura, luring, segnali, generalizzazione,
mantenimento, abituazione, sensibilizzazione ed estinzione. Introduce i limiti
di un percorso generale e quando approfondire con un professionista.
Le definizioni non sono inviti a sperimentare coercizione o provocare reazioni.

Riferimenti consultati: glossario e materiali Karen Pryor, AKC sul condizionamento
operante, Merck Veterinary Manual sui processi di apprendimento. Sono collegati
nelle lezioni; esempi e attività sono formulazioni del portale.

Il percorso mantiene otto lezioni. Le verifiche diventano cinque domande nella
lezione del timing e otto in quella delle basi; resta la soglia del 75% arrotondata
per eccesso. Una nuova attività aiuta a distinguere classico e operante.

## Compatibilità dei progressi

- URL delle lezioni e chiave `portalecinofilo-impara-v3` invariati.
- Appunti e attività preesistenti conservati, compreso il glossario personale.
- I vecchi punteggi della sfera non completano il nuovo esercizio di shaping.
- Letture con nuovi identificatori e quiz ampliati richiedono completamento;
  i risultati delle altre lezioni restano validi.
- Export del quaderno e backup includono i passaggi di shaping. Nessun dato
  viene trasformato in badge, ranking o credenziale professionale.

## Verifiche

Comandi: `node scripts/tests/test_impara_progress.mjs`,
`node scripts/tests/test_shaping_lab.mjs`, `npm run typecheck`,
`VITE_PROFESSIONAL_CONTINUITY=true npm run build`.

Il test browser `scripts/tests/test_impara_ui.mjs` usa le istruzioni con backend
sintetico di `IMPARA_RELEASE_V3.md`. Verifica click precoci/corretti/tardivi,
sequenza, animazione, tastiera, ripresa dopo reload, quaderno/backup e tema scuro
su mobile. Ispezione visiva delle zampe sulla piattaforma. Nessun account reale
o servizio Supabase coinvolto.

## Applicazione

`aggiorna_shaping_impara.py` controlla gli hash dei file esaminati e crea un
backup prima di scrivere. È idempotente. Con `--publish` esegue test, TypeScript
e build, poi committa e invia solo questo incremento a `main`. Si ferma su file
incompatibili o altri lavori da pubblicare; non modifica database o configurazioni.
Il rilascio online è confermato soltanto dal successivo deployment Vercel Ready.

## Prossimo blocco già richiesto

Riprendere gli strumenti professionali precedentemente rimossi. Analizzare lo
stato corrente e riattivare ogni strumento solo con flussi, permessi e persistenza
funzionanti. Questo incremento Impara non li implementa e non li dichiara pronti.
