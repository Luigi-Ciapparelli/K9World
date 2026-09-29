// Only a public professional profile can be resumed after an owner signs in.
// Never accept arbitrary destinations, external URLs or private-area routes.
const professionalPath = /^\/p\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function bookingDestination(route: string): string | null {
  const next = new URLSearchParams(route.split('?')[1] || '').get('next');
  if (!next) return null;
  const [path, query = ''] = next.split('?');
  if (!professionalPath.test(path) || query !== 'booking=1') return null;
  return `${path}?booking=1`;
}

export function bookingAuthPath(mode: 'signin' | 'signup', destination: string | null) {
  if (!destination || !bookingDestination(`/signin?next=${encodeURIComponent(destination)}`)) return `/${mode}`;
  return `/${mode}?${mode === 'signup' ? 'role=owner&' : ''}next=${encodeURIComponent(destination)}`;
}
