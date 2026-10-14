// Synthetic account/API flows; no real invitations, emails or bookings.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5221';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000001',instructor='e8310000-0000-0000-0006-000000000010';
const code='e8310000-0000-0000-0008-000000000001',version='e8310000-0000-0000-0008-000000000002';
const errors=[];
try {for(const width of [1440,390]){
 let membership=null,stale=true,failAgenda=false;const writes=[];
 async function session(isCentre){
  const uid=isCentre?centre:person;const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1);let data=[];
   if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id:uid,role:isCentre?'professional':'owner',full_name:isCentre?'Centro di prova':'Anna di prova',email:'test@example.invalid',email_verified:true};
   if(name==='professionals')data={id:uid,listing_type:isCentre?'center':'individual',approved:true};
   if(name==='get_my_centre_team')data={enabled:isCentre,members:[{id:instructor,display_name:'Anna di prova',active:true,version,assigned_bookings:1}]};
   if(name==='get_my_centre_memberships')data=membership?[{...membership,is_centre:isCentre}]:[];
   if(name==='get_centre_link_code')data={code,expires_at:new Date(Date.now()+7*864e5).toISOString()};
   if(name==='invite_centre_account'){
    const p=req.postDataJSON();assert.equal(p.p_code,code);assert.equal(p.p_expected_version,version);assert.equal(p.p_instructor_id,instructor);
    membership={id:p.p_id,instructor_id:instructor,instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',version,status:'pending',instructor_active:true,invited_at:new Date().toISOString(),expires_at:new Date(Date.now()+7*864e5).toISOString(),accepted_at:null};data=membership;writes.push(name);
   }
   if(name==='change_centre_membership'){
    const p=req.postDataJSON();assert.equal(p.p_id,membership.id);assert.equal(p.p_expected_version,membership.version);
    if(stale){stale=false;return route.fulfill({status:409,json:{code:'40001',message:'Synthetic stale version'}});}
    membership={...membership,status:p.p_action==='accept'?'active':p.p_action==='decline'?'declined':'revoked',version:'e8310000-0000-0000-0008-000000000003'};data=membership;writes.push(p.p_action);
   }
   if(name==='get_my_centre_lessons'){
    if(failAgenda)return route.fulfill({status:503,json:{code:'503',message:'Synthetic outage'}});
    data={items:membership?.status==='active'?[{id:'synthetic-lesson',start_at:new Date(Date.now()+3600000).toISOString(),end_at:new Date(Date.now()+7200000).toISOString(),status:'accepted',service_name:'Lezione individuale',centre_name:'Centro di prova',instructor_name:'Anna di prova',client_name:'Cliente di prova',dog_names:['Rex']}]:[],truncated:false};
   }
   return route.fulfill({status:200,json:data,headers:{'content-range':'0-0/1'}});
  });return ctx;
 }
 const personContext=await session(false);const page=await personContext.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/account/centres');await page.getByRole('heading',{name:'Collaborazioni con i centri',exact:true}).waitFor();
 await page.getByRole('button',{name:'Mostra il mio codice'}).click();assert.equal(await page.getByLabel('Il tuo codice',{exact:true}).inputValue(),code);
 await page.getByText('Nessuna lezione assegnata visibile in questo mese.').waitFor();
 const centreContext=await session(true);const pro=await centreContext.newPage();pro.setDefaultTimeout(12000);pro.on('pageerror',e=>errors.push(e.message));
 await pro.goto(base+'/pro/team');await pro.getByRole('button',{name:'Collega un account',exact:true}).click();await pro.getByLabel('Istruttore da collegare',{exact:true}).selectOption(instructor);await pro.getByLabel('Codice ricevuto dall’istruttore',{exact:true}).fill(code);await pro.getByRole('button',{name:'Proponi collegamento',exact:true}).click();await pro.getByText(/Proposta pronta nell’account/).waitFor();
 await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.getByRole('button',{name:'Accetta collegamento'}).click();await page.getByText('I dati sono cambiati. Aggiorna e controlla prima di riprovare.',{exact:true}).waitFor();
 assert.equal(membership.status,'pending');await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.getByRole('button',{name:'Accetta collegamento'}).click();await page.getByRole('heading',{name:'Lezione individuale',exact:true}).waitFor();await page.getByText('Cliente di prova · Rex',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:/Accetta prenotazione|Messaggi|Completa lezione/}).count(),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Personal agenda overflow');assert.ok(await pro.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Centre accounts overflow');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));await pro.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:process.env.PC_SCREENSHOTS+'/collaborations-'+width+'.png',fullPage:true});await pro.screenshot({path:process.env.PC_SCREENSHOTS+'/membership-manager-'+width+'.png',fullPage:true});}
 failAgenda=true;await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.getByRole('button',{name:'Riprova agenda'}).waitFor();assert.equal(await page.getByRole('heading',{name:'Lezione individuale',exact:true}).count(),0);failAgenda=false;await page.getByRole('button',{name:'Riprova agenda'}).click();await page.getByRole('heading',{name:'Lezione individuale',exact:true}).waitFor();
 page.on('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Lascia il centro'}).click();await page.getByText('Nessuna lezione assegnata visibile in questo mese.').waitFor();assert.equal(membership.status,'revoked');assert.deepEqual(writes,['invite_centre_account','accept','revoke']);
 await centreContext.close();await personContext.close();
}assert.deepEqual(errors,[]);console.log('OK: codice personale, proposta, consenso, conflitto recuperabile, agenda assegnata, errore senza dati vecchi e revoca su desktop/mobile. API simulate.');}
finally{await browser.close();}
