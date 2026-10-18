import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../../src/lib/accountProfileState.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {createAccountProfileState}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const user=id=>({id,email:id+'@example.invalid'}),profile=(id,role='owner')=>({...user(id),role,full_name:id});
const tick=()=>new Promise(r=>setTimeout(r,0));
function fixture(timeout=1000){const reads=[],events=[];const state=createAccountProfileState((id,signal)=>new Promise((resolve,reject)=>reads.push({id,signal,resolve,reject})),v=>events.push(v),timeout);return {state,reads,events};}
{
 const {state,reads,events}=fixture();state.acceptUser(user('A'));const a=state.refresh();await tick();state.acceptUser(user('B'));const b=state.refresh();await tick();
 assert.equal(reads[0].signal.aborted,true);reads[1].resolve(profile('B'));await b;reads[0].resolve(profile('A','admin'));await a;await tick();
 assert.equal(state.getSnapshot().profile.id,'B');assert.ok(events.every(s=>!s.profile||s.profile.id===s.user.id));
 state.acceptUser(user('B'));await tick();assert.equal(reads.length,2,'same-session events do not restart profile reads');state.dispose();
}
{
 const {state,reads}=fixture();state.acceptUser(user('A'));const pending=state.refresh();await tick();state.acceptUser(null);reads[0].resolve(profile('A'));await pending;
 assert.deepEqual(state.getSnapshot(),{user:null,profile:null,loading:false,profileError:false});state.dispose();
}
{
 const {state,reads}=fixture();state.acceptUser(user('A'));const p=state.refresh();assert.equal(state.refresh(),p,'one request for concurrent callers');await tick();reads[0].reject(Error('offline'));await p;
 assert.equal(state.getSnapshot().user.id,'A');assert.equal(state.getSnapshot().profileError,true);assert.equal(state.getSnapshot().loading,false);
 const retry=state.refresh();await tick();reads[1].resolve(profile('A','professional'));await retry;assert.equal(state.getSnapshot().profile.role,'professional');state.dispose();
}
for(const invalid of [null,profile('B'),profile('A','unknown')]){
 const {state,reads}=fixture();state.acceptUser(user('A'));const p=state.refresh();await tick();reads[0].resolve(invalid);await p;
 assert.equal(state.getSnapshot().profile,null);assert.equal(state.getSnapshot().profileError,true);state.dispose();
}
{
 const {state,reads}=fixture();state.acceptUser(user('A'));const p=state.refresh();await tick();state.acceptUser(user('A'),true);const q=state.refresh();await tick();reads[1].resolve(profile('A','professional'));await q;reads[0].resolve(profile('A'));await p;
 assert.equal(state.getSnapshot().profile.role,'professional');state.dispose();
}
{
 const {state,reads}=fixture(10);state.acceptUser(user('A'));await state.refresh();assert.equal(reads[0].signal.aborted,true);assert.equal(state.getSnapshot().loading,false);assert.equal(state.getSnapshot().profileError,true);state.dispose();
}
{
 const {state,reads,events}=fixture();state.acceptUser(user('A'));const p=state.refresh();await tick();const count=events.length;state.dispose();reads[0].resolve(profile('A'));await p;assert.equal(events.length,count);
}
console.log('OK: isolamento account, risposte tardive, uscita, retry, deduplica, identità/ruoli, aggiornamenti, timeout e smontaggio.');
