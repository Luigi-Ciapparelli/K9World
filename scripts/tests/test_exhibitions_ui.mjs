// Local browser/API fixtures only: no production credentials, accounts or sends.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=(process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5218').replace(/\/$/,'');
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='d0000000-0000-0000-0000-000000000001';
const errors=[];
async function setup(width=1440,professional=false) {
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  if(professional) await context.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  const requests=[];let fail=false;let services=[];
  const pro={id:uid,professional_type:'handler',display_name:'Handler di prova',listing_type:'individual',bio:'Preparazione alle esposizioni.',zone_text:'Rimini',approved:true,approval_status:'approved',rating:0,review_count:0};
  await context.route('https://**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(!url.hostname.endsWith('.supabase.co')) return route.abort();
    assert.equal(url.hostname,'pc-home-test.supabase.co','No production API permitted');
    const name=url.pathname.split('/').at(-1),body=req.postDataJSON(); requests.push({name,body});let data=[];
    if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
    if(name==='profiles')data={id:uid,full_name:'Handler di prova',role:'professional',email:'test@example.invalid',email_verified:true};
    if(name==='professionals'||name==='public_professional_profiles')data=pro;
    if(name==='services')data=services;
    if(name==='professional_external_identities')data=null;
    if(name==='booking_rules')data={};
    if(name==='get_public_booking_availability')data={paused:false,periods:[]};
    if(name==='list_sport_disciplines')data=[{id:'obedience',label:'Obedience'}];
    if(name==='get_my_professional_search_modes')data={show_companion:true,show_sport:false,discipline_ids:[]};
    if(name==='set_my_professional_search_modes')data={show_companion:body.p_show_companion,show_sport:body.p_show_sport,discipline_ids:body.p_discipline_ids};
    if(name?.startsWith('search_')){
      if(fail){fail=false;return route.fulfill({status:400,json:{message:'Synthetic error'}});}
      data=[{...pro,starting_price:35,matching_services:[{id:uid,service_type:body.p_service_type||'trainer',name:'Servizio di prova',price:35,active:true}]}];
    }
    if(name==='save_my_calendar_service'){
      services=[{id:body.p_service_id,service_type:body.p_service_type,name:body.p_name,active:body.p_active,price:body.p_price,duration_minutes:body.p_duration_minutes,duration_kind:body.p_duration_kind,calendar_color:body.p_calendar_color}];data=body.p_service_id;
    }
    await route.fulfill({status:200,json:data});
  });
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  return {context,page,requests,fail:()=>fail=true};
}
async function screenshot(page,name){if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/'+name+'.png',fullPage:true});}}
try {
 for(const width of [1440,390,1024]){
  const {page,context,requests}=await setup(width);
  await page.goto(base+'/search');
  await page.locator('a[href^="/p/"]').first().waitFor();
  assert.equal(requests.filter(r=>r.name==='search_public_professionals').at(-1).body.p_service_type,'trainer');
  for(const label of ['Addestratori','Pensioni'])await page.getByRole('button',{name:label,exact:true}).waitFor();
  for(const label of ['Pet sitting','Passeggiate','Toelettatura'])assert.equal(await page.getByRole('button',{name:label,exact:true}).count(),0);
  await page.getByRole('button',{name:'Pensioni',exact:true}).click();await page.getByRole('button',{name:'Cerca',exact:true}).click();
  await page.waitForURL(/type=boarding/);await page.waitForResponse(r=>r.url().includes('search_public_professionals'));
  assert.equal(requests.filter(r=>r.name==='search_public_professionals').at(-1).body.p_service_type,'boarding');
  const menu=page.getByRole('button',{name:'Apri menu',exact:true});if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'Navigazione principale'}).getByRole('link',{name:'Esposizioni',exact:true}).click();
  await page.getByRole('heading',{level:1,name:'Esposizioni',exact:true}).waitFor();
  await page.getByRole('button',{name:'Handler per esposizioni',exact:true}).click();
  await page.getByLabel('Città o zona',{exact:true}).fill('Rimini');
  await page.getByRole('button',{name:'Cerca',exact:true}).click();await page.waitForURL(/type=handler/);
  await page.waitForResponse(r=>r.url().includes('search_exhibition_professionals'));
  await page.locator('a[href^="/p/"]').first().waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow '+width);
  if(width!==1024)await screenshot(page,'esposizioni-'+width);
  await page.getByText('Altri filtri pratici',{exact:false}).click();
  await page.getByLabel('Prezzo massimo per servizio',{exact:true}).fill('80');
  await page.waitForResponse(r=>r.url().includes('search_exhibition_professionals') && r.request().postDataJSON().p_max_price===80);
  await page.locator('a[href^="/p/"]').first().click();
  await page.getByRole('heading',{name:'Handler di prova',level:1}).waitFor();
  await page.getByRole('button',{name:'Torna alla ricerca',exact:true}).click();
  assert.ok(page.url().includes('/esposizioni?'));assert.equal(new URL(page.url()).searchParams.get('type'),'handler');assert.equal(new URL(page.url()).searchParams.get('address'),'Rimini');
  assert.equal(new URL(page.url()).searchParams.get('max_price'),'80'); await page.getByRole('button',{name:/Massimo €80/}).waitFor();
  await context.close();
 }
 {
  const {context,page,requests,fail}=await setup();
  await page.goto(base+'/search?type=groomer&address=Rimini');await page.waitForURL(/\/esposizioni\?/);
  await page.getByRole('status').filter({hasText:'ora in Esposizioni'}).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('address'),'Rimini');
  await page.goto(base+'/search?type=walker');await page.getByText('Questa categoria non è disponibile in questa ricerca',{exact:true}).waitFor();
  assert.equal(requests.filter(r=>r.name==='search_public_professionals'&&r.body?.p_service_type==='walker').length,0);
  assert.equal(await page.getByRole('button',{name:'Addestratori',exact:true}).getAttribute('aria-pressed'),'false');
  await page.getByRole('button',{name:'Addestratori',exact:true}).click();await page.getByRole('button',{name:'Cerca',exact:true}).click();await page.waitForURL(/type=trainer/);
  await page.locator('a[href^="/p/"]').first().waitFor();
  fail();await page.goto(base+'/esposizioni');await page.getByRole('alert').filter({hasText:'Impossibile caricare'}).waitFor(); await page.getByRole('button',{name:'Riprova',exact:true}).click(); await page.locator('a[href^="/p/"]').first().waitFor();
  await page.goto(base+'/sport');await page.getByLabel('Disciplina sportiva').selectOption('obedience');await page.getByRole('button',{name:'Trova addestratore per disciplina',exact:true}).click();
  await page.waitForResponse(r=>r.url().includes('search_sport_professionals') && r.request().postDataJSON().p_discipline_id==='obedience');
  await context.close();
 }
 {
  const {context,page,requests}=await setup(1440,true);
  await page.goto(base+'/#/pro/settings?step=services');await page.getByRole('button',{name:'Aggiungi servizio',exact:true}).click();
  assert.equal(await page.getByLabel('Categoria',{exact:true}).inputValue(),'handler');
  assert.equal(await page.getByLabel('Categoria',{exact:true}).locator('option[value="sitter"],option[value="walker"],option[value="other"]').count(),0);
  await page.getByLabel('Nome del servizio',{exact:true}).fill('Preparazione al ring');
  await page.getByRole('button',{name:'Continua',exact:true}).click();await page.getByRole('button',{name:'Continua',exact:true}).click();
  await page.getByText('Esposizioni · Handler per esposizioni',{exact:true}).waitFor();await screenshot(page,'servizio-handler');
  await page.getByRole('button',{name:'Salva servizio',exact:true}).click();await page.getByRole('status').filter({hasText:'Servizio salvato'}).waitFor();
  assert.equal(requests.filter(r=>r.name==='save_my_calendar_service').at(-1).body.p_service_type,'handler');
  await page.goto(base+'/#/pro/settings?step=visibility');await page.getByRole('heading',{name:'Dove possono trovarti',exact:true}).waitFor();
  await page.getByText('Esposizioni · Handler per esposizioni',{exact:true}).waitFor();
  assert.equal(await page.getByRole('checkbox',{name:/Mostrami/}).count(),0,'No irrelevant sport setup for handler');
  await screenshot(page,'visibilita-handler');await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log('OK: ricerca diretta, pensioni, esposizioni, ritorno dal profilo, link precedenti, errori, sport, servizio handler guidato; desktop e mobile. API simulate.');
}finally{await browser.close();}
