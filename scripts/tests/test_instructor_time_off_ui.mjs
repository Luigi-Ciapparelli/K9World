// Synthetic API only: no real accounts or absences changed.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5222';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000001',instructor='e8310000-0000-0000-0006-000000000010',version='e8310000-0000-0000-0008-000000000002';
const errors=[];
try{for(const width of [1440,390]){for(const isCentre of [true,false]){
 let periods=[],fail=false,requests=[],writes=0;
 const uid=isCentre?centre:person;const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
 await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 await ctx.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,role:isCentre?'professional':'owner',full_name:'Anna di prova',email:'test@example.invalid',email_verified:true};
  if(name==='professionals')data={id:uid,listing_type:isCentre?'center':'individual',approved:true};
  if(name==='get_my_centre_team')data={enabled:isCentre,members:[{id:instructor,display_name:'Anna di prova',active:true,version,assigned_bookings:1}]};
  if(name==='get_my_centre_memberships')data=[{id:'membership',instructor_id:instructor,instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',version,status:'active',is_centre:isCentre,instructor_active:true}];
  if(name==='get_my_centre_lessons')data={items:[],truncated:false};
  if(name==='get_instructor_time_off'){
   assert.equal(req.postDataJSON().p_instructor_id,instructor);
   if(fail)return route.fulfill({status:503,json:{message:'unavailable'}});data=periods;
  }
  if(name==='add_instructor_time_off'){
   const p=req.postDataJSON();requests.push(p);assert.equal(p.p_instructor_id,instructor);
   assert.deepEqual(Object.keys(p).sort(),['p_end','p_id','p_instructor_id','p_start']);
   if(requests.length===1)return route.fulfill({status:503,json:{message:'uncertain'}});
   assert.equal(requests[0].p_id,p.p_id,'Retry preserves id');
   periods=[{id:p.p_id,start_date:p.p_start,end_date:p.p_end,version,can_cancel:true,source:isCentre?'centre':'instructor',affected_bookings:2}];data=periods[0];writes++;
  }
  if(name==='cancel_instructor_time_off'){assert.equal(req.postDataJSON().p_expected_version,version);periods=[];data={cancelled:true};writes++;}
  return route.fulfill({status:200,json:data,headers:{'content-range':'0-0/1'}});
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+(isCentre?'/pro/team':'/account/centres'));
 await page.getByRole('button',{name:'Gestisci indisponibilità',exact:true}).click();
 const panel=page.getByRole('region',{name:'Disponibilità di Anna di prova'});
 await panel.getByText('Nessuna indisponibilità registrata nel periodo visualizzato.').waitFor();
 await panel.getByRole('button',{name:'Registra indisponibilità',exact:true}).click();
 await panel.getByText('Esito non confermato. Aggiorna l’elenco prima di riprovare.').waitFor();
 await panel.getByRole('button',{name:'Registra indisponibilità',exact:true}).click();
 await panel.getByText('2 lezioni accettate da controllare e riassegnare.').waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile overflow');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.addStyleTag({content:'.pc-site-header{position:static!important}'});await panel.screenshot({path:process.env.PC_SCREENSHOTS+`/absence-${isCentre?'centre':'person'}-${width}.png`});}
 fail=true;await panel.getByRole('button',{name:'Aggiorna indisponibilità'}).click();await panel.getByRole('alert').waitFor();assert.equal(await panel.getByRole('button',{name:'Rimuovi periodo'}).count(),0);assert.equal(await panel.getByRole('button',{name:'Registra indisponibilità'}).count(),0);
 fail=false;await panel.getByRole('button',{name:'Aggiorna indisponibilità'}).click();await panel.getByRole('button',{name:'Rimuovi periodo'}).click();await panel.getByText('Nessuna indisponibilità registrata nel periodo visualizzato.').waitFor();assert.equal(writes,2);
 await ctx.close();
}}assert.deepEqual(errors,[]);console.log('OK: centro e persona, date, retry stabile, avvisi, errore senza dati obsoleti, rimozione e desktop/mobile. API simulate.');}finally{await browser.close();}
