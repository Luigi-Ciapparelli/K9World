// Real web UI, two accounts, synthetic transport only; never use production.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.PC_TEST_BASE_URL||'http://127.0.0.1:5281';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const id='aa000000-0000-4000-a000-000000000001',boarding='aa000000-0000-4000-a000-000000000004', owner='aa000000-0000-4000-a000-000000000002',trainer='aa000000-0000-4000-a000-000000000003';
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const booking={id,service_id:id,service_type:'trainer',client_name:'Famiglia sintetica',professional_name:'Centro sintetico',start_at:day+'T08:00:00Z',end_at:day+'T09:00:00Z',service_name:'Lezione base',status:'completed',price:15,notes:'',calendar_color:'#29754c'};
let rows=[],dropReceipt=true,deny=false;const sentIds=[],errors=[];
async function visit(role,width,path) {
  const ctx=await browser.newContext({viewport:{width,height:900},timezoneId:'Europe/Rome',serviceWorkers:'block'});
  const account=role==='owner'?owner:trainer;
  if(role!=='guest')await ctx.addInitScript(({account})=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-local',refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:account,email:'sample@example.invalid',role:'authenticated',aud:'authenticated'}})),{account});
  await ctx.route('**/*', async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin===new URL(base).origin)return route.continue();
    if(url.hostname!=='pc-home-test.supabase.co')return route.abort();
    const name=url.pathname.split('/').at(-1),args=req.postData()?req.postDataJSON():{};
    const ok=json=>route.fulfill({status:200,json});
    if(name==='profiles')return ok({id:account,role,email_verified:true,full_name:'Persona sintetica',email:'sample@example.invalid'});
    if(name==='user')return ok({id:account,email:'sample@example.invalid',role:'authenticated'});
    if(name==='professionals')return ok({id:trainer,approved:true,listing_type:'individual',professional_type:'trainer'});
    if(name==='get_my_schedule')return ok({paused:false,periods:[]});
    if(name==='get_my_centre_team')return ok({enabled:false,members:[]});
    if(name==='get_my_booking_calendar')return ok([booking,{...booking,id:boarding,service_name:'Pensione',service_type:'boarding'}]);
    if(name==='get_my_owner_bookings')return ok([booking]);
    if(name==='get_my_service_reviews')return ok({items:[],count:0,pending_count:0});
    if(name==='get_booking_messages'){
      if(deny)return route.fulfill({status:403,json:{code:'42501',message:'Access changed'}});
      const data=rows.filter(m=>(args.p_after_sequence===null||m.sequence>args.p_after_sequence)&&(args.p_before_sequence===null||m.sequence<args.p_before_sequence));
      if(args.p_after_sequence===null)data.reverse();return ok(data.slice(0,50).map(m=>({...m,from_me:m.sender_kind===role})));
    }
    if(name==='send_booking_message'){
      assert.equal(args.p_booking_id,id);
      let row=rows.find(m=>m.id===args.p_request_id);
      if(!row){row={id:args.p_request_id,sequence:rows.length+1,created_at:new Date().toISOString(),sender_name:role==='owner'?'Famiglia sintetica':'Centro sintetico',sender_kind:role,body:args.p_body,is_automatic:false};rows.push(row);}
      sentIds.push(args.p_request_id);
      if(role==='professional'&&dropReceipt){dropReceipt=false;return route.fulfill({status:200,json:[]});}
      return ok([row]);
    }
    return ok([]);
  });
  const page=await ctx.newPage();page.setDefaultTimeout(9000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+path);return {ctx,page};
}
try{
  const guest=await visit('guest',390,'/impara');
  await guest.page.getByRole('link',{name:/Dal campo a casa: esercizi/}).click();
  await guest.page.getByRole('searchbox').fill('guinzaglio');
  await guest.page.getByRole('link',{name:/Due passi con il guinzaglio morbido/}).click();
  await guest.page.getByRole('heading',{name:'Quando fermarsi'}).waitFor();
  assert.ok(await guest.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(rows.length,0);await guest.ctx.close();
  const pro=await visit('professional',1440,'/#/pro/calendar');
  await pro.page.getByRole('button',{name:'Da provare a casa',exact:true}).click();
  await pro.page.getByRole('button',{name:'Prepara la scheda per la famiglia'}).click();
  await pro.page.getByLabel('Esercizio concordato').selectOption('guinzaglio-morbido');
  await pro.page.getByLabel('Passo concordato').fill('Solo nel cortile, subito dopo la lezione.');
  await pro.page.getByLabel('Ritmo concordato').selectOption('2');
  await pro.page.getByRole('button',{name:'Invia scheda alla famiglia'}).click();
  await pro.page.getByRole('button',{name:'Riprova lo stesso invio'}).click();
  await pro.page.getByRole('heading',{name:'Due passi con il guinzaglio morbido'}).waitFor();
  assert.equal(rows.length,1);assert.equal(sentIds[0],sentIds[1]);
  const family=await visit('owner',390,'/#/owner/bookings');
  await family.page.getByRole('button',{name:/^Messaggi/}).first().click();
  await family.page.getByRole('heading',{name:'Due passi con il guinzaglio morbido'}).waitFor();
  assert.equal(await family.page.getByRole('button',{name:'Prepara la scheda per la famiglia'}).count(),0);
  await family.page.getByRole('button',{name:'Oggi facciamo pausa'}).click();
  await family.page.getByRole('button',{name:'Invia il riscontro di oggi'}).click();
  await family.page.getByText('Ultimo riscontro della settimana:',{exact:false}).waitFor();
  assert.ok((await family.page.getByRole('region',{name:'Dal campo a casa'}).innerText()).includes('0 giorni di pratica segnati'));
  await family.page.getByRole('button',{name:'Ho provato e mi sono fermato'}).click();
  await family.page.getByLabel('Una riga per la prossima lezione').fill('Al cancello si è teso.');
  await family.page.getByRole('button',{name:'Invia il riscontro di oggi'}).click();
  await family.page.getByText(/1 giorno di pratica segnato/).waitFor();
  await pro.page.getByRole('button',{name:'Aggiorna messaggi'}).click();
  await pro.page.getByText(/1 giorno di pratica segnato/).waitFor();
  assert.ok((await pro.page.getByRole('region',{name:'Dal campo a casa'}).innerText()).includes('Al cancello si è teso.'));
  assert.equal(await pro.page.getByRole('button',{name:'Ho provato',exact:true}).count(),0);
  assert.ok(await family.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  deny=true;await pro.page.getByRole('button',{name:'Aggiorna messaggi'}).click();
  await pro.page.getByRole('alert').filter({hasText:'Accesso o assegnazione cambiati'}).waitFor();
  assert.equal(await pro.page.getByText(/Al cancello si è teso/).count(),0);
  assert.equal(rows.length,3);assert.deepEqual(errors,[]);
  console.log('OK: catalogo pubblico su telefono, lezione completata, invio incerto senza duplicati, diario tra centro e famiglia, pausa, revoca e isolamento.');
}finally{await browser.close();}
