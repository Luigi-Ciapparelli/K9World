// Only public profile/result pages, with a bound on every redirect and response.
const hosts = new Set(['working-dog.com', 'www.working-dog.com', 'working-dog.eu', 'www.working-dog.eu']);
export function workingDogUrl(raw: string, kind: 'user' | 'results') {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.port || url.username || url.password || url.search ||
      !new RegExp(`^/${kind}/[^/?#\\s@]+-[1-9][0-9]{0,19}/?$`).test(url.pathname)) {
    throw new Error(`Inserisci l’URL HTTPS Working-Dog della pagina /${kind}/…-numero.`);
  }
  url.hash = ''; url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString();
}

export async function fetchWorkingDogHtml(raw: string) {
  let url = workingDogUrl(raw, 'results');
  const originalId = new URL(url).pathname.match(/-([0-9]+)$/)?.[1];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const maximum = 2_500_000;
  try {
    for (let redirects = 0; redirects <= 3; redirects++) {
      const response = await fetch(url, { redirect: 'manual', signal: controller.signal,
        headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'PortaleCinofilo/1.0 public-source-verifier' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (!location || redirects === 3) throw new Error('Reindirizzamento Working-Dog non verificabile.');
        url = workingDogUrl(new URL(location, url).href, 'results');
        if (new URL(url).pathname.match(/-([0-9]+)$/)?.[1] !== originalId) throw new Error('La fonte ha cambiato identificativo del risultato.');
        continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error(`Working-Dog non raggiungibile (${response.status}).`); }
      const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
      if (!['text/html', 'application/xhtml+xml'].includes(type || '') || !response.body) {
        await response.body?.cancel(); throw new Error('La fonte Working-Dog non è una pagina HTML verificabile.');
      }
      if (Number(response.headers.get('content-length')) > maximum) {
        await response.body.cancel(); throw new Error('Pagina Working-Dog troppo grande.');
      }
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let bytes = 0, html = '';
      try {
        while (true) {
          const chunk = await reader.read(); if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > maximum) { await reader.cancel(); throw new Error('Pagina Working-Dog troppo grande.'); }
          html += decoder.decode(chunk.value, { stream: true });
        }
        html += decoder.decode();
      } finally { reader.releaseLock(); }
      return { url, html };
    }
    throw new Error('Fonte Working-Dog non disponibile.');
  } finally { clearTimeout(timeout); }
}
