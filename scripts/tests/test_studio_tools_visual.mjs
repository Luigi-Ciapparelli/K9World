// Run on a local synthetic build only. PC_VISUAL_BASELINE=1 captures comparable unmodified views.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5240', folder=process.env.PC_SCREENSHOTS;
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const baseline=process.env.PC_VISUAL_BASELINE==='1';
const id=n=>'76000000-0000-4000-8000-'+String(n).padStart(12,'0');
const fmt=(days=0)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(new Date(Date.now()+days*864e5));
const start=fmt()+'T10:00:00Z',end=fmt()+'T11:00:00Z';
const client={id:id(2),full_name:'Famiglia Tiglio',email:null,phone:null,booking_count:2,total_spend:60,missing_prices:0,last_visit:start,next_booking:end,dogs:[{id:id(3),name:'Nora',breed:'Meticcio',photo_url:null}],tags:['Puppy class']};
const booking={id:id(4),service_id:id(7),service_name:'Lezione individuale',service_type:'trainer',calendar_color:'#047857',client_name:client.full_name,professional_name:'Centro dimostrativo',status:'accepted',start_at:start,end_at:end,price:30,notes:'Riprendiamo il lavoro al guinzaglio.'};
const manual={id:id(5),service_id:id(8),service_name:'Puppy class',dog_label:'Gruppo cuccioli',start_at:fmt()+'T15:00:00Z',end_at:fmt()+'T16:00:00Z',calendar_color:'#8a5b10',duration_minutes:60,instructor_name:null,version:1};
const pack={id:id(10),pass_id:id(11),name:'Primi passi',professional_name:'Centro dimostrativo',service_name:'Puppy class',client_name:client.full_name,total_uses:5,remaining_uses:3,price:100,expires_at:fmt(18)+'T16:00:00Z',state:'active',version:1};
const sub={id:id(12),name:'Percorso mensile',professional_name:'Centro dimostrativo',service_name:'Lezione individuale',client_name:client.full_name,period_unit:'month',period_uses:4,period_price:120,lifecycle:'open',version:1,latest_start:fmt(-3),latest_end:fmt(18),can_renew:false};
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
if(folder)await mkdir(folder,{recursive:true});
try {
 for(const [width,theme] of [[1440,'light'],[375,'light'],[375,'dark']]){
  const ctx=await browser.newContext({viewport:{width,height:width===375?812:900},colorScheme:theme,locale:'it-IT',timezoneId:'Europe/Rome',serviceWorkers:'block'});
  const errors=[];let role='professional',empty=false,withService=true,model=true,approved=true;
  await ctx.addInitScript(arg=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'demo-local',refresh_token:'demo-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:arg,email:'studio@example.invalid',role:'authenticated',aud:'authenticated',email_confirmed_at:'2025-01-01T12:00:00Z'}})),id(1));
  await ctx.route('https://**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
   const name=url.pathname.split('/').at(-1),body=req.method()==='POST'?req.postDataJSON():{};let data=[];
   if(name==='profiles')data={id:id(1),full_name:'Studio dimostrativo',role,email_verified:true};
   if(name==='user')data={id:id(1),email:'studio@example.invalid',email_confirmed_at:'2025-01-01T12:00:00Z',role:'authenticated',aud:'authenticated'};
   if(name==='professionals')data={id:id(1),listing_type:'center',professional_type:'trainer',business_name:'Centro dimostrativo',zone_text:approved?'Rimini':'',approved,approval_status:approved?'approved':'pending'};
   if(name==='services')data=withService?[{id:id(7),name:'Lezione individuale',service_type:'trainer',duration_minutes:60,active:true}]:[];
   if(name==='get_my_schedule')data={paused:false,periods:[]};
   if(name==='get_my_centre_team')data={enabled:false,members:[]};
   if(name==='get_my_booking_calendar'||name==='get_professional_bookings')data=[booking];
   if(name==='list_my_manual_appointments')data=[manual];
   if(name==='get_booking_details')data=[{booking_id:booking.id,end_at:end,service_name:booking.service_name,service_source:'snapshot',dog_names:['Nora'],dogs_unavailable:false}];
   if(name==='get_my_service_reviews')data={items:[],count:0,pending_count:0};
   if(name==='get_professional_client_page')data={page:0,total:empty?0:1,rows:empty?[]:[client]};
   if(name==='get_my_centre_memberships')data=[{id:id(9),instructor_id:id(6),status:'active',instructor_active:true,is_centre:false,centre_name:'Centro dimostrativo',instructor_name:'Istruttore demo'}];
   if(name==='get_my_centre_lessons')data={items:[{...booking,centre_name:'Centro dimostrativo',dog_names:['Nora']}],truncated:false};
   if(name==='list_my_client_passes')data=[pack];
   if(name==='list_my_subscriptions')data=[sub];
   if(name==='list_own_pass_templates')data=model?[{id:id(11),name:'Percorso',service_active:true,active:true,valid_days:30,total_uses:5,price:100}]:[];
   if(name==='list_own_subscription_plans')data=model?[{id:id(14),name:'Mensile',service_active:true,active:true,period_unit:'month'}]:[];
   if(name==='get_subscription_periods')data=[{remaining_uses:2,starts_on:fmt(-3),ends_on:fmt(18)}];
   if(name==='get_professional_activity_summary')data={from:body.p_from,to:body.p_to,time_zone:'Europe/Rome',as_of:start,total:0,completed:0,pending:0,accepted:0,declined:0,cancelled:0,other:0,customers:0,returning_customers:0,returning_percent:null,completed_value:0,missing_prices:0,service_groups:0,top_services:[]};
   if(/^(save_|record_|issue_|change_|assign_|cancel_|renew_)/.test(name))throw Error('Read-only visual test attempted to mutate '+name);
   return route.fulfill({json:data,headers:{'content-range':'0-0/1','access-control-expose-headers':'content-range'}});
  });
  const p=await ctx.newPage();p.setDefaultTimeout(9000);p.on('pageerror',e=>errors.push(e.message));
  const visit=pathname=>p.goto(base+'/#'+pathname,{waitUntil:'domcontentloaded'});
  const shot=async(label)=>{if(!folder)return;await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:path.join(folder,`${baseline?'prima':'dopo'}-${label}-${width}-${theme}.png`),animations:'disabled'});};
  await visit('/pro/calendar');
  const day=p.getByRole('region',{name:'Impegni del giorno'});await day.getByRole('heading',{name:client.full_name,exact:true}).waitFor();await day.getByText(/Puppy class · Gruppo cuccioli/).waitFor();
  await shot('agenda');
  if(!baseline){
    const month=p.getByRole('region',{name:'Calendario mensile'}),d=await day.boundingBox(),m=await month.boundingBox();assert.ok(d&&m);
    if(width===375){assert.ok(d.y+d.height<=m.y+2,'day before month');assert.ok(d.y<812,'day visible on first screen');}
    else assert.ok(d.x+d.width<=m.x+2 && Math.abs(d.y-m.y)<5,'day and month share one row');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await p.getByRole('button',{name:'Giorno successivo'}).click();await day.getByText('Nessun impegno per questo giorno e questi filtri.').waitFor();
    await p.getByRole('button',{name:'Oggi',exact:true}).click();await day.getByRole('heading',{name:client.full_name,exact:true}).waitFor();
    const shortcuts=p.getByRole('navigation',{name:'Strumenti del calendario'});const absence=shortcuts.getByRole('button',{name:'Indisponibilità'});await absence.focus();await p.keyboard.press('Enter');assert.equal(await p.locator(':focus').getAttribute('id'),'pc-calendar-absence');
    await p.getByLabel('Primo giorno').focus();assert.ok(await p.getByLabel('Primo giorno').evaluate(el=>el===document.activeElement));
  }
  await visit('/pro/crm');const card=p.getByRole('button',{name:'Apri scheda di Famiglia Tiglio'});await card.waitFor();await shot('rubrica');await card.focus();await p.keyboard.press('Enter');await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');
  if(!baseline){
    empty=true;await p.getByRole('button',{name:'Aggiorna clienti'}).click();const open=p.getByRole('link',{name:'Vai alle richieste'});await open.click();await p.getByRole('heading',{name:'Richieste e messaggi'}).waitFor();await p.getByRole('button',{name:'Messaggi',exact:true}).waitFor();
    await visit('/account/centres');const assigned=p.getByRole('region',{name:'La tua agenda nei centri'});await assigned.getByText('Famiglia Tiglio · Nora').waitFor();await p.getByText('Collegato',{exact:false}).first().waitFor();assert.ok((await assigned.boundingBox()).y<(await p.getByRole('region',{name:'Collegati a un centro'}).boundingBox()).y);
    await visit('/pro/analytics');await p.getByRole('button',{name:'Ultimi 90 giorni'}).click();assert.equal(await p.getByRole('button',{name:'Ultimi 90 giorni'}).getAttribute('aria-pressed'),'true');await p.getByText('Intervallo applicato').waitFor();
    withService=false;model=false;await visit('/pro/passes');await p.getByRole('link',{name:'Configura un servizio'}).waitFor();withService=true;await p.reload();await p.getByRole('button',{name:'Crea il primo modello'}).waitFor();model=true;await p.reload();await p.getByRole('button',{name:'Scegli un cliente'}).waitFor();
    const tabs=p.getByRole('navigation',{name:'Lezioni'});await tabs.getByRole('link',{name:'Abbonamenti'}).click();await p.getByRole('group',{name:'Sezioni abbonamenti'}).waitFor();
    role='owner';await visit('/owner/passes');await p.getByRole('heading',{name:'Primi passi'}).waitFor();await p.getByText(/Scadenza:/).waitFor();await tabs.getByRole('link',{name:'Abbonamenti'}).click();await p.getByText('2 lezioni disponibili').scrollIntoViewIfNeeded();await p.getByText('2 lezioni disponibili').waitFor();await p.getByText(/Periodo utilizzabile/).waitFor();
  }
  assert.deepEqual(errors,[]);await ctx.close();
 }
 console.log('OK Studio: agenda mista e rubrica con scheda cliente nei due temi; controlli a 375 px, tastiera, lezioni, collaborazioni e intervallo statistiche. '+(baseline?'Confronto precedente.':'Versione aggiornata.'));
}finally{await browser.close();}
