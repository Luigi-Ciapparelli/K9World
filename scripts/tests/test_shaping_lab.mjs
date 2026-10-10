import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pc-shaping-'));
try {
 for(const name of ['imparaContent','imparaProgress','shapingLab']){
  let code=ts.transpileModule(await fs.readFile(`src/lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
  for(const dep of ['imparaContent','shapingLab']) code=code.replaceAll(`'./${dep}'`,`'./${dep}.mjs'`);
  await fs.writeFile(path.join(temp,name+'.mjs'),code);
 }
 const lab=await import(`file://${temp}/shapingLab.mjs`);
 const progress=await import(`file://${temp}/imparaProgress.mjs`);
 const {STAGE_1_LESSONS:L}=await import(`file://${temp}/imparaContent.mjs`);
 for(const t of [0,1,3.19,NaN])assert.equal(lab.judgeShapingClick(t),'early');
 for(const t of [3.2,4,5.2])assert.equal(lab.judgeShapingClick(t),'correct');
 for(const t of [5.21,6.3])assert.equal(lab.judgeShapingClick(t),'late');
 assert.ok(lab.shapingPose(2,3.19).paw1<1);assert.equal(lab.shapingPose(2,3.2).paw1,1);assert.equal(lab.shapingPose(2,3.2).paw2,0);
 assert.equal(lab.shapingPose(3,3.2).paw1,1);assert.equal(lab.shapingPose(3,3.2).paw2,1);
 assert.deepEqual(lab.normalizeShapingResult({exercise:lab.SHAPING_VERSION,completed:['two-paws']}).completed,[]);
 assert.deepEqual(lab.normalizeShapingResult({exercise:lab.SHAPING_VERSION,completed:['orient','orient','one-paw']}).completed,['orient']);
 const shaping=L.find(l=>l.slug==='osservazione-timing-marker');
 const basics=L.find(l=>l.slug==='doti-apprendimento');
 assert.ok(shaping);assert.ok(basics);
 const p=progress.emptyProgress();const key=shaping.slug+':video-lab';
 p.activities[key]={fields:[],checks:[],done:true,lab:{hits:4,total:4,extras:0,offsets:[0,0,0,0]}};
 assert.equal(progress.normalizeProgress(p).activities[key].done,false,'the old dot game cannot complete shaping');
 for(let count=1;count<=4;count++){
  const value={exercise:lab.SHAPING_VERSION,completed:lab.SHAPING_STEPS.slice(0,count).map(s=>s.id)};
  p.activities[key]={fields:[],checks:[],done:true,lab:value};
  const normalized=progress.normalizeProgress(p);
  assert.equal(normalized.activities[key].done,count===4);
  assert.equal(normalized.activities[key].lab.completed.length,count);
 }
 // Rex checkpoints keep their own version and cannot skip or forge criteria.
 for(const bad of [null,{exercise:lab.REX_VERSION,completed:['platform'],hits:0},{exercise:lab.REX_VERSION,completed:['arrival','arrival'],hits:0},{exercise:lab.REX_VERSION,completed:[],hits:1},{exercise:lab.REX_VERSION,completed:['arrival'],hits:3},{exercise:lab.REX_VERSION,completed:[],hits:-1},{exercise:lab.REX_VERSION,completed:[],hits:NaN}]) assert.equal(lab.normalizeRexResult(bad),undefined);
 for(let count=0;count<=4;count++){
  const value={exercise:lab.REX_VERSION,completed:lab.REX_STEPS.slice(0,count),hits:count===1?2:0};
  const q=progress.emptyProgress();q.activities[key]={fields:[],checks:[],done:true,lab:value};
  q.studied=[shaping.slug+':descrivere-prima'];q.resume=shaping.slug;
  q.quizzes[shaping.slug]=[{answers:shaping.quiz.map(q=>q.correctIndex),date:'2026-10-09T20:00:00Z'}];
  const n=progress.normalizeProgress(JSON.parse(JSON.stringify(q)));
  assert.deepEqual(n.activities[key].lab,value);assert.equal(n.activities[key].done,count===4);
  assert.deepEqual(n.studied,q.studied);assert.deepEqual(n.quizzes,q.quizzes);assert.equal(n.resume,q.resume);
  assert.match(progress.notebookText(n),new RegExp('Rex e il Clicker: '+count+'/4'));
 }
 const last=basics;assert.equal(last.quiz.length,8);assert.ok(last.sublessons.some(s=>s.id==='condizionamento-classico'));assert.ok(last.sublessons.some(s=>s.id==='condizionamento-operante'));
 assert.equal(shaping.quiz.length,5);assert.equal(last.activities.length,2,'old glossary notes retained alongside new activity');
 assert.match(progress.notebookText(progress.normalizeProgress(p)),/Shaping: 4\/4/);
 console.log('OK: semantic target windows, front-paw poses, sequential completion, legacy isolation, legacy completion preserved, Rex checkpoints, progress persistence, foundations and notebook export.');
} finally {await fs.rm(temp,{recursive:true,force:true});}
