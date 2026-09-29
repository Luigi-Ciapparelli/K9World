// Checks built HTML, local routing and browser compatibility. Supabase requests are intercepted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
const dist=path.resolve('dist');
const config=JSON.parse(await fs.readFile('vercel.json','utf8'));
await import('./test_seo_build.mjs');

const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.mp4':'video/mp4','.webm':'video/webm'};
const matches=(pattern,p)=>pattern.endsWith('/:path*') ? (p===pattern.slice(0,-8)||p.startsWith(pattern.slice(0,-7))) : pattern==='/p/:id' ? /^\/p\/[^/]+$/.test(p) : pattern===p;
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');let p=decodeURIComponent(url.pathname);let status=200;
  const redirect=config.redirects.find(r=>matches(r.source,p));
  if(redirect){res.writeHead(308,{Location:redirect.destination});res.end();return;}
  const rewrite=config.rewrites.find(r=>matches(r.source,p));if(rewrite)p=rewrite.destination;
  let target=path.resolve(dist,p==='/'?'index.html':p.slice(1));if(!target.startsWith(dist+path.sep)){res.writeHead(400);res.end();return;}
  try{if(!(await fs.stat(target)).isFile())throw new Error();}catch{target+='.html';try{await fs.access(target);}catch{target=path.join(dist,'404.html');status=404;}}
  const headers={'Content-Type':mime[path.extname(target)]||'application/octet-stream'};
  for(const rule of config.headers)if(matches(rule.source,url.pathname))for(const h of rule.headers)headers[h.key]=h.value;
  res.writeHead(status,headers);res.end(await fs.readFile(target));
 }catch(error){res.writeHead(500);res.end(String(error));}
});
await new Promise(resolve=>server.listen(5197,'127.0.0.1',resolve));
const base='http://127.0.0.1:5197';
let browser;
try{
 for(const p of ['/','/impara','/sport','/sitemap.xml','/robots.txt','/p/00000000-0000-0000-0000-000000000000'])assert.equal((await fetch(base+p)).status,200,p);
 assert.equal((await fetch(base+'/questo-indirizzo-non-esiste')).status,404);
 assert.equal((await fetch(base+'/pro/settings')).headers.get('x-robots-tag'),'noindex, nofollow');
 const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
 browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});const errors=[];
 const uid='d0000000-0000-0000-0000-000000000002';let missing=false;
 await ctx.route('**/*.supabase.co/**',async route=>{
  assert.equal(new URL(route.request().url()).hostname,'pc-home-test.supabase.co');
  const name=new URL(route.request().url()).pathname.split('/').at(-1);
  let data=[];if(name==='public_professional_profiles')data=missing?null:{id:uid,display_name:'Elena Educatrice',bio:'Educazione e gestione quotidiana del cane.',zone_text:'Rimini',professional_type:'trainer',starting_price:35,rating:0,review_count:0};
  if(name==='get_public_booking_availability')data={paused:false,periods:[]};
  await route.fulfill({status:200,json:data});
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 const waitTitle=title=>page.waitForFunction(title=>document.title.includes(title),title);
 await page.goto(base+'/#/impara?source=home');await page.waitForURL('**/impara?source=home');await waitTitle('Educazione del cane: lezioni gratuite');
 const first=page.locator('a.im-lesson-card').first();const href=await first.getAttribute('href');assert.ok(href.startsWith('/impara/stage-1/'));
 await first.click();await page.waitForURL(base+href);await page.getByRole('heading',{level:1}).waitFor();
 await page.reload();await page.getByRole('heading',{level:1}).waitFor();assert.match(await page.title(),/PortaleCinofilo/);
 await page.goBack();await page.waitForURL('**/impara?source=home');await waitTitle('Educazione del cane: lezioni gratuite');
 await page.goForward();await page.waitForURL(base+href);
 await page.goto(base+'/');await page.getByRole('heading',{level:1}).waitFor();await page.getByRole('link',{name:'Impara',exact:true}).first().click();await page.waitForURL(base+'/impara');await waitTitle('Educazione del cane: lezioni gratuite');
 await page.goBack();await waitTitle('PortaleCinofilo | Educazione del cane');
 await page.goto(base+`/p/${uid}?context=sport`);await page.getByRole('heading',{name:'Elena Educatrice',level:1}).waitFor().catch(async error=>{console.error({url:page.url(),errors,body:(await page.locator('body').innerText()).slice(0,2500)});throw error;});await waitTitle('Elena Educatrice');
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://www.portalecinofilo.com/p/${uid}`);
 missing=true;await page.reload();await page.getByRole('heading',{name:'Professionista non trovato'}).waitFor();await page.waitForFunction(()=>document.querySelector('meta[name=robots]').content.includes('noindex'));
 await page.goto(base+'/indirizzo-inesistente');await page.getByRole('heading',{name:'Pagina non trovata'}).waitFor();await waitTitle('Pagina non trovata');
 await page.goto(base+'/impara');await page.getByRole('heading',{level:1}).waitFor();if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.PC_SCREENSHOTS,'PortaleCinofilo_SEO_Impara.png'),fullPage:true});}
 assert.deepEqual(errors,[]);await ctx.close();
 const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto(base+href);assert.ok(await staticPage.locator('h1').textContent());assert.ok(await staticPage.locator('a[href="/impara"]').count());await nojs.close();
 console.log('OK: vecchi link hash, URL puliti, ricarica, avanti/indietro, metadati, profilo pubblico, 404 e lettura senza JavaScript. API simulate.');
 // Shared router: reuse the existing meaningful profile-save and unsaved-draft regressions.
 for (const test of ['test_professional_guided_ui.mjs', 'test_professional_signup_ui.mjs']) {
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[`scripts/tests/${test}`],{stdio:'inherit',env:{...process.env,PC_TEST_BASE_URL:base,PC_SCREENSHOTS:''}});child.on('exit',code=>code===0?resolve():reject(new Error(`${test} failed`)));});
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
