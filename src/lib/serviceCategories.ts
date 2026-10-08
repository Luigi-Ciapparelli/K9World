export type ServiceCategoryType = 'trainer' | 'boarding' | 'walker' | 'sitter' | 'groomer' | 'handler';

export type ServiceCategory = {
  type: ServiceCategoryType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  gradient: string;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    type: 'trainer',
    title: 'Addestramento ed educazione',
    subtitle: 'Educazione e relazione nella vita quotidiana',
    description:
      'Percorsi per conoscere il cane, educarlo e affrontare insieme la vita quotidiana.',
    badge: 'Training',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #0f766e 45%, #f59e0b 100%)',
  },
  {
    type: 'boarding',
    title: 'Pensione cani',
    subtitle: 'Strutture e professionisti selezionati',
    description:
      'Soluzioni per lasciare il cane in un ambiente controllato, con regole chiare, routine e gestione responsabile.',
    badge: 'Pensione',
    gradient: 'linear-gradient(135deg, #1c1917 0%, #92400e 45%, #fbbf24 100%)',
  },
  {
    type: 'groomer',
    title: 'Toelettatura',
    subtitle: 'Cura e igiene del mantello',
    description:
      'Professionisti per toelettatura, igiene e cura del mantello, con servizi indicati chiaramente nel profilo.',
    badge: 'Grooming',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f766e 50%, #67e8f9 100%)',
  },
  {
    type: 'handler', title: 'Handler per esposizioni', subtitle: 'Preparazione e presentazione sul ring',
    description: 'Professionisti per preparare e presentare il cane nelle esposizioni cinofile.',
    badge: 'Esposizioni', gradient: 'linear-gradient(135deg, #163D2A 0%, #99732a 100%)',
  },
];

export const DAILY_SERVICE_TYPES = ['trainer', 'boarding'] as const;
export const EXHIBITION_SERVICE_TYPES = ['groomer', 'handler'] as const;
export const BOOKABLE_SERVICE_TYPES = [...DAILY_SERVICE_TYPES, ...EXHIBITION_SERVICE_TYPES, 'enci_course'] as const;
export function serviceSearchArea(type: string) {
  if (type === 'trainer') return 'Trova aiuto per il cane e/o Sport cinofili, secondo le tue preferenze di visibilità';
  if (type === 'boarding') return 'Trova aiuto per il cane · Pensioni';
  if (type === 'groomer') return 'Esposizioni · Toelettatura (anche senza partecipare a una gara)';
  if (type === 'handler') return 'Esposizioni · Handler per esposizioni';
  if (type === 'enci_course') return 'Servizi nel tuo profilo; la categoria non certifica il riconoscimento del corso';
  return 'Storico privato · categoria non più offerta al pubblico';
}
export function isBookableService(type: string) { return BOOKABLE_SERVICE_TYPES.some(value => value === type); }
