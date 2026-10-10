# Ricerca addestratori e sezioni ENCI — TRAIN-01

Decisione e preparazione: 10 ottobre 2026. Base GitHub letta: `3a6674b`.
Implementazione locale pronta per l’installer `aggiorna_ricerca_addestratori.py`.
Push GitHub, migration online e Vercel Ready restano da osservare per questo incremento.

## Percorso del proprietario

- Trova aiuto per il cane apre la ricerca quotidiana: Addestratori è già selezionato;
  basta indicare la zona o usare la posizione. Nessuna sezione ENCI da scegliere.
- Sotto la ricerca ci sono due collegamenti secondari facoltativi: **Lavoro con
  il bestiame** e **Addestramento per la caccia**. Un click cerca direttamente,
  conservando città/coordinate; un collegamento riporta all’educazione quotidiana.
- Su telefono i filtri aggiuntivi sono richiusi: i risultati precedono i dettagli
  facoltativi. Su desktop il pannello dei filtri resta disponibile di lato.
- Sport resta nella sua area; Pensioni ed Esposizioni mantengono il loro percorso.
  La razza del cane non determina il tipo di ricerca: un cane da pastore o da
  caccia può aver bisogno di normale educazione.

## Profilo professionale

Nel passaggio Visibilità, quattro scelte indipendenti: Educazione e vita quotidiana,
Sport cinofili (con discipline), Lavoro con il bestiame, Addestramento per la caccia.
Servono approvazione del profilo e servizio di addestramento attivo per comparire.
Un professionista può offrire più attività; nessuna scelta certifica una qualifica.
Il profilo pubblico mostra le attività dichiarate tramite una proiezione limitata.

Le preferenze quotidiane/sportive esistenti sono conservate. Bestiame e caccia
partono disattivati; non si deducono da bio, razza, qualifica o risultato sportivo.
L’API precedente di salvataggio resta compatibile e non azzera le nuove scelte.
La ricerca quotidiana conserva il proprio endpoint; i percorsi specialistici
usano una nuova RPC con gli stessi vincoli di zona, approvazione e servizio.

## Qualifiche ENCI, distinte dai servizi

Nel passaggio Attestati e risultati, una qualifica professionale individuale
può indicare una sezione ENCI; si inserisce una voce per ciascuna iscrizione.

| Sezione | Denominazione del disciplinare |
| --- | --- |
| 1 | Addestratori per cani da utilità, compagnia, agility e sport |
| 2 | Addestratori per cani da bestiame |
| 3 | Addestratori per cani da caccia |

Il profilo mostra sezione e stato dichiarato/in verifica/verificato. La scelta
non assegna un badge: la verifica richiede revisione amministrativa e una fonte
ENCI o documento privato associato alla persona. La semplice presenza di un URL
non dimostra l’iscrizione: il revisore controlla nome, sezione e riscontro effettivo.
Cambiare sezione o dati dell’evidenza annulla la precedente verifica. Le sezioni
personali non vengono trasferite a un centro convertendo il tipo di profilo.
Gli educatori con altri percorsi formativi possono continuare a presentare le
proprie qualifiche: l’iscrizione ENCI non diventa un requisito generale di ricerca.

Impara include una spiegazione facoltativa delle tre sezioni, della distinzione
tra attività, qualifiche e handler. Nessuna lezione rinumerata o progresso azzerato.
Fonti ENCI consultate il 10 ottobre 2026:
- [Disciplinare, articoli 2 e 3](https://www.enci.it/media/9327/disciplinare-degli-addestratori-cinofili-e-conduttori-cinofili-di-esposizione.pdf).
- [Registro addestratori](https://www.enci.it/addestratori-e-handler/registro-addestratori).

## Dati, prove e rilascio

Migration aggiuntiva `20261010170000_trainer_specializations.sql`: due preferenze,
sezione facoltativa delle credenziali, RPC e trigger controllati. Le vecchie
migration non cambiano. Wrapper pubblici SECURITY INVOKER, implementazioni
`pc_private` con privilegi espliciti e search_path vuoto; nessun accesso diretto
nuovo a tabelle o documenti privati. Nessuna nuova dipendenza o servizio a pagamento.

Prove completate in ambiente isolato:
- 56 migration precedenti più la nuova su PostgreSQL WASM (PGlite): dati
  precedenti, vecchie API, filtri geografici/prezzo, attività indipendenti,
  sezioni, invalidazione, fonti, profili individuali, ruoli e isolamento.
- Browser Chromium, 1440 e 390 pixel: ricerca quotidiana/specialistica, posizione,
  navigazione indietro, errori/riprova, scelte salvate e conservate in errore,
  inserimento sezione, stato pubblico, guida Impara e assenza di overflow.
- Regressione delle recensioni pubbliche per singola prestazione.
- TypeScript, build, 396 pagine HTML / 392 URL SEO, controllo diff.

Auth/Storage e risposte API dei browser sono simulati. Non sono prove del database
online, della verifica di una persona reale o di concorrenza PostgreSQL nativa.
Il test SQL nativo è incluso e l’installer lo esegue sul PC di Luigi prima del
rilascio. Per eseguirlo da solo: `python3 scripts/tests/test_trainer_specializations.py`.

L’installer controlla compatibilità di file/dipendenze, conserva un backup, esegue
SQL isolato, TypeScript e build/SEO; accetta solo questa migration nel dry-run,
crea un commit recuperabile, applica SQL e fa push senza forzature. Se manca accesso
remoto o viene rilevato lavoro estraneo, interrompe con i file preservati.
Dopo il push attendere Ready sul commit indicato. Non ripetere lo sviluppo per
chiudere uno stato documentale; registrare l’output effettivo.
