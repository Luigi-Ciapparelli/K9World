// Real browser decoding/compression, synthetic accounts and intercepted Storage APIs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5207';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const proId='e9100000-0000-0000-0000-000000000002', ownerId='e9100000-0000-0000-0000-000000000001', bid='e9100000-0000-0000-0000-000000000100';
const host='https://pc-home-test.supabase.co', files=new Map(), errors=[], writes=[];
let avatar='',cover='',failCover=false;
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1sAAAAASUVORK5CYII=','base64');
async function context(role,width) {
 const ctx=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'});
 const uid=role==='owner'?ownerId:proId;
 await ctx.addInitScript(({uid})=>{localStorage.setItem('pawconnect-theme','light');localStorage.setItem('sb-pc-home-test-auth-token',JSON.stringify({access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user:{id:uid,email:'test@example.invalid',aud:'authenticated',role:'authenticated'}}));},{uid});
 await ctx.route('https://**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),name=url.pathname.split('/').at(-1),method=req.method();
  if(url.hostname!=='pc-home-test.supabase.co') return route.abort();
  const ok=(data,headers={})=>route.fulfill({status:200,json:data,headers:{'access-control-expose-headers':'content-range',...headers}});
  if(url.pathname.startsWith('/storage/v1/object/')) {
   if(method==='GET'){const key=url.pathname.replace(/^\/storage\/v1\/object\/(public|sign)\//,'');const stored=files.get(key);return route.fulfill({status:200,body:stored||image,contentType:stored?'image/webp':'image/png'});}
   if(url.pathname==='/storage/v1/object/sign/client-portraits') {
    const body=req.postDataJSON();assert.equal(body.expiresIn,60);
    return ok(body.paths.map(path=>({path,signedURL:`/object/sign/client-portraits/${path}?token=synthetic`})));}
   if(method==='DELETE'){const body=req.postDataJSON();for(const path of body.prefixes)files.delete(`${name}/${path}`);return ok([]);}
   if(method==='POST') {
    const key=url.pathname.split('/object/')[1], body=req.postDataBuffer();
    assert.match(body.toString('latin1'),/image\/webp/);assert.ok(body.includes(Buffer.from('WEBP')));
    assert.ok(body.length < (key.startsWith('client-portraits')?132500:key.endsWith('avatar.webp')?165000:513500));
    assert.equal(req.headers()['x-upsert'],'true');const start=body.indexOf(Buffer.from('RIFF'));assert.ok(start>=0);files.set(key,body.subarray(start,start+8+body.readUInt32LE(start+4))); writes.push({kind:'upload',key});return ok({Key:key});
   }
  }
  const profile={id:uid,full_name:role==='owner'?'Cliente di prova':'Centro di prova',role,email:'test@example.invalid',email_verified:true,avatar_url:role==='professional'?avatar:''};
  const pro={id:proId,professional_type:'trainer',listing_type:'individual',bio:'Un percorso insieme.',zone_text:'Rimini',latitude:44,longitude:12,coverage_radius_km:20,starting_price:25,approved:true,approval_status:'approved',cover_photo_url:cover};
  const publicPro={...pro,display_name:'Centro di prova',avatar_url:avatar,rating:0,review_count:0,entity_kind:'individual',matching_services:[{id:'s',name:'Lezione',service_type:'trainer',price:25}]};
  if(name==='user')return ok({id:uid,email:profile.email,role:'authenticated'});
  if(name==='profiles') {
   if(method==='PATCH'){assert.equal(role,'professional');avatar=req.postDataJSON().avatar_url;writes.push({kind:'profile',role});return ok({id:uid});}
   return ok(profile);
  }
  if(name==='professionals') {
   if(method==='PATCH') {if(failCover){failCover=false;return route.fulfill({status:500,json:{message:'Injected persistence failure'}});}cover=req.postDataJSON().cover_photo_url;return ok({id:proId});}
   return ok(pro);
  }
  if(name==='get_client_portraits') {
   const p=req.postDataJSON(),object_path=ownerId+'/portrait.webp';
   return ok(files.has('client-portraits/'+object_path)?[{client_id:ownerId,booking_id:p.p_booking_ids?.length?bid:null,object_path}]:[]);
  }
  if(name==='get_public_booking_availability')return ok({paused:false,periods:[]});
  if(name==='public_professional_profiles')return ok(publicPro);
  if(name==='search_public_professionals'||name==='search_sport_professionals'||name==='search_exhibition_professionals')return ok([publicPro]);
  if(name==='get_public_professional_services')return ok([{id:'s',name:'Lezione',service_type:'trainer',price:25,duration_minutes:60,duration_kind:'hourly'}]);
  if(name==='get_professional_bookings')return ok([{id:bid,client_name:'Cliente di prova',status:'pending',start_at:new Date(Date.now()+86400000).toISOString(),price:25,notes:'Nota visibile',request_priority:0}],{'content-range':'0-0/1'});
  if(name==='get_professional_clients')return ok([{id:ownerId,full_name:'Cliente di prova',email:'test@example.invalid',dogs:[],tags:[]}]);
  if(name==='get_my_service_reviews')return ok({items:[],count:0,pending_count:0});
  if(name==='booking_rules')return ok({min_lead_hours:4,cancellation_hours:24,min_duration_minutes:30,max_duration_minutes:480,buffer_minutes:15});
  if(name==='professional_external_identities')return ok(null);
  if(name==='account-contacts')return ok({email:profile.email,phone:'',emailVerified:true,phoneVerified:false,emailDeliveryReady:true,smsDeliveryReady:false});
  return ok([]);
 });
 const page=await ctx.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});
 return {page,ctx};
}
async function fixture(page){return Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2400;c.height=1600;const x=c.getContext('2d');x.fillStyle='#163d2a';x.fillRect(0,0,c.width,c.height);x.fillStyle='#d5a33a';x.fillRect(400,200,1600,1200);return c.toDataURL('image/png').split(',')[1];}),'base64');}
try {
 const {page,ctx}=await context('professional',1440);
 await page.goto(base+'/pro/settings?step=appearance');
 const a=page.getByRole('region',{name:'Foto o logo della tua attività'}),c=page.getByRole('region',{name:'Banner del profilo'});
 await c.waitFor();
 const png=await fixture(page), upload={name:'sample.png',mimeType:'image/png',buffer:png};
 await a.locator('input[type=file]').setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('<svg onload="alert(1)"></svg>')});
 await a.getByRole('status').filter({hasText:'non è un’immagine'}).waitFor();assert.equal(writes.length,0);
 await a.locator('input[type=file]').setInputFiles(upload);
 await a.getByRole('button',{name:'Salva foto',exact:true}).click();await a.getByRole('status').filter({hasText:'Foto salvata'}).waitFor();
 assert.match(avatar,/\/avatar\.webp\?v=/);
 await c.locator('input[type=file]').setInputFiles(upload);
 await c.getByLabel('Posizione verticale').press('Home');
 await c.getByLabel('Posizione verticale').press('ArrowRight');
 failCover=true;await c.getByRole('button',{name:'Salva foto',exact:true}).click();await c.getByRole('status').filter({hasText:'collegamento al profilo'}).waitFor();
 await c.getByRole('button',{name:'Salva foto',exact:true}).click();await c.getByRole('status').filter({hasText:'Foto salvata'}).waitFor();
 assert.equal([...files.keys()].filter(key=>key.startsWith('professional-branding/')).length,2);
 if(process.env.PC_SCREENSHOTS){await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:process.env.PC_SCREENSHOTS+'/professional-desktop.png',fullPage:true});}
 await page.goto(base+'/search?type=trainer');await page.getByRole('img',{name:'Centro di prova · foto o logo'}).waitFor();
 await page.goto(base+'/p/'+proId);await page.locator(`img[src="${cover}"]`).waitFor();await page.locator(`img[src="${avatar}"]`).waitFor();
 await ctx.close();
 const owner=await context('owner',390);await owner.page.goto(base+'/account/contacts');
 const personal=owner.page.getByRole('region',{name:'La tua foto personale'});await personal.waitFor();
 await personal.locator('input[type=file]').setInputFiles(upload);
 await personal.getByRole('button',{name:'Salva foto',exact:true}).click();await personal.getByRole('status').filter({hasText:'Foto salvata'}).waitFor();
 assert.ok(files.has('client-portraits/'+ownerId+'/portrait.webp'));
 assert.ok(await owner.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 if(process.env.PC_SCREENSHOTS)await owner.page.screenshot({path:process.env.PC_SCREENSHOTS+'/client-mobile.png',fullPage:true});
 const professional=await context('professional',390);await professional.page.goto(base+'/pro/bookings');await professional.page.getByRole('img',{name:'Foto di Cliente di prova'}).waitFor();
 await professional.page.goto(base+'/pro/crm');await professional.page.getByRole('img',{name:'Foto di Cliente di prova'}).waitFor();
 await personal.getByRole('button',{name:'Rimuovi foto'}).click();await personal.getByRole('status').filter({hasText:'Foto rimossa'}).waitFor();
 assert.ok(!files.has('client-portraits/'+ownerId+'/portrait.webp'));
 await professional.ctx.close();await owner.ctx.close();assert.deepEqual(errors,[]);
 console.log('OK: decodifica/compressione WebP, falso formato respinto, retry, due slot pubblici, ricerca/profilo, ritratto privato e rimozione. Browser reale; API simulate.');
} finally {await browser.close();}
