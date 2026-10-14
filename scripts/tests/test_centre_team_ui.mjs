// Browser integration with synthetic sessions/APIs only; never sends invitations.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5218';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',owner='e8310000-0000-0000-0000-000000000007',booking='e8310000-0000-0000-0005-000000000001';
const version='e8310000-0000-0000-0006-000000000099';const errors=[];
try{for(const width of [1440,390]){
 let members=[],assignment=null,stale=true;const writes=[];
 const bookingRow={id:booking,start_at:new Date().toISOString(),end_at:new Date(Date.now()+3600000).toISOString(),status:'accepted',client_name:'Cliente di prova',professional_name:'Centro di prova',price:25,notes:'Nota cliente di prova',service_id:booking,service_name:'Lezione di prova',service_type:'trainer',calendar_color:'#047857'};
 async function context(role){
  const uid=role==='professional'?centre:owner;
  const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1);let data=[];
   if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id:uid,role,full_name:role==='professional'?'Centro di prova':'Cliente di prova',email:'test@example.invalid',email_verified:true};
   if(name==='professionals')data={id:uid,listing_type:'center',approved:true,approval_status:'approved'};
   if(name==='get_my_centre_team')data={enabled:role==='professional',members};
   if(name==='save_centre_instructor'){const p=req.postDataJSON();members.push({id:p.p_id,display_name:p.p_name,active:p.p_active,version,assigned_bookings:0});data=members.at(-1);}
   if(['get_professional_bookings','get_my_owner_bookings','get_my_booking_calendar'].includes(name))data=[bookingRow];
   if(name==='get_my_service_reviews')data={items:[],count:0,pending_count:0};
   if(name==='get_my_schedule')data={paused:false,periods:[]};
   if(name==='get_booking_instructors')data=[{booking_id:booking,instructor_id:assignment?.id||null,instructor_name:assignment?.name||null,version:assignment?.version||null,instructor_active:true,can_assign:role==='professional'}];
   if(name==='assign_booking_instructor_checked'){
    const p=req.postDataJSON();writes.push(p);
    if(stale){stale=false;assignment={id:null,name:null,version};return route.fulfill({status:409,json:{code:'40001',message:'Version changed'}});}
    assert.equal(p.p_allow_overlap,false);assert.equal(p.p_expected_version,version);const member=members.find(m=>m.id===p.p_instructor_id);assert.ok(member);assignment={id:member.id,name:member.display_name,version:'e8310000-0000-0000-0006-000000000098'};data={};
   }
   return route.fulfill({status:200,json:data,headers:{'content-range':'0-0/1','access-control-expose-headers':'content-range'}});
  });return ctx;
 }
 const ctx=await context('professional');const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/pro/team');await page.getByRole('heading',{name:'Gli istruttori del centro',exact:true}).waitFor();
 await page.getByRole('button',{name:'Aggiungi istruttore',exact:true}).click();await page.getByLabel('Nome e cognome',{exact:true}).fill('Anna di prova');await page.getByRole('button',{name:'Salva istruttore',exact:true}).click();await page.getByRole('heading',{name:'Anna di prova',exact:true}).waitFor();assert.equal(members.length,1);
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/centre-team-'+width+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Vai alle lezioni prenotate'}).click();await page.getByRole('button',{name:'Assegna istruttore',exact:true}).click();await page.getByLabel('Chi segue la lezione?',{exact:true}).selectOption(members[0].id);await page.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await page.getByRole('alert').filter({hasText:'I dati sono cambiati'}).waitFor();
 assert.equal(writes[0].p_expected_version,null);await page.getByRole('alert').filter({hasText:'I dati sono cambiati'}).getByRole('button',{name:'Aggiorna',exact:true}).click();
 await page.getByRole('button',{name:'Assegna istruttore',exact:true}).click();await page.getByLabel('Chi segue la lezione?',{exact:true}).selectOption(members[0].id);await page.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await page.getByLabel('Istruttore della lezione').getByText('Anna di prova',{exact:false}).waitFor();assert.equal(writes.length,2);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pro bookings overflow');
 await page.goto(base+'/pro/calendar');await page.getByLabel('Istruttore della lezione').getByText('Anna di prova',{exact:false}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Calendar overflow');await ctx.close();
 const client=await context('owner');const ownerPage=await client.newPage();ownerPage.setDefaultTimeout(12000);ownerPage.on('pageerror',e=>errors.push(e.message));await ownerPage.goto(base+'/owner/bookings');await ownerPage.getByLabel('Istruttore della lezione').getByText('Anna di prova',{exact:false}).waitFor();assert.equal(await ownerPage.getByRole('button',{name:'Cambia istruttore',exact:true}).count(),0);assert.ok(await ownerPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Owner bookings overflow');await client.close();
}assert.deepEqual(errors,[]);console.log('OK: roster creation, booking conflict/reload/save, calendar and owner read-only view at desktop/mobile widths. APIs simulated.');}
finally{await browser.close();}
