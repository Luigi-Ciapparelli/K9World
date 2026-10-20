// Browser regression with synthetic accounts/API responses. No production calls.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5219';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='e8200000-0000-0000-0000-000000000004',thread='e8200000-0000-0000-0000-000000000801';
const errors=[];
const waitUntil=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,30));}assert.fail('Condition timed out');};
const entry=()=>({id:thread,review_scope:'booking_service',kind:'trainer',booking_id:'e8200000-0000-0000-0000-000000000402',completed_at:'2026-10-08T20:00:00Z',counterpart_name:'Professionista prova',service_name:'Lezione individuale',end_at:'2026-10-08T18:00:00Z',owner_rating:null,owner_comment:null,owner_updated_at:null,professional_rating:null,professional_updated_at:null,version:0,own_rating:null,own_comment:'',pending:true,can_write:true});
async function setup(width,professional=false){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
 await context.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 const state={items:[entry()],writes:[],mode:'ok',held:null,readMode:'ok',saved:new Map()};
 await context.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(!url.hostname.endsWith('.supabase.co'))return route.abort();assert.equal(url.hostname,'pc-home-test.supabase.co');
  const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,full_name:'Account prova',role:professional?'professional':'owner',email_verified:true,email:'test@example.invalid'};
  if(name==='professionals')data={id:uid,professional_type:'trainer',approved:true};
  if(name==='get_my_service_reviews'){if(state.readMode==='hold'){state.readHeld=route;return;} data=state.readMode==='invalid'?{items:[{id:thread,service_name:{bad:true}}],count:1,pending_count:1}:{items:state.items,count:state.items.length,pending_count:state.items.filter(i=>i.pending).length};}
  if(name==='dismiss_service_review'){state.items[0].pending=false;data=null;}
  if(name==='write_service_review'){
   const body=req.postDataJSON();state.writes.push(body);
   if(state.mode==='hold'){state.held=route;return;}
   if(state.mode==='reject')return route.fulfill({status:400,json:{code:'22023',message:'Rejected'}});
   if(state.mode==='conflict')return route.fulfill({status:409,json:{code:'40001',message:'Changed'}});
   if(state.mode==='invalid')return route.fulfill({status:200,json:{version:999}});
   if(state.saved.has(body.p_request_id))data=state.saved.get(body.p_request_id);
   else {
    const item=state.items.find(row=>row.id===body.p_thread_id);
    if(item.version!==body.p_expected_version)return route.fulfill({status:409,json:{code:'40001',message:'Changed'}});
    item.version++;item.own_rating=body.p_rating;item.own_comment=body.p_comment;item.pending=false;
    if(professional)item.professional_rating=body.p_rating;else {item.owner_rating=body.p_rating;item.owner_comment=body.p_comment;}
    data={version:item.version};state.saved.set(body.p_request_id,data);
   }
   if(state.mode==='committed-loss'){state.mode='ok';return route.fulfill({status:503,json:{message:'Lost reply'}});}
  }
  await route.fulfill({status:200,json:data,headers:{'content-range':'*/0','access-control-expose-headers':'content-range'}});
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+(professional?'/pro/bookings':'/owner/bookings'),{waitUntil:'domcontentloaded',timeout:30000});
 await page.getByRole('heading',{name:'Le vostre esperienze'}).waitFor();
 await page.getByText(professional?'Nessuna prenotazione corrisponde':'Non hai ancora prenotazioni.').waitFor();
 return {context,page,state};
}

