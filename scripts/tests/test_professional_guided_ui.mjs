// Synthetic browser fixtures; no production data or credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}),args:['--no-sandbox','--disable-dev-shm-usage']});
const base=(process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5196').replace(/\/$/, '') + '/';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use a local fixture server only');
const OUT=process.env.PC_SCREENSHOTS;
if (OUT) await fs.mkdir(OUT, {recursive:true});
const uid='d0000000-0000-0000-0000-000000000001';const errors=[];
async function setup(width=1440, theme='light', approval='approved') {
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
 await context.addInitScript(({uid,theme})=>{
  localStorage.setItem('pawconnect-theme',theme);
  localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}}));
 },{uid,theme});
 const writes=[];let fail=false;let failLoad=false;
 let profile={id:uid,full_name:'Elena Rossi',role:'professional',email:'test@example.invalid',email_verified:true,phone_verified:false,avatar_url:''};
 let pro={id:uid,professional_type:'trainer',listing_type:'individual',bio:'',zone_text:'Rimini',latitude:44.0678,longitude:12.5695,coverage_radius_km:20,starting_price:25,approved:approval==='approved',approval_status:approval,team_size:1};
 let rules={min_lead_hours:4,cancellation_hours:24,min_duration_minutes:30,max_duration_minutes:480,buffer_minutes:15};
 let services=[];let credentials=[];
 await context.route('**/*.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()),name=url.pathname.split('/').at(-1),method=request.method();
  assert.equal(url.hostname,'pc-home-test.supabase.co');
  let data=[];let headers={};
  if(name==='user') data={id:uid,email:'test@example.invalid',role:'authenticated'};
  if(name==='profiles') data=profile;
  if(name==='professionals') { if(failLoad && method==='GET') return route.fulfill({status:500,json:{message:'Injected load failure'}}); data=pro; }
  if(name==='services') data=services;
  if(name==='booking_rules') data=rules;
  if(name==='professional_credentials') data=credentials;
  if(name==='professional_external_identities') data=null;
  if(name==='get_my_professional_search_modes') data={show_companion:true,show_sport:false,discipline_ids:[]};
  if(name==='list_sport_disciplines') data=[{id:'obedience',label:'Obedience'},{id:'igp',label:'IGP'}];
  if(name==='get_professional_bookings') headers={'content-range':'0-0/0'};
  if(['PATCH','POST'].includes(method)) {
   const body=request.postDataJSON(); writes.push({name,method,body});
   if(fail && ['professionals','save_my_calendar_service'].includes(name)) {fail=false;return route.fulfill({status:500,json:{message:'Errore di prova: riprova'}});}
   if(name==='professionals') {pro={...pro,...body};data=pro;}
   if(name==='profiles') {profile={...profile,...body};data=profile;}
   if(name==='booking_rules') {rules={...rules,...body};data=rules;}
   if(name==='save_my_calendar_service') {services=[{id:body.p_service_id,name:body.p_name,service_type:body.p_service_type,price:body.p_price,duration_minutes:body.p_duration_minutes,duration_kind:body.p_duration_kind,calendar_color:body.p_calendar_color,active:body.p_active}];data=null;}
   if(name==='professional_credentials') {credentials=[body,...credentials];data=body;}
   if(name==='set_my_professional_search_modes') data={show_companion:body.p_show_companion,show_sport:body.p_show_sport,discipline_ids:body.p_discipline_ids};
  }
  await route.fulfill({status:200,json:data,headers});
 });
 const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 return {page,context,writes,fail:()=>fail=true,failLoad:()=>failLoad=true};
}
try {
 const t=await setup();const {page,context,writes}=t;
 await page.goto(base+'#/pro/settings');await page.getByRole('heading',{name:'Un passo alla volta. Il tuo lavoro prende forma.'}).waitFor();
 assert.equal(await page.locator('progress').getAttribute('value'),'2');
 assert.equal(await page.getByRole('link',{name:'Apri profilo pubblico'}).getAttribute('href'),`/p/${uid}`);
 assert.equal(await page.locator('main input,main textarea,main select').count(),0);
 if(OUT) await page.screenshot({path:OUT+'/PortaleCinofilo_percorso_professionista.png',fullPage:true,animations:'disabled'});
 await page.getByRole('button',{name:'Continua il profilo',exact:true}).click();
 await page.waitForURL(/step=story/);assert.equal(await page.locator('main textarea').count(),1);
 await page.locator('main textarea').fill('Lavoro con il proprietario per costruire una gestione quotidiana serena.');
 t.fail();await page.getByRole('button',{name:'Salva e continua',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Errore di prova'}).waitFor();assert.match(page.url(),/step=story/);
 await page.getByRole('button',{name:'Salva e continua',exact:true}).click();await page.waitForURL(/step=services/);
 const savedStory=writes.filter(w=>w.name==='professionals').at(-1);assert.deepEqual(Object.keys(savedStory.body).sort(),['bio','updated_at']);assert.ok(!writes.some(w=>w.name==='booking_rules'));
 await page.getByRole('button',{name:'Aggiungi servizio',exact:true}).click();
 await page.getByLabel('Nome del servizio', {exact:true}).fill('Educazione individuale');
 assert.equal(await page.getByLabel('Prezzo per prenotazione (€)',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Continua',exact:true}).click();
 await page.getByLabel('Prezzo per prenotazione (€)',{exact:true}).fill('35');
 await page.getByLabel('Durata occupata nel calendario (minuti)',{exact:true}).fill('60');
 await page.getByRole('button',{name:'Continua',exact:true}).click();
 assert.ok(!writes.some(w=>w.name==='save_my_calendar_service'));
 if(OUT) await page.screenshot({path:OUT+'/PortaleCinofilo_servizio_guidato.png',fullPage:true,animations:'disabled'});
 t.fail();await page.getByRole('button',{name:'Salva servizio',exact:true}).click();await page.getByRole('alert').filter({hasText:'Salvataggio non confermato'}).waitFor();
 await page.getByRole('button',{name:'Salva servizio',exact:true}).click();await page.getByRole('status').filter({hasText:'Servizio salvato'}).waitFor();
 const services=writes.filter(w=>w.name==='save_my_calendar_service');assert.equal(services.length,2);assert.equal(services[0].body.p_service_id,services[1].body.p_service_id);
 await page.getByRole('button',{name:'Il tuo percorso',exact:true}).click();assert.equal(await page.locator('progress').getAttribute('value'),'4');
 await page.reload();await page.locator('progress').waitFor();assert.equal(await page.locator('progress').getAttribute('value'),'4');
 await page.getByRole('button',{name:/Racconta come lavori/}).click();await page.locator('main textarea').fill('Bozza non salvata');
 page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('navigation',{name:'Navigazione professionista'}).getByRole('button',{name:'Calendario',exact:true}).click();
 assert.match(page.url(),/step=story/);assert.equal(await page.locator('main textarea').inputValue(),'Bozza non salvata');
 // Native hash links must respect the same unsaved draft guard.
 await Promise.all([page.waitForEvent('dialog').then(dialog=>dialog.dismiss()), page.evaluate(()=>{location.hash='/pro/calendar';})]);
 await page.waitForFunction(()=>location.hash.includes('step=story'));
 assert.equal(await page.locator('main textarea').inputValue(),'Bozza non salvata');
 // Change within the editor keeps the draft; cancelling external navigation preserves it.
 await page.getByRole('navigation',{name:'Passaggi del profilo'}).getByRole('button',{name:/Identità/}).click();
 await page.getByRole('navigation',{name:'Passaggi del profilo'}).getByRole('button',{name:/Presentazione/}).click();assert.equal(await page.locator('main textarea').inputValue(),'Bozza non salvata');
 await page.getByRole('button',{name:'Salva',exact:true}).click();await page.getByRole('status').filter({hasText:'Modifiche salvate'}).waitFor();
 await page.getByRole('button',{name:'Il tuo percorso',exact:true}).click();await page.getByRole('tab',{name:/Esplora gli strumenti/}).click();
 if(OUT) await page.screenshot({path:OUT+'/PortaleCinofilo_guide_strumenti.png',fullPage:true,animations:'disabled'});
 const beforeTour=writes.length;await page.getByRole('button',{name:/Gestisci richieste e messaggi/}).click();
 await page.getByRole('heading',{name:'Leggi prima di rispondere'}).waitFor();
 await page.getByRole('button',{name:'Passaggio successivo'}).click();await page.getByRole('button',{name:'Passaggio successivo'}).click();await page.getByRole('button',{name:'Termina guida'}).click();
 assert.ok(await page.evaluate(uid=>JSON.parse(localStorage.getItem('pc-pro-explored-v1:'+uid)).includes('requests'),uid));
 assert.ok(writes.slice(beforeTour).every(w=>w.name.startsWith('get_') || w.name.startsWith('list_')),'Tour cannot mutate business data');
 await page.goto(base+'#/pro/settings?step=credentials');await page.getByRole('button',{name:'Aggiungi attestato o risultato'}).click();
 await page.getByLabel('Titolo',{exact:true}).fill('Corso di formazione');
 await page.getByRole('button',{name:'Continua',exact:true}).click();await page.getByRole('button',{name:'Continua',exact:true}).click();
 await page.getByRole('button',{name:'Aggiungi evidenza',exact:true}).click();await page.getByText('Voce aggiunta come dichiarazione non verificata.',{exact:true}).waitFor();
 assert.equal(writes.filter(w=>w.name==='professional_credentials').at(-1).body.verification_status,'self_declared');
 await context.close();
 for(const width of [320,390,768,1024,1440]) {
  const {page,context}=await setup(width);await page.goto(base+'#/pro/settings');await page.locator('progress').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overview overflow '+width);
  if(width===390)if(OUT) await page.screenshot({path:OUT+'/PortaleCinofilo_percorso_mobile.png',fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Continua il profilo',exact:true}).click();await page.waitForURL(/step=story/);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Editor overflow '+width);
  await context.close();
 }
 const dark=await setup(1440,'dark');await dark.page.goto(base+'#/pro/settings');await dark.page.locator('progress').waitFor();if(OUT) await dark.page.screenshot({path:OUT+'/PortaleCinofilo_percorso_scuro.png',fullPage:true,animations:'disabled'});await dark.context.close();
 for(const state of ['pending','rejected']) {
  const t=await setup(390,'light',state);await t.page.goto(base+'#/pro/settings');await t.page.locator('progress').waitFor();
  assert.equal(await t.page.getByRole('link',{name:'Apri profilo pubblico'}).count(),0);
  assert.ok(await t.page.getByText(state==='pending'?'Profilo in attesa di approvazione':'Profilo da rivedere',{exact:true}).isVisible());
  assert.ok(await t.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Approval notice mobile overflow');
  await t.page.getByRole('button',{name:'Vedi stato e verifiche',exact:true}).click();await t.page.waitForURL(/step=verification/);
  await t.context.close();
 }
 const unavailable=await setup();unavailable.failLoad();await unavailable.page.goto(base+'#/pro/settings');await unavailable.page.getByRole('alert').waitFor();assert.equal(await unavailable.page.locator('progress').count(),0);await unavailable.context.close();
 assert.deepEqual(errors,[]);
 console.log('OK: dati persistiti e progressi reali, salvataggio per sezione, errori e retry, servizio in tre passi senza duplicati, protezione bozze, guide senza scritture, attestati, responsive e stato di errore. API simulate; nessun dato online modificato.');
} finally { await browser.close(); }
