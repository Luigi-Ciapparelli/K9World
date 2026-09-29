# Recupero password V1

Base: GitHub main `e999041`. Nessuna migrazione, modifica account reale o email
inviata durante lo sviluppo. Codice pronto per pubblicazione con il pacchetto.

## Percorso utente

Accedi → Password dimenticata? → email → link ricevuto → nuova password e
conferma → disconnessione locale → nuovo accesso. Risposta alla richiesta
generica, senza dichiarare se un indirizzo appartiene a un account.

Il callback standard Supabase viene consumato dall'SDK già installato.
La schermata si attiva su PASSWORD_RECOVERY e verifica di nuovo l'identità
con getUser prima di updateUser. Un normale accesso non apre il modulo.
Un marcatore di sola interfaccia in sessionStorage consente la ricarica per
massimo 30 minuti e non oltre la scadenza della sessione; non contiene token
o password e non autorizza operazioni. I token restano gestiti dall'SDK.
I parametri del callback vengono rimossi dall'indirizzo dopo il consumo.

Link scaduti/rifiutati, password non coincidenti o deboli, limiti invio e
problemi di connessione hanno esiti espliciti. Se il cambio riesce ma la
chiusura della sessione fallisce, il retry ripete solo la disconnessione.
La disconnessione è locale: non promettere uscita da tutti i dispositivi.

## Configurazione necessaria in Supabase

Authentication → URL Configuration → Redirect URLs: aggiungere esattamente
`https://www.portalecinofilo.com/reset-password` e salvare.
Controllare che Site URL sia il dominio pubblico canonico
`https://www.portalecinofilo.com`. Conservare gli altri redirect necessari.

Il codice usa l'origine corrente. Se si prova una preview o localhost,
autorizzare separatamente il suo URL completo con `/reset-password`.
Il template email Reset Password deve mantenere il link standard
`{{ .ConfirmationURL }}`: non sostituirlo con un semplice link al sito.
Nessuna password SMTP o chiave privata va aggiunta al repository o alla chat.
Le impostazioni email esistenti non sono state modificate.

Documentazione primaria:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/redirect-urls

## Routing e indicizzazione

`/forgot-password` e `/reset-password` riscrivono verso app-shell in Vercel.
Sono esclusi dalla sitemap e dal service worker, con noindex/nofollow,
no-store e no-referrer. I percorsi pubblici SEO e i vecchi hash restano validi.
Il flusso conserva l'implicit flow già usato; template personalizzati token_hash
e migrazione a PKCE non fanno parte di questo intervento.

## Verifiche

TypeScript, build e test SEO; test browser del recupero con l'SDK Supabase
installato e risposte HTTP sintetiche. Scenari: richiesta, rate limit, callback,
ricarica, password errata/debole, errore verifica identità, retry disconnessione,
nuovo accesso, link scaduti, account già collegato diverso, marker incompatibile,
callback rifiutato e conferma signup distinta. Regressioni ingresso e profilo
guidato incluse in scripts/tests/test_seo.mjs.

Per ripetere in ambiente isolato: build con VITE_SUPABASE_URL impostata a
https://pc-home-test.supabase.co e VITE_SUPABASE_ANON_KEY sintetica, poi
node scripts/tests/test_seo.mjs con Playwright/Chromium disponibili.
Mai usare credenziali reali nelle fixture. Queste prove non dimostrano la
consegna email reale né la configurazione del progetto Supabase online.

## Chiusura del rilascio

Dopo Vercel Ready e salvataggio Redirect URLs, Luigi prova una sola volta con
un proprio account: richiesta, email ricevuta, link, nuova password e accesso.
Annotare qui esito e commit, senza email personali/token/password.
Poi completare la prova richiesta/risposta/calendario descritta in
PILOT_READINESS_V1.md e invitare il primo piccolo gruppo usando PILOT_INVITATIONS.md.
Nessun invito viene inviato automaticamente da questo pacchetto.
