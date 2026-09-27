// Start Vite using the synthetic backend in docs/IMPARA_SHAPING_V1.md.
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
 assert.equal(await page.getByRole('button',{name:'Ho letto questa parte',exact:true}).count(),lessons[1].sublessons.length,'lesson-local state reset');
 await page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 await page.getByLabel('Senza fretta · fotogrammi guidati').check();
 // Early clicks do not advance the criterion or award progress.
 await page.getByRole('button',{name:'Avvia passaggio',exact:true}).click();
 await page.getByRole('button',{name:'Click · segna il momento',exact:true}).click();
 await page.getByText('Un po’ presto: il criterio non è ancora raggiunto.').waitFor();
 assert.equal(await page.getByRole('button',{name:'Passa al piccolo obiettivo successivo'}).count(),0);
 for(let i=0;i<4;i++) {
   await page.getByRole('button',{name:/^(Avvia passaggio|Riprova questo passaggio)$/}).click();
   await page.getByRole('button',{name:'Osserva il fotogramma successivo'}).click();
   await page.getByRole('button',{name:'Osserva il fotogramma successivo'}).click();
   if(screenshots) await page.locator('.im-shaping').screenshot({path:`${screenshots}/shaping-step-${i+1}.png`});
   const click=page.getByRole('button',{name:'Click · segna il momento',exact:true});
   await click.focus();await page.keyboard.press('Space');
   await page.getByText('Giusto: hai premiato questa approssimazione.').waitFor();
   const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
   assert.equal(saved.activities[`${lessons[1].slug}:video-lab`].lab.completed.length,i+1);
   assert.equal(saved.activities[`${lessons[1].slug}:video-lab`].done,i===3);
   if(i===0){
     await page.reload();
     await page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
     assert.equal(await page.locator('.im-shaping-stage').getAttribute('data-step'),'approach','resume next uncompleted criterion');
     await page.getByLabel('Senza fretta · fotogrammi guidati').check();
   } else if(i<3) await page.getByRole('button',{name:'Passa al piccolo obiettivo successivo'}).click();
 }
 await page.getByText('Shaping completato: entrambe le zampe anteriori sono sulla piattaforma.').waitFor();
 await page.getByRole('button',{name:'Rivedi la dimostrazione dall’inizio'}).click();
 await page.getByLabel('Senza fretta · fotogrammi guidati').uncheck();
 await page.getByRole('button',{name:'Avvia passaggio',exact:true}).click();
 await page.waitForFunction(()=>Number(document.querySelector('.im-shaping-stage')?.dataset.sceneTime)>=3.25);
 await page.getByRole('button',{name:'Click · segna il momento',exact:true}).click();
 await page.getByText('Giusto: hai premiato questa approssimazione.').waitFor();
 await page.getByRole('button',{name:'Riprova questo passaggio'}).click();
 await page.getByText('Il momento è passato. Puoi riprovare con calma.').waitFor();
 const saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),key));
 assert.equal(saved.activities[`${lessons[1].slug}:video-lab`].done,true,'retries do not remove completed shaping');
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
 console.log('OK: public course, gating, notes reload, quiz feedback, route state, shaping animation, early/late clicks, keyboard, criterion order and resume, notebook, backup import/reset and cross-tab sync.');
 const mobile=await setup({width:390,height:844});
 await mobile.page.goto(base+'/#/impara');await mobile.page.getByRole('button',{name:'Inizia dalle basi'}).waitFor();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile home overflow');
 if(screenshots)await mobile.page.screenshot({path:`${screenshots}/impara-mobile.png`,fullPage:true});
 await mobile.page.getByRole('button',{name:'Inizia dalle basi'}).click();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile lesson overflow');
 await mobile.page.evaluate(()=>{localStorage.setItem('pawconnect-theme','dark');});await mobile.page.reload();
 await mobile.page.getByRole('heading',{name:lessons[0].title,exact:true}).waitFor();
 if(screenshots)await mobile.page.screenshot({path:`${screenshots}/impara-dark-mobile.png`,fullPage:true});
 await mobile.page.goto(base+`/#/impara/stage-1/${lessons[1].slug}`);
 await mobile.page.getByRole('button',{name:'2 Metti in pratica',exact:true}).click();
 await mobile.page.getByLabel('Senza fretta · fotogrammi guidati').check();
 await mobile.page.getByRole('button',{name:'Avvia passaggio',exact:true}).click();
 for(let i=0;i<2;i++) await mobile.page.getByRole('button',{name:'Osserva il fotogramma successivo'}).click();
 await mobile.page.getByRole('button',{name:'Click · segna il momento',exact:true}).click();
 await mobile.page.getByText('Giusto: hai premiato questa approssimazione.').waitFor();
 await mobile.page.getByText('Click → premio',{exact:true}).waitFor();
 assert.ok(await mobile.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile shaping overflow');
 if(screenshots)await mobile.page.locator('.im-shaping').screenshot({path:`${screenshots}/shaping-mobile-dark.png`});
 await mobile.context.close();
 // The full basics are reachable; all new learning topics have an explanation and quiz.
 const basics=await setup();await basics.page.goto(base+`/#/impara/stage-1/${lessons[7].slug}`);
 for(const heading of ['Condizionamento classico: un evento ne anticipa un altro','Condizionamento operante: le conseguenze contano','Rinforzo e punizione: leggere i termini tecnici','Segnali, generalizzazione e mantenimento']) await basics.page.getByRole('heading',{name:heading,exact:true}).waitFor();
 await basics.context.close();
 assert.deepEqual(errors,[],'No runtime errors');
 console.log('OK: mobile layout, dark theme, learning foundations and keyboard click. Backend mocked; no real accounts or database changed.');
} finally {await browser.close();}
