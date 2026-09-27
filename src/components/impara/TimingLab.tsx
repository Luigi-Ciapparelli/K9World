import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Play, RotateCcw, Target, Volume2 } from 'lucide-react';
import { type ImparaActivity } from '../../lib/imparaContent';
import { type LabResult } from '../../lib/imparaProgress';
import { judgeShapingClick, normalizeShapingResult, SCENE_END, SHAPING_STEPS, SHAPING_VERSION, shapingPassed, shapingPose, TARGET_AT, WINDOW_END, type ShapingStepId } from '../../lib/shapingLab';

function DogScene({step,time,reward}:{step:number;time:number;reward:boolean}) {
  const p=shapingPose(step,time);
  const fore=(amount:number,far:boolean)=>{
    const offset=far?-12:8;
    const from={x:p.x+43+offset,y:220};
    const foot={x:p.x+47+offset + 36*amount,y:292-44*amount};
    return <g key={String(far)} stroke={far?'#936746':'#c18e60'} strokeWidth="15" strokeLinecap="round" fill="none"><path d={`M${from.x} ${from.y} Q${from.x-5} ${260-24*amount} ${foot.x} ${foot.y}`}/><path d={`M${foot.x-3} ${foot.y}h15`}/>{amount===1&&<ellipse cx={foot.x+6} cy={249} rx="13" ry="3" fill="#f5cc72" stroke="none"/>}</g>;
  };
  return <svg className="im-shaping-scene" viewBox="0 0 720 340" role="img" aria-label={`${SHAPING_STEPS[step].title}: dimostrazione animata di un cane e una piattaforma`}>
    <rect width="720" height="340" fill="#183e2d"/>
    <path d="M36 301H684" stroke="#577361" strokeWidth="2"/>
    <ellipse cx={p.x} cy="300" rx="95" ry="9" fill="#102e21"/>
    <rect x="492" y="248" width="134" height="49" rx="6" fill="#dbb76c"/>
    <path d="M497 253H621" stroke="#f9df9c" strokeWidth="5" strokeLinecap="round"/>
    <path d="M505 268H615M505 280H615" stroke="#be9754" strokeWidth="2"/>
    <g fill="none" stroke="#936746" strokeLinecap="round" strokeWidth="15"><path d={`M${p.x-46} 215l-18 37 7 ${38+p.gait}`} /><path d={`M${p.x-58} ${292+p.gait}h14`}/></g>
    {fore(p.paw2,true)}
    <path d={`M${p.x-55} 205 Q${p.x-90} ${177+p.gait} ${p.x-107} 189`} stroke="#bd8d60" strokeWidth="17" fill="none" strokeLinecap="round"/>
    <ellipse cx={p.x} cy="212" rx="72" ry="39" fill="#bd8d60"/>
    <path d={`M${p.x+20} 179Q${p.x+58} 150 ${p.x+69} 192L${p.x+58} 239Q${p.x+27} 247 ${p.x+19} 221Z`} fill="#c99767"/>
    <path d={`M${p.x-43} 227L${p.x-48} 264L${p.x-33-p.gait} 292h15`} fill="none" stroke="#c99767" strokeWidth="17" strokeLinecap="round"/>
    {fore(p.paw1,false)}
    <g transform={`rotate(${p.look} ${p.x+52} 184)`}>
      <path d={`M${p.x+35} 178Q${p.x+36} 143 ${p.x+61} 142Q${p.x+85} 143 ${p.x+90} 163L${p.x+119} 170Q${p.x+125} 191 ${p.x+95} 192L${p.x+72} 208L${p.x+42} 202Z`} fill="#d5a371"/>
      <path d={`M${p.x+40} 151Q${p.x+17} 139 ${p.x+20} 182Q${p.x+29} 202 ${p.x+43} 179Z`} fill="#7d5337"/>
      <ellipse cx={p.x+117} cy="174" rx="8" ry="6" fill="#292b22"/>
      <circle cx={p.x+77} cy="164" r="4.5" fill="#292b22"/><circle cx={p.x+78} cy="163" r="1.4" fill="#fff8e3"/>
      <path d={`M${p.x+94} 190q9 2 16-3`} fill="none" stroke="#825b3b" strokeWidth="2"/>
    </g>
    <text x="553" y="321" textAnchor="middle" fill="#e5ecdc" fontSize="13">piattaforma bassa</text>
    {reward&&<g><rect x="278" y="45" width="220" height="44" rx="22" fill="#f4dea0"/><text x="388" y="73" textAnchor="middle" fill="#183e2d" fontSize="18" fontWeight="600">Click → premio</text><circle cx={p.x+117} cy="203" r="6" fill="#efce84"/><circle cx={p.x+115} cy="204" r="2" fill="#996c35"/></g>}
  </svg>;
}

