const CACHE_NAME = 'portalecinofilo-seo-v2';
const CORE_ASSETS = ['/offline.html', '/manifest.webmanifest', '/brand/portalecinofilo-mark.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => /^(k9world-|portalecinofilo-)/.test(key) && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(?:api|pro|owner|admin|signin|signup|app-shell)(?:\/|\.|$)/.test(url.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html')) || new Response('Sei offline.', { status: 503 })));
    return;
  }
  // Hashed assets may be cached. Navigation and SEO files always use the network.
  if (!/^\/(?:assets|media|brand)\//.test(url.pathname)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  })));
});
