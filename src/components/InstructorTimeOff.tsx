import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../lib/AuthContext';
import {addDays,dayLabel,romeDay} from '../lib/professionalCalendar';
import {absenceTimeLabel,type InstructorAbsence} from '../lib/instructorTimeOff';
type Period=InstructorAbsence&{id:string;version:string;can_cancel:boolean;source:'centre'|'instructor';affected_bookings:number};
export function InstructorTimeOff({instructorId,name}:{instructorId:string;name:string}){
 const {user}=useAuth();return user?<Periods key={`${user.id}:${instructorId}`} instructorId={instructorId} name={name}/>:null;
}
function Periods({instructorId,name}:{instructorId:string;name:string}){
 const [open,setOpen]=useState(false),[rows,setRows]=useState<Period[]|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[start,setStart]=useState(romeDay),[end,setEnd]=useState(romeDay);
 const [mode,setMode]=useState<'days'|'hours'>('days'),[startTime,setStartTime]=useState('09:00'),[endTime,setEndTime]=useState('10:00');
 const alive=useRef(true),lock=useRef(false),generation=useRef(0),retry=useRef({key:'',id:''});
 const [from,setFrom]=useState(romeDay);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 const load=useCallback(async()=>{const request=++generation.current;setRows(null);setLoading(true);setError('');
  try{const {data,error}=await supabase.rpc('get_instructor_time_off',{p_instructor_id:instructorId,p_from:from,p_until:addDays(from,366)});if(error)throw error;
   if(alive.current&&request===generation.current)setRows(data||[]);
  }catch{if(alive.current&&request===generation.current)setError('Indisponibilità non caricate. Il collegamento potrebbe essere cambiato. Aggiorna prima di continuare.');}
  finally{if(alive.current&&request===generation.current)setLoading(false);}
 },[instructorId,from]);
 useEffect(()=>{if(open)void load();},[open,load]);
 useEffect(()=>{if(!open)return;const refresh=()=>{if(document.visibilityState==='visible')void load();};const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[open,load]);
 async function write(period?:Period){
  if(lock.current)return;
  if(period&&!confirm('Rimuovere questa indisponibilità? Le lezioni già registrate non vengono modificate.'))return;
  lock.current=true;setBusy(true);setNotice('');
  try{let result;
   if(period)result=await supabase.rpc('cancel_instructor_time_off',{p_id:period.id,p_expected_version:period.version});
   else{const key=mode==='hours'?`hours:${start}:${startTime}:${endTime}`:`days:${start}:${end}`;if(retry.current.key!==key)retry.current={key,id:crypto.randomUUID()};
    result=mode==='hours'
     ?await supabase.rpc('add_instructor_time_off_hours',{p_id:retry.current.id,p_instructor_id:instructorId,p_date:start,p_start:startTime,p_end:endTime})
     :await supabase.rpc('add_instructor_time_off',{p_id:retry.current.id,p_instructor_id:instructorId,p_start:start,p_end:end});}
   if(result.error)throw result.error;
   if(alive.current){if(!period)retry.current={key:'',id:''};setNotice(period?'Indisponibilità rimossa.':'Indisponibilità registrata. Controlla le eventuali lezioni già assegnate: non sono state cancellate.');if(!period&&start<from)setFrom(start);else if(!period&&start>=addDays(from,366))setFrom(start);else await load();}
  }catch(e){if(alive.current){const code=(e as {code?:string}).code;setNotice(code==='40001'?'Dati cambiati: aggiorna e controlla prima di riprovare.':code==='42501'?'Non hai più il permesso per questa operazione. Aggiorna i collegamenti.':code==='PCX03'?'L’orario scelto coincide con il cambio dell’ora italiana ed è ambiguo o non esiste. Scegli un orario diverso.':code==='22023'?(mode==='hours'?'Scegli inizio e fine nello stesso giorno, con inizio prima della fine. La fascia non deve essere già terminata e la data deve essere entro due anni.':'Controlla le date: massimo 366 giorni, fine non passata, inizio entro due anni.'):code==='54000'?'Limite di 200 periodi futuri raggiunto. Rimuovi quelli non più necessari.':'Esito non confermato. Aggiorna l’elenco prima di riprovare.');await load();}}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function submit(e:FormEvent){e.preventDefault();void write();}
 return <section className="mt-4 border-t border-[var(--pc-line)] pt-4" aria-label={`Disponibilità di ${name}`}>
  <button type="button" className="font-semibold underline text-sm" aria-expanded={open} disabled={busy} onClick={()=>setOpen(!open)}>{open?'Chiudi indisponibilità':'Gestisci indisponibilità'}</button>
  {open&&<div className="mt-4 space-y-4"><div><h3 className="text-lg font-semibold">Indisponibilità · {name}</h3><p className="mt-2 text-sm">Solo per questo centro, nel fuso italiano. Puoi indicare giornate intere oppure alcune ore. Le lezioni già assegnate restano confermate: controlla quelle segnalate prima di concordare eventuali cambiamenti.</p></div>
   <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Mostra un anno a partire da<input type="date" required value={from} disabled={busy} onChange={e=>{if(e.target.value)setFrom(e.target.value);}} className="mt-1 block rounded-xl border p-2"/></label><button disabled={busy||loading} type="button" className="underline text-sm" onClick={()=>void load()}>Aggiorna indisponibilità</button></div>
   {notice&&<p role="status" className="rounded-xl bg-[var(--pc-bone-50)] p-3 text-sm">{notice}</p>}
   {loading?<p role="status">Caricamento…</p>:error?<p role="alert">{error}</p>:rows&&<>
    {!rows.length?<p className="text-sm">Nessuna indisponibilità registrata nel periodo visualizzato.</p>:<ul className="space-y-3">{rows.map(p=><li key={p.id} className="rounded-xl border border-[var(--pc-line)] p-3"><p className="font-semibold">{dayLabel(p.start_date,true)}{p.start_date!==p.end_date&&` – ${dayLabel(p.end_date,true)}`}</p><p className="mt-1 text-sm font-semibold">{absenceTimeLabel(p)}</p><p className="mt-1 text-sm">{p.source==='centre'?'Indicata dal centro':'Indicata dall’istruttore'}</p>{p.affected_bookings>0&&<p className="mt-2 text-sm font-semibold text-amber-900">{p.affected_bookings} lezioni accettate da controllare e riassegnare.</p>}{p.can_cancel&&<button disabled={busy} type="button" className="mt-2 text-sm underline" onClick={()=>void write(p)}>Rimuovi periodo</button>}</li>)}</ul>}
    <form onSubmit={submit} className="rounded-2xl bg-[var(--pc-bone-50)] p-4">
     <h4 className="font-semibold">Aggiungi un periodo</h4>
     <label htmlFor={`absence-mode-${instructorId}`} className="mt-3 block text-sm">Durata dell’assenza</label><select id={`absence-mode-${instructorId}`} disabled={busy} value={mode} onChange={e=>{const next=e.target.value as 'days'|'hours';setMode(next);if(next==='days'&&end<start)setEnd(start);if(next==='hours'&&start<romeDay())setStart(romeDay());}} className="mt-1 block w-full rounded-xl border p-3"><option value="days">Giornate intere</option><option value="hours">Alcune ore</option></select>
     {mode==='hours'?<div className="mt-3 space-y-3">
      <label className="block text-sm">Giorno<input required type="date" disabled={busy} min={romeDay()} max={addDays(romeDay(),730)} value={start} onChange={e=>setStart(e.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border p-3"/></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Dalle<input required type="time" step="60" disabled={busy} value={startTime} onChange={e=>setStartTime(e.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border p-3"/></label><label className="text-sm">Alle<input required type="time" step="60" disabled={busy} value={endTime} onChange={e=>setEndTime(e.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border p-3"/></label></div>
      <p className="text-xs">Ora italiana, nello stesso giorno. Una lezione che termina esattamente all’inizio della fascia o inizia alla fine non si sovrappone.</p>
      {startTime&&endTime&&endTime<=startTime&&<p role="alert" className="text-sm">La fine deve essere successiva all’inizio, nello stesso giorno.</p>}
     </div>:<div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Dal<input required type="date" disabled={busy} max={addDays(romeDay(),730)} value={start} onChange={e=>{setStart(e.target.value);if(end<e.target.value)setEnd(e.target.value);}} className="mt-1 block w-full min-w-0 rounded-xl border p-3"/></label><label className="text-sm">Al (compreso)<input required type="date" disabled={busy} min={start>romeDay()?start:romeDay()} max={start?addDays(start,365):undefined} value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 block w-full min-w-0 rounded-xl border p-3"/></label></div>}
     <p className="mt-3 text-xs">Non inserire motivazioni personali. Date e orari sono sufficienti per organizzare il calendario.</p>
     <button disabled={busy||!start||(mode==='hours'?(!startTime||!endTime||endTime<=startTime):(!end||end<start))} className="pc-btn pc-btn-primary mt-4">{busy?'Salvataggio…':'Registra indisponibilità'}</button>
    </form>
   </>}
  </div>}
 </section>;
}
