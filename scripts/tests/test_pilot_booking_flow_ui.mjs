// Cross-role browser flow using shared synthetic state and the real Supabase JS client.
// Backend permissions and persistence are covered by the SQL suites, not this fixture.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5197').replace(/\/$/, '');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ownerId = 'd0000000-0000-0000-0000-000000000021';
const proId = 'd0000000-0000-0000-0000-000000000022';
const dogId = 'd0000000-0000-0000-0000-000000000023';
const serviceId = 'd0000000-0000-0000-0000-000000000024';
const bookingId = 'd0000000-0000-0000-0000-000000000025';
const profilePath = `/p/${proId}`;
const notes = 'Prima richiesta di prova. Il cane ha bisogno di spazio dagli altri cani.';
const service = { id: serviceId, professional_id: proId, name: 'Lezione educativa', service_type: 'training', price: 35, duration_minutes: 60, duration_kind: 'hourly', active: true, calendar_color: '#3264A8' };
const rows = [], messages = [], attempts = [], errors = [], requests = [];
const read = new Map();
let unavailable = false, uncertainMessage = false, ownerLoadError = false;
function session(id) {
  return { access_token: 'synthetic-' + id, refresh_token: 'synthetic-refresh-' + id, expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user: { id, email: id === ownerId ? 'owner@example.invalid' : 'pro@example.invalid', role: 'authenticated', aud: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} } };
}
function rowFor(b, id) {
  return { ...b, client_name: 'Proprietario di prova', professional_name: 'Professionista di prova', service_name: service.name, service_type: service.service_type, calendar_color: service.calendar_color, request_priority: b.status === 'pending' ? 0 : b.status === 'accepted' ? 1 : 2 };
}
async function setup(id = null, width = 390) {
  const context = await browser.newContext({ viewport: { width, height: 1050 }, serviceWorkers: 'block', timezoneId: 'Europe/Rome' });
  if (id) await context.addInitScript(s => { if (!sessionStorage.getItem('fixture-ready')) { localStorage.setItem('sb-pc-home-test-auth-token', JSON.stringify(s)); sessionStorage.setItem('fixture-ready','true'); } }, session(id));
  await context.route('https://**/*', async route => {
    const req = route.request(), url = new URL(req.url()), name = url.pathname.split('/').at(-1);
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    assert.equal(url.hostname, 'pc-home-test.supabase.co', 'Production API forbidden');
    const auth = req.headers().authorization || '';
    const actor = auth === 'Bearer ' + session(ownerId).access_token ? ownerId : auth === 'Bearer ' + session(proId).access_token ? proId : null;
    const body = req.postData() ? req.postDataJSON() : {};
    const ok = data => route.fulfill({ status: 200, json: data });
    const fail = (code, status = 400) => route.fulfill({ status, json: { code, message: 'Synthetic failure' } });
    const counted = data => route.fulfill({ status: 200, headers: { 'Content-Range': data.length ? `0-${data.length-1}/${data.length}` : '*/0', 'Access-Control-Expose-Headers': 'Content-Range' }, json: data });
    if (name === 'token') return ok(session(body.email === 'pro@example.invalid' ? proId : ownerId));
    if (name === 'user') return actor ? ok(session(actor).user) : fail('bad_jwt',401);
    if (name === 'signup') { requests.push({ name, body }); return ok({ id: ownerId, email: body.email, identities: [{ provider: 'email' }] }); }
    if (name === 'profiles') return ok({ ...session(actor || ownerId).user, role: actor === proId ? 'professional' : 'owner', full_name: actor === proId ? 'Professionista di prova' : 'Proprietario di prova', email_verified: true, phone_verified: false });
    if (name === 'professionals') return ok({ id: proId, approved: true, professional_type:'trainer' });
    if (name === 'public_professional_profiles') return ok({ id: proId, display_name: 'Professionista di prova', professional_type:'trainer', bio:'Educazione del cane e gestione quotidiana.', zone_text:'Rimini', starting_price:35, rating:0, review_count:0 });
    if (name === 'dogs') return ok(actor === ownerId ? [{ id: dogId, owner_id: ownerId, name:'Cane di prova', breed:'Meticcio / altra razza' }] : []);
    if (name === 'get_public_professional_services') return ok([service]);
    if (name === 'get_public_booking_availability') return ok({ paused:false, periods:[] });
    if (name === 'create_booking_with_dog') {
      assert.equal(actor,ownerId); assert.equal(body.p_dog_id,dogId); assert.equal(body.p_service_id,serviceId);
      requests.push({ name, body });
      if (unavailable) { unavailable = false; return fail('PCA02'); }
      rows.push({ id:bookingId, owner_id:ownerId, professional_id:proId, service_id:serviceId, start_at:body.p_start_at, end_at:new Date(new Date(body.p_start_at).getTime()+3600000).toISOString(), price:35, status:'pending', notes:body.p_notes });
      return ok(bookingId);
    }
    if (name === 'get_my_owner_bookings' || name === 'get_professional_bookings') {
      assert.equal(actor,name === 'get_my_owner_bookings' ? ownerId : proId);
      if (name === 'get_my_owner_bookings' && ownerLoadError) { ownerLoadError=false; return fail('08006',503); }
      const filter = url.searchParams.get('status');
      const selected = rows.filter(b => !filter || filter === 'eq.' + b.status).map(b=>rowFor(b,actor));
      return counted(selected);
    }
    if (name === 'change_booking_status') {
      assert.equal(actor,proId); assert.equal(body.p_booking_id,bookingId); assert.equal(body.p_new_status,'accepted');
      rows[0].status=body.p_new_status; return ok(rows[0]);
    }
    if (name === 'get_my_schedule') return ok({paused:false,periods:[]});
    if (name === 'get_my_booking_calendar') { assert.equal(actor,proId); return ok(rows.map(b=>rowFor(b,actor))); }
    if (name === 'list_my_reply_templates') return ok([{id:'template-1', title:'Primo contatto',body:'Grazie per le informazioni. Ci vediamo per la prima lezione.',automatic_event:null}]);
    if (name === 'send_booking_message') {
      assert.equal(body.p_booking_id,bookingId); assert.equal(actor,proId); attempts.push(body);
      let m=messages.find(m=>m.request===body.p_request_id);
      if (!m) { m={id:'message-1',request:body.p_request_id,sequence:messages.length+1,body:body.p_body,sender_kind:'professional',sender_name:'Professionista di prova',is_automatic:false,created_at:new Date().toISOString(),sender_id:actor}; messages.push(m); }
      if (uncertainMessage) { uncertainMessage=false; return fail('08006',503); }
      return ok([m]);
    }
    if (name === 'get_booking_messages') return ok(messages.filter(m=>(!body.p_after_sequence || m.sequence>body.p_after_sequence)&&(!body.p_before_sequence||m.sequence<body.p_before_sequence)).map(m=>({...m,from_me:m.sender_id===actor})));
    if (name === 'mark_booking_messages_read') { read.set(actor,body.p_through_sequence); return ok(null); }
    if (name === 'get_booking_message_summaries') return ok((body.p_booking_ids||[]).map(id=>({booking_id:id,message_count:messages.length,unread_count:messages.filter(m=>m.sender_id!==actor&&m.sequence>(read.get(actor)||0)).length})));
    if (name === 'get_my_booking_message_inbox') return ok([]);
    return counted([]);
  });
  const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  return {context,page};
}
async function login(page, email='owner@example.invalid') {
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password');
  await page.getByRole('button',{name:'Accedi',exact:true}).last().click();
}
try {
  const pro=await setup(proId,1440);await pro.page.goto(base+'/#/pro/bookings');
  await pro.page.getByText('Nessuna prenotazione corrisponde ai filtri selezionati.').waitFor();
  const owner=await setup();await owner.page.goto(base+profilePath);
  await owner.page.getByRole('button',{name:'Richiedi prenotazione',exact:true}).click();
  await owner.page.getByRole('heading',{name:'Bentornato'}).waitFor();
  assert.equal(new URLSearchParams(owner.page.url().split('?')[1]).get('next'),profilePath+'?booking=1');
  await owner.page.reload();await login(owner.page);
  const modal=owner.page.getByRole('dialog',{name:'Richiedi prenotazione'});await modal.waitFor();
  assert.equal(new URL(owner.page.url()).pathname,profilePath);
  assert.equal(rows.length,0,'Login must not send a booking');
  await modal.getByLabel('Data',{exact:true}).fill('2020-01-01');await modal.getByLabel('Ora',{exact:true}).fill('14:00');
  await modal.getByRole('button',{name:'Invia richiesta',exact:true}).click();await modal.getByRole('alert').filter({hasText:'futuri'}).waitFor();
  assert.equal(requests.length,0);
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  await modal.getByLabel('Data',{exact:true}).fill(tomorrow);await modal.getByLabel('Note',{exact:true}).fill(notes);
  unavailable=true;await modal.getByRole('button',{name:'Invia richiesta',exact:true}).click();
  await modal.getByRole('alert').filter({hasText:'indisponibilità'}).waitFor();assert.equal(rows.length,0);
  assert.equal(await modal.getByLabel('Note',{exact:true}).inputValue(),notes);
  await modal.getByRole('button',{name:'Invia richiesta',exact:true}).click();
  await owner.page.waitForURL(base+'/#/owner/bookings');await owner.page.getByText(notes,{exact:true}).waitFor();assert.equal(rows.length,1);
  await owner.page.getByText('In attesa',{exact:true}).waitFor();
  assert.equal(new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',hour:'2-digit',minute:'2-digit'}).format(new Date(rows[0].start_at)),'14:00');
  await pro.page.getByRole('button',{name:'Aggiorna richieste'}).click();
  await pro.page.getByRole('heading',{name:'Proprietario di prova',exact:true}).waitFor();await pro.page.getByText(notes,{exact:true}).waitFor();
  await pro.page.getByRole('button',{name:'Messaggi',exact:true}).click();
  const chat=pro.page.getByRole('dialog',{name:'Messaggi della prenotazione'});await chat.getByText(notes,{exact:true}).waitFor();
  await chat.getByLabel('Usa un modello').selectOption('template-1');uncertainMessage=true;
  await chat.getByRole('button',{name:'Invia messaggio',exact:true}).click();
  await chat.getByRole('button',{name:'Riprova lo stesso invio',exact:true}).click();
  await chat.getByRole('list',{name:'Conversazione'}).getByText(messages[0].body,{exact:true}).waitFor();
  assert.equal(messages.length,1);assert.equal(attempts.length,2);assert.equal(attempts[0].p_request_id,attempts[1].p_request_id);
  await chat.getByRole('button',{name:'Chiudi messaggi'}).click();
  await pro.page.getByRole('button',{name:'Accetta',exact:true}).click();await pro.page.getByText('Richiesta accettata.',{exact:true}).waitFor();
  await owner.page.getByRole('button',{name:'Aggiorna',exact:true}).click();await owner.page.getByText('Accettata',{exact:true}).waitFor();
  await owner.page.getByRole('button',{name:/^Messaggi/}).click();
  await owner.page.getByRole('dialog').getByRole('list',{name:'Conversazione'}).getByText(messages[0].body,{exact:true}).waitFor();
  await owner.page.getByRole('button',{name:'Chiudi messaggi'}).click();
  ownerLoadError=true;await owner.page.getByRole('button',{name:'Aggiorna',exact:true}).click();
  await owner.page.getByRole('alert').filter({hasText:'Prenotazioni non caricate'}).waitFor();
  await owner.page.getByRole('button',{name:'Riprova',exact:true}).click();await owner.page.getByText('Accettata',{exact:true}).waitFor();
  await pro.page.goto(base+'/#/pro/calendar');await pro.page.getByRole('heading',{name:'Calendario e disponibilità',exact:true}).waitFor();
  const currentMonth=new Date().toISOString().slice(0,7);if(tomorrow.slice(0,7)!==currentMonth)await pro.page.getByRole('button',{name:'Mese successivo'}).click();
  const dayLabel=new Intl.DateTimeFormat('it-IT',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(tomorrow+'T12:00:00Z'));
  await pro.page.getByRole('button',{name:dayLabel+': 1 impegni',exact:true}).click();
  const agenda=pro.page.getByRole('region',{name:'Impegni del giorno'});await agenda.getByText(notes,{exact:true}).waitFor();await agenda.getByText('Accettata',{exact:true}).waitFor();
  assert.ok(await owner.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await pro.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await owner.context.close();await pro.context.close();

  const signup=await setup();await signup.page.goto(base+profilePath);await signup.page.getByRole('button',{name:'Richiedi prenotazione',exact:true}).click();
  await signup.page.getByRole('button',{name:'Registrati',exact:true}).last().click();await signup.page.getByRole('heading',{name:'Crea il tuo account',exact:true}).waitFor();
  assert.equal(new URLSearchParams(signup.page.url().split('?')[1]).get('next'),profilePath+'?booking=1');
  await signup.page.getByLabel('Nome e cognome',{exact:true}).fill('Proprietario di prova');await signup.page.getByLabel('Email',{exact:true}).fill('owner@example.invalid');await signup.page.getByLabel('Telefono',{exact:true}).fill('+390000000000');await signup.page.getByLabel('Password',{exact:true}).fill('Synthetic-only-password');
  await signup.page.getByRole('button',{name:'Continua: il tuo cane',exact:true}).click();await signup.page.getByLabel('Nome del cane',{exact:true}).fill('Cane di prova');await signup.page.getByPlaceholder('Razza, es. Rottweiler').fill('meticcio');await signup.page.getByRole('button',{name:/Meticcio \/ altra razza/}).click();
  signup.page.once('dialog',d=>d.accept());await signup.page.getByRole('button',{name:'Crea account',exact:true}).click();await signup.page.getByRole('heading',{name:'Bentornato'}).waitFor();
  assert.equal(requests.at(-1).body.data.role,'owner');assert.equal(new URLSearchParams(signup.page.url().split('?')[1]).get('next'),profilePath+'?booking=1');
  await login(signup.page);await signup.page.getByRole('dialog',{name:'Richiedi prenotazione'}).waitFor();assert.equal(rows.length,1,'Registration must not create another request');await signup.context.close();

  for(const next of ['https://example.invalid','//example.invalid','/admin',profilePath+'?booking=1&unsafe=true']) {
    const bad=await setup();await bad.page.goto(base+'/#/signin?next='+encodeURIComponent(next));await login(bad.page);await bad.page.waitForURL(base+'/#/owner');await bad.context.close();
  }
  assert.deepEqual(errors,[]);
  console.log('OK: ospite → accesso/registrazione → professionista scelto → richiesta con note; risposta con retry idempotente, accettazione, lettura proprietario, calendario e recupero errore. Nessuna destinazione esterna accettata. API condivise simulate; nessun account, appuntamento o messaggio reale creato.');
} finally { await browser.close(); }
