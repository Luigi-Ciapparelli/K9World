// Actual admin page and Supabase client, synthetic APIs only. No real approvals.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5240';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const admin = 'ad000000-0000-0000-0000-000000000001';
const pro = 'ad000000-0000-0000-0000-000000000002';
const errors = [];
let debug;
async function setup(width, role = 'admin') {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'it-IT', serviceWorkers: 'block' });
  const user = { id: admin, email: 'admin@example.invalid', aud: 'authenticated', role: 'authenticated' };
  await context.addInitScript(session => localStorage.setItem('sb-pc-home-test-auth-token', JSON.stringify(session)), { access_token: 'synthetic', refresh_token: 'synthetic-refresh', expires_at: 4102444800, token_type: 'bearer', user });
  const state = { admissionMode: 'ok', admissionWrites: [], credentials: [{ id: 'qualification-one', title: 'Qualifica educatrice', issuer_name: 'CSEN', version: 'version-one', revision: 1 }], confirmed: true, writes: [], reads: [], mode: 'ok', pending: [], row: { id: pro, business_name: 'Centro di prova', approved: false, approval_status: 'pending', admin_notes: 'Controllo già svolto', rejection_reason: null, zone_text: 'Rimini' } };
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === new URL(base).origin) return route.continue();
    if (url.hostname !== 'pc-home-test.supabase.co') return route.abort();
    const name = url.pathname.split('/').at(-1);
    let data = [];
    if (name === 'profiles') {
      const p = { ...user, full_name: 'Admin di prova', role, email_verified: true };
      data = url.searchParams.get('id') === 'eq.' + admin ? p : [p, { id: pro, full_name: 'Anna Educatrice', email: 'educatrice@example.invalid' }];
    }
    if (name === 'user') data = user;
    if (name === 'professionals') {
      const single = url.searchParams.get('id') === 'eq.' + pro;
      const mode = single ? state.reads.shift() : null;
      if (mode === 'hang') { state.pending.push(route); return; }
      if (mode === 'fail') return route.fulfill({ status: 403, json: { code: '42501', message: 'Synthetic failure' } });
      data = mode === 'missing' ? null : mode === 'malformed' ? { id: pro, approval_status: {} } : single ? state.row : [state.row];
    }
    if (name === 'admin_get_trainer_admission' && state.admissionMode === 'missing') return route.fulfill({status:404,json:{message:'Missing RPC'}});
    if (name === 'admin_get_trainer_admission') data = { required: true, token: 'a'.repeat(32), identity: { name: 'Anna Educatrice', email: 'educatrice@example.invalid', email_verified: state.confirmed, listing_type: 'individual' }, credentials: state.credentials };
    if (name === 'admin_approve_trainer') {
      const input = req.postDataJSON(); state.admissionWrites.push(input);
      if (state.admissionMode === 'stale') return route.fulfill({status:409,json:{code:'40001',message:'Dati cambiati'}});
      state.row = {...state.row,approved:true,approval_status:'approved',admin_notes:input.p_admin_notes,rejection_reason:null};
      return route.fulfill({status:204,body:''});
    }
    if (name === 'admin_set_professional_approval') {
      const input = req.postDataJSON(); state.writes.push(input);
      if (state.mode === 'denied') return route.fulfill({ status: 403, json: { code: '42501', message: 'Private database detail' } });
      if (state.mode === 'fail') return route.abort('failed');
      if (state.mode !== 'noop') state.row = { ...state.row, approval_status: input.new_approval_status, approved: input.new_approval_status === 'approved', admin_notes: input.new_admin_notes, rejection_reason: input.new_rejection_reason };
      if (state.mode === 'hang') { state.pending.push(route); return; }
      return route.fulfill({ status: 204, body: '' });
    }
    if (name === 'logout') return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ status: 200, json: data });
  });
  const page = await context.newPage(); debug = page; page.setDefaultTimeout(8000); page.on('pageerror', e => errors.push(e.message));
  await page.clock.install();
  await page.goto(base + '/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const row = page.getByRole('row').filter({ hasText: 'Anna Educatrice' });
  if (role === 'admin') await row.waitFor();
  return { context, page, row, state, dialog: page.getByRole('dialog') };
}
try {
  for (const width of [1440,390]) {
    const t=await setup(width),{page,row,state,dialog}=t;
    const open=async()=>{await row.getByRole('button',{name:'Approva',exact:true}).click();await dialog.getByText('Ammissione ai servizi di addestramento',{exact:true}).waitFor();};
    state.credentials=[];await open();
    await dialog.getByRole('alert').filter({hasText:'Manca una qualifica'}).waitFor();
    assert.ok(await dialog.getByRole('button',{name:'Conferma approvazione'}).isDisabled());
    await dialog.getByRole('button',{name:'Annulla',exact:true}).click();
    state.credentials=[{id:'qualification-one',title:'Qualifica educatrice',issuer_name:'CSEN',version:'version-one',revision:1}];state.confirmed=false;
    await open();assert.ok(await dialog.getByRole('button',{name:'Conferma approvazione'}).isDisabled());
    await dialog.getByRole('alert').filter({hasText:'confermare l’email'}).waitFor();
    await dialog.getByRole('button',{name:'Annulla',exact:true}).click();
    state.confirmed=true;await open();
    assert.equal(await dialog.getByLabel('Nome e cognome del titolare della qualifica',{exact:false}).inputValue(),'Anna Educatrice');
    await dialog.getByLabel('Qualifica controllata',{exact:false}).selectOption('qualification-one');
    await dialog.getByLabel('Riscontro privato della verifica',{exact:false}).fill('Registro sintetico e identità del referente controllati.');
    assert.ok(await dialog.getByRole('button',{name:'Conferma approvazione'}).isDisabled());
    await dialog.getByRole('checkbox').nth(0).check();await dialog.getByRole('checkbox').nth(1).check();
    assert.ok(await dialog.getByRole('button',{name:'Conferma approvazione'}).isEnabled());
    if(process.env.PC_SCREENSHOT_DIR){await fs.mkdir(process.env.PC_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:`${process.env.PC_SCREENSHOT_DIR}/admission-${width}.png`});}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0 && bounds.width<=width);
    // The server can invalidate a qualification after the administrator opens the form.
    state.admissionMode='stale';await dialog.getByRole('button',{name:'Conferma approvazione'}).click();
    await dialog.getByRole('alert').filter({hasText:'Esito non confermato'}).waitFor();
    assert.equal(state.writes.length,0);assert.equal(state.admissionWrites.length,1);
    await dialog.getByRole('button',{name:'Verifica esito',exact:true}).click();
    await dialog.getByRole('status').filter({hasText:'Stato attuale: In attesa'}).waitFor();
    assert.equal(state.admissionWrites.length,1);
    await dialog.getByRole('button',{name:'Chiudi',exact:true}).click();
    state.admissionMode='ok';await open();
    await dialog.getByLabel('Qualifica controllata',{exact:false}).selectOption('qualification-one');
    await dialog.getByLabel('Riscontro privato della verifica',{exact:false}).fill('Nuovo controllo sintetico del registro e del referente.');
    await dialog.getByRole('checkbox').nth(0).check();await dialog.getByRole('checkbox').nth(1).check();
    await dialog.getByRole('button',{name:'Conferma approvazione'}).click();
    await dialog.getByRole('status').filter({hasText:'Decisione registrata'}).waitFor();
    assert.equal(state.writes.length,0);assert.equal(state.admissionWrites.length,2);
    assert.equal(state.admissionWrites[1].p_authority,'CSEN');assert.equal(state.admissionWrites[1].p_credential_id,'qualification-one');
    await dialog.getByRole('button',{name:'Chiudi',exact:true}).click();
    state.admissionMode='missing';await row.getByRole('button',{name:'Approva',exact:true}).click();
    await dialog.getByRole('alert').filter({hasText:'requisiti attuali'}).waitFor();
    assert.equal(await dialog.getByRole('button',{name:'Conferma approvazione'}).count(),0);
    await t.context.close();
  }
  assert.deepEqual(errors,[]);
  console.log('OK: qualifica/email mancanti, riscontri obbligatori, revoca prima della conferma, nessun ripiego alla vecchia RPC, API assente; desktop/mobile, API sintetiche.');
} catch(error) {
  if(debug&&!debug.isClosed()) console.error((await debug.locator('body').innerText()).slice(-5000));
  throw error;
} finally {await browser.close();}
