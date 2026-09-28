// Synthetic API only. Never call the production database.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox','--disable-dev-shm-usage'] });
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5191';
const screenshots = process.env.PC_SCREENSHOTS;
if (screenshots) await fs.mkdir(screenshots, { recursive: true });
const uid = n => `d0000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const day = n => new Date(Date.now() + n*86400000).toISOString().slice(0,10);
const service = { id: uid(101), name: 'Lezione individuale', active: true };
const calls = [], errors = []; let plans = [], agreements = [], periods = [], events = [];
let lostAssignment = true, lostRenewal = true, failList = false;
async function setup(role = 'professional', viewport = { width: 1440, height: 1000 }) {
 const context = await browser.newContext({ viewport });
 const user = { id: uid(role === 'professional' ? 1 : 11), email: 'synthetic@example.invalid', aud: 'authenticated', role: 'authenticated' };
 const session = { access_token: 'synthetic-token', refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user };
 await context.addInitScript(s => localStorage.setItem('sb-pc-subscriptions-test-auth-token', JSON.stringify(s)), session);
 await context.route('**/*.supabase.co/**', async route => {
  const req = route.request(), url = new URL(req.url()), name = url.pathname.split('/').at(-1);
  assert.equal(url.hostname, 'pc-subscriptions-test.supabase.co');
  const b = req.method() === 'POST' ? req.postDataJSON() : {}; calls.push({ name, body: b, role }); let data = [];
  if (name === 'profiles') data = [{ ...user, role, full_name: role === 'professional' ? 'Anna Educatrice' : 'Marco Proprietario', email_verified: true }];
  else if (name === 'user') data = user;
  else if (name === 'services') data = [service];
  else if (name === 'get_professional_clients') data = [{ id: uid(11), full_name: 'Marco Proprietario' }];
  else if (name === 'list_own_subscription_plans') data = plans;
  else if (name === 'save_own_subscription_plan') {
   const p = { id: b.p_id, name: b.p_name, description: b.p_description, service_id: b.p_service_id, service_name: service.name, service_active: true, period_unit: b.p_period_unit, period_uses: b.p_period_uses, period_price: b.p_period_price, active: true, version: b.p_version+1 };
   plans = [...plans.filter(p => p.id !== b.p_id), p]; data = p.id;
  } else if (name === 'set_subscription_plan_active') { plans[0].active = b.p_active; plans[0].version++; data = null; }
  else if (name === 'list_my_subscriptions') {
   if (failList) return route.fulfill({ status: 503, json: { message: 'Synthetic outage' } });
   data = agreements.filter(s => !url.searchParams.get('lifecycle') || url.searchParams.get('lifecycle') === `eq.${s.lifecycle}`);
  } else if (name === 'issue_client_subscription') {
   if (!agreements.some(s => s.id === b.p_id)) {
    const p = plans.find(p => p.id === b.p_plan_id);
    agreements.push({ id: b.p_id, plan_id: p.id, name: p.name, description: p.description, client_name: 'Marco Proprietario', professional_name: 'Anna Educatrice', service_name: service.name, period_unit: p.period_unit, period_uses: p.period_uses, period_price: p.period_price, starts_on: day(0), lifecycle: 'open', version: 1, closure_reason: null, closed_at: null, started_at: new Date().toISOString(), latest_period_id: b.p_id, latest_start: day(0), latest_end: day(30), next_start: day(30), next_end: day(60), can_renew: true });
    periods.push({ id: b.p_id, pass_id: p.id, name: p.name, client_name: 'Marco Proprietario', professional_name: 'Anna Educatrice', service_name: service.name, total_uses: p.period_uses, remaining_uses: p.period_uses, price: p.period_price, purchased_at: new Date(Date.now()-3600000).toISOString(), expires_at: new Date(Date.now()+30*86400000).toISOString(), state: 'active', version: 1, cancellation_reason: null, ordinal: 0, starts_on: day(0), ends_on: day(30), scheduled: false });
   }
   if (lostAssignment) { lostAssignment = false; return route.fulfill({ status: 503, json: { message: 'Acknowledgement lost' } }); } data = b.p_id;
  } else if (name === 'get_subscription_periods') data = [...periods].sort((a,b)=>b.ordinal-a.ordinal);
  else if (name === 'renew_client_subscription') {
   if (!periods.some(p=>p.id===b.p_id)) {
    const s = agreements[0];
    periods.push({ ...periods[0], id: b.p_id, remaining_uses: s.period_uses, ordinal: 1, starts_on: s.next_start, ends_on: s.next_end, purchased_at: new Date(Date.now()+30*86400000).toISOString(), expires_at: new Date(Date.now()+60*86400000).toISOString(), scheduled: true });
    s.latest_period_id = b.p_id; s.latest_start = s.next_start; s.latest_end = s.next_end; s.can_renew = false; s.version++;
   }
   if (lostRenewal) { lostRenewal = false; return route.fulfill({ status: 503, json: { message: 'Acknowledgement lost' } }); } data = b.p_id;
  } else if (name === 'close_client_subscription') { agreements[0].lifecycle='closed'; agreements[0].closure_reason=b.p_reason; agreements[0].version++; data=null; }
  else if (name === 'list_pass_eligible_bookings') data=[];
  else if (name === 'record_pass_use') {
   await new Promise(resolve=>setTimeout(resolve,100));
   periods.find(p=>p.id===b.p_client_pass_id).remaining_uses--;
   events.push({ id:b.p_id,kind:'use',delta:-1,occurred_at:b.p_occurred_at,description:b.p_description,reversed_at:null,reversal_of:null,created_at:new Date().toISOString() }); data=b.p_id;
  } else if (name === 'cancel_own_client_pass') { const p=periods.find(p=>p.id===b.p_id);p.state='cancelled';p.cancellation_reason=b.p_reason;p.version++;data=null; }
  else if (name === 'get_client_pass_events') data=events;
  else if (name === 'reverse_pass_use') { events[0].reversed_at=new Date().toISOString(); periods[0].remaining_uses++;events.push({ id:b.p_id,kind:'reversal',delta:1,occurred_at:new Date().toISOString(),description:b.p_reason,reversal_of:b.p_use_id,created_at:new Date().toISOString() });data=b.p_id; }
  await route.fulfill({ status: 200, json: data });
 });
 const page=await context.newPage(); page.setDefaultTimeout(12000); page.on('pageerror',e=>errors.push(e.message));return {context,page};
}
try {
 const {page,context}=await setup();
 await page.goto(base+'/#/pro/subscriptions'); await page.getByRole('heading',{name:'Abbonamenti',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Nessun abbonamento in elenco'}).waitFor();
 await page.getByRole('button',{name:'Piani',exact:true}).click(); await page.getByRole('button',{name:'Nuovo piano',exact:true}).click();
 await page.getByLabel('Nome del piano').fill('Percorso mensile'); await page.getByLabel('Servizio incluso').selectOption(service.id);
 await page.getByLabel('Lezioni per periodo').fill('4'); await page.getByLabel('Prezzo per periodo (€)').fill('100');
 await page.getByRole('button',{name:'Salva piano',exact:true}).click(); await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Abbonamenti dei clienti',exact:true}).click(); await page.getByRole('button',{name:'Assegna abbonamento',exact:true}).click();
 await page.getByLabel('Piano',{exact:true}).selectOption(plans[0].id); await page.getByLabel('Cliente',{exact:true}).selectOption(uid(11));
 await page.getByRole('button',{name:'Conferma primo periodo'}).click(); await page.getByRole('alert').waitFor();
 await page.getByRole('button',{name:'Conferma primo periodo'}).click(); await page.getByRole('dialog').waitFor({state:'hidden'});
 const issues=calls.filter(c=>c.name==='issue_client_subscription'); assert.equal(issues.length,2); assert.equal(issues[0].body.p_id,issues[1].body.p_id);assert.equal(agreements.length,1);
 await page.getByRole('article').getByText('Marco Proprietario').waitFor();
 await page.getByRole('button',{name:'Periodi e lezioni'}).click(); await page.getByRole('button',{name:'Registra lezione'}).click();
 await page.getByLabel('Breve descrizione visibile al cliente').fill('Lavoro sul richiamo');
 await page.getByRole('button',{name:'Scala una lezione'}).evaluate(b=>{b.click();b.click();});
 await page.getByRole('heading',{name:'Periodi · Percorso mensile'}).waitFor(); await page.getByText('3 / 4 lezioni residue').waitFor();
 assert.equal(calls.filter(c=>c.name==='record_pass_use').length,1);
 await page.getByRole('button',{name:'Storico lezioni'}).click(); await page.getByText('Lavoro sul richiamo',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Storna questa lezione'}).click();await page.getByLabel('Motivo visibile al cliente').fill('Registrazione duplicata');await page.getByRole('button',{name:'Conferma storno'}).click();
 await page.getByRole('heading',{name:'Periodi · Percorso mensile'}).waitFor(); await page.getByText('4 / 4 lezioni residue').waitFor();
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Rinnova periodo'}).click();await page.getByRole('button',{name:'Conferma nuovo periodo'}).click();await page.getByRole('alert').waitFor();
 await page.getByRole('button',{name:'Conferma nuovo periodo'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const renewals=calls.filter(c=>c.name==='renew_client_subscription');assert.equal(renewals.length,2);assert.equal(renewals[0].body.p_id,renewals[1].body.p_id);assert.equal(periods.length,2);
 assert.equal(await page.getByRole('button',{name:'Rinnova periodo'}).isDisabled(),true);
 await page.getByRole('button',{name:'Periodi e lezioni'}).click();await page.getByText('In programma',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Registra lezione'}).count(),1);
 if(screenshots) await page.screenshot({path:screenshots+'/abbonamenti-periodi.png',fullPage:true});await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Chiudi rinnovi',exact:true}).click();await page.getByLabel('Motivo visibile al cliente').fill('Percorso concluso insieme');await page.getByRole('button',{name:'Conferma chiusura rinnovi'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('article').getByText('Rinnovi chiusi',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Rinnova periodo'}).count(),0);
 if(screenshots) await page.screenshot({path:screenshots+'/abbonamenti-professionista.png',fullPage:true});
 failList=true;await page.getByRole('button',{name:'Aggiorna elenco'}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('article').count(),0);failList=false;await page.getByRole('button',{name:'Aggiorna elenco'}).click();await page.getByRole('article').waitFor();
 await page.getByRole('button',{name:'Piani',exact:true}).click();await page.getByRole('button',{name:'Archivia piano'}).click();await page.getByText('Archiviato',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Abbonamenti dei clienti',exact:true}).click();await page.getByRole('button',{name:'Periodi e lezioni'}).click();
 await page.getByRole('button',{name:'Annulla periodo'}).last().click();await page.getByRole('heading',{name:'Annulla periodo',exact:true}).waitFor();
 await page.getByLabel('Motivo visibile al cliente').fill('Periodo annullato su accordo');await page.getByRole('button',{name:'Conferma annullamento'}).click();
 await page.getByRole('heading',{name:'Periodi · Percorso mensile'}).waitFor();await page.getByText('Annullato',{exact:true}).waitFor();assert.equal(periods[0].state,'cancelled');
 await context.close();
 const owner=await setup('owner',{width:390,height:844});await owner.page.goto(base+'/#/owner/subscriptions');await owner.page.getByRole('heading',{name:'I miei abbonamenti'}).waitFor();
 await owner.page.getByRole('article').getByText('Anna Educatrice').waitFor();assert.equal(await owner.page.getByRole('button',{name:'Piani',exact:true}).count(),0);assert.equal(await owner.page.getByRole('button',{name:'Rinnova periodo'}).count(),0);
 assert.equal(await owner.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(screenshots) await owner.page.screenshot({path:screenshots+'/abbonamenti-proprietario-mobile.png',fullPage:true});
 await owner.page.getByRole('button',{name:'Periodi e lezioni'}).click();await owner.page.getByText('In programma',{exact:true}).waitFor();assert.equal(await owner.page.getByRole('button',{name:'Registra lezione'}).count(),0);
 await owner.page.getByRole('button',{name:'Storico lezioni'}).last().click();await owner.page.getByText('+1 · Storno',{exact:true}).waitFor();assert.equal(await owner.page.getByRole('button',{name:'Storna questa lezione'}).count(),0);
 await owner.context.close();assert.deepEqual(errors,[]);
 console.log('OK: piano, assegnazione e rinnovo con risposta persa, doppio clic, lezioni e storni, chiusura, archivio, errore di rete e vista proprietario mobile. Backend simulato.');
} finally { await browser.close(); }
