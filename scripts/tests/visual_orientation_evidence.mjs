// Capture the actual rendered candidate / baseline with identical synthetic data, clock, theme and viewport.
// PC_TEST_BASE_URL must be loopback. All external traffic is intercepted. No production account, media or writes.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = new URL(process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5251');
assert.ok(base.protocol==='http:' && ['localhost','127.0.0.1'].includes(base.hostname), 'local build only');
const group = process.env.PC_VISUAL_STAGE || 'dopo';
assert.ok(['prima','dopo'].includes(group));
const out = path.resolve(process.env.PC_VISUAL_OUTPUT || 'artifacts/orientamento');
const dir = path.join(out, group);
await fs.mkdir(dir, {recursive:true});
const here = path.dirname(fileURLToPath(import.meta.url));
const photo = (await fs.readFile(path.resolve(here,'../../public/media/home/training-768.webp'))).toString('base64');
// A portrait cropped from the project's own illustration. Never read owner-uploaded photos.
const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360"><image x="-105" y="0" width="540" height="360" href="data:image/webp;base64,${photo}"/></svg>`;
const date='2026-11-27', fixed=new Date(date+'T07:45:00Z');
const id=n=>'a0000000-0000-4000-a000-'+String(n).padStart(12,'0');
const longName='Luna del Bosco delle Ginestre', shortName='Milo';
const owner=id(1),pro=id(2),dogId=id(3),dog2=id(4),money=35;
const service={id:id(5),professional_id:pro,name:'Lezione individuale',service_type:'trainer',active:true,price:money,
  description:'Sessione dimostrativa in campo',duration_kind:'hourly',duration_minutes:50,calendar_color:'#237761'};
const dogRows=[
  {id:dogId,owner_id:owner,name:longName,breed:'Pastore tedesco',breed_slug:'pastore-tedesco',fci_group:1,birth_date:'2023-04-12',age:3,weight:24.5,photo_url:owner+'/'+dogId+'/profile',vaccinated:true,aggressive:false,medical_notes:'',created_at:'2024-06-01T10:00:00Z'},
  {id:dog2,owner_id:owner,name:shortName,breed:'Meticcio',breed_slug:null,fci_group:null,birth_date:null,age:0,weight:null,photo_url:null,vaccinated:false,aggressive:false,medical_notes:'',created_at:'2024-04-01T10:00:00Z'},
];
const booking=(n,ts,status,notes)=>({id:id(n),client_id:owner,owner_id:owner,professional_id:pro,
  client_name:'Arianna Demo',professional_name:'Centro dimostrativo Ginestra',start_at:ts,
  end_at:new Date(Date.parse(ts)+50*60000).toISOString(),status,notes,price:money,service_id:service.id,service_name:service.name,service_type:'trainer',calendar_color:service.calendar_color});
const accepted=booking(6,date+'T10:00:00Z','accepted','Riprendiamo la passeggiata al guinzaglio.');
const pending=booking(7,'2026-11-29T13:00:00Z','pending','Una lezione al campo con Milo.');
const manual={id:id(8),version:1,service_id:service.id,service_name:'Puppy class',calendar_color:'#937025',
  start_at:date+'T14:00:00Z',end_at:date+'T14:45:00Z',duration_minutes:45,dog_label:'Nocciola',instructor_id:null,instructor_name:null};
