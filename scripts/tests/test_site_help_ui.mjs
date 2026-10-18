// Local test with synthetic identities. Never connects to a real Supabase project.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5234';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='ec720000-0000-0000-0000-000000000001',errors=[];
try{for(const role of ['visitor','owner','professional','admin'])for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});let apiCalls=0;
 if(role!=='visitor')await ctx.addInitScript(id=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id,email:'help@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 await ctx.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin===new URL(base).origin)return route.continue();
  if(url.hostname!=='pc-home-test.supabase.co')return route.abort();apiCalls++;
  const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='user')data={id:uid,email:'help@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,role,full_name:'Account di prova',email:'help@example.invalid',email_verified:true};
  if(name==='professionals')data={id:uid,listing_type:'center',approved:true};
  return route.fulfill({status:200,json:data});
 });
 const page=await ctx.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/impara',{waitUntil:'networkidle',timeout:45000});
 const trigger=page.getByRole('button',{name:'Apri la guida rapida'});await trigger.click();
 const dialog=page.getByRole('dialog',{name:'Guida rapida'});await dialog.waitFor();
 const search=dialog.getByLabel('Cerca nella guida');assert.ok(await search.evaluate(e=>document.activeElement===e));
 assert.ok(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth));
 const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);
 const before=apiCalls;await search.fill('zzqqq');await dialog.getByText('Nessun argomento trovato',{exact:true}).waitFor();
 await dialog.getByRole('button',{name:'Mostra tutti gli argomenti'}).click();assert.equal(apiCalls,before,'help search performs no API calls');
 assert.equal(await search.inputValue(),'');assert.equal(await dialog.locator('a[href="mailto:info@portalecinofilo.com"]').count(),1);
 if(role==='professional'){
  await dialog.locator('summary').filter({hasText:'Pacchetti e abbonamenti'}).click();assert.equal(await dialog.getByRole('link',{name:'Pacchetti',exact:true}).getAttribute('href'),'/#/pro/passes');
  assert.equal(await dialog.locator('a[href*="/owner/"]').count(),0);
 }else if(role==='owner'){
  await dialog.locator('summary').filter({hasText:'Come richiedo un appuntamento'}).click();assert.equal(await dialog.getByRole('link',{name:'Le mie prenotazioni'}).getAttribute('href'),'/#/owner/bookings');
  assert.equal(await dialog.locator('a[href*="/pro/"]').count(),0);
 }else if(role==='visitor'){
  await dialog.locator('summary').filter({hasText:'Quando serve un account'}).click();assert.equal(await dialog.getByRole('link',{name:'Crea un account'}).getAttribute('href'),'/#/signup');
  assert.equal(await dialog.locator('a[href*="/pro/"],a[href*="/owner/"],a[href*="/account/"]').count(),0);
 }else assert.equal(await dialog.locator('a[href*="/pro/"],a[href*="/owner/"]').count(),0);
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/help-'+role+'-'+width+'.png'});}
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Apri la guida rapida');
 await trigger.click();await dialog.locator('summary').filter({hasText:'Da dove comincio'}).click();await dialog.getByRole('link',{name:'Apri Impara',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.equal(new URL(page.url()).pathname,'/impara');
 await ctx.close();console.log('OK: guida '+role+' '+width+'px, ricerca locale, link, chiusura e focus.');
}assert.deepEqual(errors,[]);}finally{await browser.close();}
