// Edge handler contract with synthetic auth, source HTML and RPC. No network.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pc-credential-edge-'));
const uid='e8310000-0000-0000-0000-000000000001',cid='e8310000-0000-0000-0003-000000000001',version='e8310000-0000-0000-0003-000000000099';
const html='<title>Obedience Test Event Class 3</title><tr><td>4</td><td><a href="/dogs-details/12/Test-Dog">Test Dog</a></td><td><a href="/user/Owner-Test-34">Owner Test</a></td><td>Total</td><td>264,38</td><td>EX</td></tr>';
const originalFetch=globalThis.fetch;
let state,handler;
const reset=overrides=>state={calls:[],fetches:0,autoEnabled:'true',role:'professional',name:'Owner Test',auth:true,owner:uid,identityStatus:'verified',identityMethod:'manual_admin',...overrides};
const client={auth:{getUser:async()=>({data:{user:state.auth?{id:uid}:null},error:null})},
 from(table){const chain={select(){return this},eq(){return this},maybeSingle:async()=>({error:null,data:table==='profiles'?{id:uid,full_name:state.name,role:state.role}:table==='professional_credentials'?{id:cid,professional_id:state.owner,credential_type:'sport_result',title:'Test',discipline:'obedience',achievement:'Classe 3',external_url:'https://www.working-dog.com/results/test-1',dog_name:'Test Dog',event_name:'Test Event',verification_status:state.credentialStatus||'pending',verification_version:version}:table==='professional_external_identities'?{provider_user_id:'34',verification_version:version,verification_status:state.identityStatus,verification_method:state.identityMethod}:null})};return chain},
 async rpc(name,args){state.calls.push({name,args});return {data:{verification_status:state.savedStatus||(name==='request_working_dog_identity'?'pending':'verified')},error:state.rpcError||null}}};
globalThis.__pcCredentialTest={createClient:()=>client};
globalThis.Deno={env:{get:key=>({SUPABASE_URL:'https://test.invalid',SUPABASE_ANON_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture-service',WORKING_DOG_RESULT_AUTOVERIFY_ENABLED:state.autoEnabled})[key]},serve:fn=>handler=fn};
globalThis.fetch=async(url,opts)=>{state.fetches++;assert.equal(opts.redirect,'manual');if(state.redirect)return new Response(null,{status:302,headers:{location:state.redirect}});if(state.unavailable)throw new Error('Synthetic provider unavailable');const response=new Response(state.html || html,{status:200,headers:{'Content-Type':'text/html'}});Object.defineProperty(response,'url',{value:'https://www.working-dog.com/results/test-1'});return response;};
async function request(overrides={}){reset(overrides);const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:JSON.stringify(state.body || {mode:'credential',credentialId:cid})}));return {status:response.status,body:await response.json()};}
try{
 const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 await fs.writeFile(path.join(temp,'parser.mjs'),compile(await fs.readFile('supabase/functions/_shared/workingDogResultParser.ts','utf8')));
 await fs.writeFile(path.join(temp,'source.mjs'),compile(await fs.readFile('supabase/functions/_shared/workingDogSource.ts','utf8')));
 let source=await fs.readFile('supabase/functions/verify-working-dog/index.ts','utf8');
 source=source.replace("import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';","const {createClient}=globalThis.__pcCredentialTest;").replace("'../_shared/workingDogResultParser.ts'","'./parser.mjs'").replace("'../_shared/workingDogSource.ts'","'./source.mjs'");
 await fs.writeFile(path.join(temp,'handler.mjs'),compile(source));await import(pathToFileURL(path.join(temp,'handler.mjs')).href);
 let r=await request();assert.equal(r.status,200);assert.equal(r.body.verified,true);assert.equal(state.calls.length,1);
 assert.deepEqual(state.calls[0].name,'commit_bound_working_dog_check');let args=state.calls[0].args;
 assert.equal(args.p_identity_version,version);assert.equal(args.p_handler_id,'34');assert.equal(args.p_expected_version,version);assert.equal(args.p_actor_id,uid);assert.equal(args.p_outcome,'matched');assert.equal(args.p_placement,4);assert.equal(args.p_score_text,'264.38');assert.match(args.p_fingerprint,/^[0-9a-f]{64}$/);
 r=await request({rpcError:{code:'40001',message:'stale'}});assert.equal(r.status,409);assert.equal(r.body.verified,false);
 r=await request({savedStatus:'pending'});assert.equal(r.status,409);assert.equal(r.body.verified,false);
 r=await request({unavailable:true});assert.equal(r.status,200);assert.equal(r.body.verified,false);assert.equal(state.calls[0].args.p_outcome,'unavailable');assert.equal(state.calls[0].args.p_expected_version,version);
 r=await request({unavailable:true,rpcError:{code:'40001'}});assert.equal(r.status,409);
 r=await request({name:'Different Person',savedStatus:'pending'});assert.equal(r.status,200);assert.equal(r.body.verified,false);assert.equal(state.calls[0].args.p_outcome,'not_matched');assert.equal(state.calls[0].args.p_placement,null);
 r=await request({owner:'e8310000-0000-0000-0000-000000000002'});assert.equal(r.status,403);assert.equal(state.fetches,0);assert.equal(state.calls.length,0);
 r=await request({auth:false});assert.equal(r.status,401);assert.equal(state.calls.length,0);
 for(const autoEnabled of ['false',undefined]){r=await request({autoEnabled});assert.equal(r.body.verified,false);assert.equal(state.calls.length,0);assert.equal(state.fetches,0);}
 r=await request({rpcError:{code:'XX000'}});assert.equal(r.status,500);assert.equal(r.body.verified,false);
 for(const overrides of [{credentialStatus:'revoked'},{credentialStatus:'rejected'},{identityStatus:'pending'},{identityStatus:'revoked'},{identityMethod:'working_dog_auto'}]){
  r=await request(overrides);assert.equal(r.body.verified,false);assert.equal(state.fetches,0);assert.equal(state.calls.length,0);
 }
 for(const changed of [html.replace('Test-34','Test-999'),html.replace('/user/Owner-Test-34','https://evil.invalid/user/Owner-Test-34'),html.replace('EX','DQ'),html.replace('264,38','330'),html.replace('Total','Unknown'),html.replace('Owner Test</a>','Owner Test Other</a>')]){
  r=await request({html:changed,savedStatus:'pending'});assert.equal(r.body.verified,false);assert.equal(state.calls[0].args.p_outcome,'not_matched');
 }
 r=await request({body:{mode:'profile',profileUrl:'https://www.working-dog.com/user/Owner-Test-34'}});
 assert.equal(r.body.verified,false);assert.equal(state.fetches,0);assert.equal(state.calls[0].name,'request_working_dog_identity');
 for(const redirect of ['http://127.0.0.1/results/private-1','https://evil.invalid/results/test-1','https://www.working-dog.com/results/changed-2']){
  r=await request({redirect});assert.equal(r.body.verified,false);assert.equal(state.fetches,1);assert.equal(state.calls[0].args.p_outcome,'unavailable');
 }
 console.log('OK: pending profile claims, stable handler identity, revoked/unproven identities, false outcomes and unsafe redirects.');
 console.log('OK: Edge passes exact version and actor, persists source atomically, rejects stale/failed commits, handles source failure and denies foreign access. Auth/provider/DB simulated.');
}finally{globalThis.fetch=originalFetch;delete globalThis.Deno;delete globalThis.__pcCredentialTest;await fs.rm(temp,{recursive:true,force:true});}