const clients=[
  {id:owner,full_name:'Arianna Demo',email:null,phone:null,dogs:[{id:dog2,name:shortName,breed:'Meticcio',photo_url:null}],tags:['Puppy class'],booking_count:2,total_spend:70,last_visit:'2026-11-20T10:00:00Z',next_booking:accepted.start_at,missing_prices:0},
  {id:id(11),full_name:'Andrea Demo',email:null,phone:null,dogs:[{id:id(12),name:'Nocciola',breed:'Meticcio',photo_url:null}],tags:[],booking_count:1,total_spend:35,last_visit:'2026-11-18T10:00:00Z',next_booking:null,missing_prices:0}
];
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const records=[],failures=[];
const getMode=p=>p===undefined||p===null||p==='anon'?'anon':p.startsWith('owner')?'owner':'professional';
async function prepare(scene,view){
  const role=getMode(scene.person),fresh=scene.person==='owner-new',demoPro=scene.person==='studio-ok';
  const uid=role==='owner'?owner:pro, email=role==='owner'?'famiglia@example.invalid':'campo@example.invalid';
  const user={id:uid,role:'authenticated',aud:'authenticated',email,email_confirmed_at:'2026-01-01T10:00:00Z',confirmed_at:'2026-01-01T10:00:00Z'};
  const ctx=await browser.newContext({viewport:{width:view.width,height:view.height},deviceScaleFactor:1,locale:'it-IT',timezoneId:'Europe/Rome',colorScheme:view.dark?'dark':'light',reducedMotion:'reduce',serviceWorkers:'block'});
  await ctx.addInitScript(({user,role,dark})=>{
    localStorage.setItem('pawconnect-theme',dark?'dark':'light');
    if(role!=='anon')localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'not-a-real-token',refresh_token:'not-a-real-refresh-token',expires_at:2208988800,token_type:'bearer',user}));
  },{user,role,dark:view.dark});
  const boundary=[],reads=[],errors=[];
  await ctx.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===base.origin && req.method()==='GET')return route.continue();
    if(url.hostname!=='pc-home-test.supabase.co'){boundary.push(url.origin);return route.abort();}
    const name=url.pathname.split('/').at(-1);
    const headers={'access-control-allow-origin':base.origin,'access-control-allow-methods':'GET,HEAD,POST,OPTIONS','access-control-allow-headers':req.headers()['access-control-request-headers']||'*','access-control-expose-headers':'Content-Range'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
    const data=req.postData()?JSON.parse(req.postData()):{};
    const list=[accepted,pending];
    const rowsFiltered=()=>{
      let rows=fresh || (role==='professional'&&!demoPro)?[]:[...list];
      const status=url.searchParams.get('status')?.replace(/^eq\./,'');
      if(status)rows=rows.filter(x=>x.status===status);
      for(const t of url.searchParams.getAll('start_at')){const [op,...parts]=t.split('.');const n=Date.parse(parts.join('.'));if(Number.isFinite(n))rows=rows.filter(x=>op==='gt'?Date.parse(x.start_at)>n:op==='gte'?Date.parse(x.start_at)>=n:op==='lt'?Date.parse(x.start_at)<n:Date.parse(x.start_at)<=n);}
      return rows;
    };
    if(url.pathname.includes('/storage/v1/object/sign/')){
      if(req.method()==='POST')return route.fulfill({headers,json:{signedURL:'/object/sign/dog-photos/demo-portrait?token=fixture'}});
      if(req.method()==='GET')return route.fulfill({headers,contentType:'image/svg+xml',body:portrait});
    }
    if(!['POST','GET','HEAD'].includes(req.method()) || (req.method()==='POST'&&!url.pathname.includes('/rpc/')) || /^(save|record|set|change|create|send|cancel|delete|insert|update)_/.test(name)){boundary.push(req.method()+' '+name);return route.abort();}
    reads.push(name);
    let value=[];
    switch(name){
      case 'user':value=user;break;
      case 'profiles':value={id:uid,full_name:role==='owner'?'Arianna Demo':'Elena Demo',role,email,email_verified:true,phone_verified:false,phone:null,location_text:'Rimini',avatar_url:null};break;
      case 'professionals':value={id:pro,approved:demoPro,approval_status:demoPro?'approved':'pending',listing_type:'center',professional_type:'trainer',business_name:'Centro dimostrativo Ginestra',zone_text:scene.person==='studio-zona'?'':'Rimini',latitude:44.06,longitude:12.56,coverage_radius_km:15,bio:'Lavoriamo con le famiglie sulla vita quotidiana e l’educazione del cucciolo.'};break;
      case 'services':value=[service];break;
      case 'professional_credentials':value=[{id:id(15),professional_id:pro,credential_type:'professional_qualification',title:'Qualifica dimostrativa',issuer_name:'ENCI',verification_status:demoPro?'verified':'pending',document_path:'dimostrativo/attestato',external_url:null}];break;
      case 'get_my_centre_team':value={enabled:true,members:[]};break;
      case 'get_my_schedule':value={paused:false,periods:[]};break;
      case 'get_booking_instructors':value=(data.p_booking_ids||[]).map(booking_id=>({booking_id,instructor_id:null,instructor_name:null,version:null,instructor_active:null,can_assign:false}));break;
      case 'get_my_booking_calendar':value=demoPro?[accepted]:[];break;
      case 'list_my_manual_appointments':value=demoPro?[manual]:[];break;
      case 'dogs':{
        const rows=fresh?[]:dogRows;const selected=url.searchParams.get('id');
        value=selected?rows.find(x=>'eq.'+x.id===selected)??null:rows;break;
      }
      case 'get_my_owner_bookings':case 'get_professional_bookings':case 'bookings':value=rowsFiltered();break;
      case 'get_booking_details':value=(data.p_booking_ids||[]).flatMap(booking_id=>{const hit=list.find(x=>x.id===booking_id);return hit?[{booking_id,end_at:hit.end_at,service_name:hit.service_name,service_source:'recorded',dog_names:[hit.id===accepted.id?longName:shortName],dogs_unavailable:false}]:[];});break;
      case 'get_professional_client_page':{
        const q=(data.p_query||'').toLocaleLowerCase('it'), rows=scene.emptyClients?[]:clients.filter(c=>[c.full_name,...c.dogs.map(d=>d.name),...c.tags].some(s=>s.toLowerCase().includes(q)));
        value={page:data.p_page||0,total:rows.length,rows};break;
      }
      case 'get_my_booking_message_inbox':case 'get_booking_message_summaries':case 'get_client_portraits':case 'client_notes':value=[];break;
      default:value=[];
    }
    const count=Array.isArray(value)?value.length:1;
    headers['content-range']=count?'0-'+(count-1)+'/'+count:'*/0';
    return req.method()==='HEAD'?route.fulfill({status:200,headers,body:''}):route.fulfill({headers,json:value});
  });
  const p=await ctx.newPage();p.setDefaultTimeout(9000);p.setDefaultNavigationTimeout(20000);
  await p.clock.setFixedTime(fixed);p.on('pageerror',e=>errors.push(e.message));
  return {ctx,p,reads,boundary,errors};
}
const has=(p,name)=>p.getByText(name,{exact:true}).first().waitFor();
const readyH1=async p=>{await p.locator('h1').first().waitFor();};
const scenes=[
  {id:'home',title:'Prima visita',route:'/',ready:readyH1},
  {id:'accesso',title:'Accesso',route:'/signin',ready:p=>p.getByRole('button',{name:'Accedi',exact:true}).waitFor()},
  {id:'iscrizione',title:'Iscrizione',route:'/signup',ready:p=>group==='prima'?p.getByRole('button',{name:'Continua',exact:true}).waitFor():p.locator('form input').first().waitFor()},
  {id:'cliente',title:'Area cliente con appuntamenti',person:'owner',route:'/#/owner',ready:readyH1},
  {id:'cani',title:'I miei cani · con e senza foto',person:'owner',route:'/#/owner/dogs',ready:async p=>{await has(p,longName);await has(p,shortName);await p.waitForFunction(()=>[...document.images].some(i=>i.src.includes('demo-portrait')&&i.complete&&i.naturalWidth===240));}},
  {id:'cane-senza-peso',title:'Cane senza foto e senza peso',person:'owner',route:'/#/owner/dogs/'+dog2,ready:p=>has(p,shortName)},
  {id:'prenotazioni',title:'Richieste e appuntamenti del cliente',person:'owner',route:'/#/owner/bookings',ready:async p=>{await has(p,'Centro dimostrativo Ginestra');await has(p,'Una lezione al campo con Milo.');}},
  {id:'studio-attesa',title:'Studio · profilo completo in verifica',person:'studio-pending',route:'/#/pro',ready:readyH1},
  {id:'studio-zona',title:'Studio · zona da completare',person:'studio-zona',route:'/#/pro',ready:readyH1},
  {id:'studio-abilitato',title:'Studio · professionista approvato',person:'studio-ok',route:'/#/pro',ready:p=>p.getByText(/Puppy class.*Nocciola/).first().waitFor()},
  {id:'agenda',title:'Agenda con lezione online e appuntamento manuale',person:'studio-ok',route:'/#/pro/calendar',ready:async p=>{await p.getByRole('heading',{name:'Arianna Demo',exact:true}).waitFor();await p.getByRole('heading',{name:'Puppy class · Nocciola',exact:true}).waitFor();}},
  {id:'rubrica',title:'Rubrica · due clienti e i loro cani',person:'studio-ok',route:'/#/pro/crm',ready:async p=>{await has(p,'Arianna Demo');await has(p,'Andrea Demo');}},
];
const views=[{width:1440,height:900,dark:false},{width:1440,height:900,dark:true},{width:375,height:812,dark:false},{width:375,height:812,dark:true}];
const skipped = new Set();
try{
  for(const scene of scenes) for(const view of views){
    const key=scene.id+'-'+view.width+'-'+(view.dark?'scuro':'chiaro'), img=key+'.png';
    const {p,ctx,reads,boundary,errors}=await prepare(scene,view);
    try {
      await p.goto(new URL(scene.route,base).href,{waitUntil:'domcontentloaded'});
      await scene.ready(p);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);
      assert.equal(await p.locator('html').evaluate(el=>el.classList.contains('dark')),view.dark);
      const h1=await p.locator('h1').allTextContents();
      assert.ok(h1.some(v=>v.trim()),'the requested page must be rendered');
      assert.deepEqual(boundary,[],'never contact other hosts or mutate data');assert.deepEqual(errors,[],'no rendering errors');
      const bounds=await p.evaluate(()=>({visible:innerWidth,document:document.documentElement.scrollWidth,elapsedHeight:innerHeight}));
      // Capture the top of the page first, never scroll the screenshot to hide original hierarchy.
      await p.evaluate(()=>scrollTo(0,0));
      await p.screenshot({path:path.join(dir,img),animations:'disabled',caret:'hide',fullPage:false});
      const meta={scene:scene.id,title:scene.title,file:img,viewport:[view.width,view.height],tema:view.dark?'scuro':'chiaro',titleInPage:h1,bounds};
      if(group==='dopo' && ['studio-attesa','studio-zona','studio-abilitato'].includes(scene.id)){
        const actions=p.locator('.pg-day-actions');
        const label={'studio-attesa':'Dettagli della verifica','studio-zona':'Imposta la zona','studio-abilitato':'Nuovo appuntamento'}[scene.id];
        const link=actions.getByRole('link',{name:label,exact:true});await link.waitFor();
        if(scene.id!=='studio-abilitato'){
          assert.equal(await p.getByRole('link',{name:'Nuovo appuntamento',exact:true}).count(),0);
          assert.ok((await link.getAttribute('href')).includes(scene.id==='studio-zona'?'step=area':'step=verification'));
          meta.interazione='La giornata e il menu non offrono un appuntamento che non si può creare.';
        }else{
          await link.focus();await p.keyboard.press('Enter');
          const dialog=p.getByRole('dialog',{name:'Nuovo appuntamento'});await dialog.waitFor();
          const when=dialog.getByLabel('Data',{exact:true}),save=dialog.getByRole('button',{name:'Salva appuntamento'});
          for(const el of [when,save]){await el.scrollIntoViewIfNeeded();assert.ok(await el.evaluate(n=>{const b=n.getBoundingClientRect();const top=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return n===top||n.contains(top);}), 'Azione agenda coperta');}
          await when.focus();assert.ok(await when.evaluate(n=>n===document.activeElement));await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
          meta.interazione='Invio apre un modulo utilizzabile; data e salvataggio restano scoperti. Escape lo chiude.';
        }
      }
      if(group==='dopo' && scene.id==='cani'){
        await has(p,'Peso non indicato');await has(p,'24,5 kg');
        const fits=await p.getByText(longName,{exact:true}).first().evaluate(el=>el.scrollWidth<=el.clientWidth+1 && el.getBoundingClientRect().right<=innerWidth+1);
        assert.ok(fits,'Il nome lungo deve rimanere leggibile');meta.interazione='Foto verticale, nome lungo e peso non indicato.';
      }
      if(group==='dopo' && scene.id==='cane-senza-peso'){await has(p,'Peso non indicato');}
      if(scene.id==='rubrica'){
        await p.getByRole('button',{name:'Apri scheda di Arianna Demo'}).click();
        const dialog=p.getByRole('dialog');await dialog.waitFor();
        await dialog.getByText(shortName,{exact:true}).waitFor();
        await p.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
        const find=p.locator('#client-search');await find.fill('Nocciola');await find.press('Enter');
        await p.waitForFunction(()=>document.body.innerText.includes('Andrea Demo')&&!document.body.innerText.includes('Arianna Demo'));
        meta.interazione='Apertura scheda, cane, Escape e ricerca per cane verificati.';
      }
      if(scene.id==='agenda'){
        const dayRead=p.getByRole('heading',{name:'Puppy class · Nocciola',exact:true});await dayRead.scrollIntoViewIfNeeded();
        const extra=key+'-giorno.png';await p.screenshot({path:path.join(dir,extra),animations:'disabled'});meta.dettaglio=extra;
        meta.interazione='Lezione online e impegno manuale presenti il 27 novembre.';
      }
      if(scene.id==='accesso'){
        // Both targets are interactive controls, irrespective of their original role (button or link).
        const targets=[p.getByText('Password dimenticata?',{exact:true}),p.getByRole('button',{name:'Accedi',exact:true})];
        const ratios=[];for (const control of targets){
          ratios.push(await control.evaluate(el=>{
            const rgba=s=>(s.match(/[\d.]+/g)||[]).map(Number);
            const mix=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*(fg[3]??1)+bg[i]*(1-(fg[3]??1)));
            let bg=[255,255,255];const stack=[];for(let node=el;node;node=node.parentElement)stack.push(getComputedStyle(node).backgroundColor);
            for(const layer of stack.reverse())bg=mix(rgba(layer),bg);
            const fg=mix(rgba(getComputedStyle(el).color),bg);
            const luminance=c=>c.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
            const a=luminance(fg), b=luminance(bg);return Number(((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2));
          }));
        }
        meta.contrasto={recupero:ratios[0],accedi:ratios[1]};
        if(group==='dopo'&&view.dark)assert.ok(ratios.every(x=>x>=4.5),'testo login tema scuro: '+ratios);
      }
      records.push(meta);
      console.log(group+' '+key+' · '+h1.join(' / '));
    }catch(err){
      failures.push({scene:scene.id,view:key,cause:String(err).split('\n')[0]});
      console.error('CAPTURE FAILED',group,key,String(err).slice(0,900));
      if(process.env.CI && !skipped.has(scene.id)){console.log('CONTROLLO',JSON.stringify({heading:await p.locator('h1').allTextContents(),text:(await p.locator('body').innerText()).slice(0,1850),reads:[...new Set(reads)],boundary,errors}).slice(0,3400));skipped.add(scene.id);}
    }finally{await ctx.close();}
  }
} finally {
  await browser.close();
  await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({stage:group,revision:process.env.PC_VISUAL_SHA||null,clock:fixed.toISOString(),data:'Fixture locali. Account e nominativi dimostrativi. Nessun servizio remoto.',captures:records,failures},null,2));
}
assert.equal(failures.length,0,JSON.stringify(failures));assert.equal(records.length,scenes.length*views.length);
console.log('OK: '+records.length+' schermate reali su due schermi e due temi ('+group+').');
