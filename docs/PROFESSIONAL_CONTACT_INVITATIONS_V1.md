# Contatti professionali e inviti — 13 ottobre 2026

## Stato effettivo

Il foglio Google esistente è stato organizzato in Addestratori, Pensioni e
Centri cinofili, con Avvio, Registro invii PC ed Esclusioni PC. Lo script
`PortaleCinofilo_Inviti.gs` è installato da Luigi nel progetto Apps Script
collegato a quel foglio. Non crearne un secondo.

Luigi ha confermato la prova reale: mittente
`Luigi Ciapparelli | PortaleCinofilo <accounts@portalecinofilo.com>` e ricezione
delle risposte a `info@portalecinofilo.com`. Non ripetere questa verifica senza
un cambiamento o un errore concreto. Nessun invito a prospect risulta inviato.

Il file di lavoro del 12 ottobre contiene 4.679 righe e 3.327 email uniche;
la copertura CSEN è parziale. Questi conteggi descrivono una raccolta, **non
un elenco di destinatari autorizzati né una verifica della liceità della
raccolta e conservazione di ogni record**. Dati, prove e nomi dei destinatari
rimangono privati, fuori da GitHub.

## Incremento del sito

`/privacy` contiene una sezione raggiungibile con
`/privacy#contatti-professionali`: categorie e provenienza dei dati, richieste
e inviti distinti, Google Sheets/Apps Script/posta, criteri di conservazione,
opposizione e registro minimo delle esclusioni. Data del solo documento
privacy: 13 ottobre 2026; le altre pagine legali mantengono la loro data.

Il contenuto HTML pubblico viene generato dalla stessa pagina React. Nessuna
nuova migration, modifica Auth, lettura di account o spesa. Questo intervento
non certifica la conformità complessiva della piattaforma o delle liste.

## Collegamento allo script, dopo la pubblicazione della pagina

Nel progetto Apps Script **già collegato al foglio**, sostituire soltanto:

```javascript
privacyUrl: '',
```

con:

```javascript
privacyUrl: 'https://www.portalecinofilo.com/privacy#contatti-professionali',
```

Salvare. Non occorre un deployment Apps Script, un trigger, una nuova prova
del mittente o ricopiare tutto lo script. L'anteprima si usa dal foglio,
menu PortaleCinofilo → “3. Anteprima della scheda aperta”.

Restano necessari: stato Pronto, consenso/richiesta documentati e pertinenti,
data reale, recapito autorizzato corrispondente, nessuna esclusione o invio
precedente. Nessuna riga diventa Pronto per effetto della pubblicazione della
privacy. Una richiesta autorizza la risposta richiesta, non un abbonamento
a comunicazioni ulteriori. Non inviare email promozionali per chiedere il
consenso che ancora manca.

L'invio richiede la conferma manuale per massimo quattro tentativi. Il flusso
non legge le risposte o i bounce: Luigi aggiorna gli esiti e usa subito
“Escludi un indirizzo da ogni invio” quando qualcuno si oppone. Un esito
incerto resta Da verificare, senza retry automatico. Non rimuovere esclusioni
o registri per forzare un nuovo invio.

## Gestione delle liste raccolte: lavoro distinto dalla pagina privacy

- Valutare e documentare finalità, necessità e base giuridica della raccolta
  e della conservazione dei dati personali già presenti. Non basta chiamare
  una lista promozionale “ricerca di mercato” o limitare gli invii a quattro.
- Per dati raccolti indirettamente, valutare e adempiere agli obblighi
  dell'art. 14 GDPR: entro un termine ragionevole, al massimo un mese dalla
  raccolta, e comunque al primo contatto se precedente, salvo un'eccezione
  effettivamente applicabile e documentata. La sola pubblicazione di un link
  non dimostra di avere informato tutte le persone della lista.
- Conservare fonte specifica, data e motivo del trattamento nel registro
  privato. Rimuovere i dati senza necessità/base adeguate; non è stata
  eseguita una cancellazione massiva con questo incremento. Per analisi
  territoriali privilegiare dati aggregati non identificativi.
- Definire nel registro operativo il termine di revisione/conservazione
  coerente con ciascuna finalità. La pagina espone criteri, non promette un
  job di cancellazione automatica che non esiste. Verificare anche copie
  esportate e backup quando si esegue una cancellazione.
- Verificare accessi al foglio e condizioni effettive dell'account Google,
  accordi sul trattamento e garanzie applicabili. L'indirizzo con dominio
  proprio non prova un piano Workspace o una regione dati europea.

Queste verifiche non sono sostituite dal controllo tecnico dello script.
Le righe prive di autorizzazione restano escluse dagli invii.

## Fonti verificate il 13 ottobre 2026

- [Garante, provvedimento 23 ottobre 2025, § 4.2](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10197577):
  consenso per email promozionali e limiti dei registri pubblici; l'eccezione
  soft spam riguarda presupposti specifici non attestati per questa lista.
- [Garante, principi del trattamento e trasparenza](https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento):
  minimizzazione, base giuridica, bilanciamento e informativa artt. 13–14.
- [Google, trasferimenti dei dati](https://policies.google.com/privacy/frameworks?hl=it):
  infrastruttura internazionale e meccanismi descritti dal fornitore; non
  prova delle impostazioni contrattuali dell'account di Luigi.

## Verifica e rilascio

Verifica locale: TypeScript, build/SEO e controllo dell'HTML privacy e delle
date delle altre pagine legali. Build eseguita con configurazione Supabase
fittizia e senza chiamate al database; non è una prova Auth/Storage live.
Il flusso Apps Script non viene modificato
né eseguito da questo aggiornamento. Non serve ricostruire il database.

Base GitHub letta: `d2f5b2b`. Accesso Git in lettura disponibile; il tentativo
di push dry-run termina per assenza di autenticazione GitHub in scrittura.
Installer WSL `aggiorna_privacy_inviti.py`: controllo compatibilità e backup,
verifiche, commit dei soli file del pacchetto e push con `--publish`.
Il successo del push non è ancora l'osservazione della pagina pubblicata.
