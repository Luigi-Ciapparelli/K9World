# Coordinamento dell’agenda del centro

17 ottobre 2026. Incremento TEAM-01 sulla base GitHub `10163b9`.
Preparato localmente; pubblicazione DB/Git/Vercel da confermare separatamente.

## Cosa può fare il centro

In **Istruttori del centro → Collega gli account → Coordinamento agenda** concede
o revoca un permesso a una persona con collegamento già accettato, istruttore
attivo ed email confermata. Il permesso parte disattivato e non deriva da qualifiche,
ruolo professionista o appartenenza al centro. Il consenso al collegamento esistente
rimane necessario. Nessuna condivisione delle credenziali del titolare.

Il collega trova **Apri agenda del centro** nelle proprie collaborazioni.
L’agenda è giornaliera, con orari italiani, pagine da 50 lezioni e contatore completo.
Mostra lezioni confermate o svolte che iniziano dalla concessione del permesso:
servizio, orari, nomi di cliente/cani e istruttore. Le note di prenotazione, i recapiti,
i prezzi, i messaggi e gli archivi non fanno parte di questa lettura.

Può assegnare o rimuovere l’istruttore soltanto su lezioni accettate e ancora future.
Non può assegnarsi una lezione, modificare la propria assegnazione o una prenotazione
di cui è cliente: evita di procurarsi così accesso a conversazioni e note attraverso
gli altri permessi. Lezioni proprie gestite dal centro. Turni, assenze e conflitti
di orario mantengono gli stessi controlli delle assegnazioni del titolare;
la conferma di gruppo supera solo una sovrapposizione, non un turno o un’assenza.

Richieste, orari, prezzi, pagamenti, elenco istruttori e permessi restano al centro.
Questo incremento non introduce un ruolo generale di amministratore né una segreteria
indipendente dall’elenco degli istruttori. Un’eventuale estensione richiede una
matrice di azioni e dati distinta, senza ampliare implicitamente questo permesso.

## Contratto tecnico

- Migration 69: `20261017093000_centre_agenda_delegation.sql`.
- Nuove RPC: `set_centre_agenda_permission`, `get_delegated_centre_agenda`,
  `assign_delegated_centre_instructor`; wrapper pubblici invoker, implementazioni
  `pc_private` definer con `search_path` vuoto e controlli server.
- Il nucleo delle assegnazioni esistenti viene riusato; nessuna sostituzione dei
  claim JWT. Helper interno non eseguibile da anon/authenticated/service_role.
- Lock comune sul centro prima di rileggere permesso e prenotazione. Versione del
  collegamento e dell’assegnazione obbligatorie; stesso invio senza duplicare l’audit.
- Revoca, fine collegamento, istruttore inattivo o email non confermata negano
  l’accesso. Nuova concessione riparte dalla propria data. Il browser aggiorna al
  focus e ogni 60 secondi, svuota i dati se la lettura fallisce; i controlli server
  valgono a ogni richiesta, anche con una pagina vecchia.
- Audit privato con autore reale e nome salvato, visibile al centro per
  l’assegnazione corrente. Revoca non cancella lezioni o storico; eliminazioni
  account preservano l’attribuzione già registrata senza bloccare le FK.
- Valutazioni sempre associate alla prestazione prenotata. Nessuna nuova media
  dell’istruttore o del centro. Nessun allargamento della continuità condivisa.

## Verifiche e rilascio

`test_centre_agenda_delegation.py` ricostruisce le 68 migration precedenti e applica
la nuova. Riprende le regressioni team, agenda, relazioni, assenze, completamento,
messaggi, note e turni; verifica grant/revoca, isolamento, autoassegnazione negata,
attribuzione, paginazione, versioni e conservazione dopo eliminazione account.
Il runner PostgreSQL nativo aggiunge sei casi con due connessioni: revoca prima/dopo
assegnazione, assegnazione del centro prima/dopo quella delegata, doppio invio e
conflitto di versione. Richiesto dall’installer prima del SQL online.

Qui: regressioni SQL su PGlite; prove browser desktop/mobile con API simulate,
TypeScript, lint mirato, build e controllo SEO. Il PostgreSQL nativo non è disponibile
in questo ambiente: i lock concorrenti vanno verificati dal runner incluso sul PC
di Luigi. Auth/Storage, consegna messaggi e database online non verificati qui.

Installer `aggiorna_coordinamento_agenda.py`: compatibilità e backup, gate PostgreSQL,
TypeScript/build/SEO, dry-run della sola nuova migration, commit recuperabile, DB e
push dei soli file previsti. Nessuna spesa, invio email o variazione del flag sport.
Aspettare Vercel Ready per il commit rilasciato. Per tornare alla gestione del solo
titolare basta revocare il permesso; non eliminare tabelle o migration applicate.
