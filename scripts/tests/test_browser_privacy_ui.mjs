// Real React pages, synthetic APIs and local storage. No real accounts or messages.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5240';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const errors = [];
const observed = new Set();
async function setup(width, blocked = false) {
  const context = await browser.newContext({ viewport: { width, height: 950 }, locale: 'it-IT', serviceWorkers: 'block' });
  if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(base).origin) return route.continue();
    observed.add(url.hostname);
    if (url.hostname === 'pc-home-test.supabase.co') return route.fulfill({ json: [] });
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  return { page, context };
}
async function clear(page, action) {
  await page.getByRole('button', { name: action, exact: true }).click();
  await page.getByRole('button', { name: 'Conferma operazione', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Operazione completata' }).waitFor();
}
try {
  for (const width of [1440, 390]) {
    const { page, context } = await setup(width);
    await page.goto(base + '/cookies');
    await page.getByRole('heading', { name: 'Cookie e dati locali', exact: true }).waitFor();
    assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'), 'no-referrer');
    assert.equal((await context.cookies()).length, 0);
    await page.getByRole('link', { name: 'Gestisci i dati salvati su questo dispositivo', exact: true }).click();
    await page.getByRole('heading', { name: '4. Gestisci i dati locali', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no viewport overflow');
    const keys = ['portalecinofilo-impara-v3', 'pawconnect-impara-stage1-v2', 'pawconnect-before-dog-v1', 'portalecinofilo-before-dog-share-draft-v1', 'pc-pro-explored-v1:example', 'unrelated-key', 'sb-unrelated-auth-token'];
    await page.evaluate(keys => { keys.forEach(key => localStorage.setItem(key, 'preserve-or-remove')); sessionStorage.setItem('pc-password-recovery-v1', 'preserve-recovery'); }, keys);
    await page.getByRole('button', { name: 'Cancella dati Impara', exact: true }).click();
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem('portalecinofilo-impara-v3')), 'preserve-or-remove');
    await clear(page, 'Cancella dati Impara');
    await clear(page, 'Cancella risposte al test');
    await clear(page, 'Azzera guida agli strumenti');
    await page.getByRole('button', { name: 'Tema scuro', exact: true }).first().click();
    assert.equal(await page.evaluate(() => localStorage.getItem('pawconnect-theme')), 'dark');
    await clear(page, 'Ripristina tema automatico');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'system');
    for (const key of keys.slice(0,5)) assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null);
    for (const key of keys.slice(5)) assert.equal(await page.evaluate(key => localStorage.getItem(key), key), 'preserve-or-remove');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('pc-password-recovery-v1')), 'preserve-recovery');
    await page.evaluate(async () => { await caches.open('portalecinofilo-test'); await caches.open('unrelated-cache'); });
    await clear(page, 'Svuota cache pubblica');
    assert.deepEqual(await page.evaluate(() => caches.keys()), ['unrelated-cache']);
    // No empty answers are persisted on landing; corrupted old input cannot break rendering.
    await page.goto(base + '/prima-del-cane');
    await page.getByRole('heading', { name: 'Qual è il tuo rapporto attuale con i cani?' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('pawconnect-before-dog-v1')), null);
    await page.getByRole('button', { name: /Sarebbe il mio primo cane/ }).click();
    await page.getByRole('button', { name: 'Continua', exact: true }).click();
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('pawconnect-before-dog-v1')).experience === 'first'));
    await page.evaluate(() => localStorage.setItem('pawconnect-before-dog-v1', '{"household":null,"experience":{},"goal":"invalid"}'));
    await page.reload();
    await page.getByRole('heading', { name: 'Qual è il tuo rapporto attuale con i cani?' }).waitFor();
    await page.goto(base + '/cookies');
    await page.screenshot({ path: `/tmp/pc-privacy-${width}.png`, fullPage: true });
    await context.close();

    const blocked = await setup(width, true);
    await blocked.page.goto(base + '/cookies');
    await blocked.page.getByRole('button', { name: 'Tema scuro', exact: true }).first().click();
    assert.equal(await blocked.page.evaluate(() => document.documentElement.dataset.theme), 'dark');
    await blocked.page.getByRole('button', { name: 'Cancella dati Impara', exact: true }).click();
    await blocked.page.getByRole('button', { name: 'Conferma operazione', exact: true }).click();
    await blocked.page.getByRole('status').filter({ hasText: 'non ha consentito' }).waitFor();
    await blocked.page.goto(base + '/prima-del-cane');
    await blocked.page.getByRole('button', { name: /Sarebbe il mio primo cane/ }).click();
    await blocked.page.getByRole('status').filter({ hasText: 'Puoi continuare il test' }).waitFor();
    await blocked.page.getByRole('button', { name: 'Continua', exact: true }).click();
    await blocked.page.getByRole('heading', { name: 'Quanto tempo puoi dedicare ogni giorno in modo stabile?' }).waitFor();
    await blocked.context.close();
    console.log(`OK ${width}px: cancellazione selettiva, annullamento, Auth preservata, cache isolata, tema e test con storage negato.`);
  }
  assert.deepEqual(errors, []);
  assert.ok([...observed].every(host => host === 'pc-home-test.supabase.co'), 'no extra third-party resources');
  const cookiesHTML = await fs.readFile('dist/cookies.html', 'utf8');
  for (const term of ['sb-&lt;progetto&gt;-auth-token', 'pc-password-recovery-v1', 'pawconnect-theme', 'Cache Storage', 'Conserva nel browser']) assert.ok(cookiesHTML.includes(term), term + ' in prerender');
  assert.ok(cookiesHTML.includes('href="/cookies"'));
  const vercel = JSON.parse(await fs.readFile('vercel.json', 'utf8'));
  assert.ok(vercel.headers.find(rule => rule.source === '/(.*)').headers.some(header => header.key === 'Referrer-Policy' && header.value === 'no-referrer'));
  console.log('OK: nessun errore pagina, pixel o cookie nel test; inventario presente anche nell’HTML senza JavaScript. Servizi online non simulati come verificati.');
} finally { await browser.close(); }
