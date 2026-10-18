# Stato account e recupero profilo — 18 ottobre 2026

Base esaminata: `eb21b04`. Correttivo frontend della priorità funzionamento e
sicurezza, preparato localmente. Nessuna migration o modifica Auth online.

## Difetto riprodotto

Nel browser locale con SDK Supabase reale e risposte sintetiche: accesso A,
lettura del profilo A trattenuta, uscita, accesso B e caricamento del profilo B.
Rilasciando la vecchia risposta compariva il nome del profilo A nella navbar di B.
`AuthContext` accettava ogni risposta senza associarla alla sessione corrente;
caricava inoltre il profilo sia da getSession sia dagli eventi Auth.
Il ruolo era parte dello stesso oggetto incoerente. Questo dimostra un difetto
di stato dell'interfaccia, non un aggiramento delle RLS o un accesso ai dati online.

Un errore transitorio dopo login faceva anche eseguire signOut; dopo ripristino
sessione l'area personale mostrava solo «Profilo account non disponibile», senza
riprova. Una richiesta bloccata non aveva un limite locale esplicito.

## Correzione

- Stato atomico di utente/profilo, generazione della sessione, annullamento delle
  richieste e scarto dei risultati vecchi anche se il trasporto ignora l'abort.
- Controllo dell'ID e del ruolo ammesso del profilo restituito; niente ruolo
  dedotto dall'email o da metadati modificabili dall'utente.
- Una lettura in corso condivisa fra chiamanti, timeout a 15 secondi, cleanup
  allo smontaggio. Eventi ripetuti della stessa sessione non rilanciano letture.
- `INITIAL_SESSION` gestisce l'avvio, `USER_UPDATED` forza il nuovo profilo.
  Callback Auth sincrona; letture avviate fuori dal callback.
- Errore, dato assente o non coerente: sessione conservata e area riservata
  bloccata fino al caricamento valido. Schermata con Riprova, Esci, assistenza
  e collegamento all'Impara pubblico. Nessuna creazione automatica di profili.
- Cambio identità ricrea le pagine, così stato e moduli locali non passano a
  un altro account. Aggiornamento dello stesso profilo non resetta i moduli.
- Errori di logout gestiti: se la sessione resta presente viene mostrato l'errore.
  Alcune versioni SDK la rimuovono localmente anche se la revoca server fallisce:
  in quel caso l'area personale si chiude; non è attestata l'uscita dagli altri dispositivi.

Password, onboarding, conferme email, ruoli, cookie/storage Auth, permessi RLS
e flusso di recupero password non vengono riscritti. Nessun SMS o email reale.
Il limite di 15 secondi riguarda la lettura profilo, non ogni chiamata Auth.

## Prove

`test_account_profile_state.mjs`: due account e risposte fuori ordine, logout,
lettura condivisa, retry, ID/ruoli errati, aggiornamento dello stesso utente,
timeout e smontaggio. Controllo che utente/profilo coincidano a ogni pubblicazione.

`test_account_state_ui.mjs`: desktop 1440 e mobile 390, riproduzione del difetto
precedente, profilo indisponibile, riprova, profilo incoerente, logout e login
tramite modulo con lettura fallita. SDK reale su backend interamente simulato.
Regressioni esistenti di recupero password e signup professionista/proprietario.
TypeScript, lint mirato (warning preesistente only-export-components in AuthContext),
build e verifiche HTML/SEO. Nessun database online consultato o modificato.

## Applicazione

Installer `aggiorna_stato_account.py`, compatibile con `eb21b04`. Senza opzioni
prepara i file con backup dopo la verifica completa delle versioni. `--publish`
esegue test Node, typecheck, build/SEO e commit/push dei soli percorsi previsti;
si ferma per modifiche estranee o remoto divergente. Attendere Vercel Ready.
Nessuna CLI Supabase, modifica di secret, migrazione o reset del repository.

Riferimento tecnico: documentazione ufficiale Supabase onAuthStateChange,
consultata il 18 ottobre 2026; verificato anche il comportamento del pacchetto
presente nell'ambiente di prova.
https://supabase.com/docs/reference/javascript/auth-onauthstatechange
