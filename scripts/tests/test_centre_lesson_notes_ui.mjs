// Browser flows with synthetic account/API responses, no real client notes.
import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5226';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000004';
const errors=[];
try {for(const width of [1440,390]) {
 let allowed=false,version=crypto.randomUUID(),uncertain=true,requestIds=[],entries=[],noRelation=false;
 const assignment=crypto.randomUUID(),membership='test-membership',booking='test-lesson';
 const start=new Date(Date.now()-7200000).toISOString(),end=new Date(Date.now()-3600000).toISOString();
 async function session(kind) {
  const uid=kind==='centre'?centre:person,ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',acceptDownloads:true});
  await ctx.addInitScript(uid=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1),p=req.method()==='POST'?req.postDataJSON():{};let data=[];
   if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id:uid,role:kind==='centre'?'professional':'owner',full_name:kind==='centre'?'Centro di prova':'Anna di prova',email:'test@example.invalid',email_verified:true};
   if(name==='professionals')data={id:uid,listing_type:kind==='centre'?'center':'individual',approved:true};
   if(name==='get_my_centre_team')data={enabled:kind==='centre',members:[{id:'instructor',display_name:'Anna di prova',active:true,version:assignment,assigned_bookings:1}]};
   if(name==='get_my_centre_memberships')data=[{id:membership,instructor_id:'instructor',instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',status:'active',instructor_active:true,version,is_centre:kind==='centre',can_record_notes:allowed}];
   if(name==='get_my_centre_lessons')data={items:[{id:booking,start_at:start,end_at:end,status:'accepted',service_name:'Lezione con Rex',centre_name:'Centro di prova',instructor_name:'Anna di prova',client_name:'Cliente di prova',dog_names:['Rex'],membership_id:membership,membership_version:version,assignment_version:assignment,can_record_notes:allowed}],truncated:false};
   if(name==='set_centre_note_permission'){assert.equal(kind,'centre');assert.equal(p.p_expected_version,version);allowed=p.p_allowed;version=crypto.randomUUID();data={version};}
   if(['record_centre_lesson_note','revise_centre_lesson_note','get_centre_lesson_note_context'].includes(name)){
    assert.equal(kind,'person');assert.equal(p.p_membership_id,membership);assert.equal(p.p_assignment_version,assignment);
    if(!allowed)return route.fulfill({status:403,json:{code:'42501'}});
    if(p.p_membership_version!==version)return route.fulfill({status:409,json:{code:'40001'}});
   }
   if(name==='get_centre_lesson_note_context')data={relationships:noRelation?[]:[{id:'relationship',dog_name:'Rex'}],author_name:'Anna di prova'};
   if(name==='record_centre_lesson_note'){
    assert.equal(p.p_relationship_id,'relationship');requestIds.push(p.p_request_id);
    if(!entries.length)entries=[{session_id:p.p_request_id,note_id:'note',booking_id:booking,membership_id:membership,author_name:'Anna di prova',centre_name:'Centro di prova',dog_name:'Rex',occurred_at:start,activity:p.p_activity,revision_number:1,body:p.p_body,change_reason:null,revision_created_at:new Date().toISOString(),allow_continuity:p.p_allow_continuity,has_publication:false}];
    if(uncertain){uncertain=false;return route.fulfill({status:503,json:{message:'Outcome unknown'}});}data=p.p_request_id;
   }
   if(name==='revise_centre_lesson_note'){
    assert.equal(p.p_expected_revision,1);assert.equal(p.p_reason,'Precisazione esercizio');assert.equal(p.p_allow_continuity,false);
    entries.unshift({...entries[0],revision_number:2,body:p.p_body,change_reason:p.p_reason,allow_continuity:false});data=2;
   }
   if(name==='list_my_centre_note_revisions')data=entries.map(e=>({...e,total_count:entries.length}));
   if(name==='withdraw_my_centre_note_consent'){for(const row of entries){row.allow_continuity=false;row.has_publication=false;}data=true;}
   if(name==='list_professional_note_revisions_v2')data=entries.map(e=>({...e,author_name:'Anna di prova · per Centro di prova',can_revise:false}));
   if(kind==='person')assert.ok(!['list_my_dog_relationships','list_professional_note_revisions_v2','record_professional_session','prepare_my_continuity_note','revise_own_professional_note'].includes(name));
   return route.fulfill({status:200,json:data});
  });return ctx;
 }
 const cc=await session('centre'),pc=await session('person');const cp=await cc.newPage(),p=await pc.newPage();
 for(const page of [cp,p]){page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());}
 await cp.goto(base+'/pro/team');await cp.getByText('Note non abilitate',{exact:true}).waitFor();
 await p.goto(base+'/account/centres');await p.getByRole('heading',{name:'Lezione con Rex',exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:'Note della lezione',exact:true}).count(),0);
 await cp.getByRole('button',{name:'Consenti note delle lezioni',exact:true}).click();await cp.getByText('Note abilitate per le sole lezioni assegnate.',{exact:true}).waitFor();
 await p.getByRole('button',{name:'Aggiorna',exact:true}).click();await p.getByRole('button',{name:'Note della lezione',exact:true}).click();
 let dialog=p.getByRole('dialog');await dialog.getByLabel('Nota del lavoro svolto',{exact:true}).fill('Due zampe sulla piattaforma.');
 const consent=dialog.getByRole('checkbox');assert.equal(await consent.isChecked(),false);await consent.check();
 await dialog.getByRole('button',{name:'Salva nota',exact:true}).click();await dialog.getByRole('button',{name:'Riprova lo stesso salvataggio',exact:true}).waitFor();
 assert.ok(await dialog.getByLabel('Nota del lavoro svolto',{exact:true}).isDisabled());await dialog.getByRole('button',{name:'Riprova lo stesso salvataggio',exact:true}).click();await dialog.getByText('Nota salvata nel tuo archivio e in quello del centro.',{exact:true}).waitFor();
 assert.equal(requestIds.length,2);assert.equal(requestIds[0],requestIds[1]);assert.equal(entries.length,1);
 await dialog.getByRole('button',{name:'Rettifica da questa revisione',exact:true}).click();assert.equal(await consent.isChecked(),false);
 await dialog.getByLabel('Nota del lavoro svolto',{exact:true}).fill('Due zampe, due ripetizioni riuscite.');await dialog.getByLabel('Motivo della rettifica',{exact:true}).fill('Precisazione esercizio');await dialog.getByRole('button',{name:'Salva rettifica',exact:true}).click();
 await dialog.getByText('Rettifica salvata. La versione precedente resta nella cronologia.',{exact:true}).waitFor();await dialog.getByText('Due zampe, due ripetizioni riuscite.',{exact:true}).waitFor();assert.equal(entries.length,2);
 await cp.goto(base+'/pro/archive');await cp.getByText('Anna di prova · per Centro di prova',{exact:false}).first().waitFor();assert.equal(await cp.getByRole('button',{name:'Rettifica da questa revisione'}).count(),0);
 for(const page of [p,cp])assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await p.screenshot({path:process.env.PC_SCREENSHOTS+`/note-${width}.png`});await cp.screenshot({path:process.env.PC_SCREENSHOTS+`/archive-${width}.png`,fullPage:true});}
 // Permission is revoked while form remains open: server denies stale page, saved history remains.
 allowed=false;version=crypto.randomUUID();await dialog.getByLabel('Nota del lavoro svolto',{exact:true}).fill('Must not be saved');await dialog.getByRole('button',{name:'Salva nota',exact:true}).click();await dialog.getByText(/Permesso o relazione non più disponibili/).waitFor();assert.equal(entries.length,2);assert.ok(await dialog.getByRole('button',{name:'Riprova lo stesso salvataggio',exact:true}).isDisabled());
 await dialog.getByRole('button',{name:'Chiudi',exact:true}).click();await p.getByRole('button',{name:'Apri i tuoi contributi'}).click();await p.getByText('Due zampe, due ripetizioni riuscite.',{exact:true}).waitFor();
 const download=p.waitForEvent('download');await p.getByRole('button',{name:'Scarica queste revisioni'}).click();const file=await download;const content=await readFile(await file.path(),'utf8');assert.ok(content.includes('Anna di prova')&&content.includes('Revisione 1')&&content.includes('Revisione 2'));assert.ok(!content.includes('membership'));
 await p.getByRole('button',{name:'Ritira consenso della nota'}).click();await p.getByRole('button',{name:'Ritira consenso della nota'}).waitFor({state:'hidden'});assert.ok(entries.every(e=>!e.allow_continuity));
 // Explain missing consent without inventing a relationship.
 allowed=true;version=crypto.randomUUID();noRelation=true;await p.getByRole('button',{name:'Aggiorna',exact:true}).click();await p.getByRole('button',{name:'Note della lezione',exact:true}).click();await p.getByRole('dialog').getByText(/La sola prenotazione non attiva questa autorizzazione/).waitFor();assert.equal(await p.getByRole('dialog').getByRole('button',{name:'Salva nota',exact:true}).count(),0);
 await cc.close();await pc.close();
}assert.deepEqual(errors,[]);console.log('OK: permesso, nota e retry, rettifica, autore nel centro, revoca, archivio personale scaricabile e consenso; desktop/mobile. API simulate.');}finally{await browser.close();}
