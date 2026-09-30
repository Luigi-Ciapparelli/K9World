// Local browser only; all remote APIs intercepted with synthetic responses.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5198';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='e0000000-0000-0000-0000-000000000001';
const state={email:'old@example.invalid',phone:'333-bad',emailVerified:true,phoneVerified:false,emailDeliveryReady:true,smsDeliveryReady:true};
const session=()=>({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:state.email,aud:'authenticated',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{}}});
const errors=[],writes=[];let badCode=true,offline=false,emailOnlyPhase=false;
try{
 const ctx=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
 await ctx.addInitScript(s=>{if(!sessionStorage.getItem('ready')){localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify(s));sessionStorage.setItem('ready','true');}},session());
 await ctx.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),name=url.pathname.split('/').at(-1);
  if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  const body=req.postData()?req.postDataJSON():{};
  const ok=value=>route.fulfill({status:200,json:value});
  if(name==='profiles')return ok({id:uid,email:state.email,phone:state.phone,email_verified:state.emailVerified,phone_verified:state.phoneVerified,full_name:'Utente di prova',role:'owner'});
  if(name==='token')return ok(session());
  if(name==='user')return ok(session().user);
  if(name==='account-contacts'){
   if(body.action==='status')return ok(state);
   writes.push(body);
   if(offline)return route.fulfill({status:503,json:{error:'Invio non completato. Nessun recapito è stato modificato.'}});
   if(body.action==='begin')return ok({id:uid,kind:body.kind,target:body.target,otherTarget:body.target===state[body.kind]?null:body.kind==='phone'?state.email:state.phone,expiresIn:600});
   if(body.action==='complete'){
    if(badCode){badCode=false;return route.fulfill({status:400,json:{error:'Codice non corretto. Controlla i messaggi ricevuti.'}});}
    assert.equal(body.targetCode,'123456');
    if(emailOnlyPhase){assert.equal(body.otherCode,'');state.emailVerified=true;}
    else{assert.equal(body.otherCode,'654321');state.phone='+393331234567';state.phoneVerified=true;}
    return ok({success:true});
   }
  }
  return ok([]);
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/account/contacts');
 await page.getByRole('heading',{name:'Email e telefono',exact:true}).waitFor();
 await page.getByRole('button',{name:'Verifica o correggi telefono',exact:true}).click();
 await page.getByLabel('Telefono da verificare').fill('+393331234567');
 await page.getByRole('button',{name:'Invia codice di conferma',exact:true}).click();
 await page.getByText('Codici inviati.',{exact:false}).waitFor();
 assert.equal(state.phone,'333-bad');
 await page.getByLabel('Codice ricevuto su old@example.invalid').fill('654321');
 await page.getByLabel('Codice ricevuto su +393331234567').fill('123456');
 await page.getByRole('button',{name:'Conferma recapito',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Codice non corretto'}).waitFor();
 assert.equal(state.phone,'333-bad');
 await page.getByRole('button',{name:'Conferma recapito',exact:true}).click();
 await page.getByText('Recapito confermato e aggiornato.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Modifica telefono',exact:true}).waitFor();
 assert.equal(state.phone,'+393331234567');
 await page.getByRole('button',{name:'Modifica email',exact:true}).click();
 await page.getByLabel('Email da verificare').fill('new@example.invalid');offline=true;
 await page.getByRole('button',{name:'Invia codice di conferma',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Invio non completato'}).waitFor();
 assert.equal(await page.getByLabel('Codice ricevuto su new@example.invalid').count(),0);
 assert.equal(state.email,'old@example.invalid');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 await page.setViewportSize({width:1440,height:1000});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 if(process.env.PC_SCREENSHOTS)await page.screenshot({path:process.env.PC_SCREENSHOTS,fullPage:true});
 // Email-only launch: no active phone/change actions, but current email still verifiable.
 assert.equal(writes.filter(w=>w.action==='complete').length,2);
 offline=false;emailOnlyPhase=true;state.smsDeliveryReady=false;state.phoneVerified=false;state.emailVerified=false;
 await page.reload();
 await page.getByRole('button',{name:'Verifica email',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Verifica o correggi telefono',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Verifica email',exact:true}).click();
 assert.equal(await page.getByLabel('Email da verificare').getAttribute('readonly'),'');
 await page.getByRole('button',{name:'Invia codice di conferma',exact:true}).click();
 await page.getByLabel('Codice ricevuto su old@example.invalid').fill('123456');
 assert.equal(await page.getByLabel('Codice ricevuto su +393331234567').count(),0);
 await page.getByRole('button',{name:'Conferma recapito',exact:true}).click();
 await page.getByText('Recapito confermato e aggiornato.',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Modifica email',exact:true}).isDisabled(),true);
 assert.equal(state.emailVerified,true);assert.equal(state.phoneVerified,false);
 await page.setViewportSize({width:390,height:900});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 if(process.env.PC_SCREENSHOTS)await page.screenshot({path:process.env.PC_SCREENSHOTS.replace('.png','-email-only.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.equal(writes.filter(w=>w.action==='complete').length,3);
 await ctx.close();console.log('OK: UI mobile/desktop, percorso solo email e SMS disattivati, telefono errato, doppio codice, errore/retry, aggiornamento verificato e invio fallito. API simulate.');
}finally{await browser.close();}
