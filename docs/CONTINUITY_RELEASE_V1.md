# Rilascio relazioni e archivio privato — v1

Stato: migration 20260913121224_private_professional_continuity_v1.sql preparata localmente, da verificare ed
applicare. Nessuna applicazione remota dichiarata da questo documento.

La migration contiene la struttura e le RPC delle tre proposte testate,
con una sola transazione esterna e senza cambiare il comportamento SQL.
Crea sei tabelle private con RLS e RPC di invito, consenso, chiusura,
registrazione sessioni, lettura privata e revisioni. Non importa dati precedenti,
non modifica le vecchie migration, non crea bucket o concessioni di condivisione.
Nessun dato reale deve essere usato nella fase di prova.

## Evidenze prima della preparazione

- Test isolati di struttura, relazioni, note e quattro casi concorrenti passati.
- Integrazione delle proposte sullo schema delle 36 migration passata.
- UI applicata; typecheck e build con flag disattivato e attivo passati
  nel repository dell'utente. Ultimo commit comunicato: 6d69285.
- Le 36 migration esistenti risultano allineate local/remote nell'output utente.

## Verifica del file da applicare

```bash
python3 scripts/tests/test_continuity_migration.py ~/K9World
npx supabase db push --dry-run
```

Il nuovo test ricostruisce il database temporaneo usando i 37 file reali di
migration, incluso esattamente quello che verrà proposto alla CLI Supabase.
Controlla nomi e SHA-256, poi esegue le stesse verifiche applicative e ACL del
test precedente. Non applica di nuovo i file SQL sotto docs/proposals.
Dipendenze Auth/Storage simulate; non prova il servizio remoto o la UI browser.

Il test originale test_continuity_integration.py conserva il manifest delle
36 migration per documentare la baseline. Sul repository con la nuova migration
si arresta per manifest differente: usare test_continuity_migration.py.
Le proposte restano documenti storici, non una seconda via di applicazione.

## Passi successivi

Verificare che il dry-run elenchi solo questa migration. Dopo la revisione
applicarla con la CLI Supabase, quindi provare localmente il frontend con:

```bash
VITE_PROFESSIONAL_CONTINUITY=true npm run dev
```

L'avvio locale può utilizzare il database remoto configurato nel repository:
locale descrive il frontend, non un database isolato. Usare account/cani di prova.
Il flag non è configurato automaticamente né su Vercel né nei file .env.

Seguire la prova di accettazione in CONTINUITY_UI_V1.md. Nessuna promessa che
il superamento dei test SQL equivalga a verifica completa dell'interfaccia.
Condivisione fra professionisti e media non sono inclusi. Conservazione,
cancellazione ed esportazione vanno completate prima dell'uso con clienti reali.
Non eliminare le tabelle come rollback: disattivare prima il flag e valutare
una correzione che preservi eventuali sessioni e note già registrate.

Al termine registrare risultato dei test e applicazione, aggiornare il quadro
documentale e rigenerare CURRENT_STATE.md nel repository reale. Commit mirato
comprendente UI, migration, test e documentazione prima della pubblicazione.
