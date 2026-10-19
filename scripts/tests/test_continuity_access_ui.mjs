// Real browser and SDK with synthetic API only. No real account or private data.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5239';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const id = n => `ac200000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const now = Date.parse('2026-10-19T12:00:00Z');
const errors = [];
let debugPage;
async function setup(width, duration = 3600000, role = 'professional') {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, timezoneId: 'America/New_York', locale: 'it-IT', serviceWorkers: 'block' });
  const user = { id: id(1), email: 'reader@example.invalid', aud: 'authenticated', role: 'authenticated' };
  await context.addInitScript(s => localStorage.setItem('sb-pc-home-test-auth-token', JSON.stringify(s)), { access_token: 'synthetic', refresh_token: 'synthetic-refresh', expires_in: 3600, expires_at: 4102444800, token_type: 'bearer', user });
  const grant = { grant_id: id(2), dog_name: 'Rex di prova', professional_name: 'Anna Educatrice', purpose: 'Continuità di prova', created_at: '2026-10-18T12:00:00Z', expires_at: new Date(now + duration).toISOString(), revoked_at: null, revocation_reason: null, is_current: true, selected_count: 21, available_count: 21, total_count: 1 };
  const note = n => ({ publication_id: id(n + 10), note_id: id(n + 40), revision_number: 1, dog_name: 'Rex di prova', author_name: 'Autore di prova', activity: `Attività ${n}`, occurred_at: '2026-10-18T10:30:00Z', body: `Contributo riservato ${n}.`, shared_at: '2026-10-18T12:00:00Z', total_count: 21 });
  const control = { reads: [], lists: [], pending: [], calls: [] };
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === new URL(base).origin) return route.continue();
    if (url.hostname !== 'pc-home-test.supabase.co') return route.abort();
    const name = url.pathname.split('/').at(-1), input = req.method() === 'POST' ? req.postDataJSON() : {};
    control.calls.push({ name, input });
    let data = [];
    if (name === 'profiles') data = { ...user, role, full_name: 'Anna Educatrice', email_verified: true };
    if (name === 'user') data = user;
    if (name === 'professionals') data = { id: user.id, listing_type: 'individual', approved: true };
    if (name === 'dogs') data = [{ id: id(3), name: 'Rex di prova' }];
    if (name === 'list_owner_continuity_recipients') data = [{ relationship_id: id(4), professional_name: 'Educatrice destinataria' }];
    if (name === 'list_owner_continuity_publications') data = [{ ...note(1), total_count: 1 }];
    if (name === 'list_my_continuity_notes') data = [{ ...note(1), publication_id: null, can_publish: true, total_count: 1 }];
    if (name === 'logout') return route.fulfill({ status: 204, body: '' });
    if (name === 'list_my_continuity_grants' || name === 'read_received_continuity_notes') {
      const mode = (name === 'list_my_continuity_grants' ? control.lists : control.reads).shift();
      if (mode === 'hang') { control.pending.push(route); return; }
      if (mode === 'denied') return route.fulfill({ status: 403, json: { code: '42501' } });
      if (mode === 'fail') return route.fulfill({ status: 503, json: { message: 'Synthetic outage' } });
      if (mode === 'malformed') return route.fulfill({ json: { unexpected: true } });
      if (mode === 'badrow') return route.fulfill({ json: [{ ...note(1), body: { unexpected: true } }] });
      if (mode === 'empty') data = [];
      else data = name === 'list_my_continuity_grants' ? [grant] : input.p_offset ? [note(21)] : Array.from({ length: 20 }, (_, n) => note(n + 1));
    }
    await route.fulfill({ status: 200, json: data });
  });
  const page = await context.newPage(); debugPage = page;
  page.setDefaultTimeout(8000); page.on('pageerror', e => errors.push(e.message));
  await page.clock.install({ time: new Date(now) });
  await page.goto(base + (role === 'professional' ? '/pro/archive' : '/owner/relationships'));
  const open = async () => { await page.getByRole('button', { name: 'Leggi lo storico autorizzato', exact: true }).click(); await page.getByRole('dialog').getByText('Contributo riservato 1.', { exact: true }).waitFor(); };
  const dialog = page.getByRole('dialog');
  return { page, context, control, grant, note, open, dialog };
}
try {
  for (const width of [1440, 390]) {
    const t = await setup(width), { page, control, dialog } = t;
    await t.open();
    control.reads.push('hang');
    await Promise.all([page.waitForRequest(r => r.url().endsWith('/read_received_continuity_notes')), page.clock.fastForward(30000)]);
    await page.clock.fastForward(16000);
    assert.equal(await dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0, 'Hung revalidation must remove stale shared notes');
    if (process.env.PC_BASELINE) { console.log('BASELINE unexpectedly passed'); break; }
    await dialog.getByRole('alert').waitFor();
    assert.equal(await dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).isEnabled(), true);
    await dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).click();
    await dialog.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    // A hidden tab discards notes and suspends polling; resuming requires a fresh read.
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.equal(await dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
    const before = control.calls.filter(c => c.name === 'read_received_continuity_notes').length;
    await page.clock.fastForward(31000);
    assert.equal(control.calls.filter(c => c.name === 'read_received_continuity_notes').length, before);
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
    await dialog.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await dialog.getByRole('alert').getByText(/Connessione assente/).waitFor();
    assert.equal(await dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await dialog.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'Successive' }).click();
    await dialog.getByText('Contributo riservato 21.', { exact: true }).waitFor();
    assert.equal(await dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
    await dialog.getByRole('button', { name: 'Precedenti' }).click();
    await dialog.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    for (const mode of ['denied', 'fail', 'malformed', 'badrow']) {
      control.reads.push(mode);
      await dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(await dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
      assert.equal(await dialog.getByText(/Nessun contributo consultabile/).count(), 0);
      await dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).click();
      await dialog.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    }
    // A local revocation/publication event must refresh the open reader too.
    control.reads.push('denied');
    await page.evaluate(() => window.dispatchEvent(new Event('pc-continuity-sharing-changed')));
    await dialog.getByRole('alert').waitFor();
    assert.equal(await dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
    await dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).click();
    await dialog.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]).includes('Contributo riservato')), false);
    // Closing and signing out must discard the reader; late response cannot restore it.
    control.reads.push('hang');
    await Promise.all([page.waitForRequest(r => r.url().endsWith('/read_received_continuity_notes')), dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).click()]);
    await dialog.getByRole('button', { name: 'Chiudi storico' }).click();
    await page.evaluate(async () => { const { supabase } = await import('/src/lib/supabase.ts'); await supabase.auth.signOut({ scope: 'local' }); });
    for (const route of control.pending) await route.fulfill({ json: [t.note(1)] }).catch(() => {});
    assert.equal(await page.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
    await t.context.close(); console.log(`OK: ${width}px, timeout/retry, pagination, revocation, malformed responses, local events, logout and private storage.`);
  }
  if (!process.env.PC_BASELINE) {
    const t = await setup(1440, 20000);
    await t.open();
    await t.page.clock.fastForward(21000);
    await t.dialog.getByText(/autorizzazione è scaduta/).waitFor();
    assert.equal(await t.dialog.getByText('Contributo riservato 1.', { exact: true }).count(), 0);
    assert.equal(await t.dialog.getByRole('button', { name: 'Aggiorna accesso e contributi' }).isDisabled(), true);
    await t.context.close();
    const u = await setup(390);
    await u.open(); await u.dialog.getByRole('button', { name: 'Chiudi storico' }).click();
    for (const mode of ['hang', 'malformed', 'badrow']) {
      u.control.lists.push(mode);
      await Promise.all([u.page.waitForRequest(r => r.url().endsWith('/list_my_continuity_grants')), u.page.getByRole('button', { name: 'Aggiorna autorizzazioni', exact: true }).click()]);
      if (mode === 'hang') await u.page.clock.fastForward(16000);
      await u.page.getByRole('alert').waitFor();
      assert.equal(await u.page.getByText(/Nessuna autorizzazione in questa pagina/).count(), 0);
      await u.page.getByRole('button', { name: 'Aggiorna autorizzazioni', exact: true }).click();
      await u.page.getByRole('button', { name: 'Leggi lo storico autorizzato', exact: true }).waitFor();
    }
    await u.context.close();
    const author = await setup(1440);
    await author.page.getByRole('button', { name: 'Condividi il tuo lavoro', exact: true }).click();
    await author.page.getByText('Rex di prova · Attività 1', { exact: true }).waitFor();
    assert.equal(await author.page.getByRole('button', { name: 'Prepara per lo storico', exact: true }).isEnabled(), true);
    await author.context.close();
    const owner = await setup(390, 3600000, 'owner');
    await owner.page.getByLabel('Scegli il cane').waitFor();
    await owner.page.getByText('Leggi il contributo da autorizzare', { exact: true }).click();
    await owner.page.getByText('Contributo riservato 1.', { exact: true }).waitFor();
    await owner.page.getByLabel('Professionista destinatario').selectOption(id(4));
    assert.equal(await owner.page.getByLabel('Professionista destinatario').inputValue(), id(4));
    await owner.context.close();
    assert.deepEqual(errors, []);
    console.log('OK: expiry independent of polling; lists recover from timeout/malformed responses. Synthetic APIs; no online permission test.');
  }
} catch (error) {
  if (debugPage && !debugPage.isClosed()) console.error(await debugPage.locator('body').innerText());
  throw error;
} finally { await browser.close(); }
