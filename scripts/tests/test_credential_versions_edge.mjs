// Edge handler contract with synthetic auth, source HTML and RPC. No network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pc-credential-edge-'));
const uid='e8310000-0000-0000-0000-000000000001',cid='e8310000-0000-0000-0003-000000000001',version='e8310000-0000-0000-0003-000000000099';
const html='<title>Obedience Test Event Class 3</title><tr><td>4</td><td><a>Test Dog</a></td><td><a>Owner Test</a></td><td>Total</td><td>264,38</td><td>EX</td></tr>';
const originalFetch=globalThis.fetch;
let state,handler;
const reset=overrides=>state={calls:[],fetches:0,role:'professional',name:'Owner Test',auth:true,owner:uid,...overrides};
const client={auth:{getUser:async()=>({data:{user:state.auth?{id:uid}:null},error:null})},
 from(table){const chain={select(){return this},eq(){return this},maybeSingle:async()=>({error:null,data:table==='profiles'?{id:uid,full_name:state.name,role:state.role}:table==='professional_credentials'?{id:cid,professional_id:state.owner,credential_type:'sport_result',title:'Test',discipline:'obedience',achievement:'Classe 3',external_url:'https://www.working-dog.com/results/test-1',dog_name:'Test Dog',event_name:'Test Event',verification_status:'pending',verification_version:version}:null})};return chain},
 async rpc(name,args){state.calls.push({name,args});return {data:{verification_status:state.savedStatus||'verified'},error:state.rpcError||null}}};
globalThis.__pcCredentialTest={createClient:()=>client};
globalThis.Deno={env:{get:key=>({SUPABASE_URL:'https://test.invalid',SUPABASE_ANON_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture-service'})[key]},serve:fn=>handler=fn};
globalThis.fetch=async()=>{state.fetches++;if(state.unavailable)throw new Error('Synthetic provider unavailable');const response=new Response(html,{status:200,headers:{'Content-Type':'text/html'}});Object.defineProperty(response,'url',{value:'https://www.working-dog.com/results/test-1'});return response;};
async function request(overrides={}){reset(overrides);const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify({mode:'credential',credentialId:cid})}));return {status:response.status,body:await response.json()};}
try{
 const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 await fs.writeFile(path.join(temp,'parser.mjs'),compile(await fs.readFile('supabase/functions/_shared/workingDogResultParser.ts','utf8')));
 let source=await fs.readFile('supabase/functions/verify-working-dog/index.ts','utf8');
 source=source.replace("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';","const {createClient}=globalThis.__pcCredentialTest;").replace("'../_shared/workingDogResultParser.ts'","'./parser.mjs'");
 await fs.writeFile(path.join(temp,'handler.mjs'),compile(source));await import(pathToFileURL(path.join(temp,'handler.mjs')).href);
 let r=await request();assert.equal(r.status,200);assert.equal(r.body.verified,true);assert.equal(state.calls.length,1);
 assert.deepEqual(state.calls[0].name,'commit_working_dog_check');let args=state.calls[0].args;
 assert.equal(args.p_expected_version,version);assert.equal(args.p_actor_id,uid);assert.equal(args.p_outcome,'matched');assert.equal(args.p_placement,4);assert.equal(args.p_score_text,'264.38');assert.match(args.p_fingerprint,/^[0-9a-f]{64}$/);
 r=await request({rpcError:{code:'40001',message:'stale'}});assert.equal(r.status,409);assert.equal(r.body.verified,false);
 r=await request({savedStatus:'pending'});assert.equal(r.status,409);assert.equal(r.body.verified,false);
 r=await request({unavailable:true});assert.equal(r.status,200);assert.equal(r.body.verified,false);assert.equal(state.calls[0].args.p_outcome,'unavailable');assert.equal(state.calls[0].args.p_expected_version,version);
 r=await request({unavailable:true,rpcError:{code:'40001'}});assert.equal(r.status,409);
 r=await request({name:'Different Person',savedStatus:'pending'});assert.equal(r.status,200);assert.equal(r.body.verified,false);assert.equal(state.calls[0].args.p_outcome,'not_matched');assert.equal(state.calls[0].args.p_placement,null);
 r=await request({owner:'e8310000-0000-0000-0000-000000000002'});assert.equal(r.status,403);assert.equal(state.fetches,0);assert.equal(state.calls.length,0);
 r=await request({auth:false});assert.equal(r.status,401);assert.equal(state.calls.length,0);
 r=await request({rpcError:{code:'XX000'}});assert.equal(r.status,500);assert.equal(r.body.verified,false);
 console.log('OK: Edge passes exact version and actor, persists source atomically, rejects stale/failed commits, handles source failure and denies foreign access. Auth/provider/DB simulated.');
}finally{globalThis.fetch=originalFetch;delete globalThis.Deno;delete globalThis.__pcCredentialTest;await fs.rm(temp,{recursive:true,force:true});}
