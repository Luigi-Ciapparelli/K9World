export type FciBreed = {
  name: string;
  slug: string;
  fciGroup: number;
  fciGroupName: string;
  enciUrl: string;
};

let breedsCache: FciBreed[] | null = null;

export async function loadFciBreeds(): Promise<FciBreed[]> {
  if (breedsCache) return breedsCache;

  const response = await fetch('/data/fci-breeds.json');

  if (!response.ok) {
    throw new Error(`Impossibile caricare le razze: ${response.status}`);
  }

  breedsCache = (await response.json()) as FciBreed[];
  return breedsCache;
}

export function normalizeBreedSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('it')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
