# Indisponibilità individuali degli istruttori

14 ottobre 2026. Incremento TEAM-01 successivo a `b08aabf`.

## Uso

- Centro: **Istruttori del centro → Gestisci indisponibilità**, sotto il nome.
- Persona collegata: **Profilo e recapiti → Collaborazioni con i centri → Gestisci indisponibilità** sul collegamento attivo.
- Calendario del centro: scegli un istruttore; i giorni di assenza sono evidenziati.
- Le richieste e le schede nel calendario segnalano le lezioni accettate già assegnate durante un’assenza. Il centro decide come riorganizzarle e contatta il cliente.

Giornate intere, estremi inclusi, Europe/Rome (anche al cambio dell’ora).
Massimo 366 giorni per periodo, inizio entro due anni, fine non passata.
L’elenco mostra un anno dalla data scelta; massimo 200 periodi futuri attivi per istruttore.
Non vengono richieste motivazioni personali o sanitarie.

L’assenza riguarda solo quel centro: nessuna sincronizzazione automatica con altri centri.
Non modifica prenotazioni, stato dei servizi o disponibilità dell’intero centro.
Il cliente continua a vedere la lezione confermata fino a un eventuale cambiamento concordato.
L’assenza non è esposta al proprietario tramite l’API delle assegnazioni.

## Permessi e integrità

Tabelle private con RLS e nessun accesso diretto anon/authenticated/service_role.
RPC pubbliche invoker, implementazioni private definer con search_path vuoto.
Il centro gestisce tutte le assenze del proprio elenco. La persona deve avere collegamento
attivo, istruttore attivo, ruolo ammesso e email confermata: può leggere le proprie date,
creare periodi e rimuovere quelli creati da lei. Non può rimuovere i periodi indicati dal centro.
Dopo la revoca, i periodi restano gestibili dal centro; la persona perde lettura e scrittura.

UUID di richiesta per retry, versione attesa per rimozione, cancellazione logica e audit.
Assegnazione, assenza e revoca acquisiscono prima il lock del centro.
Se l’assenza precede una nuova assegnazione, questa viene respinta (`PCX02`),
anche con conferma sovrapposizione e attraverso la vecchia RPC.
Se la lezione era già assegnata, viene conservata e conteggiata tra quelle da controllare.
La conferma di gruppo (`PCX01`) rimane distinta e non supera un’assenza.

## Rilascio e prove

Migration: `20261014100000_centre_instructor_time_off.sql` (63ª).
Nessun nuovo secret, invio email, funzione Edge o costo esterno.

- Storia completa e test SQL su PostgreSQL PGlite: ruoli, isolamento, retry, revoca,
  conservazione delle lezioni e regressioni elenco/calendario/collegamenti.
- Test browser desktop/mobile con API simulate: centro e persona, date, retry,
  avvisi sulle lezioni, errore senza dati vecchi, rimozione.
- TypeScript, build e SEO; pagine private escluse dalla sitemap.
- `python3 scripts/tests/test_instructor_time_off.py`: test nativo isolato richiesto
  dall’installer, compresi i due ordini concorrenti assenza/assegnazione oltre ai casi
  precedenti. Non eseguito nell’ambiente di preparazione privo di PostgreSQL server.

Auth/Storage e API browser simulati. Nessun database online o deploy verificato qui.
Il pacchetto controlla compatibilità e modifiche locali prima di scrivere, crea backup,
con `--publish` esegue i test nativi, typecheck/build/SEO e accetta nel dry-run solo
questa migration, quindi effettua commit, db push e push su main.

## Confini del blocco

Non introduce turni orari ricorrenti, notifiche automatiche, deleghe per modificare
prenotazioni o accesso a note private/CRM. Sono incrementi separati; non considerarli implementati.
