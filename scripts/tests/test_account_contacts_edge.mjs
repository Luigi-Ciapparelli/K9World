// Real Edge handler + delivery/hashing helpers with synthetic Auth/RPC/HTTP.
// No production calls, credentials or messages. SQL semantics have their own suite.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'pc-contacts-edge-'));
const originalFetch=globalThis.fetch;
const uid='e0000000-0000-0000-0000-000000000001';
const current={email:'old@example.invalid',phone:'333-bad',emailVerified:false,phoneVerified:false};
const sent=[],records=new Map();
let providerFails=false,completeError=null,adminFails=false,adminWrites=0;
const env={SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'synthetic-test-secret-never-a-real-key',RESEND_API_KEY:'synthetic',VERIFICATION_FROM_EMAIL:'PortaleCinofilo <test@example.invalid>',TWILIO_ACCOUNT_SID:'synthetic',TWILIO_AUTH_TOKEN:'synthetic',TWILIO_FROM_NUMBER:'+39000000000',CONTACT_SMS_ENABLED:'true',ALLOW_VERIFICATION_DEV_CODE:'true'};
let handler;
globalThis.Deno={env:{get:key=>env[key]},serve:fn=>{handler=fn;}};
const client={
 auth:{getUser:async token=>({data:{user:token==='synthetic-token'?{id:uid}:null},error:null}),admin:{updateUserById:async(id,patch)=>{assert.equal(id,uid);assert.equal(patch.email_confirm,true);adminWrites++;if(adminFails)return{error:{message:'private provider failure'}};current.email=patch.email;current.emailVerified=true;return{error:null};}}},
 rpc:async(name,args)=>{
  assert.equal(args.p_user,uid);
  if(name==='account_contact_status')return{data:{...current},error:null};
  if(name==='begin_account_contact'){
   assert.equal(args.p_target_hash.length,64);assert.equal(args.p_other_hash.length,64);
   const old=args.p_kind==='phone'?current.phone.replace(/[\s().-]/g,''):current.email;
   const otherTarget=old!==args.p_target?(args.p_kind==='phone'?current.email:current.phone):null;
   records.set(args.p_id,{...args,otherTarget,delivered:false});
   return{data:{id:args.p_id,target:args.p_target,otherTarget},error:null};
  }
  if(name==='mark_account_contact_delivery'){records.get(args.p_id).delivered=args.p_delivered;return{data:true,error:null};}
  if(name==='complete_account_contact'){
   const rec=records.get(args.p_id);
   if(completeError)return{data:{error:completeError},error:null};
   if(!rec?.delivered)return{data:{error:'expired'},error:null};
   if(rec.p_target_hash!==args.p_target_hash || (rec.otherTarget && rec.p_other_hash!==args.p_other_hash))return{data:{error:'invalid_code'},error:null};
   if(rec.p_kind==='email'&&rec.p_target!==current.email)return{data:{applyEmail:rec.p_target},error:null};
   current[rec.p_kind]=rec.p_target;current[rec.p_kind+'Verified']=true;return{data:{applied:true},error:null};
  }
  throw new Error('Unexpected RPC '+name);
 }
};
globalThis.__contactTest={createClient:()=>client};
globalThis.fetch=async(url,request)=>{
 assert.ok(String(url).startsWith('https://api.resend.com/')||String(url).startsWith('https://api.twilio.com/'));
 const body=String(url).includes('resend')?JSON.parse(request.body):Object.fromEntries(new URLSearchParams(request.body));
 sent.push({body,code:(body.text||body.Body).match(/: (\d{6})\./)[1]});
 return new Response('{}',{status:providerFails?503:200});
};
try{
 const helperFile=path.join(temporary,'contactDelivery.mjs');
 const transpile=text=>ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 await fs.writeFile(helperFile,transpile(await fs.readFile('supabase/functions/_shared/contactDelivery.ts','utf8')));
 let source=await fs.readFile('supabase/functions/account-contacts/index.ts','utf8');
 source=source.replace(/import 'jsr:[^']+';/,'').replace(/import \{ createClient \} from 'npm:[^']+';/,'const { createClient } = globalThis.__contactTest;').replace("'../_shared/contactDelivery.ts'",JSON.stringify(pathToFileURL(helperFile).href));
 const file=path.join(temporary,'handler.mjs');await fs.writeFile(file,transpile(source));await import(pathToFileURL(file).href);
 const helper=await import(pathToFileURL(helperFile).href);
 assert.throws(()=>helper.normalizeContact('phone','3331234567'));
 assert.equal(helper.normalizeContact('phone','+39 (333) 123-4567'),'+393331234567');
 assert.equal(helper.normalizeContact('email',' NAME@EXAMPLE.INVALID '),'name@example.invalid');
 const hash=await helper.contactCodeHash('secret',uid,'request','target','123456');
 assert.notEqual(hash,await helper.contactCodeHash('secret',uid,'request','other','123456'));
 assert.notEqual(hash,await helper.contactCodeHash('secret','other','request','target','123456'));
 for(let i=0;i<50;i++)assert.match(helper.createContactCode(),/^\d{6}$/);
 const call=async(body,token='synthetic-token')=>{const response=await handler(new Request('https://example.invalid/functions/v1/account-contacts',{method:'POST',headers:{Authorization:'Bearer '+token},body:JSON.stringify(body)}));return{status:response.status,body:await response.json()};};
 assert.equal((await call({action:'status'},'wrong-token')).status,401);
 assert.equal((await call({action:'status'})).body.emailVerified,false);
 assert.equal((await call({action:'begin',kind:'phone',target:'+393331234567'})).status,400);
 providerFails=true;
 let result=await call({action:'begin',kind:'email',target:current.email});
 assert.equal(result.status,503);assert.equal(JSON.stringify(result).includes('dev_code'),false);assert.equal(current.emailVerified,false);
 assert.equal([...records.values()].at(-1).delivered,false);
 providerFails=false;sent.length=0;
 result=await call({action:'begin',kind:'email',target:current.email});
 assert.equal(result.status,200);assert.equal(sent.length,1);assert.equal(JSON.stringify(result).includes(sent[0].code),false);
 assert.equal((await call({action:'complete',id:result.body.id,targetCode:sent[0].code})).body.success,true);
 assert.equal(current.emailVerified,true);
 // No SMS unless explicitly opted in, even when all paid-provider credentials exist.
 delete env.CONTACT_SMS_ENABLED;
 assert.equal((await call({action:'status'})).body.smsDeliveryReady,false);
 const noSendBefore=sent.length, noRecordBefore=records.size;
 assert.equal((await call({action:'begin',kind:'phone',target:'+393331234567'})).status,503);
 assert.equal(await helper.deliverContactCode('phone','+393331234567','123456','verify',key=>env[key]),false);
 assert.equal(sent.length,noSendBefore);assert.equal(records.size,noRecordBefore);
 current.phoneVerified=true; // A pre-existing proof must not bypass the disabled channel.
 assert.equal((await call({action:'begin',kind:'email',target:'next@example.invalid'})).status,503);
 assert.equal(sent.length,noSendBefore);assert.equal(records.size,noRecordBefore);
 current.phoneVerified=false;
 result=await call({action:'begin',kind:'email',target:current.email});
 assert.equal(result.status,200);assert.equal(sent.length,noSendBefore+1);
 assert.ok(sent.at(-1).body.to);assert.equal(result.body.otherTarget,null);
 env.CONTACT_SMS_ENABLED='false';assert.equal(helper.deliveryConfigured('phone',key=>env[key]),false);
 env.CONTACT_SMS_ENABLED='true';
 sent.length=0;
 result=await call({action:'begin',kind:'phone',target:'+39 333 123 4567'});
 assert.equal(result.status,200);assert.equal(sent.length,2);assert.equal(result.body.otherTarget,current.email);
 const phoneId=result.body.id;
 assert.equal((await call({action:'complete',id:phoneId,targetCode:sent[1].code})).status,400);
 assert.equal(current.phone,'333-bad');
 assert.equal((await call({action:'complete',id:phoneId,targetCode:sent[1].code,otherCode:sent[0].code})).body.success,true);
 assert.equal(current.phone,'+393331234567');
 sent.length=0;
 result=await call({action:'begin',kind:'email',target:'new@example.invalid'});
 const emailId=result.body.id;assert.equal(sent.length,2);
 completeError='contact_changed';
 assert.equal((await call({action:'complete',id:emailId,targetCode:sent[1].code,otherCode:sent[0].code})).status,400);assert.equal(adminWrites,0);
 completeError=null;adminFails=true;
 assert.equal((await call({action:'complete',id:emailId,targetCode:sent[1].code,otherCode:sent[0].code})).status,400);assert.equal(current.email,'old@example.invalid');
 adminFails=false;
 assert.equal((await call({action:'complete',id:emailId,targetCode:sent[1].code,otherCode:sent[0].code})).body.success,true);assert.equal(current.email,'new@example.invalid');
 delete env.TWILIO_AUTH_TOKEN;
 const before=sent.length;
 assert.equal((await call({action:'begin',kind:'email',target:'next@example.invalid'})).status,503);assert.equal(sent.length,before);
 console.log('OK: SMS spenti per default anche con credenziali presenti, email autonoma, handler Edge, codici legati a utente/richiesta/canale, errore provider senza fallback, correzione telefono, doppia conferma, errori Auth e configurazione mancante. Provider e Auth simulati.');
}finally{globalThis.fetch=originalFetch;delete globalThis.Deno;delete globalThis.__contactTest;await fs.rm(temporary,{recursive:true,force:true});}
