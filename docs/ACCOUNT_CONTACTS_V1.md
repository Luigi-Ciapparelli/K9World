# Email e telefono — 30 settembre 2026

## Aggiornamento: rilascio senza SMS — 30 settembre 2026

Luigi ha confermato registrazione e recupero password via email funzionanti.
La nuova diagnosi riporta auto-conferma email e telefono false, registrazioni
aperte e nomi dei secret Resend presenti. Canonico www.portalecinofilo.com.
Le osservazioni precedenti di auto-conferma attiva sono storiche.

Per contenere i costi, Twilio non è un prerequisito del lancio. Il nuovo Edge
richiede `CONTACT_SMS_ENABLED=true` oltre alle tre credenziali per inviare
qualunque SMS; assente/false significa nessun invio. Il rilascio imposta false.
Verifica della email attuale disponibile con Resend; cambio email e verifica/
modifica telefono restano bloccati e spiegati nell'interfaccia. Prenotare
richiede l'email confermata, non un telefono verificato. Non indebolire le
prove SQL e non rendere vero un flag per aggirare questo limite.

Sequenza e collaudo aggiornati: [LAUNCH_READINESS_V1.md](LAUNCH_READINESS_V1.md).
Una SIM può essere usata con un gateway Android apposito, ma qui non esiste
questa integrazione e non viene configurata per il lancio. Nessun acquisto.
Le sezioni seguenti descrivono anche il futuro flusso a due canali: i test di
cambio recapito con SMS non sono un requisito per aprire il percorso solo email.

## Richiesta e causa osservata

Luigi segnala account subito verificati senza email ricevuta; vuole correggere
il telefono e cambiare ciascun recapito autorizzando il cambio dall'altro,
già verificato. Il controllo in sola lettura di `/auth/v1/settings` del progetto
online il 30 settembre restituisce `mailer_autoconfirm: true`,
`phone_autoconfirm: false`, `disable_signup: false`.
La configurazione privata SMTP e i secret dei provider non sono stati letti.

Base GitHub: `49f22f7`. Questa implementazione è preparata localmente;
nessuna nuova migrazione, funzione Edge o configurazione Auth è stata
applicata online da questo intervento. Nessuna email o SMS reale inviato.

## Comportamento

- Pagina privata `/account/contacts`, accessibile da navbar e dalle due aree.
- Recapito attuale: un codice realmente inviato lo verifica.
- Cambio telefono: codice all'email verificata e codice al nuovo numero.
- Cambio email: codice al telefono verificato e codice alla nuova email.
- Il valore precedente resta valido fino al completamento. La nuova email
  diventa anche quella di accesso in Supabase Auth, con profilo sincronizzato.
- Il campo consente di correggere anche un vecchio numero malformato.
- Se l'altro recapito non è verificato va prima verificato; senza accesso a
  nessun recapito verificato occorre assistenza, non un aggiramento del controllo.
- Serve una sessione autenticata. Non introduce recupero dell'account via SMS,
  login telefonico, MFA o un cambio senza accesso all'account.
- Reinvia conferma email disponibile nella pagina Accedi, per iscrizioni
  ancora in attesa. Non rivela se un indirizzo sia registrato.

La verifica dei contatti resta distinta dall'approvazione professionale e
dalla verifica di qualifiche/risultati sportivi.

## Sicurezza e dati preesistenti

Migrazione nuova: `20260930070000_verified_account_contacts.sql`.
Non modifica le migrazioni applicate. Prove e richieste in `pc_private`, RLS
attiva, nessun accesso diretto di anon/authenticated. Le quattro API invoker
sono eseguibili soltanto dal service role; l'Edge ricava sempre l'utente dal
token Auth verificato, mai da un ID del browser.

I codici hanno 6 cifre, durata 10 minuti, massimo 5 tentativi per richiesta;
limite atomico di un invio/minuto e cinque invii/ora per account. Hash HMAC
con segreto server, ID utente, richiesta e canale. Una nuova richiesta revoca
la precedente. Nessun OTP viene restituito al browser, scritto in log o salvato
in chiaro. Invio fallito non abilita la richiesta. Le richieste più vecchie
di un giorno vengono eliminate al successivo avvio di verifica dello stesso
account; non c'è un job globale di pulizia automatica in questa versione.

Il cambio email è protetto anche da un trigger Auth: la conferma incrociata
non può essere evitata chiamando direttamente `auth.updateUser`. Al commit
vengono ricontrollati recapiti, prova alternativa e scadenza. Il telefono del
portale resta nel profilo; la sua modifica diretta dal client è revocata.
Non attivare un percorso separato di modifica/recupero telefono in Auth senza
integrare queste regole.

