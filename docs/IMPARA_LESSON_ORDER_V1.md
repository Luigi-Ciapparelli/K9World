# Impara — timing alla fine del percorso

Decisione di Luigi del 9 ottobre 2026. Base remota esaminata: `684f74e`.
L’ex lezione 2 passa alla posizione 8; le ex lezioni 3–8 scalano indietro di
un numero. La prima resta prima. Non cambia il contenuto delle lezioni.

| Posizione nuova | Posizione precedente | Lezione |
| ---: | ---: | --- |
| 1 | 1 | Bisogni, sonno e recupero |
| 2 | 3 | Routine, sicurezza e autonomia |
| 3 | 4 | Spazi, risorse e incontri |
| 4 | 5 | Razze, funzioni e differenze individuali |
| 5 | 6 | Gioco, lavoro, motivazione e recupero |
| 6 | 7 | Leggere il cane, costruire la relazione |
| 7 | 8 | Come impara il cane: le basi |
| 8 | 2 | Osservazione e clicker: allenare il timing |

## Comportamento

`STAGE_1_LESSONS` mantiene questo ordine anche nell’array, usato dalla
navigazione precedente/successiva e dal quaderno. Il timing viene assegnato
al modulo finale «Costruire la relazione»: altrimenti il raggruppamento della
pagina Impara continuerebbe a mostrarlo vicino alla prima lezione.
Gli altri moduli, le altre lezioni e l’accesso rapido «Allena il tuo timing»
restano disponibili. Nessun nuovo prerequisito per aprire una lezione.

Slug, letture, ID delle attività, quiz e chiave `portalecinofilo-impara-v3`
restano invariati. Appunti e progressi già salvati continuano a riferirsi
allo stesso contenuto. Nessuna cancellazione o conversione dei dati del browser.
Anche gli URL delle otto lezioni rimangono identici, senza redirect nuovi.

## Verifica e rilascio

Superati: test progressi, test shaping, TypeScript, build di produzione,
controllo HTML SEO e test browser desktop/mobile. Verificati ordine delle
schede raggruppate, numerazione, navigazione 1→2 e 7↔8, ripresa dello shaping,
appunti, quiz, quaderno e import/export dei progressi. Browser con API simulate.
Il test UI esistente è stato aggiornato per usare i link di navigazione reali
e identificare le lezioni per slug, non per una posizione ormai superata.

L’installer `aggiorna_ordine_impara.py` verifica la compatibilità e crea backup;
con `--publish` esegue test unitari, TypeScript, build/SEO, commit limitato ai
file dell’incremento e push su `main`. Il push può avviare Vercel. Nessuna
migration, comando Supabase, spesa o pubblicazione social.
Il completamento locale non certifica un deployment online.
