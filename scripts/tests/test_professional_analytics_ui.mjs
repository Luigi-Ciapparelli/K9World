// Local browser fixtures only. No Supabase project, account or booking is contacted.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5232';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='ea710000-0000-0000-0000-000000000001',errors=[];
try {for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/New_York',serviceWorkers:'block'});
 let mode='normal',held=null;
 const requests=[],rawReads=[];
 await ctx.addInitScript(id=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id,email:'activity@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 function summary(p){
  return {from:p.p_from,to:p.p_to,time_zone:'Europe/Rome',as_of:'2026-10-17T12:00:00Z',total:23,completed:12,pending:5,accepted:3,declined:2,cancelled:1,other:0,customers:7,returning_customers:4,returning_percent:57.1,completed_value:600,missing_prices:1,service_groups:6,
   top_services:[{name:'Educazione e gestione quotidiana',completed:5,value:250,missing_prices:0},{name:'Pensione per il fine settimana',completed:2,value:150,missing_prices:0},{name:'Preparazione sportiva individuale',completed:2,value:100,missing_prices:0},{name:'Primo incontro con il binomio',completed:1,value:50,missing_prices:0},{name:'Lezione individuale',completed:1,value:0,missing_prices:1}]};
 }
 await ctx.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  const name=url.pathname.split('/').at(-1);let data=[];
  if(['bookings','services'].includes(name))rawReads.push(name);
  if(name==='user')data={id:uid,email:'activity@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,role:'professional',full_name:'Centro di prova',email:'activity@example.invalid',email_verified:true};
  if(name==='professionals')data={id:uid,listing_type:'center',approved:true};
  if(name==='get_professional_activity_summary'){
   const p=req.postDataJSON();requests.push(p);assert.deepEqual(Object.keys(p).sort(),['p_from','p_to']);
   if(mode==='denied')return route.fulfill({status:403,json:{code:'42501',message:'Denied'}});
   if(mode==='error')return route.fulfill({status:500,json:{code:'XX000',message:'Synthetic failure'}});
   data=summary(p);
   if(mode==='malformed')data=null;
   if(mode==='empty')data={...data,total:0,completed:0,pending:0,accepted:0,declined:0,cancelled:0,customers:0,returning_customers:0,returning_percent:null,completed_value:0,missing_prices:0,service_groups:0,top_services:[]};
   if(mode==='hold'){held={route,data};return;}
  }
  return route.fulfill({status:200,json:data});
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/pro/analytics',{waitUntil:'domcontentloaded',timeout:45000});
 await page.getByRole('region',{name:'Prenotazioni',exact:true}).getByText('23',{exact:true}).waitFor();
 assert.ok((await page.getByRole('region',{name:'Valore dei servizi svolti'}).innerText()).includes('600,00'));
 await page.getByText('57,1%',{exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 assert.ok((await page.getByLabel('Dal',{exact:true}).boundingBox()).width>=180);
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/statistics-'+width+'.png',fullPage:true});}
 const callCount=requests.length;
 await page.getByLabel('Dal',{exact:true}).fill('2024-01-01');await page.getByLabel('Al',{exact:true}).fill('2025-01-01');
 await page.getByRole('button',{name:'Visualizza',exact:true}).click();await page.getByRole('alert').filter({hasText:'366 giorni'}).waitFor();assert.equal(requests.length,callCount);
 await page.getByLabel('Dal',{exact:true}).fill('2026-06-01');await page.getByLabel('Al',{exact:true}).fill('2026-06-30');
 mode='empty';await page.getByRole('button',{name:'Visualizza',exact:true}).click();
 await page.getByRole('heading',{name:'Nessuna prenotazione nel periodo'}).waitFor();assert.equal(requests.at(-1).p_from,'2026-06-01');
 assert.equal(await page.getByRole('region',{name:'Valore dei servizi svolti'}).count(),0);
 mode='normal';await page.getByRole('button',{name:'Ultimi 90 giorni',exact:true}).click();await page.getByText('57,1%',{exact:true}).waitFor();
 mode='error';await page.getByRole('button',{name:'Aggiorna statistiche',exact:true}).click();await page.getByRole('alert').filter({hasText:'Non è stato possibile'}).waitFor();
 assert.equal(await page.getByRole('region',{name:'Prenotazioni',exact:true}).count(),0,'failed refresh clears previous statistics');
 assert.equal(await page.getByRole('heading',{name:'Nessuna prenotazione nel periodo'}).count(),0);
 mode='malformed';await page.getByRole('button',{name:'Riprova',exact:true}).click();await page.getByRole('alert').filter({hasText:'Non è stato possibile'}).waitFor();
 mode='normal';await page.getByRole('button',{name:'Riprova',exact:true}).click();await page.getByText('57,1%',{exact:true}).waitFor();
 mode='hold';await page.getByLabel('Dal',{exact:true}).fill('2026-07-01');await page.getByLabel('Al',{exact:true}).fill('2026-07-31');
 const july=page.waitForRequest(r=>r.url().endsWith('/rpc/get_professional_activity_summary'));
 await page.getByRole('button',{name:'Visualizza',exact:true}).click();await july;
 await page.getByRole('status').filter({hasText:'Caricamento delle statistiche'}).waitFor();
 assert.equal(await page.getByRole('region',{name:'Prenotazioni',exact:true}).count(),0,'old period never shown under new period');
 mode='normal';await page.getByLabel('Dal',{exact:true}).fill('2026-08-01');await page.getByLabel('Al',{exact:true}).fill('2026-08-31');
 await page.getByRole('button',{name:'Visualizza',exact:true}).click();await page.getByRole('heading',{name:'1 ago 2026 – 31 ago 2026',exact:true}).waitFor();
 if(held){try{await held.route.fulfill({status:200,json:{...held.data,total:9999,pending:9981}});}catch{/* superseded request may already be aborted */}}
 assert.equal(await page.getByRole('heading',{name:'1 lug 2026 – 31 lug 2026',exact:true}).count(),0,'late response ignored');
 mode='denied';await page.getByRole('button',{name:'Aggiorna statistiche',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Statistiche non disponibili per questo account'}).waitFor();
 assert.equal(await page.getByRole('region',{name:'Prenotazioni',exact:true}).count(),0);
 assert.deepEqual(rawReads,[],'no full booking/client download');
 await ctx.close();console.log('OK: statistiche '+width+'px, date, importi, errore/zero, retry, risposta tardiva e accesso negato.');
}assert.deepEqual(errors,[]);
}finally{await browser.close();}
console.log('Browser e API simulati; nessun dato online modificato.');