export function TimingLab({activity,previous,onResult}:{activity:ImparaActivity;previous?:LabResult;onResult:(result:LabResult)=>void}) {
  const restored=normalizeShapingResult(previous);
  const [completed,setCompleted]=useState<ShapingStepId[]>(restored?.completed||[]);
  const [step,setStep]=useState(Math.min(restored?.completed.length||0,3));
  const [time,setTime]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [feedback,setFeedback]=useState<'early'|'correct'|'late'|'interrupted'|null>(null);
  const [guided,setGuided]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [sound,setSound]=useState(false);
  const [reward,setReward]=useState(false);
  const [marked,setMarked]=useState(false);
  const timeRef=useRef(0); const running=useRef(false); const started=useRef(0);
  const stageRef=useRef<HTMLDivElement>(null);
  const audio=useRef<AudioContext>();
  const onResultRef=useRef(onResult);onResultRef.current=onResult;
  const allDone=shapingPassed({exercise:SHAPING_VERSION,completed});
  const goal=SHAPING_STEPS[step];
  useEffect(()=>{
    if(!playing||guided)return;
    let frame=0;
    const draw=()=>{
      const now=Math.min(SCENE_END,(performance.now()-started.current)/1000);
      timeRef.current=now;setTime(now);
      if(now>=SCENE_END){running.current=false;setPlaying(false);setFeedback('late');}
      else frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[playing,guided]);
  useEffect(()=>{
    if(!marked)return;
    const timer=setTimeout(()=>setReward(true),450);return()=>clearTimeout(timer);
  },[marked]);
  useEffect(()=>{
    const interrupt=()=>{if(document.hidden&&running.current){running.current=false;setPlaying(false);setFeedback('interrupted');}};
    document.addEventListener('visibilitychange',interrupt);
    return()=>{document.removeEventListener('visibilitychange',interrupt);running.current=false;void audio.current?.close();};
  },[]);
  const start=()=>{
    stageRef.current?.scrollIntoView({block:'start',behavior:'auto'});
    running.current=true;timeRef.current=0;started.current=performance.now();setTime(0);setPlaying(true);setFeedback(null);setReward(false);setMarked(false);
    if(sound){try {audio.current ||=new AudioContext();void audio.current.resume();}catch{/* Sound is optional. */}}
  };
  const mark=()=>{
    if(!running.current)return;
    running.current=false;setPlaying(false);setMarked(true);
    const result=judgeShapingClick(timeRef.current);setFeedback(result);
    // A single click ends this attempt. Repeated input cannot skip an approximation.
    if(result==='correct'){
      const next=SHAPING_STEPS.slice(0,step+1).map(s=>s.id);
      const retained=next.length>completed.length?next:completed;setCompleted(retained);
      onResultRef.current({exercise:SHAPING_VERSION,completed:retained});
    }
    if(sound&&audio.current){const ctx=audio.current;const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=1200;gain.gain.setValueAtTime(.05,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.04);osc.start();osc.stop(ctx.currentTime+.045);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
  };
  const advance=()=>{if(step>=3)return;setStep(step+1);setTime(0);timeRef.current=0;setFeedback(null);setReward(false);setMarked(false);};
  return <div className="im-lab im-shaping" aria-label={activity.title}>
    <ol className="im-shaping-steps" aria-label="Approssimazioni successive">{SHAPING_STEPS.map((s,i)=><li key={s.id} aria-current={i===step?'step':undefined} className={i===step?'current':''}><span>{completed.includes(s.id)?<Check size={14}/>:i+1}</span>{s.title}</li>)}</ol>
    <div className="im-shaping-goal"><span className="im-eyebrow">ADESSO PREMIAMO QUESTO</span><h3>{goal.criterion}</h3><p>{goal.hint}</p></div>
    <div ref={stageRef} className="im-video im-shaping-stage" data-scene-time={time.toFixed(3)} data-step={goal.id}><DogScene step={step} time={time} reward={reward}/><span className="im-video-label">SHAPING · ESEMPIO ANIMATO <span>{step+1} / 4</span></span></div>
    <p className="im-shaping-caption" aria-live="off">{feedback==='correct'?'Hai segnato il comportamento scelto.':playing&&time>=TARGET_AT&&time<=WINDOW_END?'Il piccolo obiettivo è raggiunto: puoi cliccare.':playing?'Osserva il cane e il criterio di questo passaggio.':'Avvia il passaggio e clicca quando il cane raggiunge il criterio.'}</p>
    <div className="im-actions">
      <button className="im-button secondary" onClick={start}>{feedback||playing?<RotateCcw size={17}/>:<Play size={17}/>} {feedback||playing?'Riprova questo passaggio':'Avvia passaggio'}</button>
      {guided&&playing&&<button className="im-button secondary" onClick={()=>{const next=Math.min(SCENE_END,timeRef.current+1.6);timeRef.current=next;setTime(next);}}>Osserva il fotogramma successivo</button>}
      <button className="im-button im-marker" disabled={!playing} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus();mark();}} onClick={e=>{if(e.detail===0)mark();}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)mark();}}} onKeyUp={e=>{if(e.key===' '||e.key==='Enter')e.preventDefault();}}><Target size={18}/>Click · segna il momento</button>
    </div>
    <div className="im-lab-options"><label><input type="checkbox" checked={guided} disabled={playing} onChange={e=>{setGuided(e.target.checked);setTime(0);timeRef.current=0;setFeedback(null);setReward(false);setMarked(false);}}/>Senza fretta · fotogrammi guidati</label><label><input type="checkbox" checked={sound} disabled={playing} onChange={e=>setSound(e.target.checked)}/><Volume2 size={16}/>Suono del click</label></div>
    <p className="im-small">Mouse, tocco o Spazio/Invio sul pulsante del click. Non è una gara di riflessi: il momento utile resta visibile per due secondi. Nei fotogrammi guidati avanzi tu e il cane aspetta.</p>
    {feedback&&<div className={`im-feedback ${feedback==='correct'?'success':''}`} role="status">
      {feedback==='correct'?<><strong>Giusto: hai premiato questa approssimazione.</strong><p>{goal.explanation}</p><p>Il click indica il comportamento; subito dopo arriva la ricompensa. Per semplicità qui basta un esempio per passaggio: con un cane reale servono ripetizioni e criteri adattati al soggetto.</p>{step<3?<button className="im-button" disabled={!reward} onClick={advance}>Passa al piccolo obiettivo successivo<ArrowRight size={17}/></button>:<strong>Shaping completato: entrambe le zampe anteriori sono sulla piattaforma.</strong>}</>
      :feedback==='early'?<><strong>Un po’ presto: il criterio non è ancora raggiunto.</strong><p>{goal.criterion} Aspetta questo momento e riprova lo stesso passaggio.</p></>
      :feedback==='interrupted'?<><strong>Dimostrazione in pausa.</strong><p>Hai cambiato finestra. Riavvia questo passaggio quando sei pronto.</p></>
      :<><strong>Il momento è passato. Puoi riprovare con calma.</strong><p>Segna il comportamento mentre il criterio è raggiunto. Puoi anche attivare i fotogrammi guidati.</p></>}
    </div>}
    {marked&&feedback!=='correct'&&<p className="im-small">Anche dopo un click impreciso arriva il premio: il marker deve restare affidabile. Poi riprovi a segnare il momento giusto.</p>}
    {allDone&&feedback!=='correct'&&<p className="im-feedback success">Hai già completato tutti e quattro i passaggi. Puoi ripassarli senza perdere il risultato.</p>}
    <details><summary>Che cosa stai imparando</summary><p>Lo shaping costruisce un comportamento rinforzando approssimazioni successive. Qui il cane esplora, senza essere attirato con un boccone davanti al naso o spinto sulla piattaforma. Cambia un solo criterio per volta, quando quello precedente è facilmente ripetibile; se serve, torna a un passo più semplice.</p><p>La scena è una dimostrazione semplificata, non un protocollo per tutti i cani. Per provare nella realtà servono una superficie bassa, stabile e antiscivolo e un’attività adatta al soggetto. Il click non serve a chiamare il cane e non sostituisce la ricompensa.</p></details>
    {allDone&&<button className="im-link" onClick={()=>{running.current=false;setPlaying(false);setStep(0);setTime(0);timeRef.current=0;setFeedback(null);setReward(false);setMarked(false);}}>Rivedi la dimostrazione dall’inizio</button>}
  </div>;
}
