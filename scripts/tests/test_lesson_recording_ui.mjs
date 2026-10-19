// Real SDK + synthetic API. No external backend, account or lesson is modified.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5237';
const screenshots=process.env.PC_SCREENSHOTS;
if(screenshots) await fs.mkdir(screenshots,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const uid=n=>`a0000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const errors=[];
async function setup(kind,width) {
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},timezoneId:'America/New_York',locale:'it-IT'});
 const user={id:uid(1),email:'synthetic@example.invalid',aud:'authenticated',role:'authenticated'};
 const profile={...user,role:'professional',full_name:'Anna Educatrice',email_verified:true};
 await context.addInitScript(s=>localStorage.setItem('sb-pc-lessons-test-auth-token',JSON.stringify(s)),{access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:4102444800,token_type:'bearer',user});
 const pack={id:uid(10),pass_id:uid(20),name:'Percorso individuale',client_name:'Marco Proprietario',professional_name:'Anna Educatrice',service_name:'Lezione individuale',total_uses:5,remaining_uses:5,price:100,purchased_at:'2026-10-01T08:00:00Z',expires_at:'2026-12-01T08:00:00Z',state:'active',version:1,cancellation_reason:null,ordinal:0,starts_on:'2026-10-01',ends_on:'2026-12-01',scheduled:false};
 const subscription={id:uid(30),plan_id:uid(20),name:pack.name,client_name:pack.client_name,professional_name:pack.professional_name,service_name:pack.service_name,period_unit:'month',period_uses:5,period_price:100,lifecycle:'open',started_at:pack.purchased_at,latest_period_id:pack.id,latest_start:'2026-10-01',latest_end:'2026-12-01',can_renew:false};
 const calls=[],events=new Map();const control={mutations:[],lists:[]};
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin===new URL(base).origin) return route.continue();
  if(url.hostname!=='pc-lessons-test.supabase.co') return route.abort();
  const name=url.pathname.split('/').at(-1),b=req.method()==='POST'?req.postDataJSON():{};
  calls.push({name,body:b});let data=[];
  if(name==='profiles') data=profile;
  else if(name==='user') data=user;
  else if(name==='professionals') data={listing_type:'individual'};
  else if(name==='services') data=[{id:uid(40),name:pack.service_name,active:true}];
  else if(name==='list_my_client_passes' || name==='get_subscription_periods') data=[{...pack}];
  else if(name==='list_my_subscriptions') data=[subscription];
  else if(name==='get_client_pass_events') data=[...events.values()].map(e=>({id:e.p_id,kind:'use',delta:-1,description:e.p_description||pack.service_name,occurred_at:e.p_occurred_at||'2026-10-18T08:00:00Z',created_at:e.p_occurred_at,reversed_at:null}));
  else if(name==='list_pass_eligible_bookings') {
   const mode=control.lists.shift();
   if(mode==='fail') return route.fulfill({status:503,json:{message:'Synthetic outage'}});
   if(mode==='malformed') return route.fulfill({json:[{id:uid(50),start_at:'invalid',service_name:pack.service_name}]});
   data=[{id:uid(50),start_at:'2026-10-18T08:00:00Z',service_name:pack.service_name}];
  }
  else if(name==='record_pass_use') {
   const mode=control.mutations.shift();
   if(mode==='reject' || mode==='denied') return route.fulfill({status:400,json:{code:mode==='reject'?'22023':'42501',message:'Synthetic rejection'}});
   if(!events.has(b.p_id)){events.set(b.p_id,b);pack.remaining_uses--;pack.version++;if(pack.remaining_uses===0)pack.state='exhausted';}
   else assert.deepEqual(b,events.get(b.p_id),'same UUID must retain exact input');
   if(mode==='lost') return route.fulfill({status:503,json:{message:'Lost response after commit'}});
   if(mode==='wrong') return route.fulfill({json:uid(999)});
   if(mode==='hang') return; // Browser timeout aborts this request; never forwards it.
   data=b.p_id;
  }
  await route.fulfill({status:200,json:data});
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-11-01T12:00:00Z')});
 await page.goto(base+`/#/pro/${kind}`);
 await page.getByRole('heading',{name:kind==='passes'?'Pacchetti di lezioni':'Abbonamenti',exact:true}).waitFor();
 async function open() {
  if(kind==='subscriptions' && !await page.getByRole('dialog').count()) await page.getByRole('button',{name:'Periodi e lezioni',exact:true}).click();
  await page.getByRole('button',{name:/^(Registra lezione|Verifica registrazione)$/}).click();
  await page.getByRole('heading',{name:'Registra lezione',exact:true}).waitFor();
 }
 async function close(){await page.getByRole('dialog').getByRole('button',{name:'Chiudi',exact:true}).click();}
 return {context,page,pack,calls,events,control,open,close};
}
try {
 for(const kind of ['passes','subscriptions'])for(const width of [1440,390]) {
  const t=await setup(kind,width),{page,control,pack}=t;
  await t.open();
  const description=page.getByLabel('Breve descrizione visibile al cliente');
  await description.fill('Richiamo e attenzione');await page.getByLabel('Data e ora della lezione').fill('2026-10-18T12:30');
  control.mutations.push('lost');pack.remaining_uses=1; // Last credit: recovery must remain accessible after refresh.
  await page.getByRole('button',{name:'Scala una lezione',exact:true}).evaluate(b=>{b.click();b.click();});
  await page.getByRole('alert').getByText(/Esito non confermato/).waitFor();
  assert.equal(await description.isDisabled(),true);assert.equal(t.events.size,1);
  assert.equal(t.calls.filter(x=>x.name==='record_pass_use').length,1);
  await t.close();
  if(kind==='passes') await page.getByRole('button',{name:'Aggiorna elenco',exact:true}).click();
  await page.getByRole('button',{name:'Verifica registrazione',exact:true}).waitFor();
  await t.open();assert.equal(await description.inputValue(),'Richiamo e attenzione');assert.equal(await description.isDisabled(),true);
  if(screenshots) await page.screenshot({path:`${screenshots}/recupero-${kind}-${width}.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Riprova lo stesso invio',exact:true}).click();
  await page.getByRole('heading',{name:'Registra lezione',exact:true}).waitFor({state:'hidden'});
  const sends=t.calls.filter(x=>x.name==='record_pass_use');assert.equal(sends.length,2);assert.deepEqual(sends[0].body,sends[1].body);
  assert.equal(sends[0].body.p_occurred_at,'2026-10-18T10:30:00.000Z');assert.equal(pack.remaining_uses,0);assert.equal(t.events.size,1);
  assert.equal(await page.getByRole('button',{name:'Verifica registrazione',exact:true}).count(),0);
  await t.context.close();console.log(`OK: ${kind} ${width}px, lost response + reopen + last credit + stable payload; Italy time in New York browser.`);
 }
 const t=await setup('passes',1440),{page,control}=t;await t.open();
 const desc=page.getByLabel('Breve descrizione visibile al cliente'),date=page.getByLabel('Data e ora della lezione');
 await desc.fill('Prima descrizione');await date.fill('2026-03-29T02:30');await page.getByRole('button',{name:'Scala una lezione',exact:true}).click();
 await page.getByText(/Data o ora non valida/).waitFor();assert.equal(t.calls.filter(x=>x.name==='record_pass_use').length,0);
 await date.fill('2027-01-01T12:00');await page.getByRole('button',{name:'Scala una lezione',exact:true}).click();await page.getByText(/soltanto una lezione già svolta/).waitFor();
 await date.fill('2026-10-25T02:30');await page.getByLabel('Quale orario del cambio ora?').selectOption('2026-10-25T01:30:00.000Z');
 control.mutations.push('reject');await page.getByRole('button',{name:'Scala una lezione',exact:true}).click();await page.getByText(/Controlla i dati inseriti/).waitFor();assert.equal(await desc.isEnabled(),true);
 await desc.fill('Descrizione corretta');control.mutations.push('wrong','denied');await page.getByRole('button',{name:'Scala una lezione',exact:true}).click();await page.getByText(/Esito non confermato/).waitFor();
 await page.getByRole('button',{name:'Riprova lo stesso invio'}).click();await page.getByRole('button',{name:'Riprova lo stesso invio'}).waitFor();assert.equal(await desc.isDisabled(),true);
 await page.getByRole('button',{name:'Riprova lo stesso invio'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const mutations=t.calls.filter(x=>x.name==='record_pass_use');assert.equal(mutations.length,4);assert.notEqual(mutations[0].body.p_id,mutations[1].body.p_id);
 assert.deepEqual(mutations[1].body,mutations[2].body);assert.deepEqual(mutations[2].body,mutations[3].body);assert.equal(mutations[1].body.p_occurred_at,'2026-10-25T01:30:00.000Z');assert.equal(t.events.size,1);
 await t.open();control.lists.push('fail','malformed');await page.getByLabel('Come vuoi registrarla?').selectOption('booking');
 await page.getByRole('button',{name:'Riprova prenotazioni'}).click();await page.getByRole('button',{name:'Riprova prenotazioni'}).waitFor();assert.equal(await page.getByRole('button',{name:'Scala una lezione'}).isDisabled(),true);
 await page.getByRole('button',{name:'Riprova prenotazioni'}).click();await page.getByLabel('Prenotazione',{exact:true}).selectOption(uid(50));
 control.mutations.push('lost');await page.getByRole('button',{name:'Scala una lezione'}).click();await page.getByText(/Esito non confermato/).waitFor();await t.close();await t.open();
 await page.getByRole('button',{name:'Riprova lo stesso invio'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const booked=t.calls.filter(x=>x.name==='record_pass_use').slice(-2);assert.deepEqual(booked[0].body,booked[1].body);assert.equal(booked[0].body.p_booking_id,uid(50));assert.equal(booked[0].body.p_occurred_at,null);
 await t.open();await date.fill('2026-10-18T12:30');await desc.fill('Risposta lenta');control.mutations.push('hang');await Promise.all([page.waitForRequest(r=>r.url().endsWith('/record_pass_use')),page.getByRole('button',{name:'Scala una lezione'}).click()]);
 await page.clock.fastForward(16000);await page.getByText(/Esito non confermato/).waitFor();await page.getByRole('button',{name:'Riprova lo stesso invio'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const timed=t.calls.filter(x=>x.name==='record_pass_use').slice(-2);assert.deepEqual(timed[0].body,timed[1].body);

 await t.open();await desc.fill('Invio prima della navigazione');await date.fill('2026-10-18T13:30');control.mutations.push('hang');
 await Promise.all([page.waitForRequest(r=>r.url().endsWith('/record_pass_use')),page.getByRole('button',{name:'Scala una lezione'}).click()]);
 await page.evaluate(()=>{location.hash='/pro/subscriptions';});await page.getByRole('heading',{name:'Abbonamenti',exact:true}).waitFor();
 await page.evaluate(()=>{location.hash='/pro/passes';});await page.getByRole('heading',{name:'Pacchetti di lezioni',exact:true}).waitFor();await t.open();
 assert.equal(await desc.inputValue(),'Invio prima della navigazione');assert.equal(await desc.isDisabled(),true);
 await page.getByRole('button',{name:'Riprova lo stesso invio'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const navigated=t.calls.filter(x=>x.name==='record_pass_use').slice(-2);assert.deepEqual(navigated[0].body,navigated[1].body);
 await t.context.close();assert.deepEqual(errors,[]);
 console.log('OK: explicit rejection, unknown response, later denial, DST gap/overlap, future date, booking failure/malformed response/retry, timeout and navigation during submission. Synthetic API only.');
} finally {await browser.close();}
