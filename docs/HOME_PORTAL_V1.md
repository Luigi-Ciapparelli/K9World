# Home — un portone statico e un percorso aperto

## Decisione finale del 5 ottobre 2026

Luigi ha visto la proposta precedente soltanto in video e non l'ha installata.
Conferma composizione, componenti e titolo; rifiuta l'animazione della porta.
La home ora usa un'immagine statica con il cane che attraversa il portone.
Niente riproduzione automatica, replay, sequenza d'ingresso o scroll guidato.
Anche l'ipotesi intermedia di sostituire la home con la ricerca è superata.

Titolo: **Apri la porta al suo mondo.**
Testo richiesto: «Conosci i suoi bisogni, scopri come impara e trova il
professionista adatto a voi per vivere felici e sereni la vostra relazione.»

## Navigazione e percorso

Il primo blocco propone due accessi affiancati:

- Stai pensando a un cane? → Fai il test di scelta.
- Hai già un cane? → Trova un addestratore.

Sotto, una sola sezione mostra quattro tappe consigliate. Sono link reali,
indipendenti e sempre disponibili, non un modulo a passaggi obbligatori.

| Tappa | Destinazione | Scopo |
| --- | --- | --- |
| Parti dalla scelta | `/prima-del-cane` | Orientarsi tra la propria vita e i bisogni del cane |
| Impara a capirlo | `/impara` | Basi gratuite su bisogni, comunicazione e apprendimento |
| Scegli con un addestratore | `/search?type=trainer&source=home&topic=scelta-responsabile&intent=choose-dog` | Confrontarsi prima di accogliere un cane |
| Crescete insieme | `/search?type=trainer` | Trovare supporto nella propria zona |

La terza tappa presenta il contesto corretto nella ricerca, senza fingere che
l'utente abbia completato il test. Invita a chiedere se il professionista offre
consulenza prima della scelta: non certifica questa specializzazione né crea
una nuova modalità di prenotazione senza cane. I vincoli di prenotazione
esistenti rimangono quelli del prodotto.

La ricerca quotidiana non richiede di scegliere una disciplina. Sport resta
separato. Navigazione, footer e rientro degli utenti autenticati nella propria
area rimangono invariati.

## Implementazione

- `src/pages/HomePage.tsx`: composizione, accessi e tappe.
- `src/components/home/PortalEntrance.tsx`: solo immagine con testo alternativo.
- `src/portal-home.css`: layout responsive, focus visibile e tema scuro.
- `src/lib/journeyContext.ts`: contesto per il confronto prima della scelta.

Immagine illustrativa generata in precedenza, non rappresenta un cliente,
un professionista o Kyros. Riutilizzata senza nuovi servizi o dipendenze.
Tre versioni WebP locali: 640 px (20.720 byte), 960 px (38.234 byte) e
1440 px (68.442 byte), scelte tramite srcset. Nessun video o script animato.
Gli asset fotografici della bozza animata non fanno parte di questo rilascio.

## Verifiche

TypeScript, build produzione e verifica SEO: superati. Generati 395 documenti
HTML e 391 URL della sitemap. I test browser verificano immagine caricata,
assenza di animazioni nella home, quattro tappe indipendenti, sei collegamenti,
contesto della ricerca prima della scelta, menu Sport su mobile, tema scuro,
assenza di overflow a 320/390/768/1024/1440/1920 px e link senza JavaScript.
Anteprime desktop e mobile acquisite dall'interfaccia e controllate visivamente.

Test ripetibile dopo il build: `node scripts/tests/test_home_portal.mjs`.
Richiede Playwright; override opzionali PC_CHROMIUM_PATH e PC_PLAYWRIGHT_MODULE.
PC_SCREENSHOTS salva le anteprime. Le richieste Supabase sono simulate: questi
controlli non verificano account o disponibilità di professionisti reali.

## Stato e applicazione

Base GitHub: `599e152a494c41f08a3740140158501ae1786392` su main.
Modifica preparata e verificata localmente; non dichiararla online senza push
e Vercel Ready. Nessuna migration, Edge Function o configurazione Auth richiesta.

Usare **aggiorna_home_statica.py**, che sostituisce il precedente pacchetto
animato. Verifica i file prima di scrivere e conserva un backup. `--check`
esegue solo il controllo; senza opzioni applica e verifica localmente;
`--publish` esegue anche commit mirato e push normale su main, senza forzature.
Una divergenza dei file ferma l'operazione: rileggere il codice aggiornato,
non disabilitare la protezione. Non tocca account, database o invii di messaggi.
