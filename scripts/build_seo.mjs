// Build public HTML from the same React pages shown in the browser. No crawler-specific content.
import { createServer } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
const dist = path.resolve('dist');
const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await fs.readFile(path.join(dist, '.vite/manifest.json'), 'utf8'));
const styles = [...new Set(Object.values(manifest).flatMap(item => item.css || []))].filter(file => !file.includes('ProLayout-'));
// SSR has no user session. Fail if a component accidentally starts requesting data during rendering.
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('SEO build must not fetch APIs, users or remote data.'); };
const server = await createServer({ mode: 'production', server: { middlewareMode: true }, appType: 'custom' });
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {
  const { PUBLIC_PAGES, pageMetadata, renderPublicPage, SITE_URL, SOCIAL_IMAGE, structuredData } = await server.ssrLoadModule('/src/seo/render.tsx');
  function html(meta, body, canonical = true) {
    const json = JSON.stringify(structuredData(meta)).replace(/</g, '\\u003c');
    const tags = `<title>${escape(meta.title)}</title>
<meta name="description" content="${escape(meta.description)}" />
<meta name="robots" content="${meta.index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />
${canonical ? `<link rel="canonical" href="${SITE_URL}${escape(meta.path)}" />` : ''}
<meta property="og:site_name" content="PortaleCinofilo" /><meta property="og:locale" content="it_IT" /><meta property="og:type" content="website" />
<meta property="og:title" content="${escape(meta.title)}" /><meta property="og:description" content="${escape(meta.description)}" />
${canonical ? `<meta property="og:url" content="${SITE_URL}${escape(meta.path)}" />` : ''}
<meta property="og:image" content="${SOCIAL_IMAGE}" /><meta property="og:image:alt" content="PortaleCinofilo" />
<meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escape(meta.title)}" /><meta name="twitter:description" content="${escape(meta.description)}" /><meta name="twitter:image" content="${SOCIAL_IMAGE}" />
<script type="application/ld+json" id="pc-structured-data">${json}</script>`;
    const extraCss = styles.filter(file => !template.includes(`/${file}`)).map(file => `<link rel="stylesheet" href="/${file}" />`).join('');
    return template.replace('<html lang="it">', `<html lang="it"${canonical ? ` data-seo-path="${escape(meta.path)}"` : ''}>`).replace(/<!--pc-seo:start-->[\s\S]*?<!--pc-seo:end-->/, tags).replace('</head>', `${extraCss}</head>`).replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  }
  for (const page of PUBLIC_PAGES) {
    const filename = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
    const target = path.join(dist, filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const body = renderPublicPage(page.path);
    if (!body.includes('<h1')) throw new Error(`Public page has no content: ${page.path}`);
    await fs.writeFile(target, html(page, body));
  }
  await fs.writeFile(path.join(dist, '404.html'), html(pageMetadata('/404'), renderPublicPage('/404'), false));
  await fs.writeFile(path.join(dist, 'app-shell.html'), html(pageMetadata('/signin'), '<main><p>Accedi alla tua area personale.</p></main>', false));
  // Valid public profiles load only the approved public projection; missing ones get noindex at runtime.
  const profileMeta = { ...pageMetadata('/p/00000000-0000-0000-0000-000000000000'), index: true };
  await fs.writeFile(path.join(dist, 'profile-shell.html'), html({ ...profileMeta, index: false }, '<main><p>Caricamento del profilo professionista…</p></main>', false).replace('noindex, follow', 'index, follow').replace(/<script type="application\/ld\+json" id="pc-structured-data">[\s\S]*?<\/script>/, ''));
  const pages = PUBLIC_PAGES.filter(page => page.index);
  await fs.writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${SITE_URL}${escape(page.path)}</loc></url>`).join('\n')}\n</urlset>\n`);
  await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /app-shell\nDisallow: /profile-shell\nDisallow: /offline.html\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`SEO: ${PUBLIC_PAGES.length} pagine HTML pubbliche, ${pages.length} URL nella sitemap, robots.txt e pagina 404. Nessuna richiesta al database.`);
} finally { await server.close(); globalThis.fetch = originalFetch; }
