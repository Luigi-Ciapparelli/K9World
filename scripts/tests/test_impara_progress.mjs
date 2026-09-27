import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const root = process.cwd();
const temp = await fs.mkdtemp(path.join(os.tmpdir(),'pc-impara-test-'));
try {
  for(const file of ['imparaContent','imparaProgress']) {
    const source=await fs.readFile(path.join(root,`src/lib/${file}.ts`),'utf8');
    const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText.replaceAll("'./imparaContent'","'./imparaContent.mjs'");
    await fs.writeFile(path.join(temp,`${file}.mjs`),code);
  }
  const { STAGE_1_LESSONS:L }=await import(`file://${temp}/imparaContent.mjs`);
  const m=await import(`file://${temp}/imparaProgress.mjs`);
  const {normalizeProgress,emptyProgress,learningKey:key,lessonStatus,scoreMarkers,labPassed}=m;
  const lesson=L[0]; const reading=key(lesson.slug,lesson.sublessons[0].id);
  let p=normalizeProgress({studied:[reading,reading,'unknown',null],activities:['any'],verified:L.map(l=>l.slug)});
  assert.deepEqual(p.studied,[reading]); assert.equal(p.migrated,true); assert.equal(lessonStatus(lesson,p).complete,false);
  assert.deepEqual(normalizeProgress(null),emptyProgress());
  p=emptyProgress();p.studied=lesson.sublessons.map(s=>key(lesson.slug,s.id));
  const a=lesson.activities[0];const id=key(lesson.slug,a.id);
  p.activities[id]={fields:a.fields.map(()=>''),checks:a.instructions.map(()=>true),done:true};
  p.quizzes[lesson.slug]=[{answers:lesson.quiz.map(q=>q.correctIndex),date:new Date().toISOString()}];
  p=normalizeProgress(p);assert.equal(lessonStatus(lesson,p).complete,false,'empty notes cannot complete a lesson');
  p.activities[id]={fields:a.fields.map(()=>'<script>plain-text-only</script>'),checks:a.instructions.map(()=>true),done:true};
  p=normalizeProgress(p);assert.equal(lessonStatus(lesson,p).complete,true);
  p.studied=[];assert.equal(lessonStatus(lesson,p).complete,false,'unmarking a reading invalidates completion');
  p.quizzes[lesson.slug]=[{answers:[999,-1],date:'bad'}];p=normalizeProgress(p);assert.equal(p.quizzes[lesson.slug].length,0);
  assert.equal(labPassed(scoreMarkers([2,5,8,11],[2,5,8],350)),true);
  assert.equal(labPassed(scoreMarkers([2,5,8,11],[2,2,2,2],350)),false,'spam cannot complete timing');
  assert.deepEqual(scoreMarkers([2,5],[1.8,5.2],350).offsets,[-200,200]);
  assert.equal(scoreMarkers([2,5],[0,2,5,6],350).extras,2);
  assert.equal(labPassed(scoreMarkers([],[],350)),false);
  const events=[]; const data=new Map();
  globalThis.window={localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},dispatchEvent:e=>events.push(e.type)};
  data.set(m.PROGRESS_KEY,'broken');assert.deepEqual(m.readProgress(),emptyProgress());assert.equal(m.storageAvailable(),true);
  m.writeProgress(p);assert.equal(m.readProgress().activities[id].fields[0],'<script>plain-text-only</script>');
  window.localStorage.setItem=()=>{throw new Error('quota');};
  m.writeProgress({...p,resume:lesson.slug});assert.equal(m.storageAvailable(),false);assert.equal(m.readProgress().resume,lesson.slug);
  assert.match(m.notebookText(p),/Non è un attestato/);
  for(const l of L){
    assert.ok(l.sources.every(s=>s.url.startsWith('https://')));
    assert.ok(l.quiz.every(q=>q.options[q.correctIndex]&&q.explanation));
    assert.ok(l.sublessons.every(s=>s.paragraphs.length>=2&&s.example&&s.tryThis));
  }
  console.log('OK: migration of legacy readings, draft validation, derived completion, quiz validation, unique marker scoring, corrupt/blocked storage and notebook export.');
  console.log('Local learning only; no official credentials, account sync or online writes tested.');
} finally {await fs.rm(temp,{recursive:true,force:true});}
