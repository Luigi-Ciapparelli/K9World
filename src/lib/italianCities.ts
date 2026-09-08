export type ItalianCity = {
  code: string;
  name: string;
  province: string;
  region: string;
  lat: number;
  lng: number;
};

let citiesCache: ItalianCity[] | null = null;

export function cityLabel(city: ItalianCity) {
  return `${city.name} (${city.province})`;
}

export async function loadItalianCities(): Promise<ItalianCity[]> {
  if (citiesCache) return citiesCache;

  const response = await fetch('/data/italian-cities.json');

  if (!response.ok) {
    throw new Error(`Impossibile caricare i comuni italiani: ${response.status}`);
  }

  citiesCache = (await response.json()) as ItalianCity[];
  return citiesCache;
}

export function normalizeCitySearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('it')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
