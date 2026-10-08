// Synthetic accounts and API responses only. Never contact production.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium }=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5218';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='e8100000-0000-0000-0000-000000000001',dog='e8100000-0000-0000-0000-000000000101',rel='e8100000-0000-0000-0000-000000000201',grant='e8100000-0000-0000-0000-000000000301';
const malicious='<img src=x onerror="window.badExport=true">';
const errors=[];
const fixture=scope=>({schema_version:1,generated_at:'2026-10-08T17:00:00Z',scope,subject_id:scope==='owner'?dog:scope==='received'?grant:rel,range:{from:null,until_exclusive:null},dog:{id:dog,name:'Cane prova',source:scope==='owner'?'current_owner_record':'professional_archive',breed:'Meticcio',owner_notes:scope==='owner'?malicious:null,photo_path:scope==='owner'?`${uid}/${dog}/profile`:null},relationships:scope==='received'?[]:[{id:rel,professional_name:'Autore test',status:'active',authorized_at:'2026-10-01T10:00:00Z'}],bookings:scope==='received'?[]:[{id:rel,service_name:'Lezione',professional_name:'Autore test',start_at:'2026-10-02T10:00:00Z',end_at:'2026-10-02T11:00:00Z',status:'completed',notes:'Nota richiesta',price:25,service_type:'trainer'}],messages:scope==='received'?[]:[{booking_id:rel,sequence:1,sender_kind:'professional',body:'Messaggio nel documento',created_at:'2026-10-01T10:00:00Z'}],notes:[{session_id:rel,note_id:rel,activity:'Piattaforma',occurred_at:'2026-10-02T10:00:00Z',revision_number:2,body:'Nota autorizzata '+malicious,revision_created_at:'2026-10-02T12:00:00Z',author_name:'Autore test',access_kind:scope==='professional'?'private_archive':'shared_revision'}],counts:{relationships:scope==='received'?0:1,bookings:scope==='received'?0:1,messages:scope==='received'?0:1,notes:1},data_bytes:800,limits:['Solo dati disponibili.']});
async function setup(width,role='owner'){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',acceptDownloads:true});
 await context.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 const state={revoked:false,withdrawn:false,photoFailure:false,hold:false,blocked:null,calls:[]};
 await context.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(!url.hostname.endsWith('.supabase.co'))return route.abort();assert.equal(url.hostname,'pc-home-test.supabase.co');
  const name=url.pathname.split('/').at(-1);let data=[];
  if(url.pathname.includes('/storage/v1/object/')){
   if(state.photoFailure)return route.fulfill({status:404,json:{error:'not found'}});
   return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});
  }
  if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,full_name:'Account test',role,email_verified:true,email:'test@example.invalid'};
  if(name==='dogs')data=url.searchParams.get('select')==='id,name'?[{id:dog,name:'Cane prova'}]:{id:dog,owner_id:uid,name:'Cane prova',breed:'Meticcio',age:2,photo_url:''};
  if(name==='professionals')data={id:uid,professional_type:'trainer',approved:true};
  if(name==='list_my_dog_relationships')data=[{id:rel,dog_name:'Cane prova',professional_name:'Autore test',status:'active',authorized_at:'2026-10-01T10:00:00Z',accepted_at:'2026-10-01T11:00:00Z'}];
  if(name==='list_my_continuity_grants')data=[{grant_id:grant,dog_name:'Cane prova',professional_name:'Destinatario',purpose:'Continuazione',is_current:true,expires_at:'2026-12-01T10:00:00Z',selected_count:1,available_count:1,total_count:1}];
  if(name==='export_dog_history'){
   const body=req.postDataJSON();state.calls.push(body);
   if(!body.p_preview&&state.hold){state.blocked=route;return;}
   if(!body.p_preview&&state.revoked)return route.fulfill({status:403,json:{code:'42501',message:'Revoked'}});
   data=body.p_preview?{dog_name:'Cane prova',counts:{relationships:1,bookings:0,messages:0,notes:1},data_bytes:800,checked_at:new Date().toISOString(),photo_present:body.p_scope==='owner'}:fixture(body.p_scope);
   if(!body.p_preview&&state.withdrawn){data.notes=[];data.counts.notes=0;}
  }
  await route.fulfill({status:200,json:data});
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 return {context,page,state};
}
async function openOwner(page){await page.goto(base+'/owner/dogs/'+dog);await page.getByRole('button',{name:'Scarica storico',exact:true}).click();}
async function preview(page){await page.getByRole('button',{name:'Prepara il riepilogo',exact:true}).click();await page.getByRole('region',{name:'Riepilogo esportazione'}).waitFor();}
async function save(page,label){const wait=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();const dl=await wait;return {name:dl.suggestedFilename(),text:await fs.readFile(await dl.path(),'utf8')};}
try {
 for(const width of [1440,390]){
  const {context,page,state}=await setup(width);await openOwner(page);await preview(page);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/export-'+width+'.png'});}
  const html=await save(page,'Scarica documento');assert.match(html.name,/\.html$/);assert.ok(html.text.includes('&lt;img src=x onerror='));assert.ok(!html.text.includes(malicious));assert.ok(html.text.includes('data:image/png;base64,'));assert.ok(!html.text.includes('photo_path'));assert.ok(html.text.includes('Messaggio nel documento'));assert.ok(html.text.includes('Nota richiesta'));
  assert.equal(state.calls.filter(c=>!c.p_preview).length,2,'Fresh delivery check after photo');
  const report=await context.newPage();await report.setContent(html.text);assert.equal(await report.evaluate(()=>window.badExport),undefined);assert.equal(await report.locator('script').count(),0);
  if(process.env.PC_SCREENSHOTS)await report.screenshot({path:process.env.PC_SCREENSHOTS+'/document-'+width+'.png',fullPage:true});
  await report.close();
  await preview(page);state.withdrawn=true;const json=JSON.parse((await save(page,'Scarica dati JSON')).text);assert.equal(json.notes.length,0,'Never use preview/cached notes after withdrawal');assert.equal(json.dog.photo_path,undefined);
  await preview(page);state.revoked=true;await page.getByRole('button',{name:'Scarica documento',exact:true}).click();await page.getByRole('alert').filter({hasText:'Non puoi più esportare'}).waitFor();assert.equal(await page.getByRole('button',{name:'Scarica documento',exact:true}).count(),0);
  await context.close();
 }
 {
  const {context,page,state}=await setup(390);await openOwner(page);await page.getByText('Scegli un periodo (facoltativo)').click();await page.getByLabel('Dall’attività del').fill('2026-10-09');await page.getByLabel('Fino al giorno incluso').fill('2026-10-01');await page.getByRole('button',{name:'Prepara il riepilogo'}).click();await page.getByRole('alert').filter({hasText:'Controlla le date'}).waitFor();assert.equal(state.calls.length,0);
  await page.getByLabel('Dall’attività del').fill('2026-10-01');await preview(page);assert.equal(state.calls[0].p_from,new Date('2026-10-01T00:00:00').toISOString());
  state.photoFailure=true;const json=JSON.parse((await save(page,'Scarica dati JSON')).text);assert.equal(json.photo.status,'omitted');assert.ok(json.photo.detail.includes('Non è stato possibile'));assert.equal(json.notes.length,1);await context.close();
 }
 {
  const {context,page}=await setup(1440,'professional');await page.goto(base+'/pro/archive');await page.getByRole('button',{name:'Scarica il tuo archivio'}).click();await preview(page);const own=JSON.parse((await save(page,'Scarica dati JSON')).text);assert.equal(own.scope,'professional');await page.getByRole('button',{name:'Chiudi esportazione'}).click();await page.getByRole('button',{name:'Scarica la selezione autorizzata'}).click();await preview(page);const received=JSON.parse((await save(page,'Scarica dati JSON')).text);assert.equal(received.scope,'received');await context.close();
 }
 for(const leave of ['close','logout']){
  const {context,page,state}=await setup(1440);let downloads=0;page.on('download',()=>downloads++);await openOwner(page);await preview(page);state.hold=true;await page.getByRole('button',{name:'Scarica documento',exact:true}).click();
  await page.waitForTimeout(100);assert.ok(state.blocked);if(leave==='close')await page.getByRole('button',{name:'Chiudi esportazione'}).click();else await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabase.ts');await supabase.auth.signOut({scope:'local'});});await state.blocked.fulfill({status:200,json:fixture('owner')});await page.waitForTimeout(100);assert.equal(downloads,0,'Closing cancels late download');await context.close();
 }
 assert.deepEqual(errors,[]);console.log('OK: desktop/mobile, HTML/JSON, photo/omission, escaping, fresh permissions, revocation, periods, professional scopes and cancelled late download on close/logout.');
}finally{await browser.close();}
