export type HelpAudience = 'visitor' | 'owner' | 'professional' | 'admin';
export interface HelpArticle {
  id: string;
  title: string;
  keywords: string;
  paragraphs: string[];
  links: { label: string; to: string }[];
}

const common: HelpArticle[] = [
  { id: 'learn', title: 'Da dove comincio con il mio cane?', keywords: 'impara lezioni bisogni scelta cucciolo educazione',
    paragraphs: ['In Impara trovi lezioni gratuite per conoscere i bisogni del cane e capire come apprende. Puoi leggerle senza registrarti.', 'Se stai pensando di accogliere un cane, Prima del cane ti aiuta a ragionare sulla vita che puoi offrirgli. Puoi seguire il percorso oppure cercare subito un professionista.'],
    links: [{ label: 'Apri Impara', to: '/impara' }, { label: 'Prima del cane', to: '/prima-del-cane' }] },
  { id: 'search', title: 'Come trovo il professionista giusto?', keywords: 'addestratore educatore pensione zona sport enci handler toelettatura esposizioni',
    paragraphs: ['Trova aiuto per il cane permette di cercare addestratori e pensioni. Apri un profilo per conoscere zona, servizi, esperienza e qualifiche.', 'Sport cinofili ed Esposizioni hanno ricerche dedicate. Un profilo approvato non significa che ogni qualifica o risultato sia verificato: controlla lo stato indicato accanto alle singole informazioni.'],
    links: [{ label: 'Trova aiuto per il cane', to: '/search' }, { label: 'Sport cinofili', to: '/sport' }, { label: 'Esposizioni', to: '/esposizioni' }] },
];
const visitor: HelpArticle[] = [
  { id: 'account', title: 'Quando serve un account?', keywords: 'registrazione iscrizione accedi proprietario professionista centro',
    paragraphs: ['Per leggere Impara e cercare professionisti non serve un account. Per inviare una richiesta di prenotazione, registrati come proprietario, conferma la tua email e aggiungi il cane.', 'Se lavori con i cani, parti da Diventa professionista. Potrai preparare il profilo della tua attività e i servizi da offrire.'],
    links: [{ label: 'Crea un account', to: '/signup' }, { label: 'Diventa professionista', to: '/become-pro' }] },
  { id: 'access', title: 'Non riesco ad accedere o manca la conferma email', keywords: 'password dimenticata recupero spam verifica codice',
    paragraphs: ['Nella pagina Accedi puoi recuperare la password o reinviare la conferma email. Controlla anche la cartella spam e verifica di avere scritto l’indirizzo corretto.', 'Se non hai più accesso al recapito o la procedura non riesce, scrivi all’assistenza. Non inviare password o codici di verifica.'],
    links: [{ label: 'Apri Accedi', to: '/signin' }] },
];
const owner: HelpArticle[] = [
  { id: 'booking', title: 'Come richiedo un appuntamento?', keywords: 'prenotazione richiesta cane data ora email',
    paragraphs: ['Conferma la tua email e aggiungi il cane in I miei cani. Dal profilo del professionista premi Richiedi prenotazione, scegli servizio, cane, data e ora e inserisci le informazioni utili.', 'La richiesta resta in attesa finché il professionista non l’accetta. L’invio non conferma da solo l’appuntamento.'],
    links: [{ label: 'I miei cani', to: '/owner/dogs' }, { label: 'Le mie prenotazioni', to: '/owner/bookings' }] },
  { id: 'owner-messages', title: 'Messaggi e modifica di un appuntamento', keywords: 'annullare cancellare rifiuto rispondere contattare note',
    paragraphs: ['Apri la conversazione della prenotazione per scrivere al professionista. Le informazioni inserite nella richiesta sono distinte dai messaggi successivi.', 'Puoi annullare una richiesta ancora in attesa. Per cambiare data o gestire un appuntamento già accettato, concorda la soluzione con il professionista nella conversazione. Il portale non esegue rimborsi automatici.'],
    links: [{ label: 'Apri le prenotazioni', to: '/owner/bookings' }] },
  { id: 'owner-packages', title: 'Dove vedo lezioni residue e abbonamenti?', keywords: 'pacchetto crediti saldo scadenza rinnovo storico',
    paragraphs: ['I miei pacchetti e I miei abbonamenti mostrano condizioni, lezioni residue, scadenze e storico registrati dal professionista.', 'Avere crediti disponibili non prenota automaticamente un appuntamento. Se un utilizzo non ti torna, chiedi al professionista di controllarlo.'],
    links: [{ label: 'I miei pacchetti', to: '/owner/passes' }, { label: 'I miei abbonamenti', to: '/owner/subscriptions' }] },
];
const professional: HelpArticle[] = [
  { id: 'pro-profile', title: 'Completo il profilo della mia attività', keywords: 'centro addestratore servizi foto banner competenze zona prezzo',
    paragraphs: ['In Profilo e servizi segui i passaggi per presentare l’attività, indicare zona e servizi, aggiungere foto e descrivere esperienza e qualifiche.', 'Controlla le informazioni prima di chiedere la pubblicazione. Il profilo pubblico e le verifiche delle singole credenziali hanno stati distinti.'],
    links: [{ label: 'Profilo e servizi', to: '/pro/settings' }] },
  { id: 'pro-requests', title: 'Gestisco richieste e messaggi', keywords: 'prenotazione accettare rifiutare cliente note risposta',
    paragraphs: ['In Prenotazioni trovi le richieste con cliente, cane, servizio e note. Apri la conversazione per rispondere o chiedere chiarimenti.', 'Scrivere un messaggio non accetta la richiesta: usa l’azione di accettazione quando hai concordato l’appuntamento. Puoi preparare risposte riutilizzabili nelle impostazioni.'],
    links: [{ label: 'Apri Prenotazioni', to: '/pro/bookings' }, { label: 'Impostazioni e risposte', to: '/pro/settings' }] },
  { id: 'pro-calendar', title: 'Calendario e periodi di indisponibilità', keywords: 'agenda assenza ferie colore colori orario impegni',
    paragraphs: ['Nel Calendario consulta gli appuntamenti e indica i periodi di indisponibilità. Il colore del servizio si sceglie quando lo crei o lo modifichi.', 'Un’assenza non cancella gli appuntamenti già fissati. Contatta i clienti interessati per concordare eventuali variazioni.'],
    links: [{ label: 'Apri Calendario', to: '/pro/calendar' }] },
  { id: 'pro-clients', title: 'Clienti, cani e appunti privati', keywords: 'crm ricerca etichette tag note scheda storico',
    paragraphs: ['In Clienti e cani cerca il cliente, il cane o un’etichetta e apri la scheda. Aspetta la conferma di salvataggio di appunti ed etichette.', 'Gli appunti della scheda sono riservati al professionista. Non sono messaggi al cliente né note di sessione dell’archivio di continuità.'],
    links: [{ label: 'Clienti e cani', to: '/pro/crm' }] },
  { id: 'pro-packages', title: 'Pacchetti e abbonamenti alle lezioni', keywords: 'credito lezione residuo rinnovo prezzo pagamento fattura storno',
    paragraphs: ['Crea un modello e assegnalo a un cliente idoneo dopo aver concordato le condizioni. Registra le lezioni svolte per aggiornare il saldo; puoi consultare lo storico e rettificare un utilizzo con un motivo.', 'I periodi degli abbonamenti vanno rinnovati esplicitamente. Questi strumenti non prenotano appuntamenti, non incassano pagamenti e non eseguono rimborsi automatici.'],
    links: [{ label: 'Pacchetti', to: '/pro/passes' }, { label: 'Abbonamenti', to: '/pro/subscriptions' }] },
  { id: 'pro-team', title: 'Collaboro con altri istruttori', keywords: 'centro team collaboratori agenda assegnata permesso turni',
    paragraphs: ['Il centro può collegare gli account personali dei propri istruttori e assegnare le lezioni. Ogni persona accede con il proprio account, senza condividere password.', 'L’agenda assegnata e le azioni disponibili dipendono dai permessi concessi dal centro. Il collegamento non dà accesso generale ai suoi clienti o archivi.'],
    links: [{ label: 'Team del centro', to: '/pro/team' }, { label: 'Le mie collaborazioni', to: '/account/centres' }] },
];
const contacts: HelpArticle = {
  id: 'contacts', title: 'Email, telefono e verifiche dell’account', keywords: 'recapiti codice conferma modifica numero sms',
  paragraphs: ['In Recapiti trovi lo stato della tua email e del telefono e le operazioni attualmente disponibili. La conferma dell’email serve per richiedere appuntamenti.', 'Le operazioni che richiedono SMS possono non essere disponibili. Se devi correggere un recapito e il cambio è bloccato, contatta l’assistenza senza inviare password o codici.', 'Verifica dei recapiti, approvazione del profilo professionale e verifica delle qualifiche sono controlli diversi.'],
  links: [{ label: 'Apri Recapiti', to: '/account/contacts' }],
};

