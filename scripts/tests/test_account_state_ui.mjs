import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5235';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const ids={a:'ec730000-0000-0000-0000-000000000001',b:'ec730000-0000-0000-0000-000000000002'};
const session=key=>({access_token:'synthetic-'+key,refresh_token:'synthetic-refresh-'+key,expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:ids[key],email:key+'@example.invalid',aud:'authenticated',role:'authenticated'}});
const profile=key=>({id:ids[key],full_name:key==='a'?'Profilo precedente':'Profilo corrente',role:key==='a'?'professional':'owner',email:key+'@example.invalid',email_verified:true,avatar_url:null});
try{for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});let active='a',mode='normal',logoutError=false;const held=[];
 await ctx.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.origin===new URL(base).origin)return route.continue();
  if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='token'){active=req.postDataJSON().email.startsWith('a@')?'a':'b';data=session(active);}
  if(name==='user')data=session(active).user;
  if(name==='logout')return route.fulfill({status:logoutError?400:204,...(logoutError?{json:{message:'Try again',code:'unexpected_failure'}}:{body:''})});
  if(name==='profiles'){
   const key=url.searchParams.get('id')==='eq.'+ids.a?'a':'b';
   if(mode==='hold-a'&&key==='a'){held.push(route);return;}
   if(mode==='failure')return route.fulfill({status:503,json:{message:'Temporary failure'}});
   data=mode==='missing'?null:mode==='mismatch'?profile(key==='a'?'b':'a'):profile(key);
  }
  if(name==='account-contacts')data={email:active+'@example.invalid',phone:'',emailVerified:true,phoneVerified:false,emailDeliveryReady:true,smsDeliveryReady:false};
  if(name==='professionals')data={id:ids[active],approved:true};
  return route.fulfill({status:200,json:data});
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);
 await page.goto(base+'/impara',{waitUntil:'networkidle'});
 const signin=key=>page.evaluate(async key=>{const {supabase}=await import('/src/lib/supabase.ts');const r=await supabase.auth.signInWithPassword({email:key+'@example.invalid',password:'synthetic-password'});if(r.error)throw r.error;},key);
 mode='hold-a';await signin('a');await page.waitForFunction(()=>document.querySelector('body')!==null);
 for(let n=0;n<300&&!held.length;n++)await new Promise(r=>setTimeout(r,20));
 assert.ok(held.length,'initial profile request captured');
 await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabase.ts');await supabase.auth.signOut({scope:'local'});});
 await signin('b');await page.locator('a.pc-account-link').first().filter({hasText:'Profilo corrente'}).waitFor({state:'attached'});
 mode='normal';for(const request of held.splice(0))await request.fulfill({status:200,json:profile('a')}).catch(()=>{});
 if(process.env.PC_EXPECT_OLD_RACE==='true'){
  await page.locator('a.pc-account-link').first().filter({hasText:'Profilo precedente'}).waitFor({state:'attached'});
  console.log('RIPRODOTTO: risposta tardiva A sostituisce il nome del profilo B.');await ctx.close();break;
 }
 await page.waitForTimeout(120);assert.equal(await page.locator('a.pc-account-link').first().innerText(),'Profilo corrente');
 // A failed profile read must be recoverable without signing out.
 mode='failure';await page.goto(base+'/account/contacts',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Non riesco a caricare il tuo profilo'}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'Email e telefono',exact:true}).count(),0);
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/profile-retry-'+width+'.png'});}
 mode='normal';await page.getByRole('button',{name:'Riprova caricamento'}).click();await page.getByRole('heading',{name:'Email e telefono',exact:true}).waitFor();
 mode='mismatch';await page.reload({waitUntil:'networkidle'});await page.getByRole('heading',{name:'Non riesco a caricare il tuo profilo'}).waitFor();
 assert.equal(await page.locator('body').getByText('Profilo precedente',{exact:true}).count(),0);
 logoutError=true;await page.getByRole('button',{name:'Esci dall’account'}).click();
 await page.waitForFunction(()=>!localStorage.getItem('sb-pc-home-test-auth-token')||Array.from(document.querySelectorAll('[role=alert]')).some(e=>e.textContent.includes('Uscita non riuscita')));
 if(await page.evaluate(()=>Boolean(localStorage.getItem('sb-pc-home-test-auth-token')))){
  await page.getByRole('alert').filter({hasText:'Uscita non riuscita'}).waitFor();logoutError=false;await page.getByRole('button',{name:'Esci dall’account'}).click();
 }
 logoutError=false;await page.getByRole('heading',{name:'Non riesco a caricare il tuo profilo'}).waitFor({state:'hidden'});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('sb-pc-home-test-auth-token')||'null')),null);
 mode='failure';await page.goto(base+'/signin',{waitUntil:'networkidle'});
 await page.getByPlaceholder('Email',{exact:true}).fill('b@example.invalid');await page.getByPlaceholder('Password',{exact:true}).fill('synthetic-password');
 await page.getByRole('button',{name:'Accedi',exact:true}).click();await page.getByRole('heading',{name:'Non riesco a caricare il tuo profilo'}).waitFor();
 assert.ok(await page.evaluate(()=>Boolean(localStorage.getItem('sb-pc-home-test-auth-token'))),'login read failure keeps the authenticated session');
 mode='normal';await page.getByRole('button',{name:'Riprova caricamento'}).click();await page.locator('a.pc-account-link').first().filter({hasText:'Profilo corrente'}).waitFor({state:'attached'});
 await ctx.close();console.log('OK: cambio account '+width+'px, risposta tardiva, profilo errato, retry, uscita non confermata e login dal modulo.');
}}finally{await browser.close();}
