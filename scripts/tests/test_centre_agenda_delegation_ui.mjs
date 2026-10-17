// Local browser fixtures only; no real account, booking, message or external site.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5231';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const centre='e8310000-0000-0000-0000-000000000006',person='e8310000-0000-0000-0000-000000000004',membership='e8310000-0000-0000-0007-000000000020';
const failures=[];
try {for(const width of [1440,390]){
 let permission=false,version='membership-a',readError=false,writeError='',total=2,lessonVersion=null,assigned=null;
 const writes=[],reads=[];
 async function context(kind){
  const uid=kind==='centre'?centre:person,ctx=await browser.newContext({viewport:{width,height:1000},timezoneId:'America/New_York',serviceWorkers:'block'});
  await ctx.addInitScript(id=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic',refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}})),uid);
  await ctx.route('https://**/*',async route=>{
   const request=route.request(),url=new URL(request.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1),p=request.method()==='POST'?request.postDataJSON():{};let data=[];
   if(name==='user')data={id:uid,email:'test@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id:uid,role:kind==='centre'?'professional':'owner',full_name:kind==='centre'?'Centro di prova':'Anna di prova',email:'test@example.invalid',email_verified:true};
   if(name==='professionals')data={id:uid,listing_type:kind==='centre'?'center':'individual',approved:true};
   if(name==='get_my_centre_team')data={enabled:kind==='centre',members:[{id:'own',display_name:'Anna di prova',active:true,version:'roster',assigned_bookings:1}]};
   if(name==='get_my_centre_memberships')data=[{id:membership,instructor_id:'own',instructor_name:'Anna di prova',account_name:'Anna di prova',centre_name:'Centro di prova',status:'active',instructor_active:true,version,is_centre:kind==='centre',can_manage_agenda:permission}];
   if(name==='get_my_centre_lessons')data={items:[],truncated:false};
   if(name==='set_centre_agenda_permission'){assert.equal(kind,'centre');assert.equal(p.p_expected_version,version);permission=p.p_allowed;version=crypto.randomUUID();data={can_manage_agenda:permission,version};}
   if(name==='get_delegated_centre_agenda'){
    reads.push(p);if(readError||!permission)return route.fulfill({status:403,json:{code:'42501',message:'Agenda permission unavailable'}});
    const lesson={id:'lesson',start_at:p.p_day+'T08:00:00Z',end_at:p.p_day+'T09:00:00Z',status:'accepted',service_name:'Lezione di educazione',client_name:'Cliente di prova',dog_names:['Rex'],instructor_id:assigned,instructor_name:assigned?'Marco di prova':null,assignment_version:lessonVersion,can_assign:true,managed_by_centre:false,outside_shift:false,instructor_unavailable:false,overlap_confirmed:false,assigned_by:assigned?'Anna di prova':null};
    data={centre_name:'Centro di prova',membership_version:version,day:p.p_day,page:p.p_page,total,members:[{id:'other',name:'Marco di prova'}],items:p.p_page?[{...lesson,id:'second',client_name:'Cliente seconda pagina'}]:[lesson,{...lesson,id:'self',assigned_by:null,client_name:'Lezione personale',instructor_id:'own',instructor_name:'Anna di prova',can_assign:false,managed_by_centre:true}]};
   }
   if(name==='assign_delegated_centre_instructor'){
    assert.equal(kind,'person');writes.push(p);
    if(writeError)return route.fulfill({status:409,json:{code:writeError,message:'Synthetic conflict'}});
    assigned=p.p_instructor_id;lessonVersion=crypto.randomUUID();data={version:lessonVersion};
   }
   return route.fulfill({status:200,json:data});
  });return ctx;
 }
 const centreContext=await context('centre'),cp=await centreContext.newPage();cp.setDefaultTimeout(10000);cp.on('pageerror',e=>failures.push(e.message));cp.on('dialog',d=>d.accept());
 await cp.goto(base+'/pro/team');await cp.getByText('Coordinamento agenda · non abilitato',{exact:true}).click();await cp.getByRole('button',{name:'Consenti coordinamento',exact:true}).click();await cp.getByText('Coordinamento agenda · abilitato',{exact:true}).waitFor();assert.equal(permission,true);
 const ctx=await context('person'),page=await ctx.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>failures.push(e.message));
 await page.goto(base+'/account/centres');await page.getByRole('button',{name:'Apri agenda del centro',exact:true}).click();await page.getByRole('heading',{name:'Centro di prova',exact:true}).waitFor();
 assert.ok(page.url().includes('/account/centre-agenda?membership='));
 assert.equal(await page.getByRole('button',{name:'Assegna istruttore',exact:true}).count(),1,'own lesson not assignable');
 await page.getByRole('button',{name:'Assegna istruttore',exact:true}).click();
 const modal=page.getByRole('dialog');await modal.waitFor();assert.equal(await modal.locator('option[value="own"]').count(),0);
 await modal.getByLabel('Istruttore',{exact:true}).selectOption('other');
 writeError='PCX01';await modal.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await modal.getByRole('checkbox').waitFor();assert.equal(await modal.getByRole('button',{name:'Salva assegnazione',exact:true}).isEnabled(),false);
 await modal.getByRole('checkbox').check();writeError='PCX04';await modal.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await modal.getByRole('alert').filter({hasText:'fuori dai turni'}).waitFor();assert.equal(await modal.getByRole('checkbox').count(),0);
 writeError='PCX02';await modal.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await modal.getByRole('alert').filter({hasText:'indisponibile'}).waitFor();
 writeError='';await modal.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await page.getByText('Assegnazione salvata con il tuo nome.',{exact:true}).waitFor();await page.getByText('Assegnazione aggiornata da Anna di prova.',{exact:true}).waitFor();
 assert.equal(writes.at(-1).p_membership_id,membership);assert.equal(writes.at(-1).p_instructor_id,'other');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 assert.ok((await page.locator('input[type=date]').boundingBox()).width>=180,'date remains readable on mobile');
 if(process.env.PC_SCREENSHOTS){await mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.PC_SCREENSHOTS+`/agenda-${width}.png`,fullPage:true});}
 await page.getByRole('button',{name:'Cambia istruttore',exact:true}).click();await modal.getByLabel('Istruttore',{exact:true}).selectOption('');writeError='40001';await modal.getByRole('button',{name:'Salva assegnazione',exact:true}).click();await page.getByRole('status').filter({hasText:'I dati sono cambiati'}).waitFor();assert.equal(await modal.isVisible(),false);writeError='';
 total=51;await page.getByRole('button',{name:'Aggiorna agenda',exact:true}).click();await page.getByRole('button',{name:'Successive',exact:true}).click();await page.getByText('Cliente seconda pagina · Rex',{exact:true}).waitFor();assert.equal(reads.at(-1).p_page,1);
 readError=true;await page.getByRole('button',{name:'Aggiorna agenda',exact:true}).click();await page.getByRole('alert').filter({hasText:'Accesso all’agenda non disponibile'}).waitFor();assert.equal(await page.getByText('Cliente seconda pagina · Rex',{exact:true}).count(),0,'revocation clears data');
 await cp.getByText('Coordinamento agenda · abilitato',{exact:true}).click();await cp.getByRole('button',{name:'Revoca coordinamento',exact:true}).click();await cp.getByText('Coordinamento agenda · non abilitato',{exact:true}).waitFor();assert.equal(permission,false);
 await ctx.close();await centreContext.close();console.log('OK: coordinamento agenda',width,'px; permesso, assegnazione, vincoli, versioni, pagine e revoca');
 }
 assert.deepEqual(failures,[]);
} finally {await browser.close();}
console.log('Browser e API simulati. Nessun dato online modificato.');
