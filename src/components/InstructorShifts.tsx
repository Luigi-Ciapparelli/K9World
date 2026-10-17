import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {useAuth} from '../lib/AuthContext';
import {supabase} from '../lib/supabase';
import {weekDays,validateShifts,type InstructorShifts as Plan,type ShiftWindow} from '../lib/instructorShifts';
const field='mt-1 block w-full min-w-0 rounded-xl border bg-white p-3 text-stone-900';
export function InstructorShifts({instructorId,name}:{instructorId:string;name:string}){
 const {user}=useAuth();return user?<WeeklyHours key={`${user.id}:${instructorId}`} instructorId={instructorId} name={name}/>:null;
}
function WeeklyHours({instructorId,name}:{instructorId:string;name:string}){
 const [open,setOpen]=useState(false),[plan,setPlan]=useState<Plan|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[enabled,setEnabled]=useState(false),[slots,setSlots]=useState<ShiftWindow[]>([]),[day,setDay]=useState(1),[blocked,setBlocked]=useState(false);
 const alive=useRef(true),lock=useRef(false),dirty=useRef(false),readVersion=useRef(0);
 const pending=useRef<{p_instructor_id:string;p_enabled:boolean;p_slots:ShiftWindow[];p_expected_version:string|null}|null>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const accept=useCallback((data:Plan)=>{setPlan(data);setEnabled(data.enabled);setSlots(data.slots);pending.current=null;dirty.current=false;setBlocked(false);},[]);
 const load=useCallback(async()=>{
  if(lock.current)return;const request=++readVersion.current;setLoading(true);setError('');setPlan(null);
  try{const {data,error}=await supabase.rpc('get_instructor_weekly_shifts',{p_instructor_id:instructorId});if(error||!data||!Array.isArray(data.slots))throw error||new Error('Missing schedule');if(alive.current&&request===readVersion.current)accept(data as Plan);}
  catch{if(alive.current&&request===readVersion.current)setError('Turni non caricati. Riprova; non considerare disponibili gli orari senza lezioni.');}
  finally{if(alive.current&&request===readVersion.current)setLoading(false);}
 },[instructorId,accept]);
 useEffect(()=>{if(open)void load();},[open,load]);
 function reload(){if(dirty.current&&!confirm('Ricaricare i turni salvati e scartare la bozza?'))return;setNotice('');void load();}
 function toggle(){if(lock.current)return;if(open&&dirty.current&&!confirm('Chiudere la bozza non salvata? Se un invio è incerto, verifica i turni salvati alla riapertura.'))return;if(open)readVersion.current++;setOpen(v=>!v);}
 const validation=validateShifts(slots,enabled);
 async function save(e:FormEvent){
  e.preventDefault();if(lock.current||!plan||blocked||validation)return;
  if(!pending.current&&!confirm('Applicare questi turni alle nuove assegnazioni? Le lezioni già fissate rimangono confermate e saranno segnalate se fuori turno.'))return;
  lock.current=true;setBusy(true);setError('');setNotice('');
  pending.current??={p_instructor_id:instructorId,p_enabled:enabled,p_slots:slots.map(s=>({...s})),p_expected_version:plan.version};
  try{const {data,error}=await supabase.rpc('save_instructor_weekly_shifts',pending.current);if(error)throw error;if(!data||!Array.isArray(data.slots))throw new Error('Missing result');if(alive.current){accept(data as Plan);setNotice('Turni salvati. Le lezioni già fissate sono conservate.');}}
  catch(e){if(alive.current){const code=(e as {code?:string})?.code;
   if(['40001','42501','22023'].includes(code||'')){setBlocked(true);setError(code==='40001'?'I turni sono cambiati in un’altra sessione. La bozza è conservata: controllala, poi aggiorna i turni.':code==='42501'?'Non sei più autorizzato a modificare questi turni. Aggiorna i collegamenti.':'Controlla le fasce: massimo quattro al giorno, non sovrapposte e con inizio prima della fine.');}
   else setError('Esito non confermato. Riprova lo stesso salvataggio oppure aggiorna i turni per controllare.');}}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function update(index:number,key:'start'|'end',value:string){dirty.current=true;setSlots(rows=>rows.map((r,i)=>i===index?{...r,[key]:value}:r));}
 return <section className="mt-4 border-t border-[var(--pc-line)] pt-4" aria-label={`Turni di ${name}`}>
  <button type="button" disabled={busy} className="text-sm font-semibold underline" aria-expanded={open} onClick={toggle}>{open?'Chiudi turni settimanali':'Turni settimanali'}</button>
  {open&&<div className="mt-4 space-y-4"><h3 className="text-lg font-semibold">Settimana tipo · {name}</h3><p className="text-sm">Orari italiani, ripetuti ogni settimana per questo centro. Le assenze prevalgono sui turni. I giorni senza fasce non sono lavorativi quando il piano è attivo.</p>
   <button type="button" disabled={busy||loading} className="text-sm underline" onClick={reload}>Aggiorna turni</button>
   {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm">{notice}</p>}
   {loading?<p role="status">Caricamento turni…</p>:plan&&<>
    <p className="font-semibold">{plan.enabled?'Turni settimanali attivi':'Nessun limite settimanale attivo'}</p>
    {!plan.enabled&&<p className="text-sm">Restano validi assenze, sovrapposizioni e disponibilità del centro.</p>}
    {plan.affected_bookings>0&&<p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Lezioni future assegnate fuori turno: {plan.affected_bookings}. Gli appuntamenti restano confermati: controllali nel calendario filtrando questo istruttore.</p>}
    <ul className="grid gap-2 text-sm sm:grid-cols-2">{weekDays.map((label,i)=><li key={label} className="rounded-xl bg-[var(--pc-bone-50)] p-3"><strong>{label}</strong><span className="ml-2">{plan.slots.filter(s=>s.day===i+1).map(s=>`${s.start}–${s.end}`).join(' · ')||(plan.enabled?'Fuori turno':'Nessuna fascia impostata')}</span></li>)}</ul>
    {plan.can_edit?<form onSubmit={e=>void save(e)} className="rounded-2xl border border-[var(--pc-line)] p-4">
     <fieldset disabled={busy||blocked||pending.current!==null} className="space-y-4">
      <legend className="font-semibold">Imposta gli orari</legend>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={e=>{dirty.current=true;setEnabled(e.target.checked);}}/><span>Usa questi turni per le nuove assegnazioni</span></label>
      <div className="flex flex-wrap gap-2" aria-label="Scegli il giorno">{weekDays.map((label,i)=><button type="button" key={label} aria-pressed={day===i+1} onClick={()=>setDay(i+1)} className={`rounded-full border px-3 py-2 text-sm ${day===i+1?'bg-emerald-900 text-white':'bg-white'}`}>{label}</button>)}</div>
      <h4 className="font-semibold">{weekDays[day-1]}</h4>
      {!slots.some(s=>s.day===day)&&<p className="text-sm">Nessuna fascia. Aggiungine una se lavori in questo giorno.</p>}
      {slots.map((s,index)=>s.day!==day?null:<div key={index} className="space-y-2 rounded-xl bg-[var(--pc-bone-50)] p-3"><div className="grid grid-cols-2 gap-3">
       <label className="text-sm">Dalle<input required aria-label={`Inizio fascia ${index+1}`} type="time" step="60" value={s.start} onChange={e=>update(index,'start',e.target.value)} className={field}/></label>
       <label className="text-sm">Alle{s.end==='24:00'?<span className={`${field} block`}>24:00</span>:<input required aria-label={`Fine fascia ${index+1}`} type="time" step="60" value={s.end} onChange={e=>update(index,'end',e.target.value)} className={field}/>}</label>
      </div><div className="flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.end==='24:00'} onChange={e=>update(index,'end',e.target.checked?'24:00':'18:00')}/>Fino a mezzanotte</label><button type="button" className="text-sm underline" onClick={()=>{dirty.current=true;setSlots(rows=>rows.filter((_,i)=>i!==index));}}>Rimuovi fascia {index+1}</button></div></div>)}
      <button type="button" disabled={slots.filter(s=>s.day===day).length>=4} className="pc-btn pc-btn-secondary" onClick={()=>{dirty.current=true;setSlots(rows=>[...rows,{day,start:'09:00',end:'13:00'}]);}}>Aggiungi fascia</button>
      <p className="text-xs">Fino a quattro fasce al giorno. Unisci quelle adiacenti o sovrapposte. Per gli orari notturni usa due giorni distinti; una lezione deve rientrare in una sola fascia. Durante il cambio dell’ora, una fascia con estremi ambigui non permette nuove assegnazioni.</p>
     </fieldset>
     {validation&&<p role="status" className="mt-3 text-sm text-amber-950">{validation}</p>}
     <button disabled={busy||blocked||!!validation} className="pc-btn pc-btn-primary mt-4">{busy?'Salvataggio…':pending.current?'Riprova lo stesso salvataggio':'Salva turni'}</button>
    </form>:<p className="text-sm">I turni sono gestiti dal centro. Puoi indicare le tue assenze da Gestisci indisponibilità.</p>}
   </>}
  </div>}
 </section>;
}
