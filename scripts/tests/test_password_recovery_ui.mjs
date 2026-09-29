// Exercises the real Supabase JS callback handling against synthetic HTTP responses.
// No production accounts, tokens, mail, or passwords are used.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5197').replace(/\/$/, '');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const uid = 'd0000000-0000-0000-0000-000000000011';
const other = 'd0000000-0000-0000-0000-000000000012';
const storageKey = 'sb-pc-home-test-auth-token';
const markerKey = 'pc-password-recovery-v1';
const errors = [];
function session(id = uid) {
  return { access_token: 'synthetic-recovery-' + id, refresh_token: 'synthetic-refresh-' + id, expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user: { id, email: id === uid ? 'pilot@example.invalid' : 'other@example.invalid', role: 'authenticated', aud: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} } };
}
const authError = (route, status, code) => route.fulfill({ status, headers: { 'x-supabase-api-version': '2024-01-01' }, json: { code, error_code: code, msg: 'Synthetic Auth error' } });
function callback(path = '/reset-password', type = 'recovery') {
  const params = new URLSearchParams({ access_token: session().access_token, refresh_token: session().refresh_token, expires_in: '3600', expires_at: String(session().expires_at), token_type: 'bearer', type });
  return base + path + '#' + params;
}
async function setup({ width = 390, signedIn = null, marker = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: 'block' });
  if (signedIn || marker) await context.addInitScript(({ signedIn, marker, storageKey, markerKey }) => {
    if (sessionStorage.getItem('fixture-initialized')) return;
    sessionStorage.setItem('fixture-initialized', 'true');
    if (signedIn) localStorage.setItem(storageKey, JSON.stringify(signedIn));
    if (marker) sessionStorage.setItem(markerKey, JSON.stringify(marker));
  }, { signedIn, marker, storageKey, markerKey });
  const writes = [];
  let failRecover = false, failUpdate = '', failLogout = false, invalidUser = false, failIdentity = false;
  let currentPassword = 'Old-synthetic-password1';
  await context.route('https://**/*', async route => {
    const req = route.request(), url = new URL(req.url()), name = url.pathname.split('/').at(-1);
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    assert.equal(url.hostname, 'pc-home-test.supabase.co', 'Never call production Supabase');
    const user = session(req.headers().authorization === 'Bearer ' + session(other).access_token ? other : uid).user;
    if (req.method() !== 'GET') writes.push({ name, method: req.method(), body: req.postDataJSON(), url: url.href });
    if (name === 'recover') return failRecover
      ? authError(route, 429, 'over_email_send_rate_limit')
      : route.fulfill({ status: 200, json: {} });
    if (name === 'user') {
      if (invalidUser) return authError(route, 401, 'bad_jwt');
      if (failIdentity && req.method() === 'GET') { failIdentity = false; return authError(route, 408, 'request_timeout'); }
      if (req.method() === 'PUT') {
        if (failUpdate) { const code = failUpdate; failUpdate = ''; return authError(route, 422, code); }
        currentPassword = req.postDataJSON().password;
      }
      return route.fulfill({ status: 200, json: user });
    }
    if (name === 'logout') {
      if (failLogout) { failLogout = false; return authError(route, 400, 'unexpected_failure'); }
      return route.fulfill({ status: 204, body: '' });
    }
    if (name === 'token') return req.postDataJSON().password === currentPassword
      ? route.fulfill({ status: 200, json: session() })
      : authError(route, 400, 'invalid_credentials');
    if (name === 'profiles') return route.fulfill({ status: 200, json: { ...user, full_name: 'Utente di prova', role: 'owner', email_verified: true } });
    await route.fulfill({ status: 200, json: [] });
  });
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  return { page, context, writes, failRecover: () => { failRecover = true; }, failUpdate: code => { failUpdate = code; }, failLogout: () => { failLogout = true; }, invalidUser: () => { invalidUser = true; }, failIdentity: () => { failIdentity = true; } };
}
const form = page => page.getByRole('heading', { name: 'Scegli una nuova password', exact: true });
const passwords = async (page, first = 'New-synthetic-password2', second = first) => {
  await page.getByLabel('Nuova password', { exact: true }).fill(first);
  await page.getByLabel('Ripeti la nuova password', { exact: true }).fill(second);
};
try {
  const request = await setup();
  await request.page.goto(base + '/#/signin');
  await request.page.getByRole('button', { name: 'Password dimenticata?' }).click();
  await request.page.waitForURL(base + '/forgot-password');
  await request.page.getByLabel('Email del tuo account').fill('missing@example.invalid');
  await request.page.getByRole('button', { name: 'Invia il link di recupero' }).click();
  await request.page.getByRole('status').filter({ hasText: 'Se l’indirizzo corrisponde' }).waitFor();
  const recover = request.writes.find(w => w.name === 'recover');
  assert.equal(recover.body.email, 'missing@example.invalid');
  assert.equal(new URL(recover.url).searchParams.get('redirect_to'), base + '/reset-password');
  await request.page.getByRole('button', { name: 'Correggi l’indirizzo email' }).click();
  request.failRecover();
  await request.page.getByRole('button', { name: 'Invia il link di recupero' }).click();
  await request.page.getByRole('alert').filter({ hasText: 'troppe richieste' }).waitFor();
  assert.ok(await request.page.getByRole('button', { name: 'Invia il link di recupero' }).isEnabled());
  await request.context.close();

  const valid = await setup({ width: 1440 });
  await valid.page.goto(callback()); await form(valid.page).waitFor();
  assert.equal(valid.page.url(), base + '/reset-password', 'Consumed credentials removed from URL');
  assert.ok(await valid.page.evaluate(() => !document.querySelector('nav')), 'No personal area during recovery');
  await valid.page.reload(); await form(valid.page).waitFor();
  assert.ok(await valid.page.evaluate(key => Boolean(sessionStorage.getItem(key)), markerKey));
  await passwords(valid.page, 'New-synthetic-password2', 'Different-password3');
  await valid.page.getByRole('button', { name: 'Salva la nuova password' }).click();
  await valid.page.getByRole('alert').filter({ hasText: 'non coincidono' }).waitFor();
  assert.equal(valid.writes.filter(w => w.name === 'user').length, 0);
  await passwords(valid.page, 'Short1');
  await valid.page.getByRole('button', { name: 'Salva la nuova password' }).click();
  assert.equal(valid.writes.filter(w => w.name === 'user').length, 0);
  await passwords(valid.page); valid.failIdentity();
  await valid.page.getByRole('button', { name: 'Salva la nuova password' }).click();
  await valid.page.getByRole('alert').filter({ hasText: 'verificare l’account' }).waitFor();
  assert.equal(valid.writes.filter(w => w.name === 'user').length, 0, 'No password write without identity recheck');
  valid.failUpdate('weak_password');
  await valid.page.getByRole('button', { name: 'Salva la nuova password' }).click();
  await valid.page.getByRole('alert').filter({ hasText: 'più lunga' }).waitFor();
  assert.equal(await valid.page.getByLabel('Nuova password', { exact: true }).inputValue(), 'New-synthetic-password2');
  valid.failLogout();
  await valid.page.getByRole('button', { name: 'Salva la nuova password' }).click();
  await valid.page.getByRole('heading', { name: 'Password aggiornata', exact: true }).waitFor();
  await valid.page.getByRole('button', { name: 'Riprova la disconnessione' }).click();
  await valid.page.getByRole('button', { name: 'Accedi con la nuova password' }).click();
  await valid.page.getByRole('heading', { name: 'Bentornato' }).waitFor();
  assert.equal(valid.writes.filter(w => w.name === 'user').length, 2, 'Signout retry cannot repeat password update');
  assert.equal(await valid.page.evaluate(key => sessionStorage.getItem(key), markerKey), null);
  assert.equal(await valid.page.evaluate(key => localStorage.getItem(key), storageKey), null);
  await valid.page.getByLabel('Email', { exact: true }).fill('pilot@example.invalid');
  await valid.page.getByLabel('Password', { exact: true }).fill('New-synthetic-password2');
  await valid.page.getByRole('button', { name: 'Accedi', exact: true }).last().click();
  await valid.page.waitForURL(base + '/#/owner');
  await valid.context.close();

  for (const initial of [null, session()]) {
    const expired = await setup({ signedIn: initial });
    await expired.page.goto(base + '/reset-password#error=access_denied&error_code=otp_expired&error_description=Expired');
    await expired.page.getByRole('heading', { name: 'Richiedi un nuovo link' }).waitFor();
    assert.equal(await expired.page.getByLabel('Nuova password', { exact: true }).count(), 0);
    assert.equal(expired.writes.length, 0);
    if (initial) assert.ok(await expired.page.evaluate(key => localStorage.getItem(key), storageKey), 'Bad link must not sign out an existing account');
    await expired.page.getByRole('button', { name: 'Richiedi un nuovo link' }).click();
    await expired.page.waitForURL(base + '/forgot-password');
    await expired.context.close();
  }
  const normal = await setup({ signedIn: session() });
  await normal.page.goto(base + '/reset-password');
  await normal.page.getByRole('heading', { name: 'Richiedi un nuovo link' }).waitFor();
  assert.equal(normal.writes.length, 0); await normal.context.close();

  const wrong = await setup({ signedIn: session(other), marker: { userId: uid, expiresAt: Date.now() + 600000 } });
  await wrong.page.goto(base + '/reset-password');
  await wrong.page.getByRole('heading', { name: 'Richiedi un nuovo link' }).waitFor();
  assert.equal(wrong.writes.length, 0); await wrong.context.close();

  const switchAccount = await setup({ signedIn: session(other) });
  await switchAccount.page.goto(callback()); await form(switchAccount.page).waitFor();
  await switchAccount.page.getByText('Account: pilot@example.invalid', { exact: true }).waitFor();
  await switchAccount.page.reload(); await form(switchAccount.page).waitFor();
  assert.equal(await switchAccount.page.evaluate(key => JSON.parse(localStorage.getItem(key)).user.id, storageKey), uid, 'Recovery uses the link account, not the previously signed-in account');
  await switchAccount.context.close();

  const rejected = await setup(); rejected.invalidUser();
  await rejected.page.goto(callback());
  await rejected.page.getByRole('heading', { name: 'Richiedi un nuovo link' }).waitFor();
  assert.equal(rejected.writes.length, 0); await rejected.context.close();

  const root = await setup();
  await root.page.goto(callback('/')); await form(root.page).waitFor();
  await root.page.waitForURL(base + '/reset-password');
  assert.ok(await root.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await root.page.getByRole('button', { name: 'Torna ad accedere' }).click();
  await root.page.waitForURL(base + '/#/signin'); await root.context.close();

  const confirmation = await setup();
  await confirmation.page.goto(callback('/', 'signup'));
  await confirmation.page.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await form(confirmation.page).count(), 0, 'Signup confirmation is not password recovery');
  assert.equal(new URL(confirmation.page.url()).pathname, '/');
  await confirmation.context.close();
  assert.deepEqual(errors, []);
  console.log('OK: richiesta email, risposta generica, rate limit, callback Supabase, ricarica, validazione password, errore e retry, disconnessione e nuovo accesso; link scaduti, sessioni diverse, callback rifiutati e conferma signup isolati. API simulate; nessuna email reale inviata.');
} finally { await browser.close(); }
