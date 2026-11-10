// Real SDK and browser, synthetic Auth only. Never request or click a real email.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = (process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5299').replace(/\/$/, '');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
const pagePath = '/account/confirm-email', email = 'trainer@example.invalid', other = 'other@example.invalid';
const makeSession = (address = email, confirmed = true) => ({
  access_token: 'synthetic-access-' + address, refresh_token: 'synthetic-refresh', token_type: 'bearer',
  expires_in: 3600, expires_at: Math.floor(Date.now()/1000) + 3600,
  user: { id: address === email ? '00000000-0000-4000-8000-000000000001' : '00000000-0000-4000-8000-000000000002',
    email: address, email_confirmed_at: confirmed ? '2026-01-01T12:00:00Z' : null, role: 'authenticated', aud: 'authenticated', user_metadata: {}, app_metadata: { provider: 'email' } },
});
const grant = new URLSearchParams({ type: 'signup', access_token: makeSession().access_token, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: '3600' });
const bad = '#error=access_denied&error_code=otp_expired&error_description=PrivateProviderDetail';
async function setup({ stored = false, confirmed = true, rejectGrant = false } = {}) {
  const ctx = await browser.newContext({ serviceWorkers: 'block' });
  if (stored) await ctx.addInitScript(session => {
    localStorage.setItem('sb-pc-home-test-auth-token', JSON.stringify(session));
    sessionStorage.setItem('pc-password-recovery-v1', JSON.stringify({ userId: session.user.id, expiresAt: Date.now()+600000 }));
  }, makeSession(other));
  const writes = [], allErrors = [];
  const page = await ctx.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', e => allErrors.push(e.message));
  const fail = (route, code, status=400) => route.fulfill({ status, headers: { 'x-supabase-api-version': '2024-01-01' }, json: { code, error_code: code, msg: 'Synthetic provider response' } });
  await ctx.route('https://**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.hostname !== 'pc-home-test.supabase.co') return route.abort();
    const key = url.pathname.split('/').at(-1);
    if (req.method() === 'POST') writes.push({ key, body: req.postDataJSON(), redirect: url.searchParams.get('redirect_to') });
    if (key === 'user') return rejectGrant ? fail(route,'bad_jwt',401) : route.fulfill({ json: makeSession(req.headers().authorization === 'Bearer ' + makeSession(other).access_token ? other : email, confirmed).user });
    if (key === 'token') return fail(route, 'email_not_confirmed');
    if (key === 'verify') return req.postDataJSON().token === '123456' ? route.fulfill({ json: makeSession() }) : fail(route, 'otp_expired');
    if (key === 'resend') return route.fulfill({ json: {} });
    if (key === 'profiles') return route.fulfill({ json: { ...makeSession().user, full_name:'Prova', role:'professional', email_verified: confirmed } });
    return route.fulfill({ json: [] });
  });
  return { ctx, page, writes, close: async () => { assert.deepEqual(allErrors, []); await ctx.close(); } };
}
try {
  for (const [path, options, heading] of [
    ['/account/contacts#' + grant, {}, 'Email confermata'],
    ['/#' + grant, {}, 'Email confermata'],
    ['/account/contacts' + bad, { stored: true }, 'Link scaduto o già utilizzato'],
    ['/' + bad, {}, 'Link scaduto o già utilizzato'],
    ['/account/contacts#error=access_denied', {}, 'Link non valido'],
    ['/account/contacts#type=signup&access_token=incomplete', { stored:true }, 'Link non valido'],
    ['/account/contacts#' + grant, { stored:true, rejectGrant:true }, 'Link non valido'],
    ['/account/contacts#' + grant, { confirmed:false }, 'Link non valido'],
    [pagePath, { stored:true }, 'Conferma la tua email'],
  ]) {
    const t = await setup(options); await t.page.goto(base + path);
    await t.page.getByRole('heading', { name: heading, exact: true }).waitFor();
    assert.equal(t.page.url(), base + pagePath);
    assert.equal(await t.page.getByText('PrivateProviderDetail').count(), 0);
    assert.deepEqual(t.writes, [], 'Reading a callback must not resend, approve or write to profiles');
    if (heading === 'Email confermata') await t.page.getByRole('button',{name:'Continua nel tuo account'}).waitFor();
    await t.close();
  }
  const normal = await setup(); await normal.page.goto(base + '/account/contacts');
  await normal.page.getByRole('heading',{name:'Bentornato'}).waitFor();
  await normal.page.getByText(/il link non ha restituito un esito/).waitFor();
  await normal.page.getByLabel('Email',{exact:true}).fill(email);
  await normal.page.getByLabel('Password',{exact:true}).fill('synthetic-only');
  await normal.page.getByRole('button',{name:'Accedi',exact:true}).last().click();
  await normal.page.getByRole('alert').filter({hasText:'non è ancora confermato'}).waitFor();
  await normal.page.getByRole('button',{name:'Reinvia email di conferma'}).click();
  await normal.page.getByRole('status').filter({hasText:'Apri solo l’ultima'}).waitFor();
  assert.ok(await normal.page.getByRole('button',{name:'Reinvia email di conferma'}).isDisabled());
  assert.deepEqual(normal.writes.filter(x=>x.key==='resend').map(x=>[x.body.type,x.body.email,x.redirect]), [['signup',email,base+'/account/contacts']]);
  await normal.page.getByRole('button',{name:'Ho un codice nell’email'}).click();
  assert.equal(await normal.page.getByLabel('Email di registrazione').inputValue(), email);
  assert.equal(normal.page.url(), base + pagePath);
  await normal.page.getByLabel('Codice di conferma').fill('111111');
  await normal.page.getByRole('button',{name:'Conferma il codice'}).click();
  await normal.page.getByRole('alert').filter({hasText:'Il codice è scaduto'}).waitFor();
  await normal.page.getByLabel('Codice di conferma').fill('123456');
  await normal.page.getByRole('button',{name:'Conferma il codice'}).click();
  await normal.page.getByRole('heading',{name:'Email confermata',exact:true}).waitFor();
  assert.deepEqual(normal.writes.filter(x=>x.key==='verify').map(x=>[x.body.type,x.body.email,x.body.token]),[['email',email,'111111'],['email',email,'123456']]);
  await normal.close();
  const recovery = await setup();
  await recovery.page.goto(base + '/reset-password' + bad);
  await recovery.page.getByRole('heading',{name:'Richiedi un nuovo link'}).waitFor();
  assert.equal(await recovery.page.getByText('Ho un codice nell’email').count(),0);
  await recovery.close();
  console.log('OK: conferme valide, rifiutate e scadute; nessun successo da sessione preesistente; reinvio, codice, accesso e recupero distinti.');
} finally { await browser.close(); }
