# Statistiche dell’attività professionale

17 ottobre 2026. Correttivo sulla base GitHub `3b62ddd`.

## Problema e risultato

La pagina precedente scaricava prenotazioni e servizi interi, ignorava gli errori
e mostrava dollari. Il ritorno dei clienti dipendeva soltanto dai cinque clienti
con più spesa, mentre il rapporto completate/totale era chiamato «utilization».
I valori delle prenotazioni erano chiamati ricavi senza un riscontro sui pagamenti.

`/pro/analytics` ora consulta un aggregato privato calcolato nel database.
La pagina è in italiano, usa euro e periodi selezionabili: mese corrente,
ultimi 90 giorni, anno corrente o date esplicite. Nessun servizio a pagamento
o nuovo fornitore. Un errore o una risposta incompatibile mostrano un messaggio
e Riprova; non vengono trasformati in statistiche pari a zero.

## Significato dei dati

| Dato | Regola |
| --- | --- |
| Periodo | Data di inizio dell’appuntamento, fuso Europe/Rome; estremi inclusi, massimo 366 giorni |
| Prenotazioni | Tutte le prenotazioni nel periodo, con dettaglio dello stato attuale |
| Servizi svolti | Solo prenotazioni con stato completed; una prenotazione conta una volta |
| Clienti serviti | Proprietari distinti con almeno una prenotazione completed nel periodo |
| Clienti tornati | Almeno due completed nel medesimo periodo / tutti i clienti serviti nel periodo; non retention storica |
| Valore dei servizi svolti | Somma dei prezzi salvati nelle completed; non incassi, fatture o ricavi da pacchetti/abbonamenti |
| Servizi più svolti | Cinque gruppi per identità del servizio, con il nome storico più recente disponibile; omonimi distinti |

Importi nulli, negativi o non finiti sono esclusi e contati come mancanti; zero
rimane un prezzo valido. Se tutti gli importi mancano, l’interfaccia dichiara
«Non disponibile». Se non ci sono clienti serviti, la percentuale è assente.
Il periodo non viene moltiplicato per notti di pensione, cani o istruttori.
I prezzi attuali del catalogo non sostituiscono quelli delle prenotazioni.
I servizi storici senza identità recuperabile confluiscono nel gruppo
«Servizio non più disponibile»; non viene inventata la loro identità.
Correzioni e cancellazioni dei dati operativi possono modificare i totali:
questo strumento non introduce un archivio fiscale o contabile.

## Confine di accesso e prestazioni

Migration 70ª: `20261017170000_professional_activity_statistics.sql`.
RPC `get_professional_activity_summary(p_from date,p_to date)`: wrapper pubblico
SECURITY INVOKER, implementazione pc_private SECURITY DEFINER con search_path
vuoto. Execute solo authenticated; controllo server su auth.uid(), ruolo
professional, riga professionals e email Auth confermata. Nessun parametro
per scegliere un’altra attività, nessun accesso aggiuntivo per un collega delegato.
L’approvazione pubblica non impedisce al titolare di consultare i propri dati.

La risposta non contiene nomi, ID, note o recapiti dei clienti, né righe delle
prenotazioni. Il filtro usa l’indice già esistente professional_id/start_at/end_at.
Le aggregazioni precedono il limite PostgREST: il totale non si ferma alle prime
1.000 righe. La risposta contiene al massimo cinque servizi. L’intervallo
massimo e il timeout frontend limitano le richieste; nessuna scansione perpetua
o polling. Cambio account rimonta il report; cambio periodo e refresh nascondono
i dati precedenti. Richieste annullate o tardive non sovrascrivono il periodo corrente.

## Verifica e rilascio

- Test SQL su storia completa (69 migration precedenti + nuova), fixture sintetiche:
  oltre 1.000 prenotazioni, denominatore corretto, isolamento tra attività,
  ruoli e permessi, range e anni bisestili, giorni italiani di 23/25 ore,
  servizi rinominati/cancellati, omonimi e prezzi non validi.
- Test delle date e del contratto risposta in Node.
- Browser desktop/mobile con API simulate: valori, periodi, date non valide,
  assenza dati distinta da errore, retry, risposta tardiva e accesso negato.
- TypeScript, lint mirato, build e verifiche SEO.

L’esecuzione SQL nell’ambiente di preparazione usa PGlite; il runner PostgreSQL
nativo viene eseguito dall’installer sul PC di Luigi. Auth/Storage simulati.
Nessuna attestazione di collaudo Supabase online o di Vercel Ready.

`aggiorna_statistiche_professionali.py ~/K9World --publish` controlla compatibilità,
esegue test SQL nativi, test Node, typecheck, build/SEO, limita il dry-run alla
nuova migration, crea il commit locale recuperabile, applica SQL e fa push main.
Nessuna modifica delle migration già pubblicate, dei servizi o delle prenotazioni.
Un’interruzione conserva il lavoro locale e consente di riprendere senza reset.
Dopo Ready, ingresso: Area professionista → Statistiche.
