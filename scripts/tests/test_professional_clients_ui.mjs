// Synthetic local browser test. No real accounts, mail or Supabase project.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5233';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='ec710000-0000-0000-0000-000000000001',cid='ec710000-0000-0000-0000-000000000003',errors=[];
try{for(const width of [1440,390]){
 const ctx=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/New_York',serviceWorkers:'block'});
 let mode='normal',writeMode='lost',notesFail=false;const writes=[],listCalls=[],notes=[];
 const client={id:cid,full_name:'Cliente di prova',email:'client@example.invalid',phone:null,booking_count:3,total_spend:75,missing_prices:0,last_visit:'2026-10-10T08:00:00Z',next_booking:'2026-10-25T09:00:00Z',dogs:[{id:'ec710000-0000-0000-0002-000000000001',name:'Kyros',breed:'Meticcio / altra razza',photo_url:null}],tags:['Primo percorso']};
 await ctx.addInitScript(id=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id,email:'crm@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
 await ctx.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
  const name=url.pathname.split('/').at(-1);let data=[];
  if(name==='user')data={id:uid,email:'crm@example.invalid',role:'authenticated'};
  if(name==='profiles')data={id:uid,role:'professional',full_name:'Centro di prova',email:'crm@example.invalid',email_verified:true};
  if(name==='professionals')data={id:uid,listing_type:'center',approved:true};
  if(name==='get_professional_client_page'){
   const p=req.postDataJSON();listCalls.push(p);assert.deepEqual(Object.keys(p).sort(),['p_page','p_query']);
   if(mode==='error')return route.fulfill({status:500,json:{message:'Unavailable'}});
   if(mode==='malformed')data=null;
   else data={page:p.p_page,total:mode==='empty'?0:21,rows:mode==='empty'?[]:[{...client,full_name:p.p_page===1?'Cliente seconda pagina':client.full_name}]};
  }
  if(name==='client_notes'){
   assert.equal(req.method(),'GET','CRM never inserts notes directly');
   assert.equal(url.searchParams.get('professional_id'),'eq.'+uid);assert.equal(url.searchParams.get('client_id'),'eq.'+cid);
   if(notesFail)return route.fulfill({status:500,json:{message:'Unavailable'}});
   data=notes;
  }
  if(name==='client_tags')throw new Error('Direct tag write');
  if(name==='save_professional_client_item'){
   const p=req.postDataJSON();writes.push(p);assert.deepEqual(Object.keys(p).sort(),['p_client_id','p_kind','p_request_id','p_text']);
   if(p.p_kind==='note'){
    if(!notes.some(n=>n.id===p.p_request_id))notes.unshift({id:p.p_request_id,content:p.p_text,created_at:'2026-10-17T12:00:00Z'});
    if(writeMode==='lost')return route.abort('failed');
    data=notes.find(n=>n.id===p.p_request_id);
   }else{
    if(writeMode==='lost')return route.fulfill({status:500,json:{message:'Unavailable'}});
    data={id:p.p_request_id,tag:p.p_text,created_at:'2026-10-17T12:00:00Z'};
   }
  }
  return route.fulfill({status:200,json:data});
 });
 const page=await ctx.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/pro/crm',{waitUntil:'domcontentloaded',timeout:45000});
 await page.getByRole('button',{name:'Apri scheda di Cliente di prova'}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'client cards fit viewport');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+'/clients-'+width+'.png',fullPage:true});}
 await page.getByRole('button',{name:'Successiva',exact:true}).click();await page.getByRole('button',{name:'Apri scheda di Cliente seconda pagina'}).waitFor();assert.equal(listCalls.at(-1).p_page,1);
 await page.getByLabel('Cerca per cliente, cane o etichetta').fill('Kyros');await page.getByRole('button',{name:'Cerca',exact:true}).click();
 await page.getByRole('button',{name:'Apri scheda di Cliente di prova'}).waitFor();assert.deepEqual(listCalls.at(-1),{p_query:'Kyros',p_page:0});
 notesFail=true;await page.getByRole('button',{name:'Apri scheda di Cliente di prova'}).click();
 const dialog=page.getByRole('dialog',{name:'Cliente di prova'});await dialog.waitFor();
 await dialog.getByRole('alert').filter({hasText:'caricare gli appunti'}).waitFor();
 assert.ok((await dialog.innerText()).includes('75,00'));
 assert.ok((await dialog.innerText()).includes('10:00'),'uses Rome time rather than browser US time');
 assert.equal(await dialog.getByText('Non hai ancora scritto appunti per questo cliente.').count(),0);
 notesFail=false;await dialog.getByRole('button',{name:'Riprova caricamento appunti'}).click();await dialog.getByText('Non hai ancora scritto appunti per questo cliente.').waitFor();
 await dialog.getByLabel('Nuovo appunto',{exact:false}).fill('Preferisce il sabato.\nConcordare gli orari.');
 await dialog.getByRole('button',{name:'Salva appunto',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'Salvataggio non confermato'}).waitFor();
 assert.equal(await dialog.getByLabel('Nuovo appunto',{exact:false}).inputValue(),'Preferisce il sabato.\nConcordare gli orari.');
 writeMode='normal';await dialog.getByRole('button',{name:'Salva appunto',exact:true}).click();await dialog.getByRole('status').filter({hasText:'Appunto salvato.'}).waitFor();
 assert.equal(writes.at(-1).p_request_id,writes.at(-2).p_request_id,'same UUID on retry');assert.equal(notes.length,1,'lost response creates one note');
 assert.equal(await dialog.getByLabel('Nuovo appunto',{exact:false}).inputValue(),'');await dialog.locator('article').filter({hasText:'Preferisce il sabato'}).waitFor();
 writeMode='lost';await dialog.getByLabel('Nuova etichetta',{exact:false}).fill('Sport');await dialog.getByRole('button',{name:'Aggiungi etichetta'}).click();await dialog.getByRole('alert').filter({hasText:'Salvataggio non confermato'}).waitFor();
 assert.equal(await dialog.getByText('Sport',{exact:true}).count(),0,'failed tag is not displayed as saved');assert.equal(await dialog.getByLabel('Nuova etichetta',{exact:false}).inputValue(),'Sport');
 writeMode='normal';await dialog.getByRole('button',{name:'Aggiungi etichetta'}).click();await dialog.getByText('Sport',{exact:true}).waitFor();
 if(process.env.PC_SCREENSHOTS)await page.screenshot({path:process.env.PC_SCREENSHOTS+'/client-detail-'+width+'.png'});
 assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),'dialog fits viewport');
 await dialog.getByLabel('Nuovo appunto',{exact:false}).fill('Bozza da conservare');
 page.once('dialog',d=>d.dismiss());await page.keyboard.press('Escape');assert.ok(await dialog.isVisible(),'cancel close keeps draft');
 page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 mode='error';await page.getByRole('button',{name:'Aggiorna clienti'}).click();await page.getByRole('alert').filter({hasText:'caricare i clienti'}).waitFor();assert.equal(await page.getByRole('button',{name:'Apri scheda di Cliente di prova'}).count(),0);
 mode='malformed';await page.getByRole('button',{name:'Riprova',exact:true}).click();await page.getByRole('alert').waitFor();
 mode='empty';await page.getByRole('button',{name:'Riprova',exact:true}).click();await page.getByRole('heading',{name:'Nessun risultato per questa ricerca'}).waitFor();
 await ctx.close();console.log('OK: Clienti '+width+'px, ricerca/pagine, errori, nota persa in rete e retry senza duplicati, etichette e bozza.');
}assert.deepEqual(errors,[]);}finally{await browser.close();}
console.log('API simulate; nessun account o dato online modificato.');
