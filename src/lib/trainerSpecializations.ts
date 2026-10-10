export const TRAINING_ACTIVITIES = [
  { id: 'companion', label: 'Educazione e vita quotidiana', description: 'Cucciolo, passeggiate, convivenza e relazione con il cane.' },
  { id: 'livestock', label: 'Lavoro con il bestiame', description: 'Preparazione del cane al lavoro con il bestiame.' },
  { id: 'hunting', label: 'Addestramento per la caccia', description: 'Preparazione del cane all’attività venatoria.' },
] as const;
export type TrainingFocus = typeof TRAINING_ACTIVITIES[number]['id'];
export function readTrainingFocus(value: string | null): TrainingFocus | null {
  if (value === null || value === '') return 'companion';
  return TRAINING_ACTIVITIES.some(item => item.id === value) ? value as TrainingFocus : null;
}
export const ENCI_SECTIONS = [
  { id: 1, label: 'Utilità, compagnia, agility e sport', description: 'Comprende educazione e diversi impieghi del cane. Chiedi quali attività il professionista insegna effettivamente.' },
  { id: 2, label: 'Cani da bestiame', description: 'Riguarda l’addestramento dei cani impiegati con il bestiame.' },
  { id: 3, label: 'Cani da caccia', description: 'Riguarda l’addestramento dei cani per l’attività venatoria.' },
] as const;
export const ENCI_REGISTER_URL = 'https://www.enci.it/addestratori-e-handler/registro-addestratori';
export const ENCI_RULES_URL = 'https://www.enci.it/media/9327/disciplinare-degli-addestratori-cinofili-e-conduttori-cinofili-di-esposizione.pdf';
export function enciSectionLabel(section: number) {
  const item = ENCI_SECTIONS.find(item => item.id === section);
  return item ? `Sezione ${item.id} · ${item.label}` : '';
}
