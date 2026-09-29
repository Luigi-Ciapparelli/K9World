/** Public routes use real paths; existing account links and Auth fragments remain valid. */
export function normalizeRoute(value: string) {
  const [raw, query = ''] = value.split('?');
  let path = raw.replace(/\/+$/, '') || '/';
  if (path === '/services') return `/search${query ? `?${query}` : '?type=trainer'}`;
  if (path === '/become-a-pro') path = '/become-pro';
  return path + (query ? `?${query}` : '');
}
export function privateRoute(path: string) {
  return /^\/(?:owner|pro|admin)(?:\/|$)/.test(path.split('?')[0]) || /^\/(?:signin|signup)$/.test(path.split('?')[0]);
}
export function routeHref(path: string) {
  const safe = normalizeRoute(path);
  if (!safe.startsWith('/') || safe.startsWith('//')) return '/';
  return privateRoute(safe) ? `/#${safe}` : safe;
}
export function readBrowserRoute() {
  if (typeof window === 'undefined') return '/';
  return normalizeRoute(window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : window.location.pathname + window.location.search);
}
