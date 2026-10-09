# Google: analisi degli URL esclusi ricevuti il 9 ottobre 2026

Questa diagnosi sostituisce la richiesta generica dei tre elenchi Search Console.
I dati sono arrivati: CSV per le 264 pagine rilevate; tre URL scansionati e home
duplicata indicati da Luigi. Non sono una penalizzazione attestata né una prova
che tutto il sito sia escluso da Google.

## Dati conservati

- [CSV originale dei 264 URL](audits/20261009_search_console_discovered.csv),
  ricevuto come `Tabella.csv`: 264 righe, 264 URL unici, nessun duplicato interno.
- [Riscontri HTTP pubblici del 9 ottobre](audits/20261009_public_seo_checks.json).
- Le tre schede scansionate/non indicizzate: `/razze/shikoku`,
  `/razze/clumber-spaniel`, `/razze/dobermann`. Ultima scansione riportata:
  **5 ottobre 2026**.
- Duplicata con canonical Google diversa: `https://www.portalecinofilo.com/`.
  Ultima scansione riportata: **4 ottobre 2026**.

Nel CSV tutte le date «Ultima scansione» sono `1970-01-01`: non rappresentano
una scansione avvenuta allora. In questo report si trattano come timestamp
non informativo, senza ricavarne una data di visita di Googlebot.

| Famiglia rilevata/non indicizzata | URL |
| --- | ---: |
| Schede razza | 246 |
| Gruppi FCI | 7 |
| Impara e singole lezioni | 7 |
| Ricerca quotidiana | 1 |
| Sport | 1 |
| Criteri di ranking | 1 |
| Scelta dell’allevatore | 1 |
| **Totale** | **264** |

I 7 URL di Impara comprendono la pagina del percorso e 6 lezioni. I percorsi
esatti sono nel CSV: non dedurre che anche le altre due lezioni siano escluse.

## Controlli pubblici eseguiti

Campione senza sessione: home, Impara, timing, ricerca, Sport, Esposizioni,
ranking e tutte e tre le razze segnalate. Per ognuna:

- risposta HTTP **200** e contenuto presente nell’HTML iniziale;
- un solo canonical verso la stessa pagina sul dominio `www.portalecinofilo.com`;
- meta robots `index, follow, max-image-preview:large`, nessun `X-Robots-Tag` restrittivo;
- robots.txt non blocca questi percorsi.

La sitemap online contiene **392 URL**; **tutti i 264 del CSV vi compaiono**.
Le varianti della home `.com` senza www, `.it` con/senza www e HTTP arrivano
alla home HTTPS con www. Il controllo ha seguito i redirect, senza affermare
un particolare codice per ogni passaggio intermedio.

Questo esclude un `noindex`, un errore HTTP o un’assenza dalla sitemap osservati
su questo campione adesso. Non dimostra disponibilità continua, comportamento
di Googlebot, stato dei flussi autenticati o inclusione nell’indice.

## Decisioni motivate

**Home duplicata.** Il canonical dichiarato ora è corretto. Manca soltanto
l’indirizzo mostrato da Search Console in «Pagina canonica scelta da Google».
Senza quello non cambiare dominio, canonical o redirect alla cieca. Un risultato
di una vecchia scansione può differire dallo stato attuale; va verificato.

**Tre razze scansionate.** Non emergono blocchi di accesso nel controllo attuale.
Il codice usa testi comuni del gruppo FCI per ampie parti delle schede. È un
limite editoriale concreto; che determini queste esclusioni è un’ipotesi,
non una diagnosi comunicata da Google. Priorità successiva: rendere utili e
specifiche queste tre schede con fonti ufficiali di razza, storia/funzione,
gestione e domande per allevatore/professionista, senza promesse comportamentali
basate sulla sola razza. Non generare in massa 364 varianti dello stesso testo.

**264 pagine rilevate.** La sitemap le include già. Dare precedenza a Impara,
lezioni e ricerca, poi gruppi/schede utili; verificare Controllo URL e link
contestuali. Non reinviare continuamente la sitemap, comprare indicizzazione,
impostare canonical delle razze verso la home o aggiungere `noindex` in massa.

**Impara.** Il riordino richiesto conserva tutti gli URL; il prerender e la
sitemap rimangono coerenti con il percorso. Non occorre una migrazione SEO.

## Prossimo controllo concreto

Luigi: Search Console → Controllo URL → incollare la home → Indicizzazione
delle pagine → copiare solo **Pagina canonica scelta da Google**. Non servono
password, token o l’intero export di nuovo.

Assistente: confrontare quel valore con canonical/redirect attuali e correggere
solo l’incongruenza osservata; preparare poi i tre approfondimenti editoriali.
Confrontare nel tempo indicizzazione delle pagine prioritarie, impressioni e
clic utili. Nessuna data garantita di indicizzazione.

## Disponibilità e limiti dell’indagine

Luigi non ha ricostruito la causa dell’interruzione di alcune ore e ipotizza
il servizio gratuito. Non esistono prove sufficienti per attribuire il problema
a Vercel, Supabase, DNS o al piano. Nessun upgrade o home server giustificato
da questa sola ipotesi. Se ricapita: ora/fuso, URL, errore e distinzione fra
pagina irraggiungibile e funzione interna guasta, poi correlazione dei log.

## Fonti primarie

Consultate il 9 ottobre 2026:

- [Google — Report Indicizzazione delle pagine](https://support.google.com/webmasters/answer/7440203?hl=it).
- [Google — Canonical e consolidamento dei duplicati](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=it).

Google distingue scoperta, scansione e indicizzazione; una dichiarazione canonical
è un segnale e non garantisce la scelta dello stesso URL. La priorità è rendere
indicizzabili e utili le pagine importanti, non ottenere il 100% delle varianti.
