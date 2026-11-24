import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--no-sandbox']});
try {
 for(const [role,path,width] of [['owner','/owner/bookings',390],['professional','/pro/calendar',1360]]){
  const ctx=await browser.newContext({viewport:{width,height:860},serviceWorkers:'block'});const versions=new Map(),writes=[];const id='70000000-0000-0000-0000-000000000001';
  await ctx.addInitScript(id=>localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'local-test',refresh_token:'local-refresh',token_type:'bearer',expires_at:Date.now()/1000+3600,user:{id,email:'owner@example.invalid',role:'authenticated',aud:'authenticated'}})),id);
  await ctx.route('**/*.supabase.co/**',async route=>{const q=route.request(),name=new URL(q.url()).pathname.split('/').at(-1),body=q.postDataJSON()||{};let data=[];
   if(name==='user')data={id,email:'owner@example.invalid',role:'authenticated'};
   if(name==='profiles')data={id,role,full_name:'Socio di prova',email:'owner@example.invalid',email_verified:true};
   if(name==='professionals')data={id,approved:true,approval_status:'approved',listing_type:'individual',professional_type:'trainer'};
   if(name==='get_my_schedule')data={paused:false,periods:[]};if(name==='get_my_centre_team')data={enabled:false,members:[]};
   if(name==='my_calendar_version')data=versions.get(body.p_provider)||null;
   if(name==='change_my_calendar_connection'){assert.equal(body.p_expected,versions.get(body.p_provider)||null);writes.push(body);
    if(body.p_enable){versions.set(body.p_provider,id);data={version:id,token:'a'.repeat(64)};}else{versions.delete(body.p_provider);data={version:null};}}
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data),headers:{'content-range':'*/0','access-control-expose-headers':'Content-Range'}});
  });const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(9000);
  await page.goto(process.env.PC_TEST_BASE_URL+'/#'+path);await page.getByRole('button',{name:'Collega il tuo calendario'}).click();
  const select=page.getByLabel('La tua app');assert.equal(await select.locator('option').count(),4);await select.selectOption('apple');
  await page.getByRole('button',{name:'Crea il mio link privato'}).click();
  assert.match(await page.getByRole('link',{name:'Apri in Calendario Apple'}).getAttribute('href'),/^webcal:\/\//);
  await page.getByRole('button',{name:'Mostra link'}).click();assert.match(await page.getByLabel('Link privato al calendario').inputValue(),/\.ics$/);
  await select.selectOption('outlook');await page.getByRole('button',{name:'Crea il mio link privato'}).waitFor();await select.selectOption('apple');
  await page.getByRole('button',{name:'Disattiva link'}).click();await page.getByRole('button',{name:'Mantieni link'}).click();assert.equal(writes.length,1);
  await page.getByRole('button',{name:'Disattiva link'}).click();await page.getByRole('button',{name:'Conferma disattivazione'}).click();await page.getByRole('button',{name:'Crea il mio link privato'}).waitFor();assert.equal(writes.length,2);
  assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await ctx.close();
 } console.log('OK: cliente su telefono, professionista su desktop, quattro app, attivazione, cambio app e revoca.');
}finally{await browser.close();}
