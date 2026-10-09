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
 const last=basics;assert.equal(last.quiz.length,8);assert.ok(last.sublessons.some(s=>s.id==='condizionamento-classico'));assert.ok(last.sublessons.some(s=>s.id==='condizionamento-operante'));
 assert.equal(shaping.quiz.length,5);assert.equal(last.activities.length,2,'old glossary notes retained alongside new activity');
 assert.match(progress.notebookText(progress.normalizeProgress(p)),/Shaping: 4\/4/);
 console.log('OK: semantic target windows, front-paw poses, sequential completion, legacy isolation, progress persistence, foundations and notebook export.');
} finally {await fs.rm(temp,{recursive:true,force:true});}
