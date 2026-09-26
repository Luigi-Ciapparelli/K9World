// Start Vite with VITE_SUPABASE_URL=https://pc-sport-test.supabase.co and a dummy
// VITE_SUPABASE_ANON_KEY. All backend responses below are synthetic fixtures.
// Uses an externally installed Playwright; adds no production dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true,
  ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5188';
const uid = 'c0000000-0000-0000-0000-000000000002';
const catalog = [
  { id: 'igp', label: 'IGP', description: 'Preparazione sportiva IGP.', aliases: ['igp'] },
  { id: 'obedience', label: 'Obedience', description: 'Precisione e collaborazione del binomio.', aliases: ['obedience'] },
  { id: 'new-test-sport', label: 'Nuova disciplina test', description: 'Catalogo dinamico.', aliases: [] },
];
const makePro = (id, name, distance, price, igp = 0) => ({
  id, display_name: name, professional_type: 'trainer', bio: 'Un percorso costruito insieme al tuo cane.',
  zone_text: 'Rimini', rating: 4, review_count: 2, distance_km: distance, starting_price: price,
  experience_start_year: 2016, approved: true, approval_status: 'approved', listing_type: 'individual',
  highest_igp_level: igp, honor_tier: igp ? 'gold' : null, specialties: ['Obedience'],
  matching_services: [{ id: 's1', professional_id: id, name: 'Lezione individuale', service_type: 'trainer', price, duration_minutes: 60, active: true }],
});
const near = makePro(uid, 'Bea Sport', 5, 30);
const far = makePro('c0000000-0000-0000-0000-000000000003', 'Zoe IGP', 25, 70, 3);
let modes = { show_companion: true, show_sport: false, discipline_ids: [] };
let saves = []; let searches = []; let catalogFails = false; let saveFails = false;
const errors = [];

async function setup(authenticated = false, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  if (authenticated) {
    const session = { access_token: 'synthetic-test-token', refresh_token: 'synthetic-refresh',
      expires_at: Math.floor(Date.now()/1000) + 3600, token_type: 'bearer',
      user: { id: uid, email: 'test@example.invalid', aud: 'authenticated', role: 'authenticated' } };
    await context.addInitScript(({ session }) => localStorage.setItem('sb-pc-sport-test-auth-token', JSON.stringify(session)), { session });
  }
  await context.route('**/*.supabase.co/**', async route => {
    const request = route.request(); const url = new URL(request.url());
    assert.equal(url.hostname, 'pc-sport-test.supabase.co', 'Tests must never use a real backend');
    const name = url.pathname.split('/').at(-1);
    const body = request.method() === 'POST' ? request.postDataJSON() : {};
    let result = [];
    if (name === 'list_sport_disciplines') {
      if (catalogFails) return route.fulfill({ status: 503, json: { message: 'Synthetic catalog outage' } });
      result = catalog;
    } else if (name === 'search_sport_professionals' || name === 'search_public_professionals') {
      searches.push({ name, body });
      result = name === 'search_sport_professionals' ? [near] : [far, near];
    } else if (name === 'get_my_professional_search_modes') result = modes;
    else if (name === 'set_my_professional_search_modes') {
      saves.push(body);
      if (saveFails) return route.fulfill({ status: 503, json: { message: 'Synthetic save outage' } });
      modes = { show_companion: body.p_show_companion, show_sport: body.p_show_sport, discipline_ids: body.p_discipline_ids };
      result = modes;
    } else if (name === 'profiles') result = [{ id: uid, full_name: 'Bea Sport', email: 'test@example.invalid', role: 'professional', email_verified: true }];
    else if (name === 'professionals' || name === 'public_professional_profiles') result = [near];
    else if (name === 'get_public_professional_services') result = near.matching_services;
    else if (name === 'get_public_professional_sports') result = [catalog[1]];
    else if (name === 'get_public_booking_availability') result = { paused: false, periods: [] };
    else if (name === 'user') result = { id: uid, email: 'test@example.invalid' };
    return route.fulfill({ status: 200, json: result });
  });
  const page = await context.newPage();
  page.on('pageerror', error => { errors.push(error.message); console.error('Runtime:', error.message); });
  page.setDefaultTimeout(12000);
  page.on('dialog', dialog => dialog.dismiss());
  return { context, page };
}

