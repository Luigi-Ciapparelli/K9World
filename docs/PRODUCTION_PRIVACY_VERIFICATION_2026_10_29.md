# Verifica tecnica dell'ambiente online — 29 ottobre 2026

Base del repository: `1eec921` (PR #8). Questo documento registra controlli
effettivamente svolti; non certifica la conformità complessiva dell'attività.
Nessun recapito, documento di qualifica, archivio personale o chiave viene
pubblicato qui. Gli inviti commerciali rimangono sospesi.

## Verifiche concluse il 28 ottobre, riconferma dello stato il 29

- Ammissione addestratori: migration `20261021100000` già applicata sul progetto
  collegato al repository. Le 14 funzioni controllate coincidono con il codice
  versionato. Non riapplicare il reset iniziale delle approvazioni.
- Ricevute iniziali: migration `20261028120000` applicata. SQL SHA-256
  `958a6206770040c2dc398e05c2891974ebd3d4c08c7ff9e8dc42c37e5140228b`.
  Il connettore aveva assegnato il numero `20261028181436`: la cronologia è stata
  allineata al file versionato solo dopo aver confrontato l'intero SQL, senza
  rieseguirlo o segnare come eseguito codice non applicato.
- Prova SQL sul database reale con soli account sintetici in una transazione
  interamente annullata: ricevuta per proprietario/professionista, assenza di
  autoapprovazione e autoverifica email, metadati modificabili che non riscrivono
  la ricevuta, input non valido senza record parziali, cancellazione a cascata.
  Nessuna chiamata al servizio di invio email e nessun account di prova conservato.
- Tabelle di ricevute e ammissione: RLS attiva e accessi diretti negati ai ruoli
  client; funzione di acquisizione non invocabile direttamente; trigger attivo.
- Data API: richiesta HTTP anonima allo schema `pc_private` respinta con
  `406 / PGRST106`. Il controllo usa una chiave pubblicabile, non una chiave server.
- Configurazione pubblica Auth: conferma automatica email disattivata, accesso
  email attivo; registrazioni anonime e accesso telefonico disattivati. Questo
  non prova da solo la consegna SMTP o le soglie antiabuso del servizio.
- Nessuna tabella pubblica accessibile ai client senza RLS; nessuna vista pubblica
  leggibile dai client priva di `security_invoker`; nessuna funzione `SECURITY
  DEFINER` nello schema pubblico eseguibile da `anon` o `authenticated` nei
  controlli svolti. Non equivale a un penetration test di ogni endpoint.
- Deploy Vercel di `1eec921`: esito `success` osservato. Frontend e database
  sono stati verificati separatamente.

## Correzione del limite foto cane

Il controllo reale ha trovato `dog-photos` privato, ma con `file_size_limit` e
`allowed_mime_types` non impostati. Il sito produce già WebP entro **160 KiB**:
il solo controllo browser non impedisce chiamate dirette con file più grandi.

La migration `20261029051635_limit_dog_photo_uploads.sql` imposta **163.840 byte**
e `image/webp` per i futuri upload e sostituzioni. Verifica prima che il bucket
atteso sia privato. Non cambia oggetti esistenti, percorsi, proprietari, RLS,
URL firmati o gli altri bucket. Non converte né elimina i vecchi originali.
Il MIME ammesso non è un controllo antivirus o una validazione server del
contenuto dell'immagine. Non vengono introdotti allegati alle sessioni o quote
commerciali per abbonamento.

La suite `test_signup_legal_receipts.py` ricostruisce ora **75 migration**,
verifica i limiti e la conservazione di un oggetto preesistente sintetico,
degli altri bucket e delle policy; ripete le verifiche di ricevute e ammissione.
Auth/Storage sono dipendenze SQL simulate. Non viene presentato questo test come
prova di un upload reale autenticato al servizio Storage. Esiti CI, applicazione
online e cronologia finale sono registrati nella PR di questo incremento.

## Avvisi distinti dalle verifiche superate

Security Advisor dopo le ricevute: **0 errori, 1 warning, 48 segnalazioni INFO**.
Il warning è la protezione contro password già compromesse disattivata;
[Supabase la offre dal piano Pro](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Non è stato attivato un piano a pagamento. Le INFO riguardano tabelle con RLS
senza policy, chiuse per accessi diretti e utilizzate tramite API controllate:
non aggiungere policy permissive per cancellare la segnalazione.

Il Performance Advisor è separato: 15 warning su policy permissive multiple,
33 INFO su foreign key senza indice e 24 INFO su indici non utilizzati al
momento del controllo. Non rimuovere gli indici o fondere le policy senza
misurare le query interessate e mantenere i confini di autorizzazione.

Versione database osservata: PostgreSQL `17.6.1.113`. Il
[changelog del fornitore](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes)
annuncia aggiornamenti di sicurezza: verificare disponibilità e compatibilità
dell'upgrade, backup e ripristino prima della manutenzione. Non dedurre dalla
sola versione un elenco di vulnerabilità sfruttabili; nessun riavvio o upgrade
è stato eseguito. Considerare anche il
[ritiro dei vecchi cipher TLS](https://supabase.com/changelog/cbc-tls-ciphers-deprecated)
dal 10 novembre per eventuali client obsoleti; nessun nuovo SDK è necessario
per la sola impostazione del limite Storage.

## Prossime evidenze necessarie per l'uso reale

1. Una prova concordata del percorso web completo con recapito controllato:
   registrazione, email, accesso e revisione del primo addestratore. Le prove
   SQL annullate non sostituiscono la consegna email o una verifica documentale.
2. Backup ed esportazioni realmente disponibili sul piano usato e ripristino
   isolato; includere gli oggetti Storage, non soltanto le righe del database.
3. Evidenze riservate di fornitori/DPA, amministratori/MFA, ruoli e basi,
   conservazione, gestione delle richieste e informazioni obbligatorie del
   gestore, secondo `PRIVACY_OPERATIONS_V1.md`. Non pubblicare questi documenti
   o dati personali nel repository e non attribuire consensi retroattivi.

Cookie e local storage tecnici mantengono inventario e comandi già implementati.
Nessun pixel, tracciamento pubblicitario o banner generico viene aggiunto da
questo incremento. Le direttive future PLUTO-01, MATCH-01 e MEDIA-01 restano ferme.

Riferimento Storage: [restrizioni dei bucket](https://supabase.com/docs/guides/storage/buckets/creating-buckets).
