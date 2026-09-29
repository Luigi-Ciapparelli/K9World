// Local synthetic Auth only: never creates accounts or sends real email.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base = (process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5196').replace(/\/$/, '');
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local fixture server required');
const browser = await chromium.launch({ headless: true, ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const errors = [];
async function setup(width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 1050 }, serviceWorkers: 'block' });
  const writes = [];
  let fail = false;
  await context.route('https://**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    assert.equal(url.hostname, 'pc-home-test.supabase.co', 'Never use production Supabase');
    if (url.pathname === '/auth/v1/signup') {
      const body = route.request().postDataJSON();
      writes.push(body);
      if (fail) { fail = false; return route.fulfill({ status: 400, json: { code: 'validation_failed', msg: 'Errore di prova: riprova' } }); }
      return route.fulfill({ status: 200, json: { id: 'd0000000-0000-0000-0000-000000000099', email: body.email, identities: [{ provider: 'email' }] } });
    }
    await route.fulfill({ status: 200, json: [] });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', async dialog => { assert.equal(dialog.type(), 'alert'); assert.match(dialog.message(), /Controlla la tua email/); await dialog.accept(); });
  return { page, context, writes, fail: () => { fail = true; } };
}
async function details(page, professional = true) {
  await page.getByLabel(professional ? 'Nome e cognome del referente' : 'Nome e cognome', { exact: true }).fill('Referente di prova');
  await page.getByLabel('Email', { exact: true }).fill('pilot@example.invalid');
  await page.getByLabel('Telefono', { exact: true }).fill('+390000000000');
  await page.getByLabel('Password', { exact: true }).fill('Synthetic-only-123');
}
try {
  for (const [activity, width] of [['trainer', 1440], ['boarding', 390]]) {
    const t = await setup(width);
    // Same entry link used by invitations, not the generic role selection.
    await t.page.goto(base + '/become-pro');
    await t.page.getByRole('button', { name: 'Entra nella beta', exact: true }).first().click();
    await t.page.getByRole('heading', { name: 'Inizia il tuo profilo professionale' }).waitFor();
    await details(t.page);
    const select = t.page.getByLabel('Attività principale', { exact: true });
    assert.equal(await select.inputValue(), '');
    await t.page.getByRole('button', { name: 'Crea account', exact: true }).click();
    assert.equal(t.writes.length, 0, 'No silent walker signup');
    assert.ok(await select.evaluate(element => element.validity.valueMissing));
    await select.selectOption(activity);
    t.fail();
    await t.page.getByRole('button', { name: 'Crea account', exact: true }).click();
    await t.page.getByRole('alert').filter({ hasText: 'Errore di prova' }).waitFor();
    assert.equal(await select.inputValue(), activity, 'Retry must retain the chosen activity');
    assert.ok(await t.page.getByRole('button', { name: 'Crea account', exact: true }).isEnabled());
    assert.ok(await t.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Signup overflow');
    if (process.env.PC_SCREENSHOTS) {
      await fs.mkdir(process.env.PC_SCREENSHOTS, { recursive: true });
      await t.page.screenshot({ path: `${process.env.PC_SCREENSHOTS}/iscrizione-${activity}.png`, fullPage: true });
    }
    await t.page.getByRole('button', { name: 'Crea account', exact: true }).click();
    await t.page.getByRole('heading', { name: 'Bentornato' }).waitFor();
    assert.equal(t.writes.length, 2);
    for (const request of t.writes) {
      assert.equal(request.data.role, 'professional');
      assert.equal(request.data.professional_type, activity);
      assert.equal(request.data.full_name, 'Referente di prova');
      assert.equal(request.data.dog_name, '');
    }
    await t.context.close();
  }
  const t = await setup(390);
  await t.page.goto(base + '/#/signup');
  await t.page.getByRole('button', { name: /Sono un professionista/ }).click();
  await t.page.getByRole('button', { name: 'Continua', exact: true }).click();
  assert.equal(await t.page.getByLabel('Attività principale', { exact: true }).inputValue(), '');
  await t.page.getByRole('button', { name: 'Indietro', exact: true }).click();
  await t.page.getByRole('button', { name: /Sono proprietario di un cane/ }).click();
  await t.page.getByRole('button', { name: 'Continua', exact: true }).click();
  assert.equal(await t.page.getByLabel('Attività principale', { exact: true }).count(), 0);
  await details(t.page, false);
  await t.page.getByRole('button', { name: 'Continua: il tuo cane', exact: true }).click();
  await t.page.getByRole('heading', { name: 'Presentaci il tuo cane' }).waitFor();
  assert.equal(t.writes.length, 0, 'Owner must complete dog onboarding before account creation');
  await t.context.close();
  assert.deepEqual(errors, []);
  console.log('OK: invito diretto, attività obbligatoria, trainer/pensione nel payload Auth, retry senza perdita dati, conferma email e percorso proprietario preservato. Auth simulata, nessun account reale creato.');
} finally { await browser.close(); }
