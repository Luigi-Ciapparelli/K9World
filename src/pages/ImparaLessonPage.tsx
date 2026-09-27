import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Download, ExternalLink, NotebookPen } from 'lucide-react';
import { STAGE_1_LESSONS, getStage1Lesson, type ImparaActivity, type ImparaLesson } from '../lib/imparaContent';
import { downloadText, labPassed, learningKey, lessonStatus, notebookText, passScore, scoreQuiz, type ActivityDraft } from '../lib/imparaProgress';
import { useImparaProgress } from '../lib/useImparaProgress';
import { useRouter } from '../lib/RouterContext';
import { TimingLab } from '../components/impara/TimingLab';
import '../impara.css';

const blankActivity = (a: ImparaActivity): ActivityDraft => ({fields:(a.fields||[]).map(()=>''),checks:a.instructions.map(()=>false),done:false});
export function ImparaLessonPage({slug}:{slug:string}) {
  const lesson=getStage1Lesson(slug);
  const {navigate}=useRouter();
  if(!lesson) return <main className="impara"><div className="im-wrap im-empty"><h1>Questa lezione non è disponibile.</h1><button className="im-button" onClick={()=>navigate('/impara')}>Torna al percorso</button></div></main>;
  return <Lesson key={slug} lesson={lesson}/>;
}
function Lesson({lesson}:{lesson:ImparaLesson}) {
  const {navigate}=useRouter();
  const {progress,update,saved}=useImparaProgress();
  const status=lessonStatus(lesson,progress);
  const readingsDone=status.studied===lesson.sublessons.length;
  const latest=progress.quizzes[lesson.slug]?.slice(-1)[0];
  const [tab,setTab]=useState<'read'|'practice'|'quiz'>(()=>status.complete?'read':status.ready?'quiz':readingsDone?'practice':'read');
  const [answers,setAnswers]=useState<number[]>(latest?.answers||lesson.quiz.map(()=>-1));
  const [submitted,setSubmitted]=useState(!!latest);
  const [message,setMessage]=useState('');
  const body=useRef<HTMLDivElement>(null);
  useEffect(()=>{update(p=>({...p,resume:lesson.slug}));},[lesson.slug,update]);
  const switchTab=(value:typeof tab)=>{setTab(value);setMessage('');requestAnimationFrame(()=>{body.current?.scrollIntoView({block:'start'});body.current?.focus({preventScroll:true});});};
  const saveActivity=(a:ImparaActivity,draft:ActivityDraft)=>update(p=>({...p,activities:{...p.activities,[learningKey(lesson.slug,a.id)]:draft}}));
  const next=STAGE_1_LESSONS[lesson.order];
  const total=lesson.sublessons.length+lesson.activities.length+1;
  const done=status.studied+status.activities+(status.ready&&status.passed?1:0);
  const tabs=[{id:'read',label:'Leggi',done:readingsDone},{id:'practice',label:'Metti in pratica',done:status.activities===lesson.activities.length},{id:'quiz',label:'Verifica',done:status.complete}] as const;
  return <main className="impara im-lesson">
    <div className="im-wrap">
      <nav className="im-breadcrumb" aria-label="Percorso"><button onClick={()=>navigate('/impara')}><ArrowLeft size={16}/>Tutte le lezioni</button><span>/</span><span>{lesson.moduleTitle}</span></nav>
      <header className="im-lesson-header"><p className="im-eyebrow">LEZIONE {String(lesson.order).padStart(2,'0')} / 08 · FONDAMENTA</p><h1>{lesson.title}</h1><p className="im-lead">{lesson.summary}</p><div className="im-meta"><span><Clock3 size={16}/>{lesson.durationMinutes} minuti di lettura e verifica</span><span><NotebookPen size={16}/>Pratica: {lesson.practiceMinutes}</span></div></header>
      {!saved && <p className="im-notice" role="alert">Salvataggio nel browser non disponibile. Scarica il quaderno o esporta un backup dalla pagina del percorso prima di chiudere.</p>}
      <div className="im-lesson-layout">
        <aside className="im-outline"><p className="im-eyebrow">IN QUESTA LEZIONE</p><h2>Una cosa utile,<br/>da portare con te.</h2><ul>{lesson.objectives.map(o=><li key={o}><Check size={15}/>{o}</li>)}</ul><progress value={done} max={total} aria-label="Avanzamento della lezione"/><p className="im-small">{done} di {total} passaggi completati</p><div className="im-aside-help"><p>Vuoi lavorarci con qualcuno?</p><button className="im-link" onClick={()=>navigate(`/search?type=trainer&from=impara&topic=${encodeURIComponent(lesson.slug)}`)}>Trova un addestratore<ArrowRight size={16}/></button></div></aside>
        <div className="im-lesson-main" ref={body} tabIndex={-1}>
          <nav className="im-tabs" aria-label="Passaggi della lezione">{tabs.map((item,i)=><button key={item.id} aria-current={tab===item.id?'step':undefined} className={tab===item.id?'active':''} onClick={()=>switchTab(item.id)}><span>{item.done?<Check size={15}/>:i+1}</span>{item.label}</button>)}</nav>
          {tab==='read' && <section aria-label="Lettura">
            {lesson.sublessons.map((sub,i)=>{const key=learningKey(lesson.slug,sub.id);const read=progress.studied.includes(key);return <article className="im-reading" key={sub.id}><p className="im-eyebrow">{i+1} / {lesson.sublessons.length}</p><h2>{sub.title}</h2>{sub.paragraphs.map(p=><p key={p}>{p}</p>)}<div className="im-example"><span className="im-eyebrow">NELLA VITA QUOTIDIANA</span><p>{sub.example}</p></div><p className="im-prompt"><strong>Fermati un momento.</strong> {sub.tryThis}</p><button className={`im-read-button ${read?'done':''}`} aria-pressed={read} onClick={()=>update(p=>({...p,studied:read?p.studied.filter(k=>k!==key):[...p.studied,key]}))}><CheckCircle2 size={18}/>{read?'Lettura completata':'Ho letto questa parte'}</button></article>;})}
            <div className="im-panel im-sources"><h3>Per approfondire</h3><p>Riferimenti di supporto, in lingua originale. Gli esempi e le attività sono elaborati da PortaleCinofilo.</p>{lesson.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={14}/></a>)}{lesson.links?.map(link=><button className="im-link" key={link.path} onClick={()=>navigate(link.path)}>{link.label}<ArrowRight size={15}/></button>)}</div>
            <div className="im-step-end"><span>{readingsDone?'Lettura completata. Ora prova ad applicarla.':`${lesson.sublessons.length-status.studied} parti ancora da segnare come lette.`}</span><button className="im-button" onClick={()=>switchTab('practice')}>Passa alla pratica<ArrowRight size={17}/></button></div>
          </section>}
          {tab==='practice' && <section aria-label="Attività pratiche"><div className="im-panel im-practice-intro"><p className="im-eyebrow">IL TUO QUADERNO</p><h2>Osserva. Scrivi. Scegli un passo.</h2><p>Usa una situazione quotidiana tranquilla. Se non hai ancora un cane, lavora sul caso qui sotto e indicalo nei tuoi appunti. Non provocare una reazione per completare l’esercizio.</p><details><summary>{lesson.caseStudy.title}</summary><p>{lesson.caseStudy.text}</p></details><p className="im-small">Gli appunti vengono salvati solo in questo browser. Evita dati personali che non servono all’osservazione.</p></div>
            {lesson.activities.map(a=>{const draft=progress.activities[learningKey(lesson.slug,a.id)]||blankActivity(a);return <article key={a.id} className="im-panel im-activity"><div className="im-card-top"><p className="im-eyebrow">{a.type==='video-lab'?'LABORATORIO':'ATTIVITÀ'}</p>{draft.done&&<span className="im-status done"><Check size={14}/>Completata</span>}</div><h2>{a.title}</h2><p>{a.summary}</p>
              {a.type==='video-lab'?<TimingLab activity={a} previous={draft.lab} onResult={lab=>{if(!draft.done || labPassed(lab)) saveActivity(a,{...draft,lab,done:labPassed(lab)});}}/>:<form onSubmit={e=>{e.preventDefault();saveActivity(a,{...draft,done:true});setMessage('Attività completata. I tuoi appunti sono nel quaderno.');}}>
                {(a.fields||[]).map((label,i)=><label className="im-field" key={label}><span>{i+1}. {label}</span><textarea required maxLength={3000} rows={3} value={draft.fields[i]||''} placeholder="Scrivi qui la tua osservazione…" onChange={e=>saveActivity(a,{...draft,fields:(a.fields||[]).map((_,j)=>i===j?e.target.value:draft.fields[j]||''),done:false})}/></label>)}
                <fieldset className="im-checklist"><legend>Prima di concludere</legend>{a.instructions.map((label,i)=><label key={label}><input required type="checkbox" checked={draft.checks[i]||false} onChange={e=>saveActivity(a,{...draft,checks:a.instructions.map((_,j)=>i===j?e.target.checked:draft.checks[j]||false),done:false})}/>{label}</label>)}</fieldset>
                <button className="im-button" type="submit" disabled={draft.done || !draft.fields.every(s=>s.trim()) || !draft.checks.every(Boolean)}>{draft.done?<><Check size={16}/>Attività completata</>:'Completa attività'}</button><p className="im-small">{saved?'Appunti salvati automaticamente.':'Appunti conservati solo finché questa pagina resta aperta.'}</p>
              </form>}
              <p className="im-small">{a.completionHint}</p></article>;})}
            {message&&<p role="status" className="im-feedback success">{message}</p>}
            <div className="im-step-end"><button className="im-link" onClick={()=>downloadText('PortaleCinofilo-il-mio-quaderno.txt',notebookText(progress))}><Download size={16}/>Scarica il quaderno</button><button className="im-button" onClick={()=>switchTab('quiz')}>Vai alla verifica<ArrowRight size={17}/></button></div>
          </section>}
          {tab==='quiz' && <section className="im-panel im-quiz" aria-labelledby="quiz-title"><p className="im-eyebrow">METTITI ALLA PROVA</p><h2 id="quiz-title">Che cosa porti con te?</h2><p>{lesson.quiz.length} domande, almeno {passScore(lesson)} risposte corrette. Puoi riprovare e rileggere le spiegazioni: l’obiettivo è capire.</p>
            {!status.ready?<div className="im-notice"><h3>Prima completa lettura e pratica.</h3><p>Restano {lesson.sublessons.length-status.studied} parti da leggere e {lesson.activities.length-status.activities} attività da completare.</p><button className="im-button secondary" onClick={()=>switchTab(readingsDone?'practice':'read')}>{readingsDone?'Torna alla pratica':'Torna alla lettura'}</button></div>:<form onSubmit={e=>{e.preventDefault();if(answers.some(a=>a<0))return;update(p=>({...p,quizzes:{...p.quizzes,[lesson.slug]:[...(p.quizzes[lesson.slug]||[]),{answers:[...answers],date:new Date().toISOString()}].slice(-5)}}));setSubmitted(true);setMessage('');}}>
              {lesson.quiz.map((q,i)=><fieldset key={q.id} className="im-question" disabled={submitted}><legend><span>{i+1}.</span> {q.prompt}</legend>{q.options.map((option,j)=><label key={option} className={submitted?(j===q.correctIndex?'correct':answers[i]===j?'incorrect':''):answers[i]===j?'selected':''}><input type="radio" required name={`question-${q.id}`} value={j} checked={answers[i]===j} onChange={()=>setAnswers(current=>current.map((value,k)=>k===i?j:value))}/><span>{option}</span>{submitted&&j===q.correctIndex&&<Check size={16}/>}</label>)}{submitted&&<div className="im-answer"><strong>{answers[i]===q.correctIndex?'Risposta corretta.':'Da rivedere.'}</strong> {q.explanation}</div>}</fieldset>)}
              {!submitted?<button className="im-button" type="submit" disabled={answers.some(a=>a<0)}>Controlla le risposte<ArrowRight size={17}/></button>:<div className={`im-feedback ${scoreQuiz(lesson,answers)>=passScore(lesson)?'success':''}`} role="status"><h3>{scoreQuiz(lesson,answers)>=passScore(lesson)?'Lezione completata.':'Rileggi le spiegazioni e riprova.'}</h3><p>{scoreQuiz(lesson,answers)} risposte corrette su {lesson.quiz.length}. {scoreQuiz(lesson,answers)>=passScore(lesson)?'Hai concluso lettura, pratica e autoverifica.':'Non è una gara: torna sui punti che vuoi chiarire.'}</p><button className="im-link" type="button" onClick={()=>{setAnswers(lesson.quiz.map(()=>-1));setSubmitted(false);}}>Rifai la verifica</button></div>}
            </form>}
            <p className="im-small">Questa autoverifica non conferisce una qualifica né certifica competenze pratiche.</p>
          </section>}
          <div className="im-lesson-navigation"><button className="im-link" onClick={()=>lesson.order>1?navigate(`/impara/stage-1/${STAGE_1_LESSONS[lesson.order-2].slug}`):navigate('/impara')}><ArrowLeft size={16}/>{lesson.order>1?'Lezione precedente':'Il percorso'}</button>{next?<button className="im-link" onClick={()=>navigate(`/impara/stage-1/${next.slug}`)}>Lezione successiva<ArrowRight size={16}/></button>:<button className="im-link" onClick={()=>navigate('/impara')}>Riepilogo percorso<BookOpen size={16}/></button>}</div>
        </div>
      </div>
    </div>
  </main>;
}
