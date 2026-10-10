// Real production bundle; controlled failures and synthetic API responses only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=(process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5210').replace(/\/$/,'');
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
async function setup(width=390){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const documents=[],errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.resourceType()==='document')documents.push(r.url());});
 await context.route('https://**/*',route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  if(req.method()!=='GET'&&!url.pathname.includes('/rpc/'))writes.push(req.url());
  return route.fulfill({status:200,json:[]});
 });
 await page.addInitScript(()=>{if(!localStorage.getItem('recovery-fixture'))localStorage.setItem('recovery-fixture','existing-progress');});
 return {page,context,documents,errors,writes};
}
const nav=page=>page.getByRole('link',{name:'Impara',exact:true}).first();
const loaded=page=>page.getByRole('heading',{level:1}).filter({hasText:/Vivere meglio insieme/}).first();
const failure=page=>page.locator('#page-recovery-title');
try{
 // A stale deployment chunk must not erase the shell; manual reload preserves URL/storage.
 const t=await setup(1440);let broken=true;
 await t.page.route('**/assets/ImparaHomePage-*.js',route=>broken?route.fulfill({status:404,body:'Missing chunk',contentType:'text/plain'}):route.continue());
 await t.page.goto(base+'/impara?origine=prova');await failure(t.page).waitFor();
 assert.match(await failure(t.page).textContent(),/Non siamo riusciti/);
 assert.equal(await t.page.locator('#page-recovery-title').evaluate(el=>document.activeElement===el),true);
 assert.ok(await nav(t.page).isVisible());assert.equal(t.documents.length,1);assert.deepEqual(t.errors,[]);
 assert.ok(await t.page.getByRole('region',{name:'Non siamo riusciti a caricare questa pagina'}).getByRole('link',{name:'info@portalecinofilo.com',exact:true}).isVisible());
 if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await t.page.screenshot({path:process.env.PC_SCREENSHOTS+'/page-recovery-desktop.png',fullPage:true});}
 broken=false;await t.page.getByRole('button',{name:'Ricarica la pagina',exact:true}).click();
 await failure(t.page).waitFor({state:'detached'});await loaded(t.page).waitFor();
 assert.equal(new URL(t.page.url()).search,'?origine=prova');assert.equal(t.documents.length,2);
 assert.equal(await t.page.evaluate(()=>localStorage.getItem('recovery-fixture')),'existing-progress');assert.deepEqual(t.writes,[]);
 await t.context.close();
 console.log('OK: modulo 404 gestito, shell e focus mantenuti, ricarica manuale con URL e progressi conservati.');
 // Going offline cannot force a reload; reconnecting only enables the user's recovery action.
 const o=await setup();await o.page.goto(base+'/');await nav(o.page).waitFor();
 await o.context.setOffline(true);await nav(o.page).click();await failure(o.page).waitFor();
 assert.match(await failure(o.page).textContent(),/connessione/);
 assert.equal(await o.page.getByRole('button',{name:'Ricarica la pagina',exact:true}).isDisabled(),true);
 assert.ok(await o.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(process.env.PC_SCREENSHOTS)await o.page.screenshot({path:process.env.PC_SCREENSHOTS+'/page-recovery-mobile.png',fullPage:true});
 await o.context.setOffline(false);await o.page.waitForFunction(()=>!document.querySelector('#page-recovery-title').closest('section').querySelector('button').disabled);
 assert.equal(o.documents.length,1);
 // Another route remains usable without reloading the whole app.
 await o.page.getByRole('link',{name:'Trova aiuto per il cane',exact:true}).first().click();
 await failure(o.page).waitFor({state:'detached'});await o.page.waitForURL(/\/search/);assert.equal(o.documents.length,1);
 assert.deepEqual(o.errors,[]);await o.context.close();
 console.log('OK: offline/online senza ricariche automatiche, navigazione verso un’altra pagina funzionante.');
 // An already rendered form survives connection changes with its draft intact.
 const f=await setup();await f.page.goto(base+'/#/signin');await f.page.getByPlaceholder('Email',{exact:true}).fill('bozza@example.invalid');
 await f.context.setOffline(true);await f.page.getByRole('status').filter({hasText:'Riconnettiti prima di inviare o salvare'}).waitFor();
 assert.equal(await f.page.getByPlaceholder('Email',{exact:true}).inputValue(),'bozza@example.invalid');
 await f.context.setOffline(false);await f.page.getByText('Connessione assente. Riconnettiti prima di inviare o salvare.',{exact:true}).waitFor({state:'detached'});
 assert.equal(await f.page.getByPlaceholder('Email',{exact:true}).inputValue(),'bozza@example.invalid');assert.equal(f.documents.length,1);assert.deepEqual(f.writes,[]);await f.context.close();
 console.log('OK: connessione persa e ripristinata conservano il modulo già aperto, senza invii.');
 // A slow import is allowed to finish after the non-destructive slow-loading hint.
 const s=await setup();await s.page.clock.install();let release;
 const gate=new Promise(resolve=>release=resolve);
 await s.page.route('**/assets/ImparaHomePage-*.js',async route=>{await gate;await route.continue().catch(()=>{});});
 try{
  await s.page.goto(base+'/');await nav(s.page).click();await s.page.getByRole('status').filter({hasText:'Caricamento…'}).waitFor();
  await s.page.clock.runFor(11000);
  await s.page.getByRole('status').filter({hasText:'più tempo del previsto'}).waitFor();assert.equal(s.documents.length,1);
  release();await loaded(s.page).waitFor();await s.page.getByText('Il caricamento sta richiedendo più tempo del previsto.',{exact:true}).waitFor({state:'detached'});
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.writes,[]);
 }finally{release();await s.context.close();}
 console.log('OK: caricamento lento segnalato dopo 10 secondi; il completamento rimuove l’avviso.');
 // A render error is not misreported as a connection/update error and never exposes its text.
 const e=await setup();
 await e.page.route('**/assets/ImparaHomePage-*.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'export function ImparaHomePage(){throw new Error("PRIVATE_SYNTHETIC_DETAIL_123")}'}));
 await e.page.goto(base+'/impara');await failure(e.page).waitFor();
 assert.equal(await failure(e.page).textContent(),'Questa pagina ha incontrato un problema');
 assert.ok(!(await e.page.locator('body').innerText()).includes('PRIVATE_SYNTHETIC_DETAIL_123'));
 assert.deepEqual(e.errors,[]);assert.deepEqual(e.writes,[]);await e.context.close();
 console.log('OK: errore di rendering contenuto, nessun dettaglio tecnico o dato dell’errore nell’interfaccia.');
 console.log('Browser reale desktop/mobile. Errori e API simulati; nessun servizio online modificato.');
}finally{await browser.close();}
