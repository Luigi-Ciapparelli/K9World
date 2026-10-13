// Real administration page, synthetic session/APIs: no live accounts or provider.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5212';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const admin='d0000000-0000-0000-0000-000000000008';
const professional='d0000000-0000-0000-0000-000000000001';
const oldVersion='d0000000-0000-0000-0000-000000000011';
const newVersion='d0000000-0000-0000-0000-000000000012';
const errors=[];
try {
 for(const width of [1440,390]){
  const ctx=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'});
  await ctx.addInitScript(admin=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:admin,email:'admin@example.invalid',aud:'authenticated',role:'authenticated'}})),admin);
  let version=oldVersion,complete=false,failNetwork=false;
  const reviews=[];
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(!url.hostname.endsWith('.supabase.co'))return route.abort();
   assert.equal(url.hostname,'pc-home-test.supabase.co');
   const name=url.pathname.split('/').at(-1);let data=[];
   if(name==='user')data={id:admin,email:'admin@example.invalid',role:'authenticated'};
   if(name==='profiles'){
    const profile={id:admin,full_name:'Admin di prova',role:'admin',email:'admin@example.invalid',email_verified:true};
    data=url.searchParams.get('id')==='eq.'+admin?profile:[profile,{id:professional,full_name:'Professionista di prova'}];
   }
   if(name==='professional_external_identities')data=complete?[]:[{id:professional,professional_id:professional,verification_version:version,profile_url:'https://www.working-dog.com/user/Professionista-34',provider_user_id:'34',verification_status:'pending',verification_note:'Collegamento ricevuto'}];
   if(name==='review_working_dog_identity'){
    const body=req.postDataJSON();reviews.push(body);
    if(failNetwork){failNetwork=false;return route.abort('failed');}
    if(body.p_expected_version===oldVersion){version=newVersion;return route.fulfill({status:409,json:{code:'40001',message:'Collegamento cambiato'}});}
    complete=true;data=null;
   }
   return route.fulfill({status:200,json:data});
  });
  const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/admin');
  const panel=page.locator('section').filter({has:page.getByRole('heading',{name:'Collegamenti Working-Dog',exact:true})});
  await panel.getByText('Professionista di prova',{exact:true}).waitFor();
  const approve=panel.getByRole('button',{name:'Conferma titolarità',exact:true});
  assert.ok(await approve.isDisabled());
  await panel.getByRole('textbox').fill('Verifica diretta sintetica del controllo account');
  assert.ok(await approve.isDisabled());
  await panel.getByRole('checkbox').check();
  await approve.click();
  await panel.getByRole('status').filter({hasText:'Il collegamento è cambiato'}).waitFor();
  assert.equal(reviews.at(-1).p_expected_version,oldVersion);
  await panel.getByRole('button',{name:'Aggiorna',exact:true}).click();
  await panel.getByText('Professionista di prova',{exact:true}).waitFor();
  assert.ok(await approve.isDisabled());
  await panel.getByRole('textbox').fill('Verifica diretta sintetica della nuova versione');
  await panel.getByRole('checkbox').check();
  await approve.click();
  await panel.getByRole('status').filter({hasText:'Titolarità verificata'}).waitFor();
  assert.equal(reviews.at(-1).p_expected_version,newVersion);
  assert.equal(reviews.at(-1).p_status,'verified');
  assert.equal(await panel.getByRole('button',{name:'Conferma titolarità',exact:true}).count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  await ctx.close();

 }
 assert.deepEqual(errors,[]);
 console.log('OK: administration accessible, stale review rejected, refresh and version-bound approval on desktop/mobile. APIs simulated.');
} finally {await browser.close();}
