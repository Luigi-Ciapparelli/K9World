// Browser regression with synthetic accounts/API responses. No production calls.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5219';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='e8200000-0000-0000-0000-000000000004',thread='e8200000-0000-0000-0000-000000000801';
const errors=[];
const entry=()=>({id:thread,review_scope:'booking_service',kind:'trainer',booking_id:'e8200000-0000-0000-0000-000000000402',completed_at:'2026-10-08T20:00:00Z',counterpart_name:'Professionista prova',service_name:'Lezione individuale',end_at:'2026-10-08T18:00:00Z',owner_rating:null,owner_comment:null,owner_updated_at:null,professional_rating:null,professional_updated_at:null,version:0,own_rating:null,own_comment:'',pending:true,can_write:true});
async function setup(width,professional=false){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
 await context.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 const state={items:[entry()],writes:[],failNext:false,conflict:false,hold:false,held:null};
 await context.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(!url.hostname.endsWith('.supabase.co'))return route.abort();assert.equal(url.hostname,'pc-home-test.supabase.co');
  const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,full_name:'Account prova',role:professional?'professional':'owner',email_verified:true,email:'test@example.invalid'};
  if(name==='professionals')data={id:uid,professional_type:'trainer',approved:true};
  if(name==='get_my_service_reviews')data={items:state.items,count:state.items.length,pending_count:state.items.filter(i=>i.pending).length};
  if(name==='dismiss_service_review'){state.items[0].pending=false;data=null;}
  if(name==='write_service_review'){
   const body=req.postDataJSON();state.writes.push(body);
   if(state.hold){state.held=route;return;}
   if(state.conflict)return route.fulfill({status:409,json:{code:'40001',message:'Version changed'}});
   if(state.failNext){state.failNext=false;return route.fulfill({status:503,json:{message:'Unknown outcome'}});}
   const item=state.items[0];item.version++;item.own_rating=body.p_rating;item.own_comment=body.p_comment;item.pending=false;
   if(professional)item.professional_rating=body.p_rating;else {item.owner_rating=body.p_rating;item.owner_comment=body.p_comment;}
   data={version:item.version};
  }
  await route.fulfill({status:200,json:data,headers:{'content-range':'*/0','access-control-expose-headers':'content-range'}});
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+(professional?'/pro/bookings':'/owner/bookings'));
 await page.getByRole('heading',{name:'Le vostre esperienze'}).waitFor();
 await page.getByText(professional?'Nessuna prenotazione corrisponde':'Non hai ancora prenotazioni.').waitFor();
 return {context,page,state};
}
try{
 for(const width of [1440,390]){
  const {context,page,state}=await setup(width);
  await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  await dialog.getByText('Lezione individuale', {exact:false}).waitFor();
  await dialog.getByText('Non diventano un voto all’addestratore o al centro.', {exact:false}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
  await dialog.getByRole('button',{name:'Pubblica recensione',exact:true}).click();
  await dialog.getByRole('alert').filter({hasText:'Scegli un voto'}).waitFor();assert.equal(state.writes.length,0);
  await dialog.getByRole('radio',{name:'4 su 5',exact:true}).check();
  await dialog.getByLabel('Un commento breve').fill('a'.repeat(501));
  await dialog.getByRole('button',{name:'Pubblica recensione',exact:true}).click();assert.equal(state.writes.length,0);
  await dialog.getByLabel('Un commento breve').fill('Esperienza chiara e utile. <img src=x onerror="window.injected=true">');
  if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/review-'+width+'.png'});}
  state.failNext=true;await dialog.getByRole('button',{name:'Pubblica recensione',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor();
  await dialog.getByRole('button',{name:'Pubblica recensione',exact:true}).click();await dialog.waitFor({state:'hidden'});
  assert.equal(state.writes.length,2);assert.equal(state.writes[0].p_request_id,state.writes[1].p_request_id,'Unchanged retry lost nonce');
  assert.equal(await page.evaluate(()=>window.injected),undefined);assert.equal(await page.getByRole('button',{name:'Non ora',exact:true}).count(),0);
  await page.getByRole('button',{name:'Aggiorna la tua valutazione',exact:true}).click();await page.getByRole('dialog').waitFor();state.conflict=true;
  await page.getByRole('radio',{name:'5 su 5',exact:true}).check();await page.getByRole('button',{name:'Pubblica recensione',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'un’altra finestra'}).waitFor();await page.getByRole('button',{name:'Chiudi valutazione'}).click();
  await context.close();
 }
 {
  const {context,page,state}=await setup(390,true);
  await page.getByRole('button',{name:'Valuta la collaborazione',exact:true}).click();
  assert.equal(await page.getByRole('textbox').count(),1,'Only client search, no professional review comment');
  await page.getByRole('dialog').getByText('mai sul suo profilo pubblico').waitFor();
  await page.getByRole('radio',{name:'3 su 5',exact:true}).check();await page.getByRole('button',{name:'Salva voto privato'}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(state.writes[0].p_comment,'');
  state.items=[{...entry(),kind:'boarding',can_write:false,pending:false,owner_rating:5,owner_comment:'Bel soggiorno'}];
  await page.getByRole('button',{name:'Aggiorna valutazioni'}).click();await page.getByText('Bel soggiorno').waitFor();
  assert.equal(await page.getByRole('button',{name:'Valuta la collaborazione',exact:true}).count(),0);
  if(process.env.PC_SCREENSHOTS)await page.screenshot({path:process.env.PC_SCREENSHOTS+'/boarding-professional.png'});
  await context.close();
 }
 {
  const {context,page,state}=await setup(1440);
  await page.getByRole('button',{name:'Non ora',exact:true}).click();await page.getByText('Promemoria nascosto.').waitFor();
  assert.equal(state.items[0].pending,false);assert.equal(await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).count(),1);
  state.items=[];await page.getByRole('button',{name:'Aggiorna valutazioni'}).click();await page.getByText('Le valutazioni delle lezioni si attivano').waitFor();
  assert.equal(await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).count(),0);
  await context.close();
 }
 {
  const {context,page,state}=await setup(1440);
  await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).click();await page.getByRole('radio',{name:'4 su 5',exact:true}).check();
  state.hold=true;await page.getByRole('button',{name:'Pubblica recensione',exact:true}).click();
  await page.waitForTimeout(100);assert.ok(state.held);
  await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabase.ts');await supabase.auth.signOut({scope:'local'});});
  await state.held.fulfill({status:200,json:{version:1}});await page.waitForTimeout(100);
  assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.getByText('Recensione pubblicata.').count(),0);
  await context.close();
 }
 {
  const {context,page,state}=await setup(390);
  state.items=[{...entry(),review_scope:'legacy_relationship',service_name:'Valutazione precedente',end_at:null,pending:false,can_write:false,owner_rating:3,own_rating:3}];
  await page.getByRole('button',{name:'Aggiorna valutazioni'}).click();await page.getByText('Storico precedente',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).count(),0);
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('OK: owner/pro desktop and mobile, stars, limits, retry nonce, version conflict, private vote, boarding, dismiss, escaping and logout.');
}finally{await browser.close();}
