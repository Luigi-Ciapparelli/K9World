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
   if(name==='professional_credentials')data=complete?[]:[{id:professional,professional_id:professional,verification_version:version,evidence_revision:version===oldVersion?1:2,credential_type:'sport_result',title:version===oldVersion?'Risultato originale':'Risultato rettificato',discipline:'obedience',achievement:'Classe 3',verification_status:'pending',external_url:'https://example.invalid/prova'}];
   if(name==='admin_review_credential_version'){
    const body=req.postDataJSON();reviews.push(body);
    if(failNetwork){failNetwork=false;return route.abort('failed');}
    if(body.p_expected_version===oldVersion){version=newVersion;return route.fulfill({status:409,json:{code:'40001',message:'Credenziale cambiata'}});}
    complete=true;data=null;
   }
   return route.fulfill({status:200,json:data});
  });
  const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/admin');
  await page.getByRole('heading',{name:'Credenziali che richiedono intervento'}).waitFor();
  await page.getByText('Risultato originale',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Verifica',exact:true}).click();
  await page.getByRole('status').filter({hasText:'La credenziale è cambiata'}).waitFor();
  assert.equal(reviews.at(-1).p_expected_version,oldVersion);
  assert.ok(await page.getByRole('button',{name:'Verifica',exact:true}).isEnabled());
  assert.equal(await page.getByText('Credenziale verificata.',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Aggiorna',exact:true}).click();
  await page.getByText('Risultato rettificato',{exact:true}).waitFor();
  failNetwork=true;await page.getByRole('button',{name:'Verifica',exact:true}).click();
  await page.getByRole('status').filter({hasText:/fetch|Verifica non confermata/i}).waitFor();
  assert.ok(await page.getByRole('button',{name:'Verifica',exact:true}).isEnabled());
  assert.equal(await page.getByText('Credenziale verificata.',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Aggiorna',exact:true}).click();
  await page.getByText('Risultato rettificato',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Verifica',exact:true}).click();
  await page.getByText('Credenziale verificata.',{exact:true}).waitFor();
  await page.getByText('Nessuna credenziale richiede revisione manuale.',{exact:true}).waitFor();
  assert.equal(reviews.at(-1).p_expected_version,newVersion);
  assert.equal(reviews.at(-1).p_status,'verified');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/review-'+width+'.png',fullPage:true});}
  await ctx.close();
 }
 assert.deepEqual(errors,[]);
 console.log('OK: administration accessible, stale review rejected, refresh, network recovery and version-bound approval on desktop/mobile. APIs simulated.');
} finally {await browser.close();}
