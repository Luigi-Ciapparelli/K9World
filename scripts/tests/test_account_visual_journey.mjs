// Synthetic Auth and demo agenda only. Run against a local Vite server or compiled preview.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5240';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Local test server only');
const out=process.env.PC_SCREENSHOTS, before=process.argv.includes('--before');
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ratios=[];
const sampleEmail='referente@example.invalid';
async function measure(locator){
 return locator.evaluate(element=>{
  const rgb=v=>v.match(/[\d.]+/g).map(Number);
  const lum=colour=>{const [r,g,b]=rgb(colour).map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
  const text=getComputedStyle(element).color; let bg=''; for(let item=element;item;item=item.parentElement){bg=getComputedStyle(item).backgroundColor;if(!bg.startsWith('rgba(')||rgb(bg)[3]!==0)break;}
  const a=lum(text),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 });
}
async function capture(page,label){if(out){await fs.mkdir(out,{recursive:true});await page.screenshot({path:path.join(out,(before?'prima-':'dopo-')+label+'.png'),animations:'disabled'});}}
try {
 for(const [width,height,theme] of [[375,667,'dark'],[375,667,'light'],[1440,900,'light'],[1440,900,'dark']]){
  const ctx=await browser.newContext({viewport:{width,height},colorScheme:theme,locale:'it-IT',serviceWorkers:'block'});const page=await ctx.newPage();
  const writes=[];let sc='accepted';
  await ctx.route('https://**/*',async r=>{
   const u=new URL(r.request().url());if(u.hostname!=='pc-home-test.supabase.co')return r.abort();
   const op=u.pathname.split('/').at(-1);if(r.request().method()==='POST')writes.push(op);
   if(op==='token')return r.fulfill({status:400,headers:{'x-supabase-api-version':'2024-01-01'},json:{code:'invalid_credentials',msg:'Invalid login credentials'}});
   if(op==='signup'&&sc==='duplicate')return r.fulfill({status:422,headers:{'x-supabase-api-version':'2024-01-01'},json:{code:'user_already_exists',msg:'User already registered'}});
   if(op==='signup')return r.fulfill({json:{id:'d0000000-0000-4000-b000-000000000199',email:sampleEmail,identities:[{provider:'email'}]}});
   if(op==='resend')return r.fulfill({json:{}});
   return r.fulfill({json:[]});
  });page.setDefaultTimeout(9500);
  await page.goto(base+'/#/signin');await page.getByRole('heading',{name:'Bentornato'}).waitFor();
  const link=page.getByRole('button',{name:'Password dimenticata?'}),submit=page.getByRole('button',{name:'Accedi',exact:true}).last();
  const lr=await measure(link),sr=await measure(submit);ratios.push([width,theme,lr.toFixed(2),sr.toFixed(2)]);
  if(!before){assert.ok(lr>=4.5&&sr>=4.5);await page.getByLabel('Password',{exact:true}).focus();await page.keyboard.press('Tab');assert.ok(await link.evaluate(e=>document.activeElement===e&&getComputedStyle(e).outlineStyle==='solid'&&parseFloat(getComputedStyle(e).outlineWidth)>=2));
   await page.getByLabel('Email',{exact:true}).fill(sampleEmail);await page.getByLabel('Password',{exact:true}).fill('synthetic-pass-demo');await submit.click();const error=page.getByRole('alert').filter({hasText:'Email o password non corrette'});await error.waitFor();assert.ok(await measure(error)>=4.5);await page.getByLabel('Password',{exact:true}).fill('');await page.getByLabel('Email',{exact:true}).fill('');
  }
  if(width===375&&theme==='dark') await capture(page,'accesso-375-scuro');
  await page.goto(base+'/#/signup?role=professional');await page.getByRole('heading',{name:'Inizia il tuo profilo professionale'}).waitFor();
  if(width===375&&theme==='light')await capture(page,'iscrizione-375');
  if(!before){const field=page.getByLabel('Nome e cognome del referente',{exact:true}),role=page.getByRole('button',{name:'Professionista',exact:true});
   assert.equal(await role.getAttribute('aria-pressed'),'true');const box=await field.boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=height,'First editable field in the first screen');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.goto(base+'/become-pro');await page.getByRole('button',{name:'Crea il tuo profilo',exact:true}).first().waitFor();
  if(width===1440&&theme==='light')await capture(page,'professionisti-1440');
  if(!before){
   const demo=page.getByRole('region',{name:'Un giovedì al centro'});await demo.getByText(/Dati dimostrativi/).waitFor();assert.equal(await demo.getByRole('listitem').count(),3);await page.getByRole('link',{name:'Vedi prova e prezzi'}).click();
   const plans=page.getByRole('region',{name:'90 giorni per provarlo sul campo'});assert.match(await plans.innerText(),/Oggi il gestionale è gratuito/);assert.match(await plans.innerText(),/non sono in vendita/);for(const price of [15,35,69,109])assert.ok((await plans.innerText()).includes(price+' €'));
  }
  if(!before&&width===375&&theme==='light'){
   let originalCopy;
   for(const mode of ['accepted','duplicate']){
    sc=mode;await page.goto(base+'/#/signup?role=professional');await page.getByLabel('Nome e cognome del referente').fill('Referente di prova');await page.getByLabel('Attività principale').selectOption('trainer');await page.getByLabel('Email',{exact:true}).fill(sampleEmail);await page.getByLabel('Telefono',{exact:true}).fill('+390000000000');await page.getByLabel('Password',{exact:true}).fill('test-password-demo');const summary=page.locator('.pc-auth-review');await summary.getByText(sampleEmail,{exact:true}).waitFor();await summary.getByText('+390000000000').waitFor();
    await summary.getByRole('button',{name:'Modifica i recapiti'}).click();assert.ok(await page.getByLabel('Email',{exact:true}).evaluate(e=>e===document.activeElement));
    await page.getByRole('checkbox',{name:/Accetto i Termini/}).check();await page.getByRole('button',{name:'Crea account'}).click();await page.getByRole('heading',{name:'Controlla la tua email'}).waitFor();
    const view=page.locator('.pc-auth-card');if(mode==='accepted')originalCopy=await view.innerText();else assert.equal(await view.innerText(),originalCopy,'Duplicate and new account yield the same response');
    assert.ok(!page.url().includes(sampleEmail));await page.getByRole('button',{name:'Reinvia email di conferma'}).click();await page.getByRole('status').filter({hasText:'Se l’indirizzo è in attesa'}).waitFor();
    await page.getByRole('button',{name:'Ripeti la registrazione con il recapito corretto'}).click();const email=page.getByLabel('Email',{exact:true});await email.waitFor();assert.equal(await email.inputValue(),sampleEmail);assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),'');assert.equal(await page.getByRole('checkbox',{name:/Accetto i Termini/}).isChecked(),false);
   }
   assert.equal(writes.filter(x=>x==='resend').length,2);
  }
  await ctx.close();
 }
 console.log(before?'Baseline':'OK',JSON.stringify(ratios),'contrasto link e pulsante (4,5:1 richiesti per la versione nuova).');
}finally{await browser.close();}
