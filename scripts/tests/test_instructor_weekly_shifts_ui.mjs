// Synthetic browser sessions/APIs only. No real schedules, bookings or messages.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5227';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000004',errors=[];
try{for(const width of [1440,390]){
 let plan={instructor_id:'instructor',enabled:false,slots:[],version:null,can_edit:true,affected_bookings:0,timezone:'Europe/Rome'},uncertain=true,conflict=false,readError=false;const writes=[];
 async function session(kind){const uid=kind==='centre'?centre:person,ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
 await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 await ctx.route('https://**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();const name=url.pathname.split('/').at(-1),p=req.method()==='POST'?req.postDataJSON():{};let data=[];
 if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
 if(name==='profiles')data={id:uid,role:kind==='centre'?'professional':'owner',full_name:kind==='centre'?'Centro di prova':'Anna di prova',email:'test@example.invalid',email_verified:true};
 if(name==='professionals')data={id:uid,listing_type:kind==='centre'?'center':'individual',approved:true};
 if(name==='get_my_centre_team')data={enabled:kind==='centre',members:[{id:'instructor',display_name:'Anna di prova',active:true,version:'roster',assigned_bookings:1}]};
 if(name==='get_my_centre_memberships')data=[{id:'membership',instructor_id:'instructor',instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',status:'active',instructor_active:true,version:'membership-v',is_centre:kind==='centre'}];
 if(name==='get_my_centre_lessons')data={items:[],truncated:false};
 if(name==='get_my_schedule')data={paused:false,periods:[]};
 if(name==='get_my_booking_calendar')data=[{id:'lesson',start_at:new Date().toISOString(),end_at:new Date(Date.now()+3600000).toISOString(),status:'accepted',client_name:'Cliente di prova',service_name:'Lezione di prova',calendar_color:'#047857'}];
 if(name==='get_booking_instructors')data=[{booking_id:'lesson',instructor_id:'instructor',instructor_name:'Anna di prova',version:'assign',instructor_active:true,can_assign:true,outside_shift:true}];
 if(name==='get_instructor_weekly_shifts'){if(readError)return route.fulfill({status:503,json:{message:'Synthetic read unavailable'}});data={...plan,can_edit:kind==='centre'};}
 if(name==='save_instructor_weekly_shifts'){
  assert.equal(kind,'centre');writes.push(p);if(conflict)return route.fulfill({status:409,json:{code:'40001',message:'Weekly hours changed'}});
  if(uncertain){uncertain=false;plan={...plan,enabled:p.p_enabled,slots:p.p_slots,version:crypto.randomUUID(),affected_bookings:1};return route.fulfill({status:503,json:{message:'Outcome unknown'}});}
  assert.deepEqual(p,writes[0],'retry preserves exact payload and expected version');data=plan;
 }
 return route.fulfill({status:200,json:data});});return ctx;}
 const ctx=await session('centre'),page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(base+'/pro/team');await page.getByRole('button',{name:'Turni settimanali',exact:true}).click();await page.getByText('Nessun limite settimanale attivo',{exact:true}).waitFor();
 await page.getByRole('checkbox',{name:'Usa questi turni per le nuove assegnazioni'}).check();assert.equal(await page.getByRole('button',{name:'Salva turni',exact:true}).isEnabled(),false);
 await page.getByRole('button',{name:'Aggiungi fascia',exact:true}).click();await page.getByLabel('Fine fascia 1',{exact:true}).fill('12:00');
 await page.getByRole('button',{name:'Aggiungi fascia',exact:true}).click();await page.getByText(/Unisci le fasce/).waitFor();assert.equal(await page.getByRole('button',{name:'Salva turni',exact:true}).isEnabled(),false);
 await page.getByLabel('Inizio fascia 2',{exact:true}).fill('14:00');await page.getByLabel('Fine fascia 2',{exact:true}).fill('18:00');
 await page.getByRole('button',{name:'Salva turni',exact:true}).click();await page.getByRole('button',{name:'Riprova lo stesso salvataggio',exact:true}).waitFor();assert.equal(await page.getByLabel('Inizio fascia 1',{exact:true}).isEnabled(),false);
 await page.getByRole('button',{name:'Riprova lo stesso salvataggio',exact:true}).click();await page.getByText('Turni salvati. Le lezioni già fissate sono conservate.',{exact:true}).waitFor();assert.equal(writes.length,2);
 await page.getByRole('button',{name:'Martedì',exact:true}).click();await page.getByRole('button',{name:'Aggiungi fascia',exact:true}).click();await page.getByRole('checkbox',{name:'Fino a mezzanotte'}).check();await page.getByText('24:00',{exact:true}).waitFor();
 conflict=true;await page.getByRole('button',{name:'Salva turni',exact:true}).click();await page.getByRole('alert').filter({hasText:'I turni sono cambiati'}).waitFor();assert.ok(await page.getByRole('button',{name:'Salva turni',exact:true}).count()===0);await page.getByText('24:00',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Aggiorna turni',exact:true}).click();await page.getByText('Turni settimanali attivi',{exact:true}).waitFor();await page.getByRole('button',{name:'Lunedì',exact:true}).click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'team mobile overflow');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.getByRole('heading',{name:'Settimana tipo · Anna di prova'}).scrollIntoViewIfNeeded();await page.screenshot({path:process.env.PC_SCREENSHOTS+`/shifts-${width}.png`});}
 await page.goto(base+'/pro/calendar');await page.getByLabel('Istruttore',{exact:true}).selectOption('instructor');await page.getByText('Turni dell’istruttore · ora italiana',{exact:true}).waitFor();await page.getByText('Fuori turno',{exact:true}).first().waitFor();await page.getByText(/Lezione fuori dai turni/).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'calendar mobile overflow');
 readError=true;await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.getByText(/Turni non caricati/).waitFor();readError=false;
 const pc=await session('person'),p=await pc.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/account/centres');await p.getByRole('button',{name:'Turni settimanali',exact:true}).click();await p.getByText(/I turni sono gestiti dal centro/).waitFor();assert.equal(await p.getByRole('button',{name:'Salva turni',exact:true}).count(),0);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await pc.close();await ctx.close();
}assert.deepEqual(errors,[]);console.log('OK: weekly editor, validation, uncertain retry, stale draft, midnight, private read-only view and calendar on desktop/mobile. APIs simulated.');}finally{await browser.close();}
