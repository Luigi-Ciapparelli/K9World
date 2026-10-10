// Start Vite using the synthetic backend in docs/REX_CLICKER_V1.md.
// No production credentials required. All backend requests are intercepted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const source=ts.transpileModule(await fs.readFile('src/lib/imparaContent.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {STAGE_1_LESSONS:lessons}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const shaping=lessons.find(l=>l.slug==='osservazione-timing-marker');
const basicsLesson=lessons.find(l=>l.slug==='doti-apprendimento');
assert.ok(shaping);assert.ok(basicsLesson);
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5189';
const key='portalecinofilo-impara-v3';const errors=[];
const screenshots=process.env.PC_SCREENSHOTS;
if(screenshots) await fs.mkdir(screenshots,{recursive:true});
async function setup(viewport={width:1440,height:1000}) {
 const context=await browser.newContext({viewport,acceptDownloads:true,hasTouch:viewport.width<600});
 await context.route('**/*.supabase.co/**',async route=>{
   assert.equal(new URL(route.request().url()).hostname,'pc-impara-test.supabase.co','Tests cannot touch a real backend');
   await route.fulfill({status:200,json:[]});
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 return {context,page};
}
try {
 const {context,page}=await setup();
 await page.goto(base+'/#/impara');
 await page.getByRole('heading',{name:'Vivere meglio insieme si impara.'}).waitFor();
 assert.equal(await page.getByRole('link',{name:/LEZIONE/}).count(),8);
 assert.deepEqual(await page.locator('.im-lesson-card').evaluateAll(cards=>cards.map(c=>c.getAttribute('href'))),lessons.map(l=>`/impara/stage-1/${l.slug}`));
 assert.deepEqual(await page.locator('.im-lesson-card .im-eyebrow').allTextContents(),lessons.map((_,i)=>`LEZIONE 0${i+1}`));
 if(screenshots) await page.screenshot({path:`${screenshots}/impara-desktop.png`,fullPage:true});
 await page.getByLabel('Cerca nelle lezioni').fill('nessuna-trovata');
 await page.getByText(/Nessuna lezione trovata/).waitFor();
 await page.getByRole('button',{name:'Mostra tutte le lezioni'}).click();
 await page.getByRole('button',{name:'Inizia dalle basi'}).click();
 await page.getByRole('button',{name:'3 Verifica',exact:true}).click();
 await page.getByText('Prima completa lettura e pratica.').waitFor();
 assert.equal(await page.getByRole('radio').count(),0);
 await page.getByRole('button',{name:'Torna alla lettura'}).click();
 for(let i=0;i<lessons[0].sublessons.length;i++) await page.getByRole('button',{name:'Ho letto questa parte',exact:true}).first().click();
 await page.getByRole('button',{name:'Passa alla pratica'}).click();
 for(let i=0;i<3;i++) await page.getByRole('textbox').nth(i).fill(`Osservazione ${i+1}: un contesto tranquillo e un passo da provare.`);
 await page.reload();
 await page.getByRole('textbox').first().waitFor();
 assert.match(await page.getByRole('textbox').first().inputValue(),/Osservazione 1/);
 for(const box of await page.getByRole('checkbox').all()) await box.check();
 await page.getByRole('button',{name:'Completa attività',exact:true}).click();
 await page.getByRole('button',{name:'Vai alla verifica'}).click();
 assert.equal(await page.getByRole('button',{name:'Controlla le risposte'}).isDisabled(),true);
 for(let i=0;i<lessons[0].quiz.length;i++) {
  const q=lessons[0].quiz[i];await page.locator(`input[name="question-${q.id}"]`).nth(q.correctIndex).check();
 }
 await page.getByRole('button',{name:'Controlla le risposte'}).click();
 await page.getByRole('heading',{name:'Lezione completata.'}).waitFor();
 assert.equal(await page.getByRole('radio').first().isDisabled(),true,'submitted answers cannot change under stale feedback');
 if(screenshots)await page.screenshot({path:`${screenshots}/impara-verifica.png`,fullPage:true});
 await page.getByRole('link',{name:'Lezione successiva'}).click();
 await page.getByRole('heading',{name:lessons[1].title,exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Ho letto questa parte',exact:true}).count(),lessons[1].sublessons.length,'lesson-local state reset');
 await page.goto(base+`/impara/stage-1/${basicsLesson.slug}`);
 await page.getByRole('link',{name:'Lezione successiva'}).click();
 await page.getByRole('heading',{name:shaping.title,exact:true}).waitFor();
 assert.equal(await page.getByRole('link',{name:'Lezione successiva'}).count(),0);
 await page.getByRole('button',{name:'Riepilogo percorso'}).waitFor();
 await page.getByRole('button',{name:'Lezione precedente'}).click();
 await page.getByRole('heading',{name:basicsLesson.title,exact:true}).waitFor();
 await page.getByRole('link',{name:'Lezione successiva'}).click();
 await page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 const frameElement=page.locator('iframe[title^="Rex e il Clicker"]');
 await frameElement.scrollIntoViewIfNeeded();
 const rex=await frameElement.elementHandle().then(e=>e.contentFrame());
 await rex.getByRole('button',{name:'Inizia',exact:true}).waitFor();
 assert.equal(await frameElement.getAttribute('sandbox'),'allow-scripts');
 assert.equal(await rex.evaluate(()=>{try{localStorage.getItem('x');return false}catch{return true}}),true,'game cannot access account storage');
 await rex.getByLabel('Senza fretta').check();
 await rex.getByRole('button',{name:'Inizia',exact:true}).click();
 await rex.getByRole('button',{name:'CLICK!',exact:true}).click();
 await rex.getByText(/Troppo presto o troppo tardi/).waitFor();
 assert.equal(await rex.evaluate(()=>score),0,'early clicks do not earn points');
 // A forged completion from another window must not be accepted.
 await page.evaluate(()=>window.postMessage({source:'rex-clicker',type:'progress',channel:decodeURIComponent(document.querySelector('iframe[title^="Rex"]').src.split('#')[1]),progress:{exercise:'rex-clicker-v1',completed:['arrival','look','approach','platform'],hits:0}},'*'));
 assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).activities['osservazione-timing-marker:video-lab']?.done,key),undefined);
 let active=rex, reloaded=false;
 for(let i=0;i<160;i++){
  if(await active.evaluate(()=>over))break;
  if(await active.evaluate(()=>lock<=0&&inWindow())){
   await active.getByRole('button',{name:'CLICK!',exact:true}).focus();await page.keyboard.press('Space');
   if(!reloaded&&await active.evaluate(()=>ph===1&&cnt===1)){
    const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
    assert.deepEqual(saved.activities[`${shaping.slug}:video-lab`].lab,{exercise:'rex-clicker-v1',completed:['arrival'],hits:1});
    await page.reload();await page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
    await page.locator('iframe[title^="Rex"]').scrollIntoViewIfNeeded();
    active=await page.locator('iframe[title^="Rex"]').elementHandle().then(e=>e.contentFrame());
    await active.getByRole('button',{name:'Riprendi',exact:true}).waitFor();
    await active.getByLabel('Senza fretta').check();await active.getByRole('button',{name:'Riprendi',exact:true}).click();
    assert.equal(await active.evaluate(()=>ph),1);assert.equal(await active.evaluate(()=>cnt),1);reloaded=true;
   }
  }else await active.getByRole('button',{name:'Osserva il prossimo movimento'}).click();
 }
 assert.equal(await active.evaluate(()=>over),true,'all four phases can be completed without changing game state');
 assert.equal(await active.evaluate(()=>score),22);
 await page.getByText('Attività già completata.',{exact:false}).waitFor();
 if(screenshots)await page.locator('.im-rex').screenshot({path:`${screenshots}/rex-desktop-complete.png`});
 await active.getByRole('button',{name:'Gioca ancora',exact:true}).click();
 await active.getByRole('button',{name:'Osserva il prossimo movimento'}).click();
 await active.getByRole('button',{name:'CLICK!',exact:true}).click();
 let saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
 assert.equal(saved.activities[`${shaping.slug}:video-lab`].done,true,'replay never removes completion');
 // A completed old shaping exercise remains completed after the replacement.
 await page.evaluate(({key,slug})=>{const p=JSON.parse(localStorage.getItem(key));p.activities[slug+':video-lab']={fields:[],checks:[],done:true,lab:{exercise:'platform-front-paws-v1',completed:['orient','approach','one-paw','two-paws']}};localStorage.setItem(key,JSON.stringify(p));},{key,slug:shaping.slug});
 await page.reload();await page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 await page.getByText('Attività già completata.',{exact:false}).waitFor();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Scarica il quaderno'}).click();const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),'PortaleCinofilo-il-mio-quaderno.txt');
 const text=await fs.readFile(await download.path(),'utf8');assert.match(text,/Osservazione 1/);
 await page.getByRole('button',{name:'Tutte le lezioni'}).click();await page.getByText('1 di 8 lezioni completate').waitFor();
 await page.getByText('Gestisci progressi e backup').click();
 const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta backup'}).click();const backup=await backupPromise;
 const backupPath=await backup.path();assert.equal(JSON.parse(await fs.readFile(backupPath,'utf8')).progress.version,3);
 await page.getByRole('button',{name:'Azzera il percorso',exact:true}).click();await page.getByRole('button',{name:'Annulla',exact:true}).click();await page.getByText('1 di 8 lezioni completate').waitFor();
 await page.getByRole('button',{name:'Azzera il percorso',exact:true}).click();await page.getByRole('button',{name:'Conferma azzeramento'}).click();await page.getByText('0 di 8 lezioni completate').waitFor();
 page.once('dialog',dialog=>dialog.accept());await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:await fs.readFile(backupPath)});
 await page.getByText('1 di 8 lezioni completate').waitFor();
 // A second tab sees committed progress and changes via storage events.
 const second=await context.newPage();await second.goto(base+'/#/impara');await second.getByText('1 di 8 lezioni completate').waitFor();
 await page.evaluate(k=>{const p=JSON.parse(localStorage.getItem(k));p.studied=[];localStorage.setItem(k,JSON.stringify(p));},key);
 await second.getByText('0 di 8 lezioni completate').waitFor();await second.close();
 await context.close();
 console.log('OK: public course, gating, notes reload, quiz feedback, route state, Rex completion, early clicks, keyboard, partial resume and legacy completion, notebook, backup import/reset and cross-tab sync.');
 const mobile=await setup({width:390,height:844});
 await mobile.page.goto(base+'/#/impara');await mobile.page.getByRole('button',{name:'Inizia dalle basi'}).waitFor();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile home overflow');
 if(screenshots)await mobile.page.screenshot({path:`${screenshots}/impara-mobile.png`,fullPage:true});
 await mobile.page.getByRole('button',{name:'Inizia dalle basi'}).click();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile lesson overflow');
 await mobile.page.evaluate(()=>{localStorage.setItem('pawconnect-theme','dark');});await mobile.page.reload();
 await mobile.page.getByRole('heading',{name:lessons[0].title,exact:true}).waitFor();
 if(screenshots)await mobile.page.screenshot({path:`${screenshots}/impara-dark-mobile.png`,fullPage:true});
 await mobile.page.goto(base+`/#/impara/stage-1/${shaping.slug}`);
 await mobile.page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 await mobile.page.locator('iframe[title^="Rex"]').scrollIntoViewIfNeeded();
 const mobileRex=await mobile.page.locator('iframe[title^="Rex"]').elementHandle().then(e=>e.contentFrame());
 await mobileRex.getByRole('button',{name:'Inizia',exact:true}).waitFor();
 await mobileRex.getByRole('button',{name:'Inizia',exact:true}).click();
 await mobileRex.waitForFunction(()=>d.p>.05);
 await mobileRex.getByRole('button',{name:'Metti in pausa'}).click();
 const pausedAt=await mobileRex.evaluate(()=>T);
 await mobile.page.waitForTimeout(250);assert.equal(await mobileRex.evaluate(()=>T),pausedAt,'pause stops simulation');
 assert.equal(await mobileRex.getByRole('button',{name:'CLICK!',exact:true}).isDisabled(),true);
 await mobileRex.getByRole('button',{name:'Riprendi gioco'}).click();
 await mobileRex.getByLabel('Senza fretta').check();
 await mobileRex.getByRole('button',{name:'Osserva il prossimo movimento'}).click();
 await mobileRex.locator('canvas').tap();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile course overflow');
 assert.ok(await mobileRex.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile Rex overflow');
 assert.equal(await mobileRex.evaluate(()=>document.documentElement.dataset.theme),'dark');
 const canvas=await mobileRex.locator('canvas').boundingBox();assert.ok(Math.abs(canvas.width/canvas.height-960/540)<.05,'canvas keeps its aspect ratio');
 if(screenshots)await mobile.page.locator('.im-rex').screenshot({path:`${screenshots}/rex-mobile-dark.png`});
 await mobile.context.close();
 // The full basics are reachable; all new learning topics have an explanation and quiz.
 const basics=await setup();await basics.page.goto(base+`/#/impara/stage-1/${basicsLesson.slug}`);
 for(const heading of ['Condizionamento classico: un evento ne anticipa un altro','Condizionamento operante: le conseguenze contano','Rinforzo e punizione: leggere i termini tecnici','Segnali, generalizzazione e mantenimento']) await basics.page.getByRole('heading',{name:heading,exact:true}).waitFor();
 await basics.page.emulateMedia({reducedMotion:'reduce'});
 await basics.page.goto(base+`/impara/stage-1/${shaping.slug}`);
 await basics.page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 const still=await basics.page.locator('iframe[title^="Rex"]').elementHandle().then(e=>e.contentFrame());
 await still.getByRole('button',{name:'Inizia',exact:true}).waitFor();
 assert.equal(await still.getByLabel('Senza fretta').isChecked(),true,'reduced motion defaults to guided frames');
 await basics.context.close();
 assert.deepEqual(errors,[],'No runtime errors');
 console.log('OK: mobile layout, dark theme, learning foundations and keyboard click. Backend mocked; no real accounts or database changed.');
} finally {await browser.close();}
