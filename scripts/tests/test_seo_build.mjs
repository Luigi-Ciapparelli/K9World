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
