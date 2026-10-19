// Real browser/SDK, synthetic API only. No real account, backend or note.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5238';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const id = n => `ac190000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const errors = [];
let debugPage;
async function setup(width) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, timezoneId: 'America/New_York', locale: 'it-IT', serviceWorkers: 'block' });
  let user = { id: id(1), email: 'synthetic@example.invalid', aud: 'authenticated', role: 'authenticated' };
  const session = () => ({ access_token: 'synthetic', refresh_token: 'synthetic-refresh', expires_in: 3600, expires_at: 4102444800, token_type: 'bearer', user });
  await context.addInitScript(s => localStorage.setItem('sb-pc-home-test-auth-token', JSON.stringify(s)), session());
  const relationship = { id: id(2), dog_name: 'Rex di prova', professional_name: 'Anna Educatrice', status: 'active', authorized_at: '2026-01-01T08:00:00Z', accepted_at: '2026-01-01T08:00:00Z', ended_at: null, revoked_at: null };
  const control = { modes: [], archive: [], visible: false }, calls = [], sessions = new Map();
  let revisions = [];
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === new URL(base).origin) return route.continue();
    if (url.hostname !== 'pc-home-test.supabase.co') return route.abort();
    const name = url.pathname.split('/').at(-1), input = req.method() === 'POST' ? req.postDataJSON() : {};
    calls.push({ name, input });
    let data = [];
    if (name === 'profiles') data = { ...user, role: 'professional', full_name: 'Anna Educatrice', email_verified: true };
    if (name === 'user') data = user;
    if (name === 'professionals') data = { id: user.id, listing_type: 'individual', approved: true };
    if (name === 'logout') return route.fulfill({ status: 204, body: '' });
    if (name === 'token') { user = { ...user, id: input.email.startsWith('other') ? id(9) : id(1) }; data = session(); }
    if (name === 'list_my_dog_relationships') data = [{ ...relationship }];
    if (name === 'list_professional_note_revisions_v2') {
      const mode = control.archive.shift();
      if (mode === 'fail') return route.fulfill({ status: 503, json: { message: 'Synthetic outage' } });
      if (mode === 'malformed') return route.fulfill({ json: { unexpected: true } });
      if (mode === 'hang') return;
      data = control.visible ? revisions : [];
    }
    if (name === 'record_professional_session') {
      const mode = control.modes.shift();
      if (mode === 'reject' || mode === 'denied') return route.fulfill({ status: 400, json: { code: mode === 'reject' ? '22023' : '42501' } });
      if (!sessions.has(input.p_request_id)) {
        sessions.set(input.p_request_id, input);
        revisions.unshift({ session_id: input.p_request_id, note_id: id(sessions.size + 10), dog_name: relationship.dog_name, author_name: 'Anna Educatrice', activity: input.p_activity, occurred_at: input.p_occurred_at, revision_number: 1, body: input.p_body, change_reason: null, revision_created_at: '2026-11-01T12:00:00Z', can_revise: true });
      } else assert.deepEqual(input, sessions.get(input.p_request_id), 'Retries retain exact payload');
      if (mode === 'lost') return route.fulfill({ status: 503, json: { message: 'Lost after commit' } });
      if (mode === 'wrong') return route.fulfill({ json: id(99) });
      if (mode === 'hang') return;
      data = input.p_request_id;
    }
    if (name === 'revise_own_professional_note') {
      const latest = revisions.find(r => r.note_id === input.p_note_id);
      if (latest.revision_number !== input.p_expected_revision) return route.fulfill({ status: 409, json: { code: '40001' } });
      revisions.unshift({ ...latest, revision_number: latest.revision_number + 1, body: input.p_body, change_reason: input.p_reason });
      data = latest.revision_number + 1;
    }
    await route.fulfill({ status: 200, json: data });
  });
  const page = await context.newPage(); debugPage = page; page.setDefaultTimeout(10000); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.clock.install({ time: new Date('2026-11-01T12:00:00Z') });
  await page.goto(base + '/pro/archive');
  const open = async () => { await page.getByRole('button', { name: /^(Registra sessione|Verifica registrazione)$/ }).click(); await page.getByRole('heading', { name: 'Nuova sessione · Rex di prova' }).waitFor(); };
  const fill = async (text = 'Due zampe sulla pedana.') => {
    await page.getByLabel('Attività', { exact: true }).fill('Shaping della pedana');
    await page.getByRole('textbox', { name: /^Nota privata/ }).fill(text);
    await page.getByLabel(/Data e ora dell’attività/).fill('2026-10-18T12:30');
  };
  const sends = () => calls.filter(c => c.name === 'record_professional_session');
  return { page, context, control, calls, relationship, sessions, open, fill, sends };
}
try {
  for (const width of [1440, 390]) {
    const t = await setup(width), { page, control } = t;
    await t.open(); await t.fill(); control.modes.push('reject');
    await page.getByRole('button', { name: 'Registra sessione e nota', exact: true }).click();
    await page.getByRole('alert').getByText(/Controlla i dati inseriti/).waitFor();
    assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).isEnabled(), true, 'Explicit rejection must allow correcting the note');
    await page.getByRole('textbox', { name: /^Nota privata/ }).fill('Testo corretto e privato.');
    control.modes.push('lost'); await page.getByRole('button', { name: 'Registra sessione e nota', exact: true }).evaluate(b => { b.click(); b.click(); });
    await page.getByRole('alert').getByText(/Esito non confermato/).waitFor();
    assert.equal(t.sends().length, 2); assert.equal(t.sessions.size, 1);
    assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).isDisabled(), true);
    await page.getByRole('button', { name: 'Chiudi modulo', exact: true }).click(); await t.open();
    assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).inputValue(), 'Testo corretto e privato.');
    if (process.env.PC_SCREENSHOTS) { await mkdir(process.env.PC_SCREENSHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.PC_SCREENSHOTS}/archivio-recupero-${width}.png`, fullPage: true }); }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Riprova lo stesso invio', exact: true }).click();
    await page.getByText('Sessione e nota privata registrate.', { exact: true }).waitFor();
    assert.deepEqual(t.sends()[1].input, t.sends()[2].input); assert.notEqual(t.sends()[0].input.p_request_id, t.sends()[1].input.p_request_id);
    assert.equal(t.sends()[1].input.p_occurred_at, '2026-10-18T10:30:00.000Z');
    // Confirm from authenticated archive even when the relationship is now closed.
    await t.open(); await t.fill('Nota conservata prima della revoca.'); control.modes.push('lost');
    await page.getByRole('button', { name: 'Registra sessione e nota', exact: true }).click(); await page.getByRole('alert').getByText(/Esito non confermato/).waitFor();
    await page.getByRole('button', { name: 'Chiudi modulo', exact: true }).click();
    t.relationship.status = 'revoked'; t.relationship.revoked_at = '2026-11-01T12:00:00Z';
    await page.getByRole('button', { name: 'Aggiorna', exact: true }).click(); await t.open();
    control.modes.push('denied'); await page.getByRole('button', { name: 'Riprova lo stesso invio', exact: true }).click(); await page.getByRole('alert').getByText(/Esito non confermato/).waitFor();
    assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).isDisabled(), true);
    control.visible = true; await page.getByRole('button', { name: 'Controlla registrazione nell’archivio' }).click();
    await page.getByText('Registrazione confermata nell’archivio. La sessione e la nota sono già presenti.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Verifica registrazione' }).count(), 0); assert.equal(t.sessions.size, 2);
    // The original and rectification remain separate; stale revisions cannot overwrite.
    await page.getByRole('button', { name: 'Rettifica da questa revisione' }).first().click();
    await page.getByLabel('Nota corretta').fill('Nota rettificata.'); await page.getByLabel('Motivo della rettifica').fill('Precisazione osservazione.');
    await page.getByRole('button', { name: 'Salva rettifica', exact: true }).click();
    await page.getByText('Nota rettificata.', { exact: true }).waitFor(); await page.getByText('Nota conservata prima della revoca.', { exact: true }).waitFor();
    await page.getByRole('article').filter({ has: page.getByText('Nota conservata prima della revoca.', { exact: true }) }).getByRole('button', { name: 'Rettifica da questa revisione' }).click();
    await page.getByLabel('Nota corretta').fill('Conserva questo testo al conflitto.'); await page.getByLabel('Motivo della rettifica').fill('Prova conflitto.');
    await page.getByRole('button', { name: 'Salva rettifica', exact: true }).click(); await page.getByRole('alert').getByText(/revisione più recente/).waitFor();
    assert.equal(await page.getByLabel('Nota corretta').inputValue(), 'Conserva questo testo al conflitto.');
    await t.context.close(); console.log(`OK: ${width}px, rejection, double click, lost response, same retry, Italian time, revocation, archive confirmation and revision conflict.`);
  }
  const t = await setup(1440), { page, control } = t;
  await t.open(); await t.fill();
  await page.getByLabel(/Data e ora dell’attività/).fill('2026-03-29T02:30');
  await page.getByRole('button', { name: 'Registra sessione e nota', exact: true }).click(); await page.getByText(/Data o ora non valida/).waitFor(); assert.equal(t.sends().length, 0);
  await page.getByLabel(/Data e ora dell’attività/).fill('2026-10-25T02:30'); await page.getByLabel('Quale orario del cambio ora?').selectOption('2026-10-25T01:30:00.000Z');
  control.modes.push('wrong'); await page.getByRole('button', { name: 'Registra sessione e nota', exact: true }).click(); await page.getByRole('alert').getByText(/Esito non confermato/).waitFor();
  await page.getByRole('button', { name: 'Riprova lo stesso invio' }).click(); await page.getByText('Sessione e nota privata registrate.', { exact: true }).waitFor();
  assert.equal(t.sends()[0].input.p_occurred_at, '2026-10-25T01:30:00.000Z');
  await t.open(); await t.fill('Nota da recuperare dopo navigazione.'); control.modes.push('hang');
  await Promise.all([page.waitForRequest(r => r.url().endsWith('/record_professional_session')), page.getByRole('button', { name: 'Registra sessione e nota', exact: true }).click()]);
  await page.clock.fastForward(16000); await page.getByRole('alert').getByText(/Esito non confermato/).waitFor();
  await page.evaluate(() => { location.hash = '/impara'; }); await page.getByRole('heading', { name: 'Relazioni e archivio', exact: true }).waitFor({ state: 'hidden' });
  await page.evaluate(() => { location.hash = '/pro/archive'; }); await t.open();
  assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).inputValue(), 'Nota da recuperare dopo navigazione.');
  assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).isDisabled(), true);
  control.archive.push('fail', 'malformed', 'hang');
  for (let n = 0; n < 3; n++) {
    await Promise.all([page.waitForRequest(r => r.url().endsWith('/list_professional_note_revisions_v2')), page.getByRole('button', { name: 'Controlla registrazione nell’archivio' }).click()]);
    if (n === 2) await page.clock.fastForward(16000);
    await page.getByRole('alert').getByText(/Impossibile caricare l’archivio/).waitFor();
    assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).inputValue(), 'Nota da recuperare dopo navigazione.');
  }
  const storage = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
  assert.ok(!storage.includes('Nota da recuperare') && !storage.includes('Shaping della pedana'));
  // Real SDK sign-out/account change clears private retries, including a login of the same person.
  await page.evaluate(async () => { const { supabase } = await import('/src/lib/supabase.ts'); await supabase.auth.signOut({ scope: 'local' }); });
  assert.equal(await page.evaluate(async () => { const m = await import('/src/lib/continuityRecording.ts'); return !!m.getPendingSession('ac190000-0000-0000-0000-000000000001', 'ac190000-0000-0000-0000-000000000002'); }), false);
  await page.evaluate(async () => { const { supabase } = await import('/src/lib/supabase.ts'); const result = await supabase.auth.signInWithPassword({ email: 'synthetic@example.invalid', password: 'synthetic' }); if(result.error) throw result.error; });
  await page.locator('a.pc-account-link').first().filter({ hasText: 'Anna Educatrice' }).waitFor({ state: 'attached' });
  await page.evaluate(() => { location.hash = '/pro/archive'; });
  await t.open(); assert.equal(await page.getByRole('textbox', { name: /^Nota privata/ }).inputValue(), '');
  await t.context.close(); assert.deepEqual(errors, []);
  console.log('OK: DST, invalid response, timeout, navigation, failed/malformed/hung archive, no private browser storage, logout and same-account login. Synthetic API only.');
} catch (error) {
  if (debugPage && !debugPage.isClosed()) console.error(await debugPage.locator('body').innerText());
  throw error;
} finally { await browser.close(); }