async function openReview(page,professional=false){
 await page.getByRole('button',{name:professional?'Valuta la collaborazione':'Scrivi la recensione',exact:true}).first().click();
 await page.getByRole('radio',{name:'4 su 5',exact:true}).check();
 if(!professional)await page.getByLabel('Un commento breve').fill('Il cane ha lavorato serenamente.');
}
async function send(page,professional=false){await page.getByRole('button',{name:professional?'Salva voto privato':'Pubblica recensione',exact:true}).click();}
async function navigate(page,path){
 await page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'));},path);
}
try{
 // Commit succeeds, response is lost, then the editor is closed and reopened.
 for(const [width,professional] of [[1440,false],[390,true]]){
  const {context,page,state}=await setup(width,professional);
  await openReview(page,professional);state.mode='committed-loss';await send(page,professional);
  await page.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor();
  await page.getByRole('button',{name:'Chiudi valutazione'}).click();
  if(process.env.PC_BASELINE){
   await page.getByRole('button',{name:professional?'Valuta la collaborazione':'Scrivi la recensione',exact:true}).click();
   await page.getByRole('radio',{name:'4 su 5',exact:true}).check();
   if(!professional)await page.getByLabel('Un commento breve').fill('Il cane ha lavorato serenamente.');
   await send(page,professional);await waitUntil(()=>state.writes.length===2);
   assert.equal(state.writes[1].p_request_id,state.writes[0].p_request_id,'DEFECT: closing the editor discarded the committed request reference');
  }else{
   await page.getByRole('button',{name:'Aggiorna valutazioni'}).click();
   await page.getByRole('button',{name:'Aggiorna la tua valutazione',exact:true}).waitFor();
   await page.getByRole('button',{name:'Riprendi verifica'}).click();
   assert.ok(await page.getByRole('radio',{name:'4 su 5',exact:true}).isChecked());
   assert.ok(await page.getByRole('radio',{name:'5 su 5',exact:true}).isDisabled());
   if(!professional)assert.equal(await page.getByLabel('Un commento breve').inputValue(),'Il cane ha lavorato serenamente.');
   await page.getByRole('button',{name:'Verifica invio'}).click();
   await page.getByRole('dialog').waitFor({state:'hidden'});
   assert.deepEqual(state.writes[0],state.writes[1]);assert.equal(state.saved.size,1);assert.equal(state.items[0].version,1);
   assert.equal(await page.getByRole('button',{name:'Riprendi verifica'}).count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   console.log('OK: committed reply loss and reopen, identical request, one revision; viewport',width,'professional',professional);
  }
  await context.close();
 }
 if(!process.env.PC_BASELINE){
  {
   const {context,page,state}=await setup(390);
   await openReview(page);state.mode='hold';await send(page);await waitUntil(()=>!!state.held);
   await page.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor({timeout:20000});
   assert.ok(await page.getByRole('button',{name:'Chiudi valutazione'}).isEnabled());
   assert.ok(await page.getByLabel('Un commento breve').isDisabled());
   if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/review-recovery-mobile.png'});}
   await page.getByRole('button',{name:'Chiudi valutazione'}).click();
   await navigate(page,'/owner');await page.getByRole('heading',{name:'Le vostre esperienze'}).waitFor({state:'hidden'});
   await navigate(page,'/owner/bookings');await page.getByRole('button',{name:'Riprendi verifica'}).click();
   state.mode='ok';await page.getByRole('button',{name:'Verifica invio'}).click();
   await page.getByRole('dialog').waitFor({state:'hidden'});
   assert.deepEqual(state.writes[0],state.writes[1]);
   await context.close();console.log('OK: actual 15 second deadline; recovery after SPA navigation');
  }
  {
   const {context,page,state}=await setup(1440);
   await openReview(page);state.mode='invalid';await send(page);
   await page.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor();
   assert.equal(await page.getByText('Recensione pubblicata.').count(),0);
   state.mode='conflict';await page.getByRole('button',{name:'Verifica invio'}).click();
   await waitUntil(()=>state.writes.length===2);
   await page.getByRole('button',{name:'Verifica invio'}).waitFor();
   assert.ok(await page.getByLabel('Un commento breve').isDisabled(),'Late denial cannot rule out a previously committed request');
   await page.getByRole('button',{name:'Chiudi valutazione'}).click();
   await page.getByRole('button',{name:'Riprendi verifica'}).click();
   state.mode='ok';await page.getByRole('button',{name:'Verifica invio'}).click();
   await page.getByRole('dialog').waitFor({state:'hidden'});
   assert.deepEqual(state.writes[0],state.writes[2]);
   await context.close();console.log('OK: malformed success rejected; late rejection preserves uncertain attempt');
  }
  {
   const {context,page,state}=await setup(1440);
   await openReview(page);state.mode='reject';await send(page);
   await page.getByRole('alert').filter({hasText:'Scegli un voto'}).waitFor();
   assert.ok(await page.getByLabel('Un commento breve').isEnabled());
   state.mode='ok';await page.getByLabel('Un commento breve').fill('Testo corretto.');await send(page);
   await page.getByRole('dialog').waitFor({state:'hidden'});
   assert.notEqual(state.writes[0].p_request_id,state.writes[1].p_request_id);
   await context.close();console.log('OK: explicit first rejection allows correction');
  }
  {
   const {context,page,state}=await setup(390);
   state.readMode='invalid';await page.getByRole('button',{name:'Aggiorna valutazioni'}).click();
   await page.getByRole('alert').filter({hasText:'Non è stato possibile caricare'}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).count(),0);
   state.readMode='hold';await page.getByRole('button',{name:'Riprova',exact:true}).click();
   await page.getByRole('alert').filter({hasText:'Non è stato possibile caricare'}).waitFor({timeout:20000});
   state.readMode='ok';await page.getByRole('button',{name:'Riprova',exact:true}).click();
   await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).waitFor();
   await context.close();console.log('OK: invalid and stalled list fail visibly, retry succeeds');
  }
  {
   const {context,page,state}=await setup(1440);
   await openReview(page);state.mode='invalid';await send(page);
   await page.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor();
   await page.getByRole('button',{name:'Chiudi valutazione'}).click();
   await page.reload({waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:'Scrivi la recensione',exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Riprendi verifica'}).count(),0);
   await context.close();console.log('OK: full reload does not persist private review text');
  }
  {
   const {context,page,state}=await setup(1440);
   await openReview(page);state.mode='hold';await send(page);await waitUntil(()=>!!state.held);
   await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabase.ts');await supabase.auth.signOut({scope:'local'});});
   await page.getByRole('dialog').waitFor({state:'hidden'});
   assert.equal(await page.getByRole('button',{name:'Riprendi verifica'}).count(),0);
   const stored=await page.evaluate(()=>Object.values(sessionStorage).concat(Object.values(localStorage)).some(value=>value.includes('Il cane ha lavorato serenamente.')));
   assert.equal(stored,false);await context.close();console.log('OK: logout aborts pending write; no review text in browser storage');
  }
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
