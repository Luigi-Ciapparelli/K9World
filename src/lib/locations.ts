export type SupportedCity = {
  name: string;
  lat: number;
  lng: number;
};

export const SUPPORTED_CITIES: SupportedCity[] = [
  { name: 'Rimini', lat: 44.0678, lng: 12.5695 },
  { name: 'Riccione', lat: 43.9994, lng: 12.6561 },
  { name: 'Cattolica', lat: 43.9633, lng: 12.7386 },
  { name: 'Misano Adriatico', lat: 43.9775, lng: 12.6983 },
  { name: 'Coriano', lat: 43.9697, lng: 12.6003 },
  { name: 'Santarcangelo di Romagna', lat: 44.0633, lng: 12.4464 },
  { name: 'Cesena', lat: 44.1391, lng: 12.2431 },
  { name: 'San Marino', lat: 43.9424, lng: 12.4578 },
];

export function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(lat: number, lng: number): SupportedCity {
  return SUPPORTED_CITIES.reduce((nearest, city) => {
    const nearestDistance = distanceKm(lat, lng, nearest.lat, nearest.lng);
    const cityDistance = distanceKm(lat, lng, city.lat, city.lng);
    return cityDistance < nearestDistance ? city : nearest;
  }, SUPPORTED_CITIES[0]);
}

export function findSupportedCity(input: string | null): SupportedCity | null {
  if (!input) return null;

  const normalized = input.trim().toLowerCase();

  return (
    SUPPORTED_CITIES.find((city) =>
      normalized.includes(city.name.toLowerCase())
    ) || null
  );
}
