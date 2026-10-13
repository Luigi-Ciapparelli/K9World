// Bounded public-source retrieval, synthetic responses only; no network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pc-wd-source-'));
const original=globalThis.fetch;
try {
 const source=await fs.readFile('supabase/functions/_shared/workingDogSource.ts','utf8');
 const target=path.join(dir,'source.mjs');
 await fs.writeFile(target,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 const {workingDogUrl,fetchWorkingDogHtml}=await import(pathToFileURL(target));
 const good='https://www.working-dog.com/results/test-1';
 assert.equal(workingDogUrl(good,'results'),good);
 for(const url of ['http://www.working-dog.com/results/test-1','https://evil.invalid/results/test-1','https://www.working-dog.com:81/results/test-1','https://u:p@www.working-dog.com/results/test-1',good+'?target=other','https://www.working-dog.com/user/test-1']) assert.throws(()=>workingDogUrl(url,'results'));
 let calls=0;
 globalThis.fetch=async(url,opts)=>{calls++;assert.equal(opts.redirect,'manual');return new Response('<title>test</title>',{headers:{'content-type':'text/html'}});};
 assert.equal((await fetchWorkingDogHtml(good)).html,'<title>test</title>');assert.equal(calls,1);
 for(const location of ['http://127.0.0.1/results/test-1','https://evil.invalid/results/test-1','https://www.working-dog.com/results/test-2']){
  calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:302,headers:{location}});};
  await assert.rejects(fetchWorkingDogHtml(good));assert.equal(calls,1);
 }
 calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:302,headers:{location:good}});};
 await assert.rejects(fetchWorkingDogHtml(good));assert.equal(calls,4);
 globalThis.fetch=async()=>new Response('bad',{headers:{'content-type':'application/json'}});await assert.rejects(fetchWorkingDogHtml(good));
 let cancelled=false;
 globalThis.fetch=async()=>new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array(1000000));},cancel(){cancelled=true;}}),{headers:{'content-type':'text/html'}});
 await assert.rejects(fetchWorkingDogHtml(good),/troppo grande/);assert.ok(cancelled);
 globalThis.fetch=async()=>new Response('small',{headers:{'content-type':'text/html','content-length':'2500001'}});
 await assert.rejects(fetchWorkingDogHtml(good),/troppo grande/);
 console.log('OK: HTTPS, host/path, redirect limit and destination checks, HTML and declared/streaming size bounds. Provider simulated.');
} finally {globalThis.fetch=original;await fs.rm(dir,{recursive:true,force:true});}
