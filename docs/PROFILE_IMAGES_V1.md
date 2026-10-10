# Foto dei profili — IMG-01

9 ottobre 2026. Base GitHub esaminata: `558e0d5`.
Implementazione ora su GitHub (`e6e38c9`); applicazione online e Ready non
osservati direttamente da questo ambiente. Il registro corrente prevale su
questo checkpoint. Il correttivo del 10 ottobre serializza le anteprime e
ottimizza anche le foto dei cani: [PHOTO_UPLOAD_OPTIMIZATION_V1](PHOTO_UPLOAD_OPTIMIZATION_V1.md).

## Uso

- Professionista o centro: **Profilo guidato → Foto e link** (`/pro/settings?step=appearance`).
  Caricare foto/logo e banner, scegliere l’inquadratura, controllare l’anteprima
  e salvare. Vale anche per il professionista individuale e l’handler.
- La foto/logo appare nella ricerca esistente e nel profilo pubblico. Il banner
  appare in apertura del profilo. Nessun nuovo livello di verifica è assegnato.
- Cliente: foto nella dashboard oppure **Profilo e recapiti** (`/account/contacts`).
  Foto facoltativa e privata, con spiegazione dei destinatari prima del caricamento.
- I professionisti autorizzati la vedono accanto al nome in richieste, dashboard,
  dettaglio giornaliero del calendario e CRM. Nessuna foto obbligatoria per prenotare.

## Dimensioni e conservazione

| Immagine | Copia preparata dal browser | Limite copia | Spazio nuovo |
| --- | --- | --- | --- |
| Foto/logo professionale | WebP, entro 512 × 512 | 160 KiB | Un oggetto `avatar.webp` |
| Banner professionale | WebP, entro 1600 × 600 | 500 KiB | Un oggetto `cover.webp` |
| Foto cliente | WebP, entro 384 × 384 | 128 KiB | Un oggetto `portrait.webp` |

Input JPG, PNG o WebP entro 10 MiB, 32 megapixel e 16.000 pixel per lato.
Controllo intestazione e dimensioni prima della decodifica; WebP animati respinti.
Il canvas produce una copia statica nuova, senza trasferire EXIF/GPS dell’originale.
Nessun originale viene caricato. Immagine intera o ritaglio, posizione verticale,
anteprima esatta della copia; nessun ingrandimento artificiale della sorgente.

Upload con sostituzione dello stesso percorso, evitando file nuovi a ogni cambio.
Una concorrenza fra due dispositivi segue l’ultima scrittura riuscita; non è uno
storico fotografico. Cache pubblica breve e parametro versione sul riferimento.
File/URL precedenti sono conservati, senza cancellazione automatica di immagini
legacy o esterne: il limite di due oggetti riguarda il nuovo flusso, non certifica
che ogni vecchio account occupi già soltanto due file. Pulizia legacy da effettuare
solo dopo ricognizione dei riferimenti, attraverso Storage API e con backup.

Il bucket pubblico impone 500 KiB per oggetto; quello privato 128 KiB. MIME WebP
vincolato nei bucket e percorsi esatti nelle policy. Il sotto-limite avatar 160 KiB,
la decodifica e la compressione sono controlli del client: il server non esegue
qui un decoder o uno scanner dei byte. Non descrivere queste prove come un controllo
antimalware. HEIC/SVG/PDF/audio/video non sono ingressi supportati dall’editor.

## Permessi della foto cliente

Il bucket `client-portraits` è privato. Il proprietario del file deve avere ruolo
`owner`; soltanto lui può caricare, sostituire o cancellare il suo percorso.
Il file non viene scritto nel campo pubblico `profiles.avatar_url`.

Un professionista deve essere approvato e avere almeno uno di questi rapporti:

1. Prenotazione con il cliente in attesa, accettata o completata.
2. Relazione bilaterale attiva con un cane ancora del proprietario autorizzante.

Un invito non ancora accettato, una sola prenotazione rifiutata/annullata, una
relazione revocata o il cambio proprietario del cane non bastano. Un diverso
rapporto valido può comunque autorizzare l’accesso: per esempio una prenotazione
completata rimane valida anche dopo la chiusura della relazione con il cane.
Non vengono concessi accessi impliciti ad anonimi, altri clienti o amministratori.
Questi diritti non estendono l’accesso alle note o allo storico condiviso.

