import { useMemo, useState, type FormEvent } from 'react';
import type { BookingMessage } from '../lib/bookingMessages';
import { collectDiary, dayLabel, diaryWeek, entryText, moveDay, observations, planText, romeDay, weekOf, type FieldRecord, type Observation } from '../lib/fieldDiary';
import { exerciseIndex, exercisePath } from '../lib/practiceCatalog';

const button='rounded-xl border border-emerald-800 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50';
const primary='rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-50';
const input='mt-1 block w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-900';
type Props={messages:BookingMessage[]; canAssign:boolean; isTeacher:boolean; disabled:boolean; hasOlder:boolean; older:()=>void; send:(text:string)=>Promise<boolean>};

export function LessonPractice({messages,canAssign,isTeacher,disabled,hasOlder,older,send}:Props) {
  const records=useMemo(()=>collectDiary(messages),[messages]);
  const [selected,setSelected]=useState(''),[composing,setComposing]=useState(false);
  const current=records.find(r=>r.message.id===selected)||records[0];
  if(!canAssign&&!current&&!hasOlder)return null;
  if(!canAssign&&!current)return <button type="button" className="my-2 text-sm underline" disabled={disabled} onClick={older}>Cerca una scheda nei messaggi precedenti</button>;
  return <section aria-label="Dal campo a casa" className="mt-4 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-stone-900">
    <h3 className="text-lg font-bold">Da provare a casa</h3>
    {current&&<>
      {records.length>1&&<label className="block text-sm font-semibold">Schede di questa lezione<select className={input} value={current.message.id} onChange={e=>setSelected(e.target.value)}>{records.map(r=><option key={r.message.id} value={r.message.id}>{r.plan.title} · {dayLabel(romeDay(r.message.created_at))} · #{r.message.sequence}</option>)}</select></label>}
      <WeekCard key={current.message.id} rec={current} isTeacher={isTeacher} disabled={disabled} send={send}/>
    </>}
    {!current&&<p className="text-sm">Scegli un solo esercizio fatto al campo. La famiglia riceverà la scheda nei messaggi di questa prenotazione.</p>}
    {hasOlder&&<button type="button" onClick={older} disabled={disabled} className="text-sm underline">Carica schede e messaggi precedenti</button>}
    {canAssign&&(composing?<Assignment disabled={disabled} cancel={()=>setComposing(false)} send={async text=>{const ok=await send(text);if(ok){setComposing(false);setSelected('');}return ok;}}/>:<button type="button" className={button} disabled={disabled} onClick={()=>setComposing(true)}>{current?'Prepara un’altra scheda':'Prepara la scheda per la famiglia'}</button>)}
  </section>;
}
function Assignment({disabled,cancel,send}:{disabled:boolean;cancel:()=>void;send:Props['send']}){
  const [slug,setSlug]=useState(''),[goal,setGoal]=useState(0),[note,setNote]=useState(''),[custom,setCustom]=useState('');
  const title=slug==='personale'?custom.trim():exerciseIndex.find(ex=>ex.slug===slug)?.title||'';
  const go=(e:FormEvent)=>{e.preventDefault();if(title&&(slug!=='personale'||note.trim())&&!disabled)void send(planText({slug,title,goal,note}));};
  return <form onSubmit={go} className="space-y-3 border-t border-emerald-200 pt-3">
    <label className="block text-sm font-semibold">Esercizio concordato<select className={input} required disabled={disabled} value={slug} onChange={e=>setSlug(e.target.value)}><option value="">Scegli dalla biblioteca…</option>{exerciseIndex.map(ex=><option value={ex.slug} key={ex.slug}>{ex.title}</option>)}<option value="personale">Una consegna scritta da me</option></select></label>
    {slug==='personale'&&<label className="block text-sm font-semibold">Titolo della tua consegna<input className={input} disabled={disabled} required maxLength={100} value={custom} onChange={e=>setCustom(e.target.value)}/></label>}
    <label className="block text-sm font-semibold">Passo concordato {slug==='personale'?'':'(facoltativo)'}<textarea className={input} rows={2} disabled={disabled} required={slug==='personale'} maxLength={500} placeholder="Dove provarlo e quando fermarsi, come avete fatto al campo." value={note} onChange={e=>setNote(e.target.value)}/></label>
    <label className="block text-sm font-semibold">Ritmo concordato con la famiglia<select className={input} disabled={disabled} value={goal} onChange={e=>setGoal(Number(e.target.value))}><option value={0}>Libero, senza obiettivo</option>{[1,2,3].map(n=><option key={n} value={n}>{n} {n===1?'giorno':'giorni'} a settimana</option>)}</select></label>
    <p className="text-xs">Se alla lezione hanno partecipato più cani, indica a chi è destinata la scheda. Scrivi solo ciò che vuoi condividere con i partecipanti autorizzati a questa prenotazione.</p>
    <div className="flex flex-wrap gap-2"><button type="submit" className={primary} disabled={disabled||!title||(slug==='personale'&&!note.trim())}>Invia scheda alla famiglia</button><button type="button" className={button} disabled={disabled} onClick={cancel}>Annulla</button></div>
  </form>;
}
function WeekCard({rec,isTeacher,disabled,send}:{rec:FieldRecord;isTeacher:boolean;disabled:boolean;send:Props['send']}){
  const [chosenWeek,setChosenWeek]=useState(''),[kind,setKind]=useState<Observation|null>(null),[note,setNote]=useState('');
  const today=romeDay(new Date()),thisWeek=weekOf(today),firstDay=romeDay(rec.message.created_at),firstWeek=weekOf(firstDay);
  const monday=chosenWeek&&chosenWeek<=thisWeek&&chosenWeek>=firstWeek?chosenWeek:thisWeek;
  const {days,practised}=diaryWeek(rec,monday);const events=days.flatMap(d=>d.events);
  const submit=async(e:FormEvent)=>{e.preventDefault();if(!kind||disabled||(kind==='question'&&!note.trim()))return;
    if(await send(entryText(rec.message.id,kind,note))){setKind(null);setNote('');setChosenWeek('');}};
  const last=events[events.length-1];
  const todayExists=rec.entries.some(e=>romeDay(e.message.created_at)===today&&e.report.kind===kind&&e.report.note===note.trim());
  return <div className="space-y-3">
    <div><h4 className="text-lg font-bold">{rec.plan.title}</h4><p className="text-xs">Da {rec.message.sender_name} · {dayLabel(firstDay)}</p>
      {rec.plan.note&&<p className="my-2 whitespace-pre-wrap break-words">{rec.plan.note}</p>}
      {rec.plan.slug!=='personale'&&<a className="mt-2 inline-block text-sm font-semibold underline" target="_blank" rel="noopener noreferrer" href={exercisePath(rec.plan.slug)}>Leggi i passi dell’esercizio <span className="sr-only">(si apre in una nuova scheda)</span></a>}</div>
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong>Settimana {dayLabel(monday)} – {dayLabel(moveDay(monday,6))}</strong>
        <div className="flex gap-2"><button type="button" className={button} aria-label="Settimana precedente" disabled={monday<=firstWeek} onClick={()=>setChosenWeek(moveDay(monday,-7))}>←</button><button type="button" className={button} aria-label="Settimana successiva" disabled={monday>=thisWeek} onClick={()=>setChosenWeek(moveDay(monday,7))}>→</button></div></div>
      <p className="mt-1 text-sm">{practised} {practised===1?'giorno di pratica segnato':'giorni di pratica segnati'}{rec.plan.goal?' · Obiettivo concordato: '+rec.plan.goal:' · Ritmo libero'}</p>
      {rec.plan.goal>0&&practised>=rec.plan.goal&&<p className="text-sm font-semibold text-emerald-800">Avete trovato il vostro ritmo questa settimana.</p>}
      <ul aria-label="Giorni della settimana" className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">{days.map((d,i)=>{
        const pract=d.events.some(e=>['tried','hard'].includes(e.report.kind)), icon=pract?'✓':d.events.some(e=>e.report.kind==='question')?'?':d.events.length?'Ⅱ':'·';
        const label=d.events.length?d.events.map(e=>observations[e.report.kind]).join('; '):d.date<firstDay?'Prima della scheda':d.date>today?'Giorno futuro':'Nessuna risposta';
        return <li key={d.date} aria-label={dayLabel(d.date)+': '+label} title={label} className={'rounded-lg py-2 '+(d.events.length?'bg-emerald-100 text-emerald-950':'bg-stone-100 text-stone-700')}><span>{['Lun','Mar','Mer','Gio','Ven','Sab','Dom'][i]}</span><strong aria-hidden="true" className="block">{icon}</strong></li>;})}</ul>
      <p className="mt-2 text-xs">✓ Prova · Ⅱ Pausa · ? Domanda. Un giorno vuoto non dice se vi siete esercitati.</p>
      {last&&<p className="mt-3 break-words text-sm"><strong>Ultimo riscontro della settimana: </strong>{observations[last.report.kind]}{last.report.note&&' · '+last.report.note}</p>}
      {events.length>1&&<details className="mt-2 text-sm"><summary className="cursor-pointer underline">Tutti i riscontri di questa settimana</summary><ul>{events.map(e=><li className="mt-1 break-words" key={e.message.id}>{dayLabel(romeDay(e.message.created_at))} · {observations[e.report.kind]}{e.report.note&&': '+e.report.note}</li>)}</ul></details>}
    </div>
    {!isTeacher&&<form onSubmit={submit} className="space-y-2"><fieldset disabled={disabled}><legend className="mb-2 font-semibold">Come va oggi?</legend><div className="flex flex-wrap gap-2">{(Object.entries(observations) as [Observation,string][]).map(([k,v])=><button type="button" key={k} aria-pressed={kind===k} className={kind===k?primary:button} onClick={()=>setKind(k)}>{v}</button>)}</div></fieldset>
      {kind&&<><label className="block text-sm">{kind==='question'?'Cosa vuoi chiedere?':'Una riga per la prossima lezione (facoltativa)'}<textarea className={input} disabled={disabled} rows={2} required={kind==='question'} maxLength={300} value={note} onChange={e=>setNote(e.target.value)}/></label>
      <p className="text-xs">Premendo invia, condividi questo riscontro con chi può leggere i messaggi di questa lezione.</p><button type="submit" className={primary} disabled={disabled||todayExists||(kind==='question'&&!note.trim())}>{todayExists?'Già segnato oggi':'Invia il riscontro di oggi'}</button></>}
    </form>}
  </div>;
}
