// Real browser, synthetic API responses only. No live accounts or database.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5219';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const pro='e8210000-0000-0000-0000-000000000005',service='e8210000-0000-0000-0000-000000000205';
const errors=[];
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  let fail=false;const calls=[];
  await context.route('https://**/*', async route=>{
   const url=new URL(route.request().url());
   if(!url.hostname.endsWith('.supabase.co'))return route.abort();
   assert.equal(url.hostname,'pc-home-test.supabase.co');
   const name=url.pathname.split('/').at(-1);let data=[];
   if(name==='public_professional_profiles')data={id:pro,display_name:'Centro prova',professional_type:'trainer',zone_text:'Milano',bio:'Attività di prova',rating:4.9,review_count:84};
   if(name==='get_public_professional_services')data=[{id:service,name:'Lezione prenotata',service_type:'trainer',price:25,duration_minutes:60}];
   if(name==='get_public_booking_availability')data={paused:false,periods:[]};
   if(name==='get_public_service_reviews'){
    const body=route.request().postDataJSON();calls.push(body);
    if(fail){fail=false;return route.fulfill({status:503,json:{message:'Temporary failure'}});}
    const entry=n=>({id:'r'+n,review_scope:n===11?'legacy_relationship':'booking_service',service_name:'Lezione prenotata',service_type:'trainer',reviewer_name:'Cliente',rating:4,comment:n===11?'Testo precedente':`Esperienza ${n} <img src=x onerror="window.injected=true">`});
    data=body.p_service_id?{items:[entry(1)],count:1}:body.p_offset?{items:[entry(11),entry(12)],count:12}:{items:Array.from({length:10},(_,i)=>entry(i+1)),count:12};
   }
   await route.fulfill({status:200,json:data});
  });
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/p/'+pro);
  const panel=page.getByRole('region',{name:'Esperienze sui servizi svolti'});
  try { await panel.getByText('Esperienza 1 <img',{exact:false}).waitFor(); } catch(e) { console.error({calls,errors,body:await page.locator('body').innerText()}); throw e; }
  assert.equal(await page.getByText('4.9',{exact:true}).count(),0,'Professional aggregate still displayed');
  assert.equal(await page.getByText('84',{exact:true}).count(),0,'General review count displayed');
  assert.equal(await page.evaluate(()=>window.injected),undefined,'Review HTML executed');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
  if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await panel.screenshot({path:process.env.PC_SCREENSHOTS+'/public-reviews-'+width+'.png'});}
  await panel.getByRole('button',{name:'Successive',exact:true}).click();
  await panel.getByText('Testo precedente',{exact:true}).waitFor();
  await panel.getByText('Storico precedente',{exact:true}).waitFor();
  assert.equal(calls.at(-1).p_offset,10);
  fail=true;await panel.getByLabel('Leggi per servizio').selectOption(service);
  await panel.getByRole('alert').waitFor();await panel.getByRole('button',{name:'Riprova',exact:true}).click();
  await panel.getByText('Esperienza 1 <img',{exact:false}).waitFor();
  assert.equal(calls.at(-1).p_offset,0);assert.equal(calls.at(-1).p_service_id,service);
  assert.equal(await panel.getByRole('button',{name:'Successive',exact:true}).count(),0);
  assert.equal(await panel.getByText('Testo precedente',{exact:true}).count(),0);
  await page.goto(base+'/search?min_rating=5&sort=rating');
  await page.getByRole('heading',{level:1}).waitFor();
  assert.equal(await page.getByText('Valutazione minima',{exact:true}).count(),0);
  assert.equal(await page.locator('option[value="rating"]').count(),0);
  await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log('OK: service-specific public reviews, no profile score, service filtering, paging, legacy context, retry, text escaping, mobile/desktop.');
}finally{await browser.close();}
