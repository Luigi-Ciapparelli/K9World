// Real UI, synthetic tenant. Never send a request to the production data service.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5240';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const out = process.env.PC_SCREENSHOTS;
if (out) await mkdir(out, {recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
const uid='d0000000-0000-0000-0000-000000000001',sid='d0000000-0000-0000-0000-000000000021';
try {
  for (const width of [1440,390]) {
    const ctx=await browser.newContext({viewport:{width,height:width===1440?900:844},timezoneId:'Europe/Rome',serviceWorkers:'block'});
    const centre=width===390,errors=[],writes=[];const records=new Map();
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const service={id:sid,name:'Lezione individuale',duration_minutes:50,calendar_color:'#147D70'};
    let services=[service], injectFailure=false;
    await ctx.addInitScript(({uid,centre})=>{
      localStorage.setItem('pawconnect-theme',centre?'dark':'light');
      localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',token_type:'bearer',expires_at:Date.now()/1000+3600,user:{id:uid,email:'studio@example.invalid',aud:'authenticated',role:'authenticated'}}));
    },{uid,centre});
    await ctx.route('**/*.supabase.co/**',async route=>{
      const req=route.request(),url=new URL(req.url());assert.equal(url.hostname,'pc-home-test.supabase.co');
      const name=url.pathname.split('/').at(-1),body=req.postDataJSON()||{};let value=[];
      if(name==='user')value={id:uid,email:'studio@example.invalid',role:'authenticated'};
      if(name==='profiles')value={id:uid,role:'professional',full_name:'Elena Rossi',email:'studio@example.invalid',email_verified:true};
      if(name==='professionals')value={id:uid,approved:true,approval_status:'approved',listing_type:centre?'center':'individual',professional_type:'trainer'};
      if(name==='get_my_schedule')value={paused:false,periods:[]};
      if(name==='get_my_centre_team')value={enabled:centre,members:centre?[{id:'d0000000-0000-0000-0000-000000000022',display_name:'Istruttore demo',active:true}]:[]};
      if(name==='services')value=services;
      if(name==='list_my_manual_appointments')value=[...records.values()];
      if(name==='save_my_manual_appointment'){
        writes.push(body);
        if(injectFailure){injectFailure=false;return route.fulfill({status:409,json:{code:'PCJ01',message:'Synthetic schedule conflict'}});}
        const when=new Date(body.p_day+'T'+body.p_time+':00Z');
        value=body.p_version+1;
        records.set(body.p_id,{id:body.p_id,version:value,service_id:sid,service_name:service.name,calendar_color:service.calendar_color,duration_minutes:50,
          start_at:when.toISOString(),end_at:new Date(+when+50*60000).toISOString(),dog_label:body.p_dog,instructor_name:body.p_instructor?'Istruttore demo':null,instructor_id:body.p_instructor});
      }
      if(name==='cancel_my_manual_appointment'){value=records.delete(body.p_id);}
      if(name==='get_professional_bookings')return route.fulfill({json:[],headers:{'content-range':'*/0'}});
      return route.fulfill({json:value});
    });
    const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
    await page.goto(base+'/#/pro');
    await page.getByRole('heading',{name:'Ciao, Elena.'}).waitFor();
    assert.equal(await page.locator('.pc-site-header').count(),0);
    const nav=page.getByRole('navigation',{name:'Navigazione professionista',includeHidden:true});
    const menu=page.getByRole('button',{name:'Apri menu professionista'});
    if(width===1440){
      const rail=await page.locator('.pg-rail-inner').boundingBox(),last=await nav.getByRole('link',{name:'Statistiche'}).boundingBox();
      assert.ok(rail.y<3 && rail.height>=895 && last.y+last.height>820);
    }else{assert.equal(await nav.isVisible(),false);await menu.click();}
    await nav.getByRole('link',{name:'Nuovo appuntamento'}).click();
    const d=page.getByRole('dialog',{name:'Nuovo appuntamento'});await d.waitFor();
    assert.equal(await d.getByLabel('Data',{exact:true}).inputValue(),day);
    await d.getByLabel('Ora italiana').fill('12:30');await d.getByLabel('Nome del cane').fill('Kyros');
    if(centre)await d.getByLabel('Istruttore').selectOption({label:'Istruttore demo'});
    await d.getByText('50 min').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(out)await page.screenshot({path:out+'/appuntamento-'+width+'.png'});
    injectFailure=true;await d.getByRole('button',{name:'Salva appuntamento'}).click();await d.getByRole('alert').filter({hasText:'Hai già un impegno'}).waitFor();
    await d.getByLabel('Ora italiana').fill('14:00');await d.getByRole('button',{name:'Salva appuntamento'}).click();
    const card=page.locator('.pg-manual-card').filter({hasText:'Kyros'});await card.waitFor();
    assert.equal(writes.length,2);assert.equal(writes[0].p_id,writes[1].p_id);assert.ok(!Object.keys(writes[1]).some(k=>k.includes('owner')||k.includes('phone')));
    await page.reload();await card.waitFor();assert.equal(await card.getByRole('button',{name:'Accetta'}).count(),0);
    await page.goto(base+'/#/pro');await page.locator('.pg-desk-manual').filter({hasText:'Kyros'}).waitFor();
    if(out)await page.screenshot({path:out+'/studio-'+width+'.png'});
    await page.getByRole('button',{name:'Apri calendario',exact:true}).click();await card.getByRole('button',{name:'Modifica'}).click();
    const edit=page.getByRole('dialog',{name:'Modifica appuntamento'});await edit.getByLabel('Nome del cane').fill('Luna');await edit.getByRole('button',{name:'Salva appuntamento'}).click();
    const edited=page.locator('.pg-manual-card').filter({hasText:'Luna'});await edited.waitFor();assert.equal(writes.at(-1).p_version,1);
    await edited.getByRole('button',{name:'Modifica'}).click();await edit.getByRole('button',{name:'Rimuovi',exact:true}).click();
    await edit.getByRole('button',{name:'Mantieni'}).click();await edit.getByRole('button',{name:'Rimuovi',exact:true}).click();
    await edit.getByRole('button',{name:'Sì, rimuovi'}).click();await edited.waitFor({state:'detached'});assert.equal(records.size,0);
    services=[];await page.getByRole('button',{name:'Aggiungi in questo giorno'}).click();
    await d.getByRole('button',{name:'Configura servizi'}).waitFor();await page.keyboard.press('Escape');await d.waitFor({state:'detached'});
    assert.deepEqual(errors,[]);await ctx.close();
  }
  console.log('OK: desktop e telefono, agenda privata, conflitto, retry, durata, assegnazione, rettifica, rimozione.');
}finally{await browser.close();}
