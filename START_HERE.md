# PortaleCinofilo — comincia qui

Aggiornamento del 9 ottobre 2026, dopo il controllo di `origin/main` a `558e0d5`.
Questa pagina è un ingresso breve, non un registro a cui anteporre ogni rilascio.

## Ordine di lettura per un nuovo account o collaboratore

1. [CURRENT_STATE](docs/CURRENT_STATE.md): cosa c'è nel codice, cosa sappiamo del rilascio e cosa manca.
2. [PRODUCT_DIRECTION](docs/PRODUCT_DIRECTION.md): missione e decisioni di prodotto in vigore.
3. [EXECUTION_PRIORITIES](docs/EXECUTION_PRIORITIES_2026_10.md): lavori residui, dipendenze e criteri di chiusura.
4. [PROJECT_HANDOFF](docs/PROJECT_HANDOFF.md): ambiente, vincoli, mappa dei documenti e modalità di lavoro.
5. [AI_CONTINUITY_PROTOCOL](docs/AI_CONTINUITY_PROTOCOL.md): come aggiornare questo passaggio di consegne.

Poi leggere soltanto le specifiche del blocco su cui si interviene. La mappa
completa è nel handoff; l'architettura futura resta nei quattro documenti Core.

## Situazione da non ricominciare

Su GitHub sono presenti ricerca Addestratori/Pensioni ed Esposizioni (`7f11610`),
storico scaricabile (`3ec87ad`) e valutazioni dopo i servizi (`fd619e4`).
Calendario, messaggi, pacchetti, abbonamenti e archivio testuale esistono già.
Il registro corrente specifica i limiti: presenza su GitHub, migration applicata,
deployment Ready e prova con account reali sono evidenze distinte.

Priorità approvata: foto dei profili, funzionamento, ottimizzazione e sicurezza.
Gli allegati delle sessioni attendono quote per piano e una politica di compressione;
Impara ora segue l’ordine precedente 1, 3, 4, 5, 6, 7, 8, 2 (rinumerato 1–8).
Il CSV SEO è stato analizzato: dettagli in [SEO_INDEXATION_2026_10_09](docs/SEO_INDEXATION_2026_10_09.md).
Il riordino è su GitHub (`204441b`). Google aveva scelto la home senza www;
il redirect 308 attuale porta a www. Luigi ha inviato la richiesta di indicizzazione
e confermato la sitemap riuscita. Non richiedere questi dati nuovamente.
Le tre guide razza specifiche sono su GitHub (`558e0d5`): [BREED_GUIDES_V1](docs/BREED_GUIDES_V1.md).
L'esito della nuova scansione resta da osservare; la causa del downtime resta ignota.
Social e possibile prova Higgsfield da 100 crediti sono aggiornati nel piano operativo.
Non sospendere tutto il lavoro per questi dati e non ricreare funzioni esistenti.
Foto professionali, banner e ritratti privati dei clienti: incremento preparato,
con prova SQL/browser e procedura di rilascio in [PROFILE_IMAGES_V1](docs/PROFILE_IMAGES_V1.md).

## Primo controllo, senza modificare nulla

Nel terminale WSL con prompt `luigi@…:~/K9World$`:

```bash
cd ~/K9World && git status --short --branch && git log -5 --oneline
```

Confrontare il commit con il registro, leggere il codice pertinente e preservare
il lavoro locale. Non serve ripetere build o test SQL per leggere le direttive.

## Stato mantenuto e rapporto automatico

- `docs/CURRENT_STATE.md` è mantenuto consapevolmente: contiene fatti, prove e limiti.
- `docs/TECHNICAL_SNAPSHOT.md` riceve l'output di `scripts/update_project_state.py`.
- Il generatore non sovrascrive più lo stato corrente. Il suo output non certifica un deploy.
- Le versioni precedenti restano raggiungibili da [PROJECT_HISTORY](docs/PROJECT_HISTORY.md).

Per un nuovo account: dare accesso al repository e chiedere di seguire questa
pagina, confrontando il commit effettivo prima di agire. Le chat, i segreti e le
sessioni degli account esterni non vengono trasferiti dai documenti Git.