**Effetto sui dati esistenti:** i flag email vengono ricostruiti solo quando
Auth registra un invio precedente alla conferma. Gli account autoconfermati
senza tale traccia devono verificare l'email. Le vecchie verifiche telefoniche
vanno ripetute: il vecchio servizio poteva mostrare un codice di sviluppo e
non conservava una prova sufficiente di invio. Password, account, cani,
approvazioni professionali, prenotazioni e archivi non vengono cancellati.
Le operazioni che richiedono email verificata tornano disponibili dopo la
conferma reale. Pubblicare solo dopo aver preparato la consegna dei messaggi.

Le funzioni `send-verification-code` e `verify-code` sono dismesse (HTTP 410).
I vecchi codici pendenti sono invalidati; un trigger impedisce anche ai vecchi
endpoint di rendere vero un flag privo della nuova prova.

## Configurazione da completare prima del rilascio

1. Supabase Authentication: abilitare **Confirm email**, quindi verificare
   `mailer_autoconfirm: false`. Non cambiare manualmente la verifica degli
   utenti per simulare la ricezione. Non disabilitare l'approvazione professionale.
2. Configurare e provare il **Custom SMTP di Supabase Auth**, con mittente del
   dominio verificato, per iscrizione e recupero password. Una casella
   Register.it funzionante non configura da sola Supabase.
3. Aggiungere agli URL di redirect autorizzati:
   `https://www.portalecinofilo.com/account/contacts` e conservare
   `https://www.portalecinofilo.com/reset-password`.
4. Per i codici dei recapiti l'implementazione riprende i provider già
   previsti nel repository: `RESEND_API_KEY`, `VERIFICATION_FROM_EMAIL`
   (mittente di un dominio autorizzato), `TWILIO_ACCOUNT_SID`,
   `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. I secret sono lato Edge, mai
   variabili VITE né file committati. SMTP Auth e invio dei codici Edge sono
   due configurazioni distinte. Se si sceglie un provider diverso va adattato
   il solo modulo di consegna prima del rilascio, non simulata la verifica.
5. La SIM CoopVoce resta il recapito del portale. Nessun gateway Android
   integrato; SMS spenti per il lancio. Prima di un eventuale uso a due canali
   serviranno provider configurato, abilitazione esplicita e collaudo reale.

Diagnosi senza mostrare valori dei secret:

```bash
python3 scripts/diagnose_account_contacts.py --secrets
```

## Verifiche e rilascio

Eseguiti localmente: replay delle 50 migrazioni precedenti e nuova migrazione
in PostgreSQL PGlite, controlli su prova Auth/auto-conferma, flag legacy,
codici errati, doppia conferma, scadenza, limiti, retry, cambio del recapito
alternativo prima del commit, isolamento e permessi. Handler Edge e provider
testati con risposte simulate; TypeScript frontend e handler controllati.
Test browser recapiti mobile/desktop, recupero password e percorso completo
prenotazione con API simulate superati; controllo visivo desktop effettuato.
Il runner PostgreSQL nativo incluso permette la stessa prova isolata nel WSL.
La concorrenza tra connessioni separate e GoTrue reale restano da collaudare.

```bash
python3 scripts/tests/test_account_contacts.py
node scripts/tests/test_account_contacts_edge.mjs
npm run typecheck
VITE_PROFESSIONAL_CONTINUITY=true npm run build
npx --yes supabase@2.118.0 db push --dry-run
```

Il dry-run deve elencare soltanto la nuova migration. Dopo configurazione e
controllo del dry-run, applicare in questa sequenza:

```bash
npx --yes supabase@2.118.0 db push
npx --yes supabase@2.118.0 functions deploy account-contacts
npx --yes supabase@2.118.0 functions deploy send-verification-code
npx --yes supabase@2.118.0 functions deploy verify-code
```

Quindi commit dei soli file dell'incremento e push del frontend su main.
Un push Git/Vercel non pubblica da solo le funzioni Edge. Non rimuovere
l'autenticazione della funzione per aggirare un eventuale errore 401.

Collaudo reale con un account controllato: iscrizione con email da confermare,
ricezione e clic, invio a recapito attuale, correzione telefono, cambio email
con due codici, accesso con nuova email e recupero password. Verificare che
codice sbagliato/assente non modifichi i dati. Non dichiarare il rilascio
concluso finché consegna reale, GoTrue, Edge, migration e frontend non sono
verificati insieme. La precedente osservazione di auto-conferma attiva è superata dalla
nuova diagnosi fornita da Luigi: vedere aggiornamento in apertura.

Riferimenti ufficiali consultati:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/reference/javascript/auth-updateuser
- https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid
- https://supabase.com/docs/reference/javascript/auth-resend
