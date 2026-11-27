// Exercise the actual search and learning UI, using only synthetic data.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';
const external=process.env.PC_TEST_BASE_URL;
const server=external?null:await preview({preview:{port:5217,host:'127.0.0.1',strictPort:true}});
const base=external||'http://127.0.0.1:5217';
const shots=process.env.PC_SCREENSHOTS, baseline=process.env.PC_CAPTURE_BASELINE==='1';
let browser;
const record=(id,name,years)=>({id:'d0000000-0000-0000-0000-'+String(id).padStart(12,'0'),display_name:name,zone_text:'Comune dimostrativo',entity_kind:'professional',experience_start_year:new Date().getFullYear()-years,matching_services:[],distance_km:4});
const two=[record(1,'Educatore demo A',4),record(2,'Educatrice demo B',9)];
try{
 browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 if(shots) await mkdir(shots,{recursive:true});
 for(const [width,height] of [[375,667],[1440,900]]) for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height},locale:'it-IT',colorScheme:theme,serviceWorkers:'block'});
  const p=await ctx.newPage();p.setDefaultTimeout(9000);
  let response='empty',release;const responseGate=new Promise(resolve=>{release=resolve;});let query;const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await ctx.route('https://**/*',async r=>{
    const u=new URL(r.request().url());if(u.hostname!==new URL(base).hostname&&u.hostname!=='pc-home-test.supabase.co')return r.abort();
    if(u.hostname===new URL(base).hostname)return r.continue();
    const name=u.pathname.split('/').pop();if(name==='list_sport_disciplines') return r.fulfill({json:[{id:'obedience',label:'Obedience',description:'',aliases:[]}]});
    if(name.startsWith('search_')){query={name,body:r.request().postDataJSON()};if(response==='hold') await responseGate;if(response==='failure')return r.fulfill({status:400,json:{message:'demo only'}});return r.fulfill({json:response==='two'?two:response==='one'?[two[0]]:[]});}
    return r.fulfill({json:[]});
  });
  const snap=async name=>{if(shots)await p.screenshot({path:join(shots,name+'-'+width+'-'+theme+'.png'),animations:'disabled'});};
  const empty=()=>p.getByRole('region',{name:'Nessun risultato',exact:true});
  if(baseline){
    await p.goto(base+'/search');await p.getByText(/Nessun risultato corrisponde|Nessun risultato per questa ricerca/).first().waitFor();await snap('discovery');
    await p.goto(base+'/prima-del-cane');await p.getByRole('heading',{name:'Qual è il tuo rapporto attuale con i cani?'}).waitFor();await snap('before-dog');
    await ctx.close();continue;
  }
  await p.goto(base+'/search');await empty().waitFor();
  assert.equal(await p.getByLabel('Ordina per').count(),0);assert.equal(await p.getByRole('button',{name:'Azzera filtri',exact:true}).count(),0);
  const city=p.getByRole('textbox',{name:/Città o zona/});
  const inputBounds=await city.boundingBox(),gpsBounds=await p.getByRole('button',{name:'Usa la mia posizione'}).boundingBox();
  assert.ok(inputBounds.y+inputBounds.height<=gpsBounds.y,'GPS must not overlap city field');
  assert.ok(inputBounds.width>=200,'long town names get usable horizontal space');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await snap('discovery');await p.getByRole('button',{name:'Cambia zona'}).click();assert.ok(await city.evaluate(n=>n===document.activeElement));
  response='hold';
  const received = p.waitForRequest(r=>r.url().endsWith('/search_public_professionals') && r.postDataJSON()?.p_zone_text==='Comune dimostrativo');
  await city.fill('Comune dimostrativo');await city.press('Enter');await p.getByText('Caricamento dei risultati…',{exact:true}).waitFor();
  assert.equal(await empty().count(),0);
  await received;response='two';release();await p.getByRole('heading',{name:'Educatore demo A'}).waitFor();await p.getByLabel('Ordina per').selectOption('experience');assert.match(await p.getByRole('article').first().innerText(),/Educatrice demo B/);
  if(width===375)await p.getByRole('button',{name:/Filtri facoltativi/}).click();
  await p.getByRole('button',{name:'Struttura / centro',exact:true}).click();await empty().getByText('Nessun risultato con questi filtri').waitFor();
  await empty().getByRole('button',{name:'Azzera filtri'}).click();await p.getByRole('heading',{name:'Educatore demo A'}).waitFor();
  response='failure';await city.fill('Zona temporanea');await city.press('Enter');await p.getByRole('alert').filter({hasText:'Impossibile caricare'}).waitFor();assert.equal(await empty().count(),0);
  response='one';await p.getByRole('button',{name:'Riprova',exact:true}).click();await p.getByRole('heading',{name:'Educatore demo A'}).waitFor();assert.equal(await p.getByLabel('Ordina per').count(),0);
  await p.goto(base+'/sport');await p.getByLabel('Disciplina sportiva').selectOption('obedience');await p.getByRole('button',{name:'Trova addestratore per disciplina'}).click();await p.waitForResponse(r=>r.url().endsWith('/search_sport_professionals')&&r.request().postDataJSON()?.p_discipline_id==='obedience');assert.equal(query.body.p_discipline_id,'obedience');
  await p.goto(base+'/esposizioni');await p.getByRole('button',{name:'Handler per esposizioni'}).click();await p.getByRole('button',{name:'Cerca',exact:true}).click();await p.waitForResponse(r=>r.url().endsWith('/search_exhibition_professionals')&&r.request().postDataJSON()?.p_service_type==='handler');
  await p.goto(base+'/impara');await p.getByRole('button',{name:'Inizia dalle basi'}).click();const first=p.locator('.im-reading h2').first(),outline=p.locator('.im-outline');
  await first.waitFor();assert.ok(await first.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('.im-outline'))&Node.DOCUMENT_POSITION_FOLLOWING)));
  if(width===375)assert.ok((await first.boundingBox()).y<(await outline.boundingBox()).y);
  const lesson=p.url();await p.goto(base+'/impara');await p.getByRole('button',{name:'Riprendi il percorso'}).click();assert.equal(p.url(),lesson);
  await p.goto(base+'/prima-del-cane');await p.getByText('Domanda 1 di 8',{exact:true}).waitFor();await p.getByText('0 di 8 risposte date',{exact:true}).waitFor();
  const answer=p.getByRole('button',{name:/Sarebbe il mio primo cane/});const ab=await answer.boundingBox();assert.ok(ab.y>=0&&ab.y+ab.height<=height,'first full answer should be inside initial viewport');
  await snap('before-dog');await answer.focus();await answer.press('Space');await p.getByText('1 di 8 risposte date',{exact:true}).waitFor();
  await p.getByRole('button',{name:'Continua',exact:true}).click();await p.getByText('Domanda 2 di 8').waitFor();assert.equal(await p.getByRole('progressbar',{name:'Risposte date'}).getAttribute('value'),'1');
  await p.getByRole('button',{name:'Indietro'}).click();await p.getByText('Domanda 1 di 8').waitFor();assert.equal(await p.getByRole('progressbar',{name:'Risposte date'}).getAttribute('value'),'1');
  await p.reload();await p.getByText('Domanda 2 di 8').waitFor();assert.deepEqual(errors,[]);
  await ctx.close();
 }
 console.log(baseline?'OK: schermate di riferimento delle due pagine.':'OK: ricerca quotidiana/sport/esposizioni, GPS separato, caricamento/errore/riprova e zero con/senza filtri, ordinamento 1/2 risultati, quiz e progressi, ripresa, lettura, 375/1440 chiaro/scuro e tastiera.');
}finally{await browser?.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));}
