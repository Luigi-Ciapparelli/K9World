// Run after npm run build. Browser requests to Supabase are mocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { preview } from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const server = await preview({ preview: { host: '127.0.0.1', port: 5204, strictPort: true } });
let browser;
const base = 'http://127.0.0.1:5204';
const errors = [];
const shots = process.env.PC_SCREENSHOTS;
try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.PC_CHROMIUM_PATH ? { executablePath: process.env.PC_CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1040 }, serviceWorkers: 'block' });
  await ctx.route('**/*.supabase.co/**', (route) => route.fulfill({ status: 200, json: [] }));
  const page = await ctx.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base);
  await page.getByRole('heading', { level: 1, name: 'Apri la porta al suo mondo.' }).waitFor();
  await page.locator('.pc-portal-figure img').evaluate(img => img.decode());
  assert.equal(await page.locator('.pc-portal-figure img').evaluate(img => img.naturalWidth > 0), true);
  assert.equal(await page.locator('main').evaluate(el => el.getAnimations({subtree: true}).length), 0);
  assert.equal(await page.locator('main video, main canvas, main iframe, .pc-portal-door').count(), 0);
  assert.equal(await page.locator('.pc-journey-steps li').count(), 4);
  assert.equal(await page.locator('.pc-portal-description').textContent(), 'Conosci i suoi bisogni, scopri come impara e trova il professionista adatto a voi per vivere felici e sereni la vostra relazione.');
  if (shots) {
    await fs.mkdir(shots, { recursive: true });
    await page.screenshot({ path: path.join(shots, 'PortaleCinofilo_home_statica_desktop.png'), fullPage: true });
    const bottom = await page.locator('.pc-journey').evaluate(el => el.getBoundingClientRect().bottom);
    await page.setViewportSize({width:1440,height:Math.ceil(bottom)});
    await page.screenshot({path: path.join(shots, 'PortaleCinofilo_home_statica_anteprima.png'), clip: {x:0,y:0,width:1440,height:Math.ceil(bottom)}});
    await page.setViewportSize({width:1440,height:1040});
  }
  // Each phase is independently reachable, without completing any previous phase.
  const routes = [
    ['.pc-portal-primary', '/prima-del-cane'],
    ['.pc-portal-secondary', '/search?type=trainer'],
    ['.pc-journey-steps li:nth-child(1) a', '/prima-del-cane'],
    ['.pc-journey-steps li:nth-child(2) a', '/impara'],
    ['.pc-journey-steps li:nth-child(3) a', '/search?type=trainer&source=home&topic=scelta-responsabile&intent=choose-dog'],
    ['.pc-journey-steps li:nth-child(4) a', '/search?type=trainer'],
  ];
  for (const [selector, destination] of routes) {
    const link=page.locator(selector);
    assert.equal(await link.getAttribute('href'), destination);
    await link.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(base + destination);
    if (destination.includes('source=home')) await page.getByText('Scegli il cane insieme a un professionista.', {exact:true}).waitFor();
    await page.goto(base);
  }
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1040 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}`);
    assert.ok(await page.locator('.pc-portal-secondary').isVisible(), `direct search at ${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Apri menu/ }).click();
  await page.getByRole('link', { name: 'Sport cinofili', exact: true }).click();
  await page.waitForURL(base + '/sport');
  await page.goto(base);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.pc-portal-figure img').evaluate(img => img.decode());
  if (shots) await page.screenshot({ path: path.join(shots, 'PortaleCinofilo_home_statica_mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1040 });
  await page.getByRole('button', { name: 'Tema scuro', exact: true }).click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('h1')).color === 'rgb(241, 241, 223)');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (shots) await page.screenshot({ path: path.join(shots, 'PortaleCinofilo_home_statica_scura.png'), fullPage: true });
  await ctx.close();
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(base);
  assert.equal(await staticPage.locator('h1').count(), 1);
  assert.equal(await staticPage.locator('.pc-journey-steps a').count(), 4);
  assert.equal(await staticPage.locator('link[rel=canonical]').getAttribute('href'), 'https://www.portalecinofilo.com/');
  await staticPage.locator('main a[href="/impara"]').click();
  await staticPage.waitForURL(base + '/impara');
  await staticContext.close();
  assert.deepEqual(errors, []);
  console.log('OK: immagine statica, 4 tappe indipendenti, 6 collegamenti, contesto prima della scelta, 6 larghezze, menu mobile, tema scuro e HTML senza JavaScript. API simulate.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
