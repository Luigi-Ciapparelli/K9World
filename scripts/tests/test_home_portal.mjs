// E2E on the production build. Synthetic users and fixture data only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';
const server=await preview({preview:{host:'127.0.0.1',port:5204,strictPort:true}});
const base='http://127.0.0.1:5204', shots=process.env.PC_SCREENSHOTS;
let browser;
try {
  browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'it-IT',serviceWorkers:'block'});
  const page=await ctx.newPage(), errors=[], calls=[], requests=[];
  page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>requests.push(r.url()));
  await ctx.route('**/*.supabase.co/**',async route=>{
    const r=route.request(), u=new URL(r.url());assert.equal(u.hostname,'pc-home-test.supabase.co');
    if(u.pathname.includes('/rpc/')) calls.push({name:u.pathname.split('/').pop(),params:r.postDataJSON()});
    return route.fulfill({json:[]});
  });
  const headed=async()=>{await page.getByRole('heading',{level:1,name:'Conosci il tuo cane. Trova chi ti aiuta.'}).waitFor();};
  const go=async()=>{await page.goto(base);await headed();};
  await go();await page.locator('.pc-landing-cover img').evaluate(image=>image.decode());
  assert.equal(await page.locator('main h1').count(),1);
  assert.equal(calls.length,0,'home must render without searching the public directory');
  assert.ok(!requests.some(url=>url.endsWith('italian-cities.json')),'no municipal directory on initial load');
  assert.equal(await page.locator('main video, main canvas, main iframe').count(),0);
  if(shots) await fs.mkdir(shots,{recursive:true});
  for(const [width,height] of [[1440,900],[1024,768],[820,1024],[768,1024],[390,844],[320,568]]){
    await page.setViewportSize({width,height});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow at ${width}`);
    const box=await page.getByRole('button',{name:'Cerca un addestratore'}).boundingBox();
    assert.ok(box && box.y>=0 && box.y+box.height<=height && box.height>=44,`search requires scrolling at ${width}`);
    const prof=page.getByRole('link',{name:/Gestionale per professionisti/});assert.equal(await prof.count(),1);
    const pb=await prof.boundingBox();assert.ok(pb&&pb.y+pb.height<=height&&pb.x+pb.width<=width);
    const overlap=await page.locator('.pc-landing-cover-caption').evaluate(el=>{const r=el.getBoundingClientRect(), img=el.closest('a').getBoundingClientRect();return r.left<img.left||r.right>img.right||r.bottom>img.bottom;});assert.equal(overlap,false);
    if(shots && [1440,390].includes(width)) await page.screenshot({path:path.join(shots,`home-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('link',{name:'Gestionale per professionisti e centri'}).click();await page.waitForURL(base+'/become-pro');
  await go();await page.getByRole('button',{name:'Apri menu'}).click();await page.getByRole('navigation',{name:'Navigazione principale'}).getByRole('link',{name:'Sport cinofili'}).click();await page.waitForURL(base+'/sport');
  await go();await page.getByRole('button',{name:'Cerca un addestratore'}).click();await page.waitForURL(base+'/search?type=trainer');
  async function waitSearch(){return page.waitForResponse(r=> r.url().includes('/rpc/search_public_professionals'));}
  await go();const input=page.getByLabel('Il tuo comune',{exact:false});await input.fill('Milano');
  await page.waitForFunction(()=>document.querySelectorAll('#home-comuni option').length>0);
  const city=page.waitForURL(url=>url.pathname==='/search' && url.searchParams.get('address')==='Milano');
  await Promise.all([city,waitSearch(),page.getByRole('button',{name:'Cerca una pensione'}).click()]);
  assert.equal(new URL(page.url()).searchParams.get('type'),'boarding');
  const last=calls.filter(x=>x.name==='search_public_professionals').at(-1).params;
  assert.equal(last.p_service_type,'boarding');assert.ok(Math.abs(last.p_lat-45.46)<.1&&Math.abs(last.p_lng-9.19)<.1,'use national city coordinates');
  await go();await page.route('**/data/italian-cities.json',r=>r.abort());await input.fill('  Località prova  ');
  await Promise.all([page.waitForURL(u=>u.pathname==='/search'&&u.searchParams.get('type')==='trainer'),waitSearch(),input.press('Enter')]);
  assert.equal(new URL(page.url()).searchParams.get('address'),'Località prova');
  assert.equal(calls.filter(x=>x.name==='search_public_professionals').at(-1).params.p_zone_text,'Località prova');
  await page.unroute('**/data/italian-cities.json');
  for(const [label,to] of [['Leggi le lezioni gratuite','/impara'],['Leggi l’esercizio: Due zampe sulla piattaforma','/impara/esercizi/piattaforma-shaping'],['Tutti gli esercizi','/impara/esercizi'],['Fai il test di scelta','/prima-del-cane'],['Parlane con un addestratore','/search?type=trainer&source=home&topic=scelta-responsabile&intent=choose-dog']]){
    await go();const link=page.getByRole('main').getByRole('link',{name:label,exact:true});await link.focus();await link.press('Enter');await page.waitForURL(base+to);
    if(to.includes('source=home'))await page.getByText('Scegli il cane insieme a un professionista.',{exact:true}).waitFor();
  }
  await go();await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Tema scuro'}).click();
  await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));
  if(shots) await page.screenshot({path:path.join(shots,'home-scura.png'),fullPage:true});
  assert.deepEqual(errors,[]);await ctx.close();
  // No JS: links and both submitters are real HTML. Search results themselves still require the app.
  const off=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const staticPage=await off.newPage();await staticPage.goto(base);
  assert.equal(await staticPage.locator('h1').count(),1);assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'),'https://www.portalecinofilo.com/');
  assert.ok(await staticPage.getByRole('navigation',{name:'Navigazione principale'}).getByRole('link',{name:'Esposizioni'}).isVisible());
  for(const [label,service] of [['Cerca un addestratore','trainer'],['Cerca una pensione','boarding']]){
    await staticPage.goto(base);await staticPage.getByLabel('Il tuo comune').fill('Rimini');await staticPage.getByRole('button',{name:label}).click();
    const target=new URL(staticPage.url());assert.equal(target.pathname,'/search');assert.equal(target.searchParams.get('type'),service);assert.equal(target.searchParams.get('address'),'Rimini');
  }await off.close();
  // A signed-in visitor still lands in their role's dashboard. A missing profile offers recovery, not an endless spinner.
  for(const role of ['owner','professional','admin','missing']){
    const account=await browser.newContext({serviceWorkers:'block'}),uid='d0000000-0000-0000-0000-000000000029';
    await account.addInitScript(id=>{localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-session',refresh_token:'synthetic-refresh',token_type:'bearer',expires_at:Date.now()/1000+3600,user:{id,email:'demo@example.invalid',aud:'authenticated',role:'authenticated'}}));},uid);
    await account.route('**/*.supabase.co/**',r=>{const u=new URL(r.request().url());assert.equal(u.hostname,'pc-home-test.supabase.co');const n=u.pathname.split('/').at(-1);return r.fulfill({json:n==='profiles'?(role==='missing'?null:{id:uid,role,full_name:'Persona demo',email_verified:true}):n==='user'?{id:uid,role:'authenticated'}:[]});});
    const p=await account.newPage();await p.goto(base);if(role==='missing')await p.getByRole('button',{name:'Riprova caricamento'}).waitFor();else await p.waitForURL(base+'/#/'+(role==='professional'?'pro':role));await account.close();
  }
  console.log('OK home: sei schermi, ricerca con/senza comune, pensione in zona, servizio e tastiera, aperture dirette, tema scuro, senza JS, accesso dei tre ruoli e recupero profilo.');
}finally{await browser?.close();await new Promise(r=>server.httpServer.close(r));}
