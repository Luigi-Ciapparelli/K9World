// Production build served locally. Auth/API requests are synthetic only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
const {chromium}=await import(process.env.PC_PLAYWRIGHT_MODULE || 'playwright');
const dist=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const rel=decodeURIComponent(url.pathname).slice(1) || 'index.html';
    const base=path.resolve(dist,rel);
    if(!base.startsWith(dist+path.sep)){res.writeHead(403).end();return;}
    const file=path.extname(base)?base:base+'.html';
    const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(data);
  } catch {res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser=await chromium.launch({headless:true,...(process.env.PC_CHROMIUM_PATH?{executablePath:process.env.PC_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const errors=[];
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    const context=await browser.newContext({viewport});
    await context.route('**/*.supabase.co/**',async route=>{
      assert.equal(new URL(route.request().url()).hostname,'pc-breed-test.supabase.co','No real backend allowed');
      await route.fulfill({status:200,json:[]});
    });
    const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
    for(const [slug,name] of [['shikoku','Shikoku'],['clumber-spaniel','Clumber Spaniel'],['dobermann','Dobermann']]) {
      await page.goto(`${base}/razze/${slug}`);
      await page.getByRole('heading',{name,exact:true}).waitFor();
      await page.getByRole('heading',{name:'Immagina la vostra giornata'}).waitFor();
      assert.ok((await page.title()).includes('scelta consapevole'));
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`https://www.portalecinofilo.com/razze/${slug}`);
      assert.equal(await page.getByRole('link',{name:'Trova un addestratore',exact:true}).getAttribute('href'),'/search?type=trainer');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${slug} ${viewport.width} overflow`);
      if(process.env.PC_SCREENSHOTS && slug==='clumber-spaniel') {
        await fs.mkdir(process.env.PC_SCREENSHOTS,{recursive:true});
        await page.screenshot({path:path.join(process.env.PC_SCREENSHOTS,`clumber-${viewport.width}.png`),fullPage:true});
      }
    }
    await page.getByRole('link',{name:'Capire come apprende'}).click();
    await page.getByRole('heading',{name:'Come impara il cane: le basi',exact:true}).waitFor();
    await page.waitForFunction(()=>document.title.startsWith('Come impara il cane: le basi'));
    await context.close();
  }
  assert.deepEqual(errors,[]);
  console.log('OK: tre guide, navigazione verso Impara e metadata su desktop/mobile. Build di produzione, API simulate; nessun account o database reale.');
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
