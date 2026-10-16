// Synthetic accounts and API responses only; no real lessons are completed.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5223';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000004',instructor='e8310000-0000-0000-0006-000000000020',version='e8310000-0000-0000-0008-000000000002';
const errors=[];
try{for(const width of [1440,390]){
 let allowed=false,revision=version,stale=true,completed=false,successes=0;
 const membership={id:'membership',instructor_id:instructor,instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',status:'active',instructor_active:true};
 async function session(isCentre){
  const uid=isCentre?centre:person,ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1);let data=[];
   if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id:uid,role:isCentre?'professional':'owner',full_name:'Anna di prova',email:'test@example.invalid',email_verified:true};
   if(name==='professionals')data={id:uid,listing_type:isCentre?'center':'individual',approved:true};
   if(name==='get_my_centre_team')data={enabled:isCentre,members:[{id:instructor,display_name:'Anna di prova',active:true,version,assigned_bookings:2}]};
   if(name==='get_my_centre_memberships')data=[{...membership,version:revision,is_centre:isCentre,can_complete_lessons:allowed}];
   if(name==='get_my_centre_lessons')data={items:[1,2].map(n=>({id:'lesson-'+n,start_at:new Date(Date.now()-7200000).toISOString(),end_at:new Date(Date.now()-3600000).toISOString(),status:completed&&n===1?'completed':'accepted',service_name:'Lezione '+n,centre_name:'Centro di prova',instructor_name:'Anna di prova',client_name:'Cliente di prova',dog_names:['Rex'],membership_id:'membership',membership_version:revision,assignment_version:version,can_complete:allowed&&!(completed&&n===1),completed_by:completed&&n===1?'Anna di prova':null})),truncated:false};
   if(name==='set_centre_lesson_permission'){
    assert.equal(isCentre,true);const p=req.postDataJSON();assert.equal(p.p_expected_version,revision);assert.equal(p.p_membership_id,'membership');allowed=p.p_allowed;revision=crypto.randomUUID();data={version:revision,can_complete_lessons:allowed};
   }
   if(name==='complete_assigned_centre_lesson'){
    assert.equal(isCentre,false);const p=req.postDataJSON();assert.equal(p.p_assignment_version,version);assert.equal(p.p_membership_id,'membership');
    if(!allowed)return route.fulfill({status:403,json:{code:'42501',message:'revoked'}});
    if(stale){stale=false;revision=crypto.randomUUID();return route.fulfill({status:409,json:{code:'40001',message:'stale'}});}
    assert.equal(p.p_membership_version,revision);assert.equal(p.p_booking_id,'lesson-1');completed=true;successes++;data={status:'completed',already_completed:false};
   }
   return route.fulfill({status:200,json:data,headers:{'content-range':'0-0/1'}});
  });return ctx;
 }
 const cc=await session(true),pc=await session(false),centrePage=await cc.newPage(),page=await pc.newPage();
 for(const p of [centrePage,page]){p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());}
 await centrePage.goto(base+'/pro/team');await centrePage.getByText('Agenda in sola lettura',{exact:true}).waitFor();
 await page.goto(base+'/account/centres');await page.getByRole('heading',{name:'Lezione 1',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Segna lezione svolta'}).count(),0);
 await centrePage.getByRole('button',{name:'Consenti completamento lezioni'}).click();await centrePage.getByText('Permesso attivato per le sole lezioni assegnate.').waitFor();
 await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.getByRole('button',{name:'Segna lezione svolta'}).first().click();await page.getByText('I dati sono cambiati. Aggiorna e controlla prima di riprovare.').waitFor();assert.equal(successes,0);
 await page.getByRole('button',{name:'Segna lezione svolta'}).first().click();await page.getByText('Confermata come svolta da Anna di prova.').waitFor();assert.equal(successes,1);assert.equal(await page.getByRole('button',{name:'Segna lezione svolta'}).count(),1);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Personal agenda overflow');assert.ok(await centrePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Centre permission overflow');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:process.env.PC_SCREENSHOTS+`/completed-lesson-${width}.png`,fullPage:true});await centrePage.evaluate(()=>scrollTo(0,0));await centrePage.screenshot({path:process.env.PC_SCREENSHOTS+`/permission-${width}.png`,fullPage:true});}
 await centrePage.getByRole('button',{name:'Aggiorna collegamenti'}).click();await centrePage.getByRole('button',{name:'Rimuovi permesso di completamento'}).click();await centrePage.getByText('Permesso rimosso. L’istruttore conserva la lettura della propria agenda.').waitFor();
 // Deliberately leave the personal view stale; the server rejects the attempted write.
 await page.getByRole('button',{name:'Segna lezione svolta'}).click();await page.getByText('Operazione non consentita. Controlla di usare il tuo account con email confermata.').waitFor();assert.equal(await page.getByRole('button',{name:'Segna lezione svolta'}).count(),0);assert.equal(successes,1);
 await page.getByRole('heading',{name:'Lezione 2',exact:true}).waitFor();
 await cc.close();await pc.close();
}assert.deepEqual(errors,[]);console.log('OK: permesso esplicito, agenda in lettura, conflitto recuperabile, completamento con autore, revoca contro pagina obsoleta, desktop e mobile. API simulate.');}finally{await browser.close();}
