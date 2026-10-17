import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { supabase } from '../lib/supabase';
import { agendaError, type AgendaLesson, type DelegatedAgenda } from '../lib/centreAgenda';
import { addDays, calendarTime, dayLabel, romeDay } from '../lib/professionalCalendar';

export function CentreAgendaPage(){
 const {user}=useAuth(),{path,navigate}=useRouter();
 const membership=new URLSearchParams(path.split('?')[1]||'').get('membership')||'';
 if(!user)return null;
 if(!/^[0-9a-f-]{36}$/i.test(membership))return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-2xl font-semibold">Scegli il centro dalle tue collaborazioni</h1><button className="pc-btn pc-btn-primary mt-5" onClick={()=>navigate('/account/centres')}>Apri collaborazioni</button></main>;
 return <Agenda key={`${user.id}:${membership}`} membership={membership}/>;
}
function Agenda({membership}:{membership:string}){
 const {navigate}=useRouter();
 const [day,setDay]=useState(()=>romeDay(new Date().toISOString())),[page,setPage]=useState(0);
 const [data,setData]=useState<DelegatedAgenda|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [selected,setSelected]=useState<AgendaLesson|null>(null),[instructor,setInstructor]=useState('');
 const [busy,setBusy]=useState(false),[saveError,setSaveError]=useState(''),[overlap,setOverlap]=useState(false),[allowOverlap,setAllowOverlap]=useState(false);
 const alive=useRef(true),generation=useRef(0),lock=useRef(false),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{alive.current=true;const requests=generation;return()=>{alive.current=false;requests.current++;};},[]);
 const reload=useCallback(async()=>{
  const request=++generation.current;setLoading(true);setError('');
  try{const {data:response,error:failure}=await supabase.rpc('get_delegated_centre_agenda',{p_membership_id:membership,p_day:day,p_page:page});
   if(failure)throw failure;
   if(alive.current&&request===generation.current)setData(response);
  }catch(failure){if(alive.current&&request===generation.current){setData(null);setSelected(null);setError(agendaError(failure));}}
  finally{if(alive.current&&request===generation.current)setLoading(false);}
 },[membership,day,page]);
 useEffect(()=>{void reload();},[reload]);
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState==='visible'&&!lock.current)void reload();};
  const timer=window.setInterval(refresh,60000);window.addEventListener('focus',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[reload]);
 useEffect(()=>{if(selected&&!dialog.current?.open)dialog.current?.showModal();else if(!selected)dialog.current?.close();},[selected]);
 // A refresh must not silently replace the versions attached to an open assignment.
 const editVersion=useRef('');
 function open(lesson:AgendaLesson){if(!data||busy||loading)return;editVersion.current=data.membership_version;setSelected(lesson);setInstructor(lesson.instructor_id||'');setOverlap(false);setAllowOverlap(false);setSaveError('');setNotice('');}
 async function save(){
  if(lock.current||!selected)return;
  lock.current=true;setBusy(true);setSaveError('');
  try{const {error:failure}=await supabase.rpc('assign_delegated_centre_instructor',{
   p_membership_id:membership,p_membership_version:editVersion.current,p_booking_id:selected.id,
   p_instructor_id:instructor||null,p_assignment_version:selected.assignment_version,p_allow_overlap:overlap&&allowOverlap
  });if(failure)throw failure;
   if(alive.current){setSelected(null);setNotice('Assegnazione salvata con il tuo nome.');await reload();}
  }catch(failure){if(alive.current){
   const code=(failure as {code?:string})?.code;
   if(['PCX01','PCX02','PCX04'].includes(code||'')){setSaveError(agendaError(failure));setOverlap(code==='PCX01');setAllowOverlap(false);}
   else {setSelected(null);setNotice(agendaError(failure));await reload();}
  }}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function changeDay(next:string){if(!next||busy)return;setDay(next);setPage(0);setData(null);setNotice('');}
 const current=data?.day===day&&data?.page===page?data:null;
 return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 text-[var(--pc-ink-950)]">
  <button className="text-sm underline" onClick={()=>navigate('/account/centres')}>← Collaborazioni con i centri</button>
  <header className="mt-6 rounded-3xl bg-[var(--pc-forest-900)] p-6 text-white sm:p-8">
   <p className="text-sm font-semibold text-emerald-200">Coordinamento agenda</p><h1 className="mt-2 text-3xl font-semibold">{current?.centre_name||'Agenda del centro'}</h1>
   <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50">Organizza chi segue le lezioni confermate. Le assegnazioni sono registrate a tuo nome. Per richieste, orari e modifiche alle tue lezioni, rivolgiti al centro.</p>
  </header>
  <div className="my-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap">
   <button aria-label="Giorno precedente" className="pc-btn pc-btn-secondary" disabled={busy} onClick={()=>changeDay(addDays(day,-1))}>←</button>
   <label className="min-w-0 text-sm font-semibold sm:flex-1">Giorno · ora italiana<input type="date" value={day} disabled={busy} onChange={e=>changeDay(e.target.value)} className="mt-2 block w-full min-w-0 rounded-xl border p-3"/></label>
   <button aria-label="Giorno successivo" className="pc-btn pc-btn-secondary" disabled={busy} onClick={()=>changeDay(addDays(day,1))}>→</button>
   <div className="col-span-3 flex items-center gap-4"><button className="pc-btn pc-btn-secondary" disabled={busy} onClick={()=>changeDay(romeDay(new Date().toISOString()))}>Oggi</button>
   <button className="text-sm underline" disabled={busy||loading} onClick={()=>void reload()}>Aggiorna agenda</button></div>
  </div>
  {notice&&<p role="status" className="pc-card mb-5 p-4">{notice}</p>}
  {error?<p role="alert" className="pc-card p-5">{error} <button className="underline" onClick={()=>void reload()}>Riprova</button></p>:<>
   <h2 className="mb-4 text-xl font-semibold">{dayLabel(day,true)}</h2>
   {loading&&<p role="status" className="mb-4">Aggiornamento agenda…</p>}
   {current&&<><p className="mb-4 text-sm text-[var(--pc-muted-600)]">{current.total} lezioni · visibili dalla concessione del permesso</p>
    {current.items.length===0?<p className="pc-card p-6">Nessuna lezione visibile in questo giorno.</p>:<div className="space-y-4">{current.items.map(lesson=><article key={lesson.id} className="pc-card grid gap-4 p-5 sm:grid-cols-[7rem_1fr_auto] sm:p-6">
     <div><p className="text-lg font-semibold">{calendarTime(lesson.start_at)}</p><p className="text-sm text-[var(--pc-muted-600)]">fino alle {calendarTime(lesson.end_at)}</p><span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">{lesson.status==='completed'?'Svolta':'Confermata'}</span></div>
     <div className="min-w-0 break-words"><h3 className="text-lg font-semibold">{lesson.service_name}</h3><p className="mt-1">{lesson.client_name}{lesson.dog_names.length>0&&` · ${lesson.dog_names.join(', ')}`}</p><p className="mt-3 text-sm"><strong>Istruttore:</strong> {lesson.instructor_name||'Da assegnare'}</p>
      {lesson.assigned_by&&<p className="mt-1 text-xs">Assegnazione aggiornata da {lesson.assigned_by}.</p>}
      {lesson.outside_shift&&<p className="mt-2 text-sm text-amber-800">Fuori dai turni attuali dell’istruttore.</p>}{lesson.instructor_unavailable&&<p className="mt-2 text-sm text-amber-800">Istruttore indisponibile in questo orario.</p>}{lesson.overlap_confirmed&&<p className="mt-2 text-xs">Sovrapposizione confermata per attività di gruppo.</p>}
      {lesson.managed_by_centre&&<p className="mt-2 text-xs">Questa assegnazione è gestita dal centro.</p>}
     </div><div>{lesson.can_assign&&<button disabled={busy||loading} className="pc-btn pc-btn-secondary" onClick={()=>open(lesson)}>{lesson.instructor_id?'Cambia istruttore':'Assegna istruttore'}</button>}</div>
    </article>)}</div>}
    {current.total>50&&<nav className="mt-6 flex items-center justify-between gap-3" aria-label="Pagine delle lezioni"><button className="pc-btn pc-btn-secondary" disabled={busy||loading||page===0} onClick={()=>{setPage(page-1);setData(null);}}>Precedenti</button><span className="text-sm">Pagina {page+1} di {Math.ceil(current.total/50)}</span><button className="pc-btn pc-btn-secondary" disabled={busy||loading||(page+1)*50>=current.total} onClick={()=>{setPage(page+1);setData(null);}}>Successive</button></nav>}
   </>}
  </>}
  <dialog ref={dialog} onCancel={e=>{e.preventDefault();if(!lock.current)setSelected(null);}} aria-labelledby="delegate-assignment-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-stone-900 backdrop:bg-stone-900/50">
   {selected&&current&&<><h2 id="delegate-assignment-title" className="text-xl font-semibold">Chi segue questa lezione?</h2><p className="mt-2 text-sm">{selected.service_name} · {selected.client_name}</p>
    <label htmlFor="agenda-instructor" className="mt-5 block text-sm font-semibold">Istruttore</label><select id="agenda-instructor" className="mt-2 w-full rounded-xl border p-3" value={instructor} disabled={busy} onChange={e=>{setInstructor(e.target.value);setOverlap(false);setAllowOverlap(false);setSaveError('');}}><option value="">Da assegnare</option>{current.members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</select>
    <p className="mt-2 text-xs text-stone-600">Per assegnare una lezione a te, chiedi al centro.</p>
    {saveError&&<p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{saveError}</p>}
    {overlap&&<label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={allowOverlap} disabled={busy} onChange={e=>setAllowOverlap(e.target.checked)}/><span>Confermo che le lezioni possono essere svolte insieme, ad esempio come attività di gruppo.</span></label>}
    <div className="mt-5 flex flex-wrap gap-3"><button className="pc-btn pc-btn-primary" disabled={busy||(overlap&&!allowOverlap)||Boolean(instructor&&!current.members.some(m=>m.id===instructor))} onClick={()=>void save()}>{busy?'Salvataggio…':'Salva assegnazione'}</button><button className="pc-btn pc-btn-secondary" disabled={busy} onClick={()=>setSelected(null)}>Annulla</button></div>
   </>}
  </dialog>
 </main>;
}
