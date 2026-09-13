# Interfaccia relazioni e archivio privato — v1

Baseline sorgenti ricevuta: commit 6d69285 sul branch signup-dog-profile.
I test SQL di integrazione sulle 36 migration sono passati nella macchina
locale dell'utente. Nessuna delle tre proposte di continuità è stata applicata
al database online. CURRENT_STATE.md è ancora il vecchio snapshot: rigenerarlo
nel repository reale al prossimo checkpoint.

## Implementato nel codice di questo incremento

- Dal profilo pubblico: il proprietario sceglie un proprio cane e invia un invito
  al professionista mostrato. Il nome proviene dalla proiezione pubblica; il
  server verifica proprietà, verifica email e abilitazione del professionista.
- /owner/relationships: elenco relazioni, ritiro invito e revoca con conferma.
- /pro/archive: inviti da accettare/rifiutare, relazioni da concludere e nuove
  sessioni con note private.
- Archivio autore: revisioni paginate (50 per pagina), autore, cane, data
  attività, data registrazione, testo e motivo delle rettifiche.
- Rettifica con revisione attesa: il conflitto conserva il testo nel modulo.
- Nuova sessione: data nell'intervallo autorizzato, testo obbligatorio,
  blocco invii simultanei e richiesta UUID congelata dopo il primo invio.
  Un retry usa lo stesso UUID e gli stessi parametri. Dopo una risposta incerta
  controllare l'archivio prima di chiudere il modulo o creare un'altra sessione.
- Tutti i nuovi dati dell'archivio passano dalle RPC testate. Nessuna lettura
  diretta delle sei tabelle e nessun nuovo permesso a profili, CRM o booking.
- I componenti privati vengono ricreati al cambio account; le risposte di
  caricamento obsolete vengono ignorate. Nessuna nota in localStorage, URL o log.

## Stato di attivazione

VITE_PROFESSIONAL_CONTINUITY deve essere esattamente true per mostrare le nuove
voci e abilitare le route. In assenza del valore, tutto rimane disattivato.
Il flag è solo gestione del rilascio: l'autorizzazione è sempre delle RPC.
Non abilitare il flag sul sito prima di installare e verificare lo schema.
Nessun file .env, configurazione Vercel o migration è modificato da questa patch.

Passo successivo: preparare una nuova migration dalle tre proposte già testate,
controllarne il dry-run e applicarla nell'ambiente concordato, quindi provare
il flusso UI con account e cani sintetici. Non eseguire manualmente le proposte
SQL sul database online e non riscrivere le migration esistenti.

## Limiti espliciti

Questa UI riguarda relazioni e note private. Non implementa condivisione dello
storico, file, compressione, esportazioni o una promessa di conservazione
perpetua. Le procedure di conservazione/cancellazione definite come necessarie
in PROFESSIONAL_CONTINUITY_MEDIA.md restano da completare prima dell'uso reale.

La RPC relazione restituisce nomi storici di cane/professionista e date; non
restituisce il nome del proprietario né identità correnti del cane. La UI non
inventa questi dati e non recupera profili privati per completarli. Eventuale
arricchimento della proiezione richiede una modifica SQL con test specifici.
La sessione viene registrata senza booking: l'associazione facoltativa a una
prenotazione, già testata nel backend, non ha ancora un selettore UI.

Le note non salvate e il riferimento del retry vivono solo nel modulo aperto:
non sopravvivono a refresh, logout o navigazione fuori pagina. I pulsanti di
chiusura chiedono conferma quando il modulo contiene testo/esito incerto.
La data usa il fuso del dispositivo e non certifica l'attività svolta.
L'archivio pagina revisioni, non sessioni; uno stesso documento può proseguire
nella pagina seguente. Una revisione storica può essere consultata ma non
usata per sovrascrivere una versione più recente.

## Verifica del codice

Nell'ambiente assistente: TypeScript strict e build Vite con flag attivo passati.
Lo ZIP non includeva i tsconfig, index.html, configurazione Vite/Tailwind e
package-lock.json: per queste verifiche sono stati usati config temporanei e
versioni compatibili con package.json. Nessuno di tali file o dipendenze viene
incluso nella patch. Eseguire typecheck/build con la configurazione reale.
Nessuna prova browser o RPC online è stata eseguita dall'assistente.

## Prova di accettazione dopo l'attivazione del backend

1. Proprietario verificato invita A dal suo profilo scegliendo il cane corretto.
   Invio ripetuto: una sola relazione aperta; proprietario non verificato bloccato.
2. A accetta; il proprietario vede Attiva. Rifiuto di un altro invito mostra
   Rifiutata in entrambi gli account. Inviti non accettati non consentono sessioni.
3. A registra una sessione e una nota sintetiche: appaiono nell'archivio privato.
   B, proprietario e anonimo non devono leggere la nota attraverso UI o API.
4. A rettifica con motivo: originale e rettifica restano distinti. Due schede
   correggono la stessa revisione: la seconda segnala conflitto e conserva il testo.
5. Proprietario revoca: nessuna nuova sessione autorizzata. A legge e rettifica
   ancora il proprio archivio; nessun accesso a contributi privati di B.
6. Risposta interrotta dopo invio: controllare archivio e riprovare nello stesso
   modulo. Verificare una sola sessione e assenza di perdita silenziosa del testo.
7. Verificare tastiera, smartphone, logout/cambio account e flag disattivato.

Registrare esito e limitazioni prima di abilitare la produzione; rigenerare
CURRENT_STATE.md nel repository reale e committare il checkpoint.


## Preparazione del backend

Vedi [rilascio v1](CONTINUITY_RELEASE_V1.md): la migration è stata predisposta per verifica e dry-run. Nessuna applicazione remota è ancora dichiarata; la UI resta disattivata di default.