try {
  const { context, page } = await setup();
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'Trova aiuto per il cane', exact: true }).first().click();
  await page.waitForURL('**/#/search?type=trainer');
  await page.getByRole('article').first().waitFor();
  assert.equal(await page.locator('#sport-discipline').count(), 0, 'no sport choice in everyday search');
  assert.equal(searches.at(-1).name, 'search_public_professionals');
  await page.getByLabel('Ordina per').selectOption('distance');
  assert.match(await page.getByRole('article').first().innerText(), /Bea Sport/);
  await page.getByLabel('Ordina per').selectOption('price');
  assert.match(await page.getByRole('article').first().innerText(), /Bea Sport/);
  await page.getByRole('button', { name: 'Sport cinofili', exact: true }).click();
  await page.getByLabel('Disciplina sportiva').selectOption('obedience');
  await page.getByRole('button', { name: 'Trova addestratore per disciplina' }).click();
  await page.waitForURL('**/*discipline=obedience*');
  await page.waitForResponse(r => r.url().endsWith('/search_sport_professionals'));
  assert.equal(searches.at(-1).body.p_discipline_id, 'obedience');
  await page.getByRole('article').first().getByRole('button').click();
  await page.waitForURL('**/#/p/**');
  await page.getByRole('heading', { name: 'Discipline sportive offerte' }).waitFor();
  await page.getByRole('button', { name: 'Torna alla ricerca' }).click();
  await page.waitForURL('**/#/sport?**');
  assert.equal(await page.getByLabel('Disciplina sportiva').inputValue(), 'obedience');
  await page.getByLabel('Disciplina sportiva').selectOption('new-test-sport');
  await page.getByRole('button', { name: 'Trova addestratore per disciplina' }).click();
  await page.waitForResponse(r => r.url().endsWith('/search_sport_professionals'));
  assert.equal(searches.at(-1).body.p_discipline_id, 'new-test-sport');
  console.log('OK: owner direct path, isolated Sport route, selected discipline, sorting, profile round trip, dynamic catalog.');
  if (process.env.PC_SCREENSHOTS) {
    await fs.mkdir(process.env.PC_SCREENSHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.PC_SCREENSHOTS}/sport-desktop.png`, fullPage: true });
  }
  await context.close();

  const mobile = await setup(false, { width: 390, height: 844 });
  await mobile.page.goto(base + '/');
  await mobile.page.getByRole('button', { name: 'Apri menu' }).click();
  await mobile.page.getByRole('button', { name: 'Sport cinofili', exact: true }).click();
  await mobile.page.getByRole('heading', { name: 'Sport cinofili', exact: true }).waitFor();
  assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no horizontal overflow');
  if (process.env.PC_SCREENSHOTS) await mobile.page.screenshot({ path: `${process.env.PC_SCREENSHOTS}/sport-mobile.png`, fullPage: true });
  await mobile.context.close();
  console.log('OK: mobile navigation and width.');

  const professional = await setup(true);
  await professional.page.goto(base + '/#/pro/settings');
  const companion = professional.page.getByRole('checkbox', { name: 'Mostrami nella sezione Gestione del cane' });
  const sport = professional.page.getByRole('checkbox', { name: 'Mostrami nella sezione Sport cinofili' });
  const save = professional.page.getByRole('button', { name: 'Salva visibilità e discipline' });
  await companion.waitFor();
  assert.equal(await companion.isChecked(), true);
  assert.equal(await sport.isChecked(), false);
  await sport.check(); await companion.uncheck();
  await save.click();
  await professional.page.getByRole('alert').filter({ hasText: 'Scegli almeno una disciplina' }).waitFor();
  assert.equal(saves.length, 0);
  await professional.page.getByRole('checkbox', { name: 'Obedience', exact: true }).check();
  saveFails = true;
  await save.click();
  await professional.page.getByRole('alert').filter({ hasText: 'Salvataggio non confermato' }).waitFor();
  assert.equal(await professional.page.getByRole('checkbox', { name: 'Obedience', exact: true }).isChecked(), true);
  saveFails = false;
  await save.click();
  await professional.page.getByText('Visibilità e discipline salvate.', { exact: true }).waitFor();
  assert.deepEqual(modes, { show_companion: false, show_sport: true, discipline_ids: ['obedience'] });
  await companion.check(); await save.click();
  await professional.page.getByText('Visibilità e discipline salvate.', { exact: true }).waitFor();
  assert.equal(modes.show_companion && modes.show_sport, true);
  assert.equal(await professional.page.getByText('Entrambi', { exact: true }).count(), 0);
  if (process.env.PC_SCREENSHOTS) await professional.page.locator('section[aria-labelledby="professional-search-heading"]').screenshot({ path: `${process.env.PC_SCREENSHOTS}/professional-settings.png` });
  await professional.context.close();
  console.log('OK: independent switches, validation, failed-save retry preserves input, separate save.');

  catalogFails = true;
  const failed = await setup();
  await failed.page.goto(base + '/#/sport');
  await failed.page.getByRole('alert').filter({ hasText: 'caricare le discipline' }).waitFor();
  catalogFails = false;
  await failed.page.getByRole('button', { name: 'Riprova', exact: true }).click();
  await failed.page.getByLabel('Disciplina sportiva').waitFor();
  await failed.context.close();
  assert.deepEqual(errors, [], 'no React runtime errors');
  console.log('OK: catalog recovery; no runtime errors. Backend mocked; authorization tested separately in SQL.');
} finally { await browser.close(); }
