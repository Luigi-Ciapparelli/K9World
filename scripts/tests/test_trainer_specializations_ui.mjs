// Real browser with synthetic APIs: no live account, database, messages or uploads.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5211';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='d0000000-0000-0000-0000-000000000001';const errors=[];
async function shot(page,name){if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/'+name+'.png',fullPage:true});}}
async function setup(width,professional=false){
 const ctx=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'});
 if(professional)await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 const calls=[];let failure='';let credentials=[];let modes={show_companion:true,show_sport:false,show_livestock:false,show_hunting:false,discipline_ids:[]};
 const pro={id:uid,professional_type:'trainer',display_name:'Professionista di prova',full_name:'Professionista di prova',listing_type:'individual',bio:'Educazione e percorsi specialistici.',zone_text:'Rimini',approved:true,approval_status:'approved',rating:0,review_count:0};
 const services=[{id:uid,service_type:'trainer',name:'Percorso educativo',active:true,price:25,duration_minutes:60,duration_kind:'hourly',calendar_color:'#047857'}];
 await ctx.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(!url.hostname.endsWith('.supabase.co'))return route.abort();
  assert.equal(url.hostname,'pc-home-test.supabase.co');const name=url.pathname.split('/').at(-1),body=req.postDataJSON();calls.push({name,body});let data=[];
  if(name===failure){failure='';return route.fulfill({status:503,json:{message:'Synthetic transient failure'}});}
  if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,full_name:pro.full_name,role:'professional',email:'test@example.invalid',email_verified:true};
  if(name==='professionals'||name==='public_professional_profiles')data=pro;
  if(name==='services'||name==='get_public_professional_services')data=services;
  if(name==='professional_external_identities')data=null;
  if(name==='booking_rules')data={};
  if(name==='get_public_booking_availability')data={paused:false,periods:[]};
  if(name==='get_public_service_reviews')data={items:[],count:0};
  if(name==='list_sport_disciplines')data=[{id:'obedience',label:'Obedience',description:'Disciplina di prova'}];
  if(name==='get_my_professional_search_modes')data=modes;
  if(name==='set_my_training_search_modes'){modes={show_companion:body.p_show_companion,show_sport:body.p_show_sport,show_livestock:body.p_show_livestock,show_hunting:body.p_show_hunting,discipline_ids:body.p_discipline_ids};data=modes;}
  if(name==='professional_credentials'){
   if(req.method()==='POST'){credentials.push({...body,verification_status:'pending'});data=null;}else data=credentials;
  }
  if(name==='get_public_professional_credentials_v2')data=[{id:'a',credential_type:'professional_qualification',title:'Qualifica di prova',issuer_name:'ENCI',enci_section:2,verification_status:'pending',external_url:'https://www.enci.it/addestratori-e-handler/registro-addestratori'}];
  if(name==='get_public_training_activities')data={companion:true,livestock:true,hunting:false};
  if(name?.startsWith('search_')){
   const label=body?.p_focus==='hunting'?'Specialista caccia':body?.p_focus==='livestock'?'Specialista bestiame':'Educatore quotidiano';
   data=[{...pro,display_name:label,starting_price:25,matching_services:services}];
  }
  return route.fulfill({status:200,json:data});
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 return {page,ctx,calls,fail:name=>failure=name};
}
try {
 for(const width of [1440,390]){
  const {page,ctx,calls,fail}=await setup(width);
  await page.goto(base+'/search');await page.getByText('Educatore quotidiano',{exact:true}).waitFor();
  assert.equal(calls.filter(c=>c.name==='search_public_professionals').at(-1).body.p_service_type,'trainer');
  assert.equal(await page.locator('input[type=checkbox]').count(),0,'No mandatory section checkboxes');
  assert.equal(await page.getByText('Sezione 1',{exact:true}).count(),0);
  if(width<1024){
   assert.equal(await page.getByText('Tipo di risultato',{exact:true}).isVisible(),false);
   await page.getByRole('button',{name:'Filtri facoltativi',exact:false}).click();
   assert.ok(await page.getByText('Tipo di risultato',{exact:true}).isVisible());
   await page.getByRole('button',{name:'Filtri facoltativi',exact:false}).click();
  }
  await shot(page,'daily-search-'+width);
  await page.getByLabel('Città o zona',{exact:true}).fill('Rimini');
  await page.getByRole('button',{name:'Lavoro con il bestiame',exact:true}).click();await page.waitForURL(/training=livestock/);
  await page.getByText('Specialista bestiame',{exact:true}).waitFor();
  let query=calls.filter(c=>c.name==='search_training_professionals').at(-1).body;
  assert.equal(query.p_focus,'livestock');assert.ok(query.p_lat || query.p_zone_text==='Rimini');
  assert.equal(await page.getByLabel('Città o zona',{exact:true}).inputValue(),'Rimini');
  await shot(page,'specialist-search-'+width);
  await page.getByRole('button',{name:'Addestramento per la caccia',exact:true}).click();await page.getByText('Specialista caccia',{exact:true}).waitFor();
  await page.goBack();await page.getByText('Specialista bestiame',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Torna all’educazione quotidiana',exact:true}).click();await page.getByText('Educatore quotidiano',{exact:true}).waitFor();
  assert.ok(!page.url().includes('training='));
  await page.getByRole('button',{name:'Pensioni',exact:true}).click();await Promise.all([page.waitForResponse(r=>r.url().includes('search_public_professionals')),page.getByRole('button',{name:'Cerca',exact:true}).click()]);
  assert.equal(await page.getByRole('button',{name:'Lavoro con il bestiame',exact:true}).count(),0);
  await page.goto(base+'/search?training=invalid');await page.getByRole('alert').filter({hasText:'Attività non riconosciuta'}).waitFor();
  await page.getByRole('button',{name:'Cerca',exact:true}).click();await page.getByText('Educatore quotidiano',{exact:true}).waitFor();
  fail('search_training_professionals');await page.getByRole('button',{name:'Addestramento per la caccia',exact:true}).click();
  await page.getByRole('button',{name:'Riprova',exact:true}).click();await page.getByText('Specialista caccia',{exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(base+'/sport');await page.getByLabel('Disciplina sportiva').waitFor();
  assert.equal(await page.getByRole('button',{name:'Lavoro con il bestiame',exact:true}).count(),0);
  await page.goto(base+'/p/'+uid);await page.getByText('Registro addestratori ENCI · Sezione 2',{exact:false}).waitFor();
  await page.getByText('In verifica',{exact:true}).waitFor();await page.getByText('Come può aiutarti',{exact:true}).waitFor();
  assert.equal(await page.getByText('Verificato da PortaleCinofilo',{exact:true}).count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(base+'/impara');await page.getByText('Capire le qualifiche ENCI e le specializzazioni',{exact:true}).click();
  await page.getByText('Sezione 3 · Cani da caccia',{exact:true}).waitFor();await shot(page,'enci-guide-'+width);
  await ctx.close();
  const pro=await setup(width,true);const p=pro.page;
  await p.goto(base+'/pro/settings?step=visibility');await p.getByRole('checkbox',{name:'Educazione e vita quotidiana',exact:false}).waitFor();
  await p.getByRole('checkbox',{name:'Educazione e vita quotidiana',exact:false}).uncheck();
  await p.getByRole('checkbox',{name:'Lavoro con il bestiame',exact:false}).check();
  pro.fail('set_my_training_search_modes');await p.getByRole('button',{name:'Salva visibilità e discipline',exact:true}).click();
  await p.getByRole('alert').filter({hasText:'Salvataggio non confermato'}).waitFor();
  assert.ok(await p.getByRole('checkbox',{name:'Lavoro con il bestiame',exact:false}).isChecked());
  await p.getByRole('button',{name:'Salva visibilità e discipline',exact:true}).click();await p.getByText('Visibilità e discipline salvate.',{exact:true}).waitFor();
  assert.equal(pro.calls.filter(c=>c.name==='set_my_training_search_modes').at(-1).body.p_show_companion,false);
  await p.reload();assert.ok(await p.getByRole('checkbox',{name:'Lavoro con il bestiame',exact:false}).isChecked());
  await shot(p,'professional-activities-'+width);
  await p.goto(base+'/pro/settings?step=credentials');await p.getByRole('button',{name:'Aggiungi attestato o risultato',exact:true}).click();
  await p.getByLabel('Tipo evidenza',{exact:false}).selectOption('professional_qualification');
  await p.getByLabel('Sezione ENCI (facoltativa)',{exact:false}).selectOption('2');
  await p.getByRole('button',{name:'Continua',exact:true}).click();
  await p.getByRole('button',{name:'Continua',exact:true}).click();
  await p.getByRole('button',{name:'Aggiungi evidenza',exact:true}).click();
  await p.getByText('Voce aggiunta come dichiarazione non verificata.',{exact:true}).waitFor();
  const saved=pro.calls.filter(c=>c.name==='professional_credentials' && c.body).at(-1).body;
  assert.equal(saved.enci_section,2);assert.equal(saved.issuer_name,'ENCI');assert.equal(saved.verification_status,'self_declared');
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await pro.ctx.close();
 }
 assert.deepEqual(errors,[]);
 console.log('OK: direct owner search, optional specialist links, location/history/retry, independent professional preferences, ENCI declaration, public status and Impara on desktop/mobile. APIs simulated.');
}finally{await browser.close();}