export function helpArticlesFor(audience: HelpAudience, continuity: boolean): HelpArticle[] {
  const result = [...common, ...(audience === 'visitor' ? visitor : audience === 'owner' ? owner : audience === 'professional' ? professional : [])];
  if (audience !== 'visitor') result.push(contacts);
  if (continuity && audience === 'owner') result.push({
    id: 'owner-archive', title: 'Invito un professionista a seguire il cane', keywords: 'relazione archivio sessione continuità consenso revoca',
    paragraphs: ['L’invito a seguire il cane è distinto dalla prenotazione. Scegli il cane e il professionista: la relazione diventa attiva quando il professionista accetta l’invito.', 'La relazione consente di registrare sessioni. Non rende automaticamente visibili tutte le note: la condivisione dei contributi segue consensi specifici.'],
    links: [{ label: 'Professionisti dei tuoi cani', to: '/owner/relationships' }],
  });
  if (continuity && audience === 'professional') result.push({
    id: 'pro-archive', title: 'Registro una sessione e conservo le revisioni', keywords: 'relazione archivio continuità nota rettifica invito consenso',
    paragraphs: ['In Relazioni e archivio gestisci gli inviti a seguire un cane. Accettare una prenotazione non attiva da solo questa relazione.', 'Con una relazione attiva puoi registrare le sessioni svolte e le note private. Le rettifiche conservano le revisioni e richiedono un motivo; la condivisione con altri professionisti segue autorizzazioni separate.'],
    links: [{ label: 'Relazioni e archivio', to: '/pro/archive' }],
  });
  return result;
}

function normalized(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it-IT'); }
export function filterHelpArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  const words = normalized(query.slice(0, 100)).trim().split(/\s+/).filter(Boolean);
  return articles.filter(article => {
    const haystack = normalized([article.title, article.keywords, ...article.paragraphs].join(' '));
    return words.every(word => haystack.includes(word));
  });
}
