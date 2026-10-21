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
  const state = { writes: [], reads: [], mode: 'ok', pending: [], row: { id: pro, business_name: 'Centro di prova', approved: false, approval_status: 'pending', admin_notes: 'Controllo già svolto', rejection_reason: null, zone_text: 'Rimini' } };
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
    if (name === 'admin_get_trainer_admission') data = { required: false, token: 'a'.repeat(32), identity: { name: 'Anna Educatrice', email: 'educatrice@example.invalid', email_verified: true, listing_type: 'individual' }, credentials: [] };
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
  if (process.env.PC_BASELINE) {
    const t = await setup(1440); t.page.on('dialog', d => d.dismiss());
    await Promise.all([t.page.waitForResponse(r => r.url().includes('admin_set_professional_approval')), t.row.getByRole('button', { name: 'Reject', exact: true }).click()]);
    assert.equal(t.state.writes.length, 0, 'Cancel must not reject a professional');
  } else {
    for (const width of [1440, 390]) {
      const t = await setup(width), { page, row, state, dialog } = t;
      const open = async label => {
        await row.getByRole('button', { name: label, exact: true }).click();
        await dialog.getByLabel('Note di amministrazione').waitFor();
      };
      await open('Rifiuta');
      assert.equal(await dialog.getByLabel('Note di amministrazione').inputValue(), 'Controllo già svolto');
      assert.ok(await dialog.getByRole('button', { name: 'Conferma rifiuto' }).isDisabled());
      if (process.env.PC_SCREENSHOT_DIR) {
        await fs.mkdir(process.env.PC_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: `${process.env.PC_SCREENSHOT_DIR}/approval-${width}.png` });
      }
      await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
      assert.equal(state.writes.length, 0);
      await open('Approva'); await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 0); assert.equal(state.writes.length, 0);
      // Opening and confirming a decision both check current notes.
      state.row.admin_notes = 'Controllo più recente';
      await open('Approva');
      assert.equal(await dialog.getByLabel('Note di amministrazione').inputValue(), 'Controllo più recente');
      state.row.admin_notes = 'Nota modificata da un altro controllo';
      await dialog.getByRole('button', { name: 'Conferma approvazione' }).click();
      await dialog.getByRole('alert').filter({ hasText: 'Lo stato o le note sono cambiati' }).waitFor();
      assert.equal(state.writes.length, 0);
      assert.equal(await dialog.getByLabel('Note di amministrazione').inputValue(), state.row.admin_notes);
      await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
      await open('Rifiuta');
      await dialog.getByLabel('Motivo del rifiuto').fill('   ');
      assert.ok(await dialog.getByRole('button', { name: 'Conferma rifiuto' }).isDisabled());
      await dialog.getByLabel('Motivo del rifiuto').fill('Completa le informazioni richieste.');
      state.reads.push('fail');
      await dialog.getByRole('button', { name: 'Conferma rifiuto' }).click();
      await dialog.getByRole('alert').filter({ hasText: 'Nessuna decisione inviata' }).waitFor();
      assert.equal(state.writes.length, 0);
      await dialog.getByRole('button', { name: 'Riprova caricamento' }).click();
      await dialog.getByLabel('Motivo del rifiuto').waitFor();
      assert.equal(await dialog.getByLabel('Motivo del rifiuto').inputValue(), 'Completa le informazioni richieste.');
      state.mode = 'hang';
      await Promise.all([page.waitForRequest(r => r.url().endsWith('/admin_set_professional_approval')), dialog.getByRole('button', { name: 'Conferma rifiuto' }).click()]);
      assert.ok(await dialog.getByRole('button', { name: 'Registrazione in corso…' }).isDisabled());
      // Two extra submit events and Escape during sending must not duplicate it.
      await dialog.locator('form').evaluate(form => { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
      await page.keyboard.press('Escape'); assert.equal(await dialog.count(), 1);
      assert.equal(state.writes.length, 1); assert.equal(state.writes[0].new_admin_notes, state.row.admin_notes);
      await page.clock.fastForward(16000);
      await dialog.getByRole('alert').filter({ hasText: 'Esito non confermato' }).waitFor();
      await dialog.getByRole('button', { name: 'Verifica esito', exact: true }).click();
      await dialog.getByRole('status').filter({ hasText: 'Stato attuale: Rifiutato' }).waitFor();
      assert.equal(state.writes.length, 1, 'Reading the result must never resend a mutation');
      await dialog.getByRole('button', { name: 'Chiudi', exact: true }).click();
      await row.getByText('Rifiutato', { exact: true }).waitFor();
      state.mode = 'ok'; await open('Approva');
      await dialog.getByRole('button', { name: 'Conferma approvazione' }).click();
      await dialog.getByRole('status').filter({ hasText: 'Decisione registrata' }).waitFor();
      assert.equal(state.writes.at(-1).new_rejection_reason, null);
      await dialog.getByRole('button', { name: 'Chiudi', exact: true }).click();
      await row.getByText('Approvato', { exact: true }).waitFor();
      for (const mode of ['fail', 'missing', 'malformed', 'hang']) {
        state.reads.push(mode);
        await Promise.all([page.waitForRequest(r => r.url().includes('professionals?') && r.url().includes('id=eq.')), row.getByRole('button', { name: 'Rifiuta', exact: true }).click()]);
        if (mode === 'hang') await page.clock.fastForward(16000);
        await dialog.getByRole('alert').waitFor();
        assert.equal(await dialog.getByRole('button', { name: 'Conferma rifiuto' }).count(), 0);
        await dialog.getByRole('button', { name: 'Riprova caricamento' }).click();
        await dialog.getByLabel('Note di amministrazione').waitFor();
        await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
      }
      state.mode = 'noop'; await open('Rimetti in attesa');
      await dialog.getByRole('button', { name: 'Conferma attesa' }).click();
      await dialog.getByRole('alert').filter({ hasText: 'non corrisponde' }).waitFor();
      await dialog.getByRole('button', { name: 'Chiudi', exact: true }).click();
      state.mode = 'denied'; await open('Rimetti in attesa');
      await dialog.getByRole('button', { name: 'Conferma attesa' }).click();
      await dialog.getByRole('alert').filter({ hasText: 'Esito non confermato' }).waitFor();
      assert.equal(await dialog.getByText('Private database detail', { exact: true }).count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const bounds = await dialog.boundingBox(); assert.ok(bounds.width <= width && bounds.x >= 0);
      await t.context.close();
    }
    const t = await setup(390, 'owner');
    await t.page.getByRole('heading', { name: 'Ciao, Admin.' }).waitFor();
    assert.equal(t.state.writes.length, 0); assert.equal(await t.page.getByRole('button', { name: 'Approva', exact: true }).count(), 0);
    await t.context.close(); assert.deepEqual(errors, []);
    console.log('OK: annullamento senza scritture, note correnti, cambiamenti prima della conferma, motivo obbligatorio, invio singolo, esito incerto, letture errate e falso successo; desktop/mobile. API simulate.');
  }
} catch (error) {
  if (debug && !debug.isClosed()) console.error((await debug.locator('body').innerText()).slice(-5000));
  throw error;
} finally { await browser.close(); }
