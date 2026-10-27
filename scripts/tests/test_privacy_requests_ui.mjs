// Browser-only request preparation. No production accounts, email, or database writes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5240';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const errors = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: 'block' });
    const writes = [];
    await context.route('**/*', route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
      const url = new URL(request.url());
      if (url.origin === new URL(base).origin) return route.continue();
      if (url.hostname === 'pc-home-test.supabase.co') return route.fulfill({ json: [] });
      return route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/privacy#richieste-privacy');
    const section = page.locator('#richieste-privacy');
    await section.getByRole('heading', { name: 'Esercita i tuoi diritti' }).waitFor();
    const kind = page.getByLabel('Cosa vuoi richiedere?');
    const body = page.getByLabel('Testo da completare nella tua email');
    assert.equal(await body.evaluate(element => element.readOnly), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No mobile overflow');
    for (const value of ['access', 'correction', 'deletion', 'restriction', 'portability', 'objection']) {
      await kind.selectOption(value);
      const href = new URL(await page.getByRole('link', { name: 'Apri la tua app email', exact: true }).getAttribute('href'));
      assert.equal(href.protocol, 'mailto:');
      assert.equal(href.pathname, 'info@portalecinofilo.com');
      assert.equal(href.searchParams.get('body'), await body.inputValue());
      assert.match(href.searchParams.get('subject'), /^Richiesta privacy/);
      assert.match(await section.innerText(), /La richiesta non è ancora inviata/);
    }
    // Success reports copying only; a denied clipboard leaves a usable manual template.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedPrivacyText = text; } } }));
    await page.getByRole('button', { name: 'Copia il testo', exact: true }).click();
    await section.getByRole('status').filter({ hasText: 'Testo copiato.' }).waitFor();
    assert.equal(await page.evaluate(() => window.__copiedPrivacyText), await body.inputValue());
    await kind.selectOption('deletion');
    assert.equal(await section.getByRole('status').innerText(), '');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } }));
    await page.getByRole('button', { name: 'Copia il testo', exact: true }).click();
    await section.getByRole('status').filter({ hasText: 'Copia automatica non disponibile' }).waitFor();
    assert.deepEqual(writes, [], 'Preparing a request must not send it or store it remotely');
    await page.screenshot({ path: `/tmp/pc-rights-${width}.png`, fullPage: true });
    await page.goto(base + '/professional-terms');
    await page.getByRole('heading', { name: 'Termini per i professionisti', exact: true }).waitFor();
    assert.equal(await page.locator('footer').count(), 1, 'Professional terms are public, not the /pro account area');
    await context.close();
    console.log(`OK ${width}px: sei modelli, destinatario e testo corretti, copia e fallback, nessun invio o falso esito, footer pubblico.`);
  }
  assert.deepEqual(errors, []);
  const html = await fs.readFile('dist/privacy.html', 'utf8');
  assert.ok(html.includes('id="richieste-privacy"'));
  assert.ok(html.includes('2026-10-21.1'));
  assert.ok(html.includes('info@portalecinofilo.com'));
} finally { await browser.close(); }
