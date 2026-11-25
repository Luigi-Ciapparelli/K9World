import index from './practiceIndex.json';
export const exerciseIndex = index;
export const practiceGroups = [...new Set(index.map(entry => entry.group))];
export const practicePath = '/impara/esercizi';
export const exercisePath = (slug: string) => practicePath + '/' + slug;
