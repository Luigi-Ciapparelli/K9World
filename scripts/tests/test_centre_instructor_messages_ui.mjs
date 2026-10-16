// Real browser, synthetic APIs and accounts; no messages leave this local test.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5225';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000004',owner='e8310000-0000-0000-0000-000000000007',instructor='e8310000-0000-0000-0006-000000000020',assignment='e8310000-0000-0000-0008-000000000002';
const errors=[];
try{for(const width of [1440,390]){
 let allowed=false,revision=crypto.randomUUID(),uncertain=true,sendIds=[],markReaders=[],failRead=false;
 const messages=[{id:'m1',sequence:1,sender_name:'Cliente di prova',sender_kind:'owner',body:'Ci troviamo al campo?',created_at:new Date().toISOString(),is_automatic:false}];
 const membership={id:'membership',instructor_id:instructor,instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',status:'active',instructor_active:true,can_complete_lessons:false};
 async function session(kind){
  const uid=kind==='centre'?centre:kind==='person'?person:owner,ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1);let data=[];const p=req.method()==='POST'?req.postDataJSON():{};
   if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id:uid,role:kind==='centre'?'professional':'owner',full_name:kind==='person'?'Anna di prova':'Cliente di prova',email:'test@example.invalid',email_verified:true};
   if(name==='professionals')data={id:uid,listing_type:kind==='centre'?'center':'individual',approved:true};
   if(name==='get_my_centre_team')data={enabled:kind==='centre',members:[{id:instructor,display_name:'Anna di prova',active:true,version:assignment,assigned_bookings:1}]};
   if(name==='get_my_centre_memberships')data=[{...membership,version:revision,is_centre:kind==='centre',can_message_clients:allowed}];
   const lesson={id:'lesson-1',start_at:new Date().toISOString(),end_at:new Date(Date.now()+3600000).toISOString(),status:'accepted',service_name:'Lezione con Rex',centre_name:'Centro di prova',professional_name:'Centro di prova',instructor_name:'Anna di prova',client_name:'Cliente di prova',dog_names:['Rex'],membership_id:'membership',membership_version:revision,assignment_version:assignment,can_message:allowed,message_count:messages.length,unread_count:1,can_complete:false,notes:'Nota della richiesta per il centro'};
   if(name==='get_my_centre_lessons')data={items:[lesson],truncated:false};
   if(name==='get_my_owner_bookings')data=[lesson];
   if(name==='get_booking_message_summaries')data=[{booking_id:'lesson-1',message_count:messages.length,unread_count:1}];
   if(name==='set_centre_message_permission'){
    assert.equal(kind,'centre');assert.equal(p.p_expected_version,revision);allowed=p.p_allowed;revision=crypto.randomUUID();data={version:revision,can_message_clients:allowed};
   }
   if(['get_centre_lesson_messages','send_centre_lesson_message','mark_centre_lesson_messages_read'].includes(name)){
    assert.equal(kind,'person');assert.equal(p.p_membership_id,'membership');assert.equal(p.p_assignment_version,assignment);
    if(!allowed)return route.fulfill({status:403,json:{code:'42501',message:'revoked'}});
    if(p.p_membership_version!==revision)return route.fulfill({status:409,json:{code:'40001',message:'changed'}});
   }
   if(name==='get_centre_lesson_messages'||name==='get_booking_messages'){
    if(failRead&&kind==='person')return route.fulfill({status:503,json:{code:'503',message:'offline'}});
    data=messages.filter(m=>p.p_after_sequence==null||m.sequence>p.p_after_sequence).map(m=>({...m,from_me:kind==='person'?m.sender_kind==='instructor':m.sender_kind==='owner'}));
   }
   if(name==='send_centre_lesson_message'){
    sendIds.push(p.p_request_id);if(!messages.some(m=>m.id===p.p_request_id))messages.push({id:p.p_request_id,sequence:messages.length+1,sender_name:'Anna di prova',sender_kind:'instructor',body:p.p_body,created_at:new Date().toISOString(),is_automatic:false});
    if(uncertain){uncertain=false;return route.fulfill({status:503,json:{code:'503',message:'unknown outcome'}});}
    data=[messages.find(m=>m.id===p.p_request_id)];
   }
   if(name.includes('mark_')&&name.includes('messages_read')){markReaders.push(kind);data=p.p_through_sequence;}
   // Delegated users must not load centre templates or private booking details.
   if(kind==='person')assert.ok(!['list_my_reply_templates','get_my_professional_bookings','get_my_owner_bookings','send_booking_message'].includes(name));
   return route.fulfill({status:200,json:data,headers:{'content-range':'0-0/1','access-control-expose-headers':'content-range'}});
  });return ctx;
 }
 const cc=await session('centre'),pc=await session('person'),oc=await session('owner');
 const centrePage=await cc.newPage(),page=await pc.newPage(),ownerPage=await oc.newPage();
 for(const p of [centrePage,page,ownerPage]){p.setDefaultTimeout(12000);p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());}
 await centrePage.goto(base+'/pro/team');await centrePage.getByText('Messaggi non abilitati',{exact:true}).waitFor();
 await page.goto(base+'/account/centres');await page.getByRole('heading',{name:'Lezione con Rex',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/^Messaggi/}).count(),0);
 await centrePage.getByRole('button',{name:'Consenti messaggi delle lezioni'}).click();await centrePage.getByText('Messaggi abilitati per le sole lezioni assegnate.').waitFor();
 await page.getByRole('button',{name:'Aggiorna',exact:true}).click();await page.getByRole('button',{name:/^Messaggi/}).click();
 await page.getByText('Ci troviamo al campo?',{exact:true}).waitFor();assert.equal(await page.getByText('Nota della richiesta per il centro').count(),0);assert.equal(await page.getByLabel('Usa un modello').count(),0);
 await page.getByLabel('Messaggio',{exact:true}).fill('Sì, al campo alle 17.');await page.getByRole('button',{name:'Invia messaggio',exact:true}).click();await page.getByRole('button',{name:'Riprova lo stesso invio',exact:true}).waitFor();
 await page.getByRole('button',{name:'Riprova lo stesso invio',exact:true}).click();await page.getByText('Sì, al campo alle 17.',{exact:true}).waitFor();assert.equal(sendIds.length,2);assert.equal(sendIds[0],sendIds[1]);assert.equal(messages.length,2);
 await ownerPage.goto(base+'/owner/bookings');await ownerPage.getByRole('button',{name:/^Messaggi/}).click();await ownerPage.getByText('Anna di prova · Istruttore del centro',{exact:true}).waitFor();await ownerPage.getByText('Sì, al campo alle 17.',{exact:true}).waitFor();
 assert.ok(markReaders.includes('person'));assert.ok(!markReaders.includes('centre'));
 for(const p of [page,ownerPage,centrePage])assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+`/instructor-chat-${width}.png`});await ownerPage.screenshot({path:process.env.PC_SCREENSHOTS+`/client-chat-${width}.png`});await centrePage.screenshot({path:process.env.PC_SCREENSHOTS+`/message-permission-${width}.png`,fullPage:true});}
 failRead=true;await page.getByRole('button',{name:'Aggiorna messaggi'}).click();await page.getByText('Messaggi non aggiornati. Riprova tra poco.').waitFor();assert.ok(await page.getByRole('button',{name:'Invia messaggio',exact:true}).isDisabled());failRead=false;
 await page.getByRole('button',{name:'Aggiorna messaggi'}).click();await page.getByText('Messaggi non aggiornati. Riprova tra poco.').waitFor({state:'hidden'});
 await centrePage.getByRole('button',{name:'Rimuovi accesso ai messaggi'}).click();await centrePage.getByText('Accesso ai messaggi rimosso. Le risposte inviate restano visibili.').waitFor();
 await page.getByLabel('Messaggio',{exact:true}).fill('Questo invio deve essere respinto');await page.getByRole('button',{name:'Invia messaggio',exact:true}).click();await page.getByText('Accesso o assegnazione cambiati. Chiudi i messaggi e aggiorna l’agenda prima di riaprire.').waitFor();assert.equal(await page.getByRole('list',{name:'Conversazione'}).getByRole('listitem').count(),0);assert.ok(await page.getByRole('button',{name:'Invia messaggio',exact:true}).isDisabled());assert.equal(messages.length,2);
 // Client still sees the sent reply after permission revocation.
 await ownerPage.getByRole('button',{name:'Aggiorna messaggi'}).click();assert.equal(await ownerPage.getByText('Sì, al campo alle 17.',{exact:true}).count(),1);
 await cc.close();await pc.close();await oc.close();
}assert.deepEqual(errors,[]);console.log('OK: permesso distinto, risposta con autore reale, retry senza duplicati, cliente, letture individuali, errori e revoca a chat aperta; desktop/mobile. API simulate.');}finally{await browser.close();}
