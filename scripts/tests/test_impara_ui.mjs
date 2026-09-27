// Start Vite using the synthetic backend in docs/IMPARA_RELEASE_V3.md.
// No production credentials required. All backend requests are intercepted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const source=ts.transpileModule(await fs.readFile('src/lib/imparaContent.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {STAGE_1_LESSONS:lessons}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const base=process.env.PC_TEST_BASE_URL || 'http://127.0.0.1:5189';
const key='portalecinofilo-impara-v3';const errors=[];
const screenshots=process.env.PC_SCREENSHOTS;
if(screenshots) await fs.mkdir(screenshots,{recursive:true});
async function setup(viewport={width:1440,height:1000}) {
 const context=await browser.newContext({viewport,acceptDownloads:true});
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
 assert.equal(await page.getByRole('button',{name:/LEZIONE/}).count(),8);
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
 await page.getByRole('button',{name:'Lezione successiva'}).click();
 await page.getByRole('heading',{name:lessons[1].title,exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Ho letto questa parte',exact:true}).count(),3,'lesson-local state reset');
 await page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 await page.getByRole('button',{name:'Avvia esercizio'}).click();
 const useVideo=await page.locator('video').count();
 if(useVideo) {
   for(const target of [2,5,8,11]) {
     await page.waitForFunction(t=>{const v=document.querySelector('video');return v && v.currentTime>=t-.08;},target);
     await page.getByRole('button',{name:'Segna il momento',exact:true}).click();
   }
   await page.getByText(/Timing completato./).waitFor({timeout:16000});
   assert.match(await page.locator('.im-feedback').innerText(),/4\/4/);
   await page.getByRole('button',{name:'Riprova il timing'}).click();
   await page.waitForFunction(()=>document.querySelector('video')?.currentTime>=1.9);
   await page.getByRole('button',{name:'Segna il momento',exact:true}).click({clickCount:4});
   await page.getByText(/Guarda il confronto e riprova./).waitFor({timeout:16000});
   assert.match(await page.locator('.im-feedback').innerText(),/1\/4|0\/4/);
   const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
   assert.equal(saved.activities[`${lessons[1].slug}:video-lab`].done,true,'a practice retry preserves previous completed lab');
 }
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
 console.log('OK: public course, gating, notes reload, quiz feedback, route state, real timing video, anti-spam, notebook, backup import/reset and cross-tab sync.');
 const mobile=await setup({width:390,height:844});
 await mobile.page.goto(base+'/#/impara');await mobile.page.getByRole('button',{name:'Inizia dalle basi'}).waitFor();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile home overflow');
 if(screenshots)await mobile.page.screenshot({path:`${screenshots}/impara-mobile.png`,fullPage:true});
 await mobile.page.getByRole('button',{name:'Inizia dalle basi'}).click();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile lesson overflow');
 await mobile.page.evaluate(()=>{localStorage.setItem('pawconnect-theme','dark');});await mobile.page.reload();
 await mobile.page.getByRole('heading',{name:lessons[0].title,exact:true}).waitFor();
 if(screenshots)await mobile.page.screenshot({path:`${screenshots}/impara-dark-mobile.png`,fullPage:true});
 await mobile.context.close();
 // A video outage still leaves the authored exercise usable via the matching animation.
 const failed=await setup();await failed.context.route('**/media/impara/*.mp4',route=>route.abort());
 await failed.page.goto(base+`/#/impara/stage-1/${lessons[1].slug}`);
 await failed.page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 await failed.page.getByRole('img',{name:/Esercizio animato/}).waitFor();
 await failed.page.getByRole('button',{name:'Avvia esercizio'}).click();
 await failed.page.getByRole('button',{name:'Segna il momento'}).focus();await failed.page.keyboard.press('Space');
 await failed.page.getByText('1 click',{exact:true}).waitFor();
 await failed.context.close();
 assert.deepEqual(errors,[],'No runtime errors');
 console.log('OK: mobile layout, dark theme, fallback animation and keyboard click. Backend mocked; no real accounts or database changed.');
} finally {await browser.close();}
