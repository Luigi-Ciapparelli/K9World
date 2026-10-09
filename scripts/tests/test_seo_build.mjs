// Dependency-free checks for the public HTML produced by npm run build.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const dist=path.resolve('dist');
const config=JSON.parse(await fs.readFile('vercel.json','utf8'));
const sitemap=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.ok(urls.length>20);assert.equal(new Set(urls).size,urls.length);
let lessonCount=0;
for(const url of urls){
 const u=new URL(url);assert.equal(u.origin,'https://www.portalecinofilo.com');assert.equal(u.search,'');assert.equal(u.hash,'');
 assert.ok(!/^\/(owner|pro|admin)(\/|$)/.test(u.pathname));
 const file=path.join(dist,u.pathname==='/'?'index.html':`${decodeURIComponent(u.pathname).slice(1)}.html`);
 const html=await fs.readFile(file,'utf8');
 assert.match(html,/<html lang="it"/);assert.match(html,/<h1[ >]/);assert.ok(!html.includes('bolt.new'));
 assert.ok(html.includes(`rel="canonical" href="${url}"`),url);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.match(html,/<meta name="robots" content="index, follow/);
 const ld=JSON.parse(html.match(/id="pc-structured-data">([^<]+)<\/script>/)[1]);assert.equal(ld['@context'],'https://schema.org');
 if(u.pathname.startsWith('/impara/stage-1/')) {lessonCount++;assert.ok(html.length>18000);assert.ok(ld['@graph'].some(x=>x['@type']==='LearningResource'));}
}
assert.equal(lessonCount,8);
const home=await fs.readFile(path.join(dist,'index.html'),'utf8');assert.match(home,/href="\/impara"/);assert.match(home,/href="\/sport"/);assert.match(home,/Conosci/);
const impara=await fs.readFile(path.join(dist,'impara.html'),'utf8');assert.ok((impara.match(/href="\/impara\/stage-1\//g)||[]).length>=8);
for(const name of ['privacy','terms','cookies','professional-terms','404','app-shell']) assert.match(await fs.readFile(path.join(dist,`${name}.html`),'utf8'),/noindex/);
assert.match(await fs.readFile(path.join(dist,'robots.txt'),'utf8'),/Sitemap: https:\/\/www.portalecinofilo.com\/sitemap.xml/);
assert.ok(!config.rewrites.some(rule=>rule.source==='/(.*)' || rule.source==='/:path*'),'Unknown paths must remain 404');
for (const route of ['/forgot-password', '/reset-password']) {
 assert.ok(!urls.some(url=>new URL(url).pathname===route));
 assert.ok(config.rewrites.some(rule=>rule.source===route && rule.destination==='/app-shell'));
 const headers=config.headers.find(rule=>rule.source===route)?.headers;
 assert.ok(headers?.some(h=>h.key==='X-Robots-Tag' && h.value==='noindex, nofollow'));
 assert.ok(headers?.some(h=>h.key==='Cache-Control' && h.value==='no-store'));
 assert.ok(headers?.some(h=>h.key==='Referrer-Policy' && h.value==='no-referrer'));
}
console.log(`OK: ${urls.length} URL canonici, HTML con contenuto, otto lezioni, JSON-LD, link, sitemap ed esclusione delle aree personali.`);

assert.ok(urls.includes('https://www.portalecinofilo.com/esposizioni'));
const exhibitions=await fs.readFile(path.join(dist,'esposizioni.html'),'utf8');
assert.match(exhibitions,/Handler per esposizioni/);
assert.match(exhibitions,/anche per la cura quotidiana/);
assert.ok(!exhibitions.includes('Pet sitting'));
assert.match(home,/href="\/esposizioni"/);

// The three expanded guides must be readable before JavaScript runs. Their
// canonical URLs stay stable; the remaining breed catalogue keeps its content.
for (const [slug,title,standard] of [
  ['shikoku','Shikoku: origini, convivenza e scelta consapevole','319'],
  ['clumber-spaniel','Clumber Spaniel: attività, cura e scelta consapevole','109'],
  ['dobermann','Dobermann: relazione, attività e scelta consapevole','143'],
]) {
  const html=await fs.readFile(path.join(dist,'razze',slug+'.html'),'utf8');
  assert.ok(html.includes(`<title>${title} | PortaleCinofilo</title>`),slug);
  assert.ok(html.includes('Immagina la vostra giornata'),slug+' original guidance');
  assert.ok(html.includes(`N. ${standard}`),slug+' standard reference');
  assert.ok(html.includes('Fonti di questa guida'),slug+' visible sources');
  assert.ok(html.includes('dateTime="2026-10-09"'),slug+' source check date');
  assert.ok(!html.includes('Da quale storia funzionale partire'),slug+' no generic duplicate section');
  assert.ok(html.includes('href="/search?type=trainer"'),slug+' direct professional search');
  assert.ok(html.includes('href="/impara/stage-1/'),slug+' contextual learning links');
}
assert.match(await fs.readFile(path.join(dist,'razze','affenpinscher.html'),'utf8'),/Da quale storia funzionale partire/);
console.log('OK: tre guide specifiche nel prerender, fonti visibili, URL stabili e catalogo restante conservato.');
