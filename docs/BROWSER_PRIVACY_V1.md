# Privacy del browser e strumenti tecnici

21 ottobre 2026. Base `7ac252e`; ambito TRUST-02. Nessuna migration o nuovo servizio a pagamento.

## Esito concreto

- `/cookies` contiene inventario, finalità, durata e comandi selettivi per Impara,
  test di scelta, tema, guida professionale e cache pubblica. Informativa e link
  presenti anche nel prerender senza JavaScript; comandi richiedono JavaScript.
- Nessun banner di consenso inventato per soli strumenti funzionali. Nessun pixel
  marketing introdotto. L'introduzione di analytics, pubblicità o contenuti esterni
  richiede una nuova valutazione e blocco preventivo quando il consenso è necessario.
- I comandi chiedono conferma, preservano Auth/recupero password e dati online.
  La cancellazione locale non è cancellazione GDPR dell'account. Appunti e risposte
  non sono separati per account: avviso esplicito sui dispositivi condivisi.
- Tema e test funzionano anche quando localStorage è negato. Le risposte vecchie
  sono validate prima dell'uso; nessuna bozza vuota creata alla sola visita.
- Eliminata la scrittura della bozza `portalecinofilo-before-dog-share-draft-v1`:
  nessun lettore nel codice la utilizzava. Le copie precedenti sono eliminabili
  dal comando del test e da Ricomincia. Le risposte correnti restano locali.
- La migrazione dei progressi Impara elimina la vecchia copia dopo la scrittura;
  la cancellazione elimina entrambe le versioni e invalida la memoria della pagina.
- Le quattro immagini di ripiego Pexels sono sostituite da risorse già del portale.
  URL di immagini legacy presenti nei record possono ancora causare richieste
  esterne: non dichiarare tutte le immagini sempre first-party.
- `Referrer-Policy: no-referrer` e meta equivalente impediscono l'invio del referrer;
  `nosniff` e `no-store` sulle shell/aree private completano il blocco frontend.
  Il service worker esclude anche account e shell profilo e continua a non salvare API.

## Riscontri e limiti

Prima della modifica, il 21 ottobre: GET pubbliche a home e `/cookies` hanno dato
HTTP 200, nessun Set-Cookie, nessuna Referrer-Policy/nosniff; script applicativo
first-party. Questa osservazione non è un audit di tutte le sessioni o dell'hosting.
Ricerca del codice: nessun pixel Meta/TikTok, Google Analytics o font esterno;
localStorage, sessionStorage e Cache Storage inventariati in pagina.

TypeScript, lint mirato, build/prerender SEO e regressione Impara eseguiti localmente.
Suite browser nella CI `Browser privacy`: 1440/390 px, conferma/annullamento,
protezione delle chiavi estranee/Auth, cache selettiva, tema/test con storage negato,
input precedente corrotto e assenza di richieste a host aggiuntivi nelle pagine provate.
Il browser locale non è stato scaricabile; non dichiarare il test browser passato
prima dell'esito effettivo della CI. Prove con API sintetiche, nessun account reale.

Il deploy Vercel e gli header reali vanno distinti dal merge. Nessuna cancellazione
su account, Storage, database o contatti online. Nessuna certificazione di conformità.

## Prossime prove operative di TRUST-02

| Da verificare | Evidenza necessaria | Stato |
| --- | --- | --- |
| Fornitori e trasferimenti | Contratti/DPA effettivi, regione Supabase, subfornitori e meccanismi applicabili a Vercel, Supabase, Resend e Google | Non verificati da questo blocco; nessuna garanzia contrattuale inventata |
| Conservazione online | Tempi per categorie, log e backup; procedure effettive di cancellazione/limitazione, inclusi archivi dei professionisti | Informativa generale esistente; piano operativo specifico ancora da chiudere |
| Backup e incidenti | Configurazione reale, prova di ripristino isolata, accessi amministrativi e procedura incidente | Non provati; non dedurre sicurezza da build o test simulati |
| Richieste delle persone | Canale info@portalecinofilo.com presidiato, verifica identità proporzionata e registro richieste privato | Canale pubblicato; gestione operativa da confermare |
| Ammissione addestratori | Applicazione remota della migration TRUST-01 e riesame amministrativo dei profili | Commit su main `a510771`; applicazione online non osservata |
| Abusi di registrazione | Valutazione delle email temporanee e dei limiti reali del provider Auth | Ancora aperto, senza promettere eliminazione totale degli abusi |

## Fonti istituzionali consultate

- Garante, linee guida 10 giugno 2021, §§4–5 e 8: finalità effettiva,
  informativa per strumenti tecnici; consenso per quelli non necessari.
  https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876
- EDPB, Guidelines 2/2023, versione finale: il perimetro dell'art. 5(3) ePrivacy
  non è limitato al nome cookie o ai soli dati personali.
  https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en

Queste fonti motivano le scelte tecniche, non sostituiscono la verifica professionale
sui trattamenti reali e sull'inquadramento del titolare.
