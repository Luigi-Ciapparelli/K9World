export type ServiceCategoryType = 'trainer' | 'boarding' | 'walker' | 'sitter';

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
    subtitle: 'Educatori, addestratori e sport cinofili',
    description:
      'Percorsi per educazione di base, obedience, gestione del cane, preparazione sportiva e lavoro personalizzato.',
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
    type: 'walker',
    title: 'Passeggiate',
    subtitle: 'Dog walker e supporto alla routine',
    description:
      'Uscite programmate per cani che hanno bisogno di movimento, continuità e attenzione durante la giornata.',
    badge: 'Walking',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #16a34a 50%, #84cc16 100%)',
  },
  {
    type: 'sitter',
    title: 'Pet sitting e visite',
    subtitle: 'Assistenza a domicilio',
    description:
      'Visite, compagnia, pasti e gestione quotidiana quando il proprietario non può occuparsi direttamente del cane.',
    badge: 'Sitting',
    gradient: 'linear-gradient(135deg, #312e81 0%, #7c3aed 45%, #f472b6 100%)',
  },
];
