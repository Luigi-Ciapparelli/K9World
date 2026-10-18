// Local API fixtures with real Supabase JS. No external requests/accounts.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5236';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const pro='bd720000-0000-0000-0000-000000000001',owner='bd720000-0000-0000-0000-000000000003',id='bd720000-0000-0000-0002-000000000001';
const errors=[];
try{for(const width of [1440,390])for(const role of ['professional','owner']){
 const actor=role==='professional'?pro:owner;
 const ctx=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/New_York',serviceWorkers:'block'});
 let detailMode='normal',cancelMode='normal',held=null,mutationCount=0;const detailCalls=[],todayQueries=[];
 const row={id,client_name:'Cliente di prova',professional_name:'Centro di prova',service_name:'Nome nuovo di catalogo',start_at:'2026-10-18T08:00:00Z',end_at:'2026-10-18T09:00:00Z',price:0,notes:'Il cane necessita di spazio.\nPrima di iniziare parliamone.',status:'pending',request_priority:0};
 const detail={booking_id:id,end_at:row.end_at,service_name:'Educazione individuale',service_source:'recorded',dog_names:['Kyros di prova'],dogs_unavailable:false};
 await ctx.addInitScript(actor=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:actor,email:'booking@example.invalid',aud:'authenticated',role:'authenticated'}})),actor);
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin===new URL(base).origin)return route.continue();
  if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  const name=url.pathname.split('/').at(-1),p=req.postData()?req.postDataJSON():{};
  const ok=data=>route.fulfill({status:200,json:data});
  if(name==='profiles')return ok({id:actor,role,full_name:role==='professional'?'Centro di prova':'Cliente di prova',email:'booking@example.invalid',email_verified:true});
  if(name==='user')return ok({id:actor,email:'booking@example.invalid',role:'authenticated'});
  if(name==='professionals')return ok({id:pro,approved:true,listing_type:'center'});
  if(name==='get_my_service_reviews')return ok({items:[],count:0,pending_count:0});
  if(name==='get_professional_bookings'||name==='get_my_owner_bookings'){
   if(url.searchParams.has('start_at'))todayQueries.push(url.searchParams.getAll('start_at'));
   const status=url.searchParams.get('status');const rows=!status||status==='eq.'+row.status?[row]:[];
   return route.fulfill({status:200,headers:{'Content-Range':rows.length?'0-0/1':'*/0','Access-Control-Expose-Headers':'Content-Range'},json:rows});
  }
  if(name==='get_booking_details'){
   assert.deepEqual(p,{p_booking_ids:[id]});detailCalls.push(p);
   if(detailMode==='hold'){held=route;return;}
   if(detailMode==='error')return route.fulfill({status:503,json:{message:'Temporary failure'}});
   return ok(detailMode==='missing'?[]:detailMode==='malformed'?[{...detail,dog_names:null}]:[detail]);
  }
  if(name==='change_booking_status'){
   mutationCount++;assert.equal(p.p_booking_id,id);
   if(role==='owner'){
    assert.equal(p.p_new_status,'cancelled');
    if(cancelMode==='lost'){row.status='cancelled';return route.abort('failed');}
    if(cancelMode==='race'){row.status='accepted';return route.fulfill({status:400,json:{message:'Invalid owner transition'}});}
   }
   row.status=p.p_new_status;return ok(row);
  }
  return ok([]);
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+(role==='professional'?'/pro/bookings':'/owner/bookings'),{waitUntil:'networkidle'});
 const card=page.locator('article').filter({hasText:'Kyros di prova'});await card.waitFor().catch(async e=>{console.log(await page.locator('body').innerText(),detailCalls,errors);throw e;});
 assert.ok((await card.innerText()).includes('10:00')&&(await card.innerText()).includes('11:00'),'Italian times on a New York browser');
 assert.ok((await card.innerText()).includes('0,00'),'zero price shown');assert.equal(await page.getByText('Nome nuovo di catalogo',{exact:true}).count(),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport fits');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/booking-'+role+'-'+width+'.png',fullPage:true});}
 const refresh=()=>page.getByRole('button',{name:role==='professional'?'Aggiorna richieste':'Aggiorna',exact:true}).click();
 detailMode='error';await refresh();await page.getByRole('button',{name:'Riprova dettagli'}).waitFor();
 assert.equal(await page.getByText('Kyros di prova',{exact:false}).count(),0,'old context removed on failed reload');
 if(role==='professional')assert.ok(await page.getByRole('button',{name:'Accetta',exact:true}).isDisabled());
 detailMode='malformed';await page.getByRole('button',{name:'Riprova dettagli'}).click();await page.getByRole('button',{name:'Riprova dettagli'}).waitFor();
 detailMode='normal';await page.getByRole('button',{name:'Riprova dettagli'}).click();await card.waitFor();
 if(role==='professional'){
  // A response from a superseded reload must never replace the current details.
  detailMode='hold';await refresh();await page.getByText('Caricamento servizio e cane…').waitFor();
  assert.ok(await page.getByRole('button',{name:'Accetta',exact:true}).isDisabled());
  detailMode='normal';await page.getByRole('button',{name:'In attesa',exact:true}).click();await card.waitFor();
  if(held)await held.fulfill({status:200,json:[{...detail,service_name:'RISPOSTA SUPERATA'}]}).catch(()=>{});
  await page.waitForTimeout(100);assert.equal(await page.getByText('RISPOSTA SUPERATA',{exact:false}).count(),0);
  await page.getByRole('button',{name:'Accetta',exact:true}).click();await page.getByText('Richiesta accettata.',{exact:true}).waitFor();assert.equal(mutationCount,1);
  row.status='pending';await page.goto(base+'/pro',{waitUntil:'networkidle'});await card.waitFor();
  assert.equal(await card.getByText(row.notes,{exact:true}).count(),1,'request notes not duplicated on dashboard');
  assert.ok(todayQueries.some(q=>q.some(v=>/^gte\..*T(22|23):00:00/.test(v))),'dashboard day starts at Italian midnight');
  if(process.env.PC_SCREENSHOTS)await page.screenshot({path:process.env.PC_SCREENSHOTS+'/booking-dashboard-'+width+'.png',fullPage:true});
 }else{
  cancelMode='lost';page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Annulla richiesta'}).click();
  await page.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor();await page.getByText('Annullata',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Annulla richiesta'}).count(),0);assert.equal(mutationCount,1);
  row.status='pending';await refresh();await card.waitFor();
  cancelMode='race';page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Annulla richiesta'}).click();
  await page.getByText('Accettata',{exact:true}).waitFor();assert.equal(mutationCount,2,'server acceptance wins over stale cancellation');
 }
 assert.ok(detailCalls.length>0);await ctx.close();console.log('OK: '+role+' '+width+'px, dettagli, errori/retry, orari e transizioni.');
}assert.deepEqual(errors,[]);}finally{await browser.close();}
console.log('API simulate; nessun dato o account online modificato.');
