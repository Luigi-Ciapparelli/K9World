import { isBookableService } from './serviceCategories';
export const setupSteps = [
  { id: 'identity', label: 'Presenta la tua attività', short: 'Identità', description: 'Il tuo nome e il tipo di lavoro che offri.', group: 'base' },
  { id: 'area', label: 'Indica dove lavori', short: 'Zona', description: 'La zona e la distanza entro cui puoi seguire i clienti.', group: 'base' },
  { id: 'story', label: 'Racconta come lavori', short: 'Presentazione', description: 'Una breve presentazione, con parole tue.', group: 'base' },
  { id: 'services', label: 'Crea il primo servizio', short: 'Servizi', description: 'Nome, durata, prezzo e colore nel calendario.', group: 'base' },
  { id: 'visibility', label: 'Scegli dove comparire', short: 'Visibilità', description: 'Scopri in quali ricerche compariranno i tuoi servizi.', group: 'more' },
  { id: 'appearance', label: 'Personalizza la tua immagine', short: 'Foto e link', description: 'Foto o logo, banner, sito e profili social.', group: 'more' },
  { id: 'experience', label: 'Aggiungi la tua esperienza', short: 'Esperienza', description: 'Anno di inizio, formazione e documentazione.', group: 'more' },
  { id: 'credentials', label: 'Documenta le competenze', short: 'Attestati e risultati', description: 'Un attestato alla volta. Working-Dog è facoltativo.', group: 'more' },
  { id: 'replies', label: 'Prepara le tue risposte', short: 'Messaggi', description: 'Modelli riutilizzabili e risposte automatiche.', group: 'more' },
  { id: 'rules', label: 'Organizza le prenotazioni', short: 'Regole', description: 'Anticipo, cancellazioni e tempi tra gli appuntamenti.', group: 'more' },
  { id: 'verification', label: 'Controlla le verifiche', short: 'Verifiche', description: 'Contatti e stato di approvazione del profilo.', group: 'more' },
] as const;
export type SetupStep = typeof setupSteps[number]['id'];
export function parseSetupStep(path: string): SetupStep | null {
  const value = new URLSearchParams(path.split('?')[1] || '').get('step');
  return setupSteps.find(step => step.id === value)?.id ?? null;
}
export function setupPath(step?: SetupStep) { return `/pro/settings${step ? `?step=${step}` : ''}`; }
export const profileStepFields: Partial<Record<SetupStep, string[]>> = {
  identity: ['professional_type', 'listing_type', 'business_name', 'main_contact_name', 'team_size', 'vat_number'],
  area: ['zone_text', 'latitude', 'longitude', 'coverage_radius_km', 'starting_price'],
  story: ['bio'], appearance: ['website_url', 'instagram_url'],
  experience: ['experience_start_year', 'qualification_summary', 'insurance_summary'],
};
export function completedProfileSteps(name: string, pro: Record<string, unknown> | null, services: Array<{ active: boolean; service_type?: string }>) {
  const filled = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
  return {
    identity: filled(name) && filled(pro?.professional_type) && (pro?.listing_type === 'individual' || !pro?.listing_type || filled(pro?.business_name)),
    area: filled(pro?.zone_text), story: filled(pro?.bio), services: services.some(service => service.active && (!service.service_type || isBookableService(service.service_type))),
  };
}
export const toolTours = [
  { id: 'calendar', title: 'Organizza il calendario', icon: 'calendar', path: '/pro/calendar', description: 'Appuntamenti, colori e periodi di indisponibilità.', steps: [
    ['Guarda i tuoi impegni', 'Scegli il giorno da consultare. I colori distinguono i servizi; lo stato indica se la richiesta è confermata.'],
    ['Gestisci le assenze', 'Usa le opzioni di disponibilità per indicare un periodo di assenza o sospendere le nuove richieste. Gli appuntamenti già accettati rimangono.'],
    ['Personalizza i colori', 'I colori si scelgono in Profilo guidato → Servizi. Apri un appuntamento per consultarne i dettagli.'],
  ] },
  { id: 'requests', title: 'Gestisci richieste e messaggi', icon: 'messages', path: '/pro/bookings', description: 'Leggi le note del cliente e rispondi dalla prenotazione.', steps: [
    ['Leggi prima di rispondere', 'Apri una richiesta per leggere proprietario, cane, servizio e note. Se non ne hai ancora, tornerai qui quando arriverà la prima.'],
    ['Parla con il cliente', 'La conversazione della prenotazione permette di chiarire i dettagli. Puoi preparare messaggi riutilizzabili in Profilo guidato → Messaggi.'],
    ['Decidi sulla richiesta', 'Accetta o rifiuta solo richieste reali. Il messaggio al cliente e il cambio di stato sono due azioni distinte.'],
  ] },
  { id: 'clients', title: 'Ritrova i tuoi clienti', icon: 'users', path: '/pro/crm', description: 'Consulta i contatti collegati alla tua attività.', steps: [
    ['Apri la tua rubrica', 'Qui trovi i clienti a cui puoi accedere attraverso le relazioni previste dal portale.'],
    ['Cerca il cliente', 'Usa la ricerca per trovare una persona e consultarne i dati disponibili. Non occorre inserire contatti di prova.'],
    ['Continua il percorso', 'Per sessioni e note sul cane usa Relazioni e archivio; per le conversazioni usa la prenotazione.'],
  ] },
  { id: 'archive', title: 'Registra il percorso del cane', icon: 'archive', path: '/pro/archive', description: 'Relazioni, sessioni e archivio professionale.', steps: [
    ['Parti da una relazione', 'Il proprietario invita il professionista a seguire il cane. L’invito è distinto dalla prenotazione.'],
    ['Registra una sessione', 'Con una relazione attiva puoi registrare una sessione e una nota privata. Usa dati di attività realmente svolte.'],
    ['Conserva la continuità', 'Le rettifiche conservano le revisioni. La condivisione con un altro professionista richiede le autorizzazioni previste.'],
  ] },
  { id: 'passes', title: 'Prepara un pacchetto', icon: 'package', path: '/pro/passes', description: 'Più lezioni con un numero di utilizzi definito.', steps: [
    ['Scegli la tua proposta', 'Un pacchetto raggruppa un numero definito di prestazioni. Consulta le proposte già presenti o creane una quando serve.'],
    ['Assegna al cliente', 'Controlla servizio, numero di utilizzi e condizioni prima di assegnare un pacchetto reale.'],
    ['Segui gli utilizzi', 'Registra le prestazioni effettuate e consulta il saldo. La gestione del pacchetto non è un incasso online.'],
  ] },
  { id: 'subscriptions', title: 'Gestisci un abbonamento', icon: 'repeat', path: '/pro/subscriptions', description: 'Un percorso periodico con scadenze e rinnovi.', steps: [
    ['Valuta un percorso periodico', 'L’abbonamento serve a organizzare prestazioni ricorrenti. Scegli le condizioni in base al servizio offerto.'],
    ['Controlla le condizioni', 'Verifica periodo, cliente e utilizzi prima di attivare un abbonamento reale.'],
    ['Gestisci i rinnovi', 'Controlla scadenze e stato dal pannello. Non vengono avviati addebiti automatici al cliente da questa guida.'],
  ] },
] as const;
export type ToolTour = typeof toolTours[number];
const tourKey = (userId: string) => `pc-pro-explored-v1:${userId}`;
export function readExploredTools(userId: string): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(tourKey(userId)) || '[]'); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && toolTours.some(t => t.id === id)) : []; } catch { return []; }
}
export function markToolExplored(userId: string, id: string) {
  try { localStorage.setItem(tourKey(userId), JSON.stringify([...new Set([...readExploredTools(userId), id])])); return true; } catch { return false; }
}
