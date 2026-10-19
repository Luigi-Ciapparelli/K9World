# Archivio privato: recupero della registrazione

19 ottobre 2026. Base osservata `3dae13b`. Intervento frontend nell'ambito
della priorità funzionamento e tutela dei dati; nessuna nuova migration.

## Problema verificato

Sul codice precedente, una risposta esplicita `22023` blocca comunque i campi
della nuova sessione: il professionista non può correggere i dati. Riprodotto
con browser e API sintetiche sul commit base. Il riferimento della richiesta
vive inoltre nel solo modulo: chiusura o navigazione lo perdono. Una risposta
senza errore ma con un valore inatteso viene trattata come salvataggio riuscito.

## Comportamento corretto

- Il primo rifiuto esplicito del server consente di correggere il testo e la data.
- Risposta persa, timeout o identificativo inatteso mantengono testo, UUID e
  parametri invariati. Il pulsante **Riprova lo stesso invio** usa la stessa richiesta.
- Chiusura e navigazione nella stessa scheda conservano il tentativo. La relazione
  mostra **Verifica registrazione**, anche quando nel frattempo è stata revocata.
- **Controlla registrazione nell’archivio** ricarica le revisioni già autorizzate.
  Conferma il tentativo soltanto quando trova prima revisione, ID sessione, data,
  attività e nota corrispondenti. Non deduce il successo da un semplice nome.
- Un rifiuto dopo una risposta incerta non cancella il tentativo: il primo invio
  potrebbe essere riuscito prima della revoca. I controlli del server restano validi.
- Lettura archivio con timeout, errore recuperabile e controllo della risposta;
  una lettura fallita non è presentata come archivio vuoto e conserva i moduli aperti.
- Nuove sessioni e date mostrate nella continuità usano il fuso italiano. Gli orari
  inesistenti sono respinti; per il cambio autunnale si sceglie l’occorrenza.

## Privacy e limiti

Il recupero conserva dati soltanto nella memoria della scheda, separati per
relazione e account. Uscita, cambio account e ricaricamento completo li eliminano.
Niente note in localStorage, sessionStorage, URL o log. Non è un backup delle bozze:
il testo non ancora inviato resta nel solo modulo. Anche le rettifiche restano
nel modulo aperto; questo incremento non aggiunge persistenza alle loro bozze.

La conferma dall'archivio esamina soltanto la pagina caricata. Se la prima revisione
è in una pagina successiva, occorre raggiungerla; un risultato assente nella prima
pagina non dimostra che il salvataggio sia fallito. Un ricaricamento completo dopo
un invio incerto richiede di controllare lo storico prima di creare una sessione.
Le RPC mantengono permessi, consenso e controllo di revisione; nessuna estensione
alla lettura di note di altri autori. Media, matching e invii email non sono inclusi.

## Prove e rilascio

- Browser 1440/390, SDK reale e API sintetiche: rifiuto e correzione, doppio clic,
  risposta persa, riapertura, stesso UUID/parametri, revoca e conferma dall’archivio.
- Salvataggio di una rettifica con entrambe le revisioni visibili; conflitto su
  revisione superata con testo conservato. Logica SQL preesistente invariata.
- Fuso browser New York con orari italiani; ora inesistente/ambigua, risposta
  malformata, timeout, navigazione, errore archivio e uscita/rientro nello stesso account.
- TypeScript, test Node account e fusi, build/SEO e lint mirato. Il warning
  Fast Refresh già presente in AuthContext resta distinto dagli errori di compilazione.

Test UI: `scripts/tests/test_continuity_recording_ui.mjs`; usa un server Vite
locale con `VITE_PROFESSIONAL_CONTINUITY=true`, URL Supabase sintetico
`https://pc-home-test.supabase.co` e chiave sintetica. Le richieste esterne vengono
intercettate o bloccate dal test; non utilizza account o note reali.

Installer: `aggiorna_archivio_sessioni.py ~/K9World --publish` nel WSL, con
backup, controllo dei file e commit circoscritto. Typecheck e build/SEO sul
repository di Luigi precedono il push. Nessun comando Supabase necessario.
Presenza su GitHub, Vercel Ready e prova online restano evidenze separate.
