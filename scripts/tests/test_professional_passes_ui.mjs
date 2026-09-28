// Vite: synthetic backend pc-passes-test.supabase.co. No production requests.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5190';
const screenshotDir=process.env.PC_SCREENSHOTS;
if(screenshotDir) await fs.mkdir(screenshotDir,{recursive:true});
const uid=n=>`d0000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const service={id:uid(101),name:'Lezione individuale',active:true};
const calls=[];const errors=[];let models=[];let packs=[];let events=[];let failIssue=true;let failList=false;
const ago=new Date(Date.now()-86400000).toISOString();
async function setup(role='professional',viewport={width:1440,height:1000}){
 const context=await browser.newContext({viewport});
 const user={id:uid(role==='professional'?1:11),email:'synthetic@example.invalid',aud:'authenticated',role:'authenticated'};
 const session={access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
 await context.addInitScript(session=>localStorage.setItem('sb-pc-passes-test-auth-token',JSON.stringify(session)),session);
 await context.route('**/*.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),name=url.pathname.split('/').at(-1);
  assert.equal(url.hostname,'pc-passes-test.supabase.co','No real backend permitted');
  const body=req.method()==='POST'?req.postDataJSON():{};calls.push({name,body,role});let data=[];
  if(name==='profiles') data=[{...user,role,full_name:role==='professional'?'Anna Educatrice':'Marco Proprietario',email_verified:true}];
  else if(name==='user') data=user;
  else if(name==='services') data=[service];
  else if(name==='get_professional_clients') data=[{id:uid(11),full_name:'Marco Proprietario'}];
  else if(name==='list_own_pass_templates') data=models;
  else if(name==='list_my_client_passes') {
   if(failList) return route.fulfill({status:503,json:{message:'Synthetic outage'}});
   data=packs.filter(p=>!url.searchParams.get('state')||url.searchParams.get('state')===`eq.${p.state}`);
  }
  else if(name==='save_own_pass_template') {
   const m={id:body.p_id,name:body.p_name,description:body.p_description,total_uses:body.p_total_uses,price:body.p_price,valid_days:body.p_valid_days,service_id:body.p_service_id,service_name:service.name,service_active:true,active:true,version:body.p_version+1};
   models=[...models.filter(x=>x.id!==m.id),m];data=m.id;
  }
  else if(name==='set_own_pass_template_active'){models=models.map(m=>m.id===body.p_id?{...m,active:body.p_active,version:m.version+1}:m);data=null;}
  else if(name==='issue_client_pass'){
   if(!packs.some(p=>p.id===body.p_id)){
    const m=models.find(m=>m.id===body.p_template_id);
    packs.push({id:body.p_id,pass_id:m.id,client_name:'Marco Proprietario',professional_name:'Anna Educatrice',name:m.name,service_name:m.service_name,total_uses:m.total_uses,remaining_uses:m.total_uses,price:m.price,purchased_at:ago,expires_at:new Date(Date.now()+86400000*30).toISOString(),state:'active',cancellation_reason:null,version:1});
   }
   if(failIssue){failIssue=false;return route.fulfill({status:503,json:{message:'Lost acknowledgement'}});}
   data=body.p_id;
  }
  else if(name==='list_pass_eligible_bookings') data=[{id:uid(201),start_at:new Date(Date.now()-3600000*2).toISOString(),service_name:service.name}];
  else if(name==='record_pass_use'){
   await new Promise(resolve=>setTimeout(resolve,150));
   const p=packs.find(p=>p.id===body.p_client_pass_id);p.remaining_uses--;p.version++;
   events.push({id:body.p_id,kind:'use',delta:-1,occurred_at:body.p_occurred_at||new Date().toISOString(),description:body.p_description||service.name,reversed_at:null,reversal_of:null,created_at:new Date().toISOString()});data=body.p_id;
  }
  else if(name==='get_client_pass_events') data=events;
  else if(name==='reverse_pass_use'){
   const event=events.find(e=>e.id===body.p_use_id);event.reversed_at=new Date().toISOString();packs[0].remaining_uses++;packs[0].version++;
   events.push({id:body.p_id,kind:'reversal',delta:1,occurred_at:new Date().toISOString(),description:body.p_reason,reversal_of:body.p_use_id,created_at:new Date().toISOString()});data=body.p_id;
  }
  else if(name==='cancel_own_client_pass'){packs[0].state='cancelled';packs[0].cancellation_reason=body.p_reason;packs[0].version++;data=null;}
  await route.fulfill({status:200,json:data});
 });
 const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 return {page,context};
}
try{
 const {page,context}=await setup();
 await page.goto(base+'/#/pro/passes');await page.getByRole('heading',{name:'Pacchetti di lezioni',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Nessun pacchetto assegnato'}).waitFor();
 await page.getByRole('button',{name:'Modelli',exact:true}).click();
 await page.getByRole('button',{name:'Nuovo modello',exact:true}).click();
 await page.getByLabel('Nome del pacchetto').fill('Percorso cinque lezioni');
 await page.getByLabel('Servizio incluso').selectOption(service.id);
 await page.getByLabel('Numero di lezioni').fill('5');await page.getByLabel('Prezzo totale (€)').fill('125');
 await page.getByRole('button',{name:'Salva modello'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByText('5 lezioni · 125,00').waitFor();
 await page.getByRole('button',{name:'Pacchetti dei clienti',exact:true}).click();
 await page.getByRole('button',{name:'Assegna pacchetto',exact:true}).click();
 await page.getByLabel('Modello',{exact:true}).selectOption(models[0].id);
 await page.getByLabel('Cliente',{exact:true}).selectOption(uid(11));
 await page.getByRole('button',{name:'Conferma assegnazione'}).click();
 await page.getByRole('alert').getByText(/Operazione non completata/).waitFor();
 await page.getByRole('button',{name:'Conferma assegnazione'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 const issues=calls.filter(c=>c.name==='issue_client_pass');assert.equal(issues.length,2);assert.equal(issues[0].body.p_id,issues[1].body.p_id,'retry reuses operation UUID');assert.equal(packs.length,1);
 const card=page.getByRole('article');await card.getByText('Marco Proprietario').waitFor();
 await card.getByRole('button',{name:'Registra lezione'}).click();
 await page.getByLabel('Breve descrizione visibile al cliente').fill('Esercizi di gestione quotidiana');
 await page.getByRole('button',{name:'Scala una lezione'}).evaluate(button=>{button.click();button.click();});
 await page.getByRole('dialog').waitFor({state:'hidden'});await card.getByText('4 / 5 lezioni residue').waitFor();
 assert.equal(calls.filter(c=>c.name==='record_pass_use').length,1,'double click not double debit');
 await card.getByRole('button',{name:'Storico',exact:true}).click();
 await page.getByText('Esercizi di gestione quotidiana',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Storna questa lezione'}).click();
 await page.getByLabel('Motivo visibile al cliente').fill('Lezione registrata sul cliente sbagliato');
 await page.getByRole('button',{name:'Conferma storno'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await card.getByText('5 / 5 lezioni residue').waitFor();
 await card.getByRole('button',{name:'Storico',exact:true}).click();await page.getByText('Lezione stornata',{exact:true}).waitFor();await page.getByText('+1 · Storno',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Storna questa lezione'}).count(),0);
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 await card.getByRole('button',{name:'Registra lezione'}).click();await page.getByLabel('Come vuoi registrarla?').selectOption('booking');
 await page.getByLabel('Prenotazione',{exact:true}).selectOption(uid(201));await page.getByRole('button',{name:'Scala una lezione'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 assert.equal(calls.filter(c=>c.name==='record_pass_use').at(-1).body.p_booking_id,uid(201));
 await card.getByText('4 / 5 lezioni residue').waitFor();
 if(screenshotDir)await page.screenshot({path:`${screenshotDir}/pacchetti-professionista.png`,fullPage:true});
 failList=true;await page.getByRole('button',{name:'Aggiorna elenco'}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('article').count(),0,'load failure not shown as stale data');
 failList=false;await page.getByRole('button',{name:'Aggiorna elenco'}).click();await card.waitFor();
 await card.getByRole('button',{name:'Annulla pacchetto'}).click();await page.getByLabel('Motivo visibile al cliente').fill('Accordo concluso con il cliente');await page.getByRole('button',{name:'Conferma annullamento'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await card.getByText('Annullato',{exact:true}).waitFor();assert.equal(await card.getByRole('button',{name:'Registra lezione'}).count(),0);
 await page.getByRole('button',{name:'Modelli',exact:true}).click();await page.getByRole('button',{name:'Archivia modello'}).click();await page.getByText('Archiviato',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Pacchetti dei clienti',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Assegna pacchetto',exact:true}).isDisabled(),true);
 await context.close();
 const owner=await setup('owner',{width:390,height:844});await owner.page.goto(base+'/#/owner/passes');
 await owner.page.getByRole('heading',{name:'I miei pacchetti',exact:true}).waitFor();await owner.page.getByRole('article').waitFor();
 assert.equal(await owner.page.getByRole('button',{name:'Registra lezione'}).count(),0);assert.equal(await owner.page.getByRole('button',{name:'Modelli',exact:true}).count(),0);
 assert.equal(await owner.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow on mobile');
 if(screenshotDir)await owner.page.screenshot({path:`${screenshotDir}/pacchetti-proprietario-mobile.png`,fullPage:true});
 await owner.page.getByRole('button',{name:'Storico',exact:true}).click();await owner.page.getByText('+1 · Storno',{exact:true}).waitFor();
 assert.equal(await owner.page.getByRole('button',{name:'Storna questa lezione'}).count(),0);
 await owner.context.close();assert.deepEqual(errors,[]);console.log('OK: creazione, assegnazione con retry, doppio clic, lezione manuale/prenotata, storico, storno, annullamento, archivio, errore di rete e proprietario mobile. Backend simulato.');
}finally{await browser.close();}
