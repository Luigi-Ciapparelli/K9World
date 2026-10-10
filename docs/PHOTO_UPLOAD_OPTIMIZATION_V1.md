# Ottimizzazione del caricamento foto

10 ottobre 2026. Base GitHub verificata: `d3517b5`. Incremento frontend preparato;
non confondere test locali, push Git e verifica dello Storage online.

## Problemi corretti

Le foto dei cani venivano ancora caricate come originali fino a 8 MiB. Una
sostituzione manteneva il percorso e poteva lasciare la vecchia foto nella scheda.
L’editor professionale ricalcolava l’intera immagine per ogni movimento dello
slider, anche quando una preparazione precedente non serviva più.

## Comportamento

- Foto cane: JPG/PNG/WebP fino a 8 MiB in ingresso, controllo della firma reale,
  massimo 32 megapixel e 16.000 pixel per lato prima della decodifica. La copia
  WebP statica è entro 512 × 512 pixel e 160 KiB; niente ingrandimento artificiale.
  Il canvas non trasferisce i metadati EXIF/GPS dell’originale.
- Anteprima dei byte che saranno effettivamente caricati. Salvataggio sospeso
  durante la preparazione; rimuovere la foto o chiudere il modulo annulla il lavoro
  pendente. La copia già preparata non viene ricompressa durante l’upload.
- Il percorso privato esistente `ownerId/dogId/profile` viene sostituito. Nessun
  nuovo oggetto ad ogni cambio, nessun originale caricato dal nuovo flusso.
- Dopo un upload riuscito le viste del cane richiedono un nuovo URL firmato con
  `cacheNonce`; il componente distingue anche account e percorso, scartando
  risposte vecchie. Upload falliti non emettono la notifica di sostituzione.
- Editor foto/logo, banner e ritratto cliente: attesa di 180 ms dopo i movimenti,
  una sola preparazione alla volta per editor e controlli di annullamento fra
  le fasi asincrone. Il decoder nativo già avviato termina prima di liberare il
  bitmap; non si pretende di interrompere internamente il browser.
- Il tasto di salvataggio usa soltanto la copia corrispondente a file,
  inquadratura e posizione attuali. Un’anteprima precedente non è salvabile.

## Confini invariati

Nessuna nuova migration, funzione Edge, modifica ai bucket o alle policy.
Il limite di 160 KiB per foto cane è qui un controllo del client: il bucket
`dog-photos` mantiene i propri limiti server preesistenti. Nessuna quota per piano
viene introdotta. I vecchi file non vengono convertiti né cancellati in massa.

I nuovi upload cane richiedono cache browser di 60 secondi; gli URL firmati del
cane mantengono la scadenza esistente di 3600 secondi. Sono valori diversi.
`cacheNonce` evita il riuso della vecchia copia nella vista aggiornata: non è una
revoca degli URL già copiati, né una prova che ogni cache esterna sia svuotata.
Nessuna promessa di revocare copie già scaricate. La foto cliente conserva il
proprio flusso privato e la propria scadenza, descritti in PROFILE_IMAGES_V1.

Storage e aggiornamento della riga del cane non sono una singola transazione:
la gestione preesistente degli errori parziali resta esplicita. Due dispositivi
che aggiornano la stessa foto seguono l’ultima scrittura riuscita. Nessuna nuova
sincronizzazione cross-tab o cronologia delle foto. File SVG, HEIC, audio/video
e allegati delle sessioni restano fuori da questo intervento.

## Verifiche

`test_profile_images_ui.mjs`, browser Chromium reale con API simulate:
formato falso, compressione WebP, burst di 15 spostamenti del ritaglio, massimo
un decoder simultaneo per editor, annullamento durante decodifica, retry dopo
persistenza fallita, foto pubbliche in ricerca/profilo e ritratto privato.
Per il cane: copia preparata una sola volta, anteprima uguale ai byte inviati,
limiti rispettati, URL rinnovato dopo sostituzione nello stesso percorso e
rimozione del file. Nessun errore runtime nelle prove desktop/mobile.

TypeScript, build e controlli HTML SEO. Nessuna prova dei servizi Supabase reali;
nessun test SQL ripetuto perché schema e permessi non cambiano. Il browser usa
soltanto endpoint sintetici: non inserire credenziali reali nella fixture.

## Rilascio

Scaricare `ottimizza_caricamento_foto.py` nei Download Windows ed eseguire in WSL:

```bash
cd ~/K9World && python3 /mnt/c/Users/Lugi/Downloads/ottimizza_caricamento_foto.py ~/K9World --publish
```

Lo script controlla tutti i file prima di scrivere, crea backup e preserva
modifiche estranee. Esegue typecheck/build/SEO, poi commit dei soli file elencati
e push main. Nessuna richiesta a Supabase o nuova spesa. Senza `--publish` prepara
e verifica soltanto. Se il remoto o un file pertinente è cambiato si ferma senza
forzare un merge. Dopo il push registrare separatamente il riscontro del deploy.

Riferimento tecnico: https://supabase.com/docs/guides/storage/cdn/smart-cdn
(`cacheNonce` e distinzione fra cache e scadenza degli URL; Smart CDN dipende dal
piano e non viene attivata o acquistata da questo intervento).