RPC e policy Storage verificano l’autorizzazione. `get_client_portraits` risolve
anche i clienti dalle prenotazioni, senza aggiungere ID personali alle proiezioni
pubbliche. Batch massimo 100 identificativi; URL firmati per 60 secondi, rinnovati
solo per viste attive. Nessuna cache globale o localStorage delle foto private.
Il cambio account scarta le risposte obsolete. Un ritratto assente o un errore
non blocca le richieste: restano le iniziali. Link già firmati possono valere fino
alla scadenza; una copia già scaricata non è revocabile a distanza.

## Migration e compatibilità

`20261009140000_profile_images.sql`: bucket/limiti, policy, RPC con confine
`pc_private` e due proiezioni esistenti corrette per non nascondere il banner
agli individuali. Le firme, i filtri e i permessi pubblici preesistenti restano
invariati. Se il testo delle proiezioni è diverso dalla base verificata la
migration si interrompe atomicamente: non forzare una sostituzione alla cieca.

Applicare prima la migration e pubblicare subito il frontend nello stesso rilascio:
la vecchia UI usa nomi timestamp e JPG/PNG, che le nuove policy non accettano più.
La consultazione delle immagini esistenti continua. Se fallisce l’associazione
al profilo dopo un upload, l’editor conserva la copia e consente il retry. Se il
percorso era già usato, la sostituzione dei byte può essere già avvenuta: non
promettere una transazione unica fra Storage e Postgres.

La rimozione pubblica scollega prima il profilo, poi rimuove lo slot Storage.
Nessuna cancellazione di account o bonifica generalizzata viene implementata qui.
La gestione della cancellazione account deve includere separatamente gli oggetti
Storage: non presumere che una cascade SQL elimini i byte, né che il backup del
database li contenga. Usare Storage API, non DELETE manuali su storage.objects.

## Verifiche e rilascio

- Test SQL sull’intera storia: 54 migration precedenti più la nuova, ruoli reali
  PostgreSQL, isolamento, stato prenotazioni, relazione/invito, revoca, cambio
  proprietario, cancellazione del file, permessi RPC e banner individuali/handler.
- Esecuzione locale in PostgreSQL WASM; Auth/Storage simulati. Il runner Python
  ripete la stessa fixture in PostgreSQL nativo isolato nel terminale WSL.
- Browser reale desktop/mobile con API simulate: compressione effettiva in WebP,
  intestazione falsa respinta, retry dopo errore, slot limitati, foto in ricerca
  e profilo, ritratto cliente in richieste/CRM e rimozione.
- TypeScript, build e controlli HTML SEO. Nessuna prova dei servizi reali Supabase,
  di upload simultanei su più dispositivi o di ripristino Storage inclusa.

Installer: `aggiorna_immagini_profili.py ~/K9World --publish`.
Prima verifica file e dipendenze, preserva conflitti, crea backup; esegue test SQL,
typecheck/build/SEO. Il dry-run deve includere solo questa migration o risultare
già allineato. Poi commit recuperabile, db push e push main, senza force push.
L’installer non acquista servizi e non invia messaggi. Dopo Ready, prova una foto
reale facoltativa con account cliente e professionista autorizzato; la verifica
frontend simulata non sostituisce la consegna reale dello Storage.

## Decisione sui media delle sessioni

Rinviati. Prima matrice di quote per futuri piani del portale: spazio, tipi,
durata/dimensioni, traffico, trasformazioni, temporanei, backup e conservazione.
Misurare qualità utile e costo totale; ammettere ciò che serve al lavoro sul cane,
non caricare o duplicare file senza utilità. Downgrade, avvisi, export e cancellazioni
devono avere regole esplicite. Non sono decisi prezzi o capacità dei piani; gli
abbonamenti alle lezioni esistenti sono un oggetto diverso. Vedere
[PROFESSIONAL_CONTINUITY_MEDIA](PROFESSIONAL_CONTINUITY_MEDIA.md).

Riferimenti tecnici:
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://supabase.com/docs/guides/storage/buckets/fundamentals
