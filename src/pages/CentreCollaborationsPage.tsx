import { CentreLessonNotes, CentreNoteAuthorArchive } from '../components/CentreLessonNotes';
import { messagesChanged } from '../lib/bookingMessages';
import { BookingConversation } from '../components/BookingConversation';
import { InstructorTimeOff } from '../components/InstructorTimeOff';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../lib/AuthContext';
import {useRouter} from '../lib/RouterContext';
import {supabase} from '../lib/supabase';
import {type CentreLesson,type CentreMembership,membershipError,membershipLabels,useCentreMemberships} from '../lib/centreMemberships';
export function CentreCollaborationsPage(){const {user}=useAuth();return user?<Collaborations key={user.id}/>:null;}
function Collaborations(){
 const {navigate}=useRouter();const {rows,loading,error,reload}=useCentreMemberships();
 const [code,setCode]=useState<{code:string;expires_at:string}|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [month,setMonth]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
 const [agenda,setAgenda]=useState<{items:CentreLesson[];truncated:boolean}|null>(null),[agendaError,setAgendaError]=useState(''),[agendaLoading,setAgendaLoading]=useState(true);
 const alive=useRef(true),lock=useRef(false),generation=useRef(0);
 useEffect(()=>{alive.current=true;const requests=generation;return()=>{alive.current=false;requests.current++;};},[]);
 const loadAgenda=useCallback(async()=>{
  const request=++generation.current;setAgendaLoading(true);setAgendaError('');
  try{const {data,error}=await supabase.rpc('get_my_centre_lessons',{p_from:month.toISOString(),p_until:new Date(month.getFullYear(),month.getMonth()+1,1).toISOString()});if(error)throw error;
   if(alive.current&&generation.current===request)setAgenda(data);
  }catch{if(alive.current&&generation.current===request){setAgenda(null);setAgendaError('Agenda non caricata. Riprova.');}}
  finally{if(alive.current&&generation.current===request)setAgendaLoading(false);}
 },[month]);
 useEffect(()=>{void loadAgenda();},[loadAgenda]);
 useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible')void loadAgenda();};window.addEventListener(messagesChanged,refresh);return()=>window.removeEventListener(messagesChanged,refresh);},[loadAgenda]);
 useEffect(()=>{const refresh=()=>{if(document.visibilityState==='visible'){void reload();void loadAgenda();}};const timer=window.setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[reload,loadAgenda]);
 async function action(row?:CentreMembership,type?:'accept'|'decline'|'revoke'){
  if(lock.current)return;if(type==='revoke'&&!confirm('Lasciare il centro? Perderai l’accesso alla sua agenda. Le lezioni rimangono registrate nel centro.'))return;
  lock.current=true;setBusy(true);setNotice('');
  try{if(row&&type){const {error}=await supabase.rpc('change_centre_membership',{p_id:row.id,p_action:type,p_expected_version:row.version});if(error)throw error;
    if(alive.current){setAgenda(null);setNotice(type==='accept'?'Collegamento accettato. La tua agenda è disponibile.':type==='decline'?'Proposta rifiutata.':'Collegamento revocato.');await Promise.all([reload(),loadAgenda()]);}
   }else{const {data,error}=await supabase.rpc('get_centre_link_code');if(error)throw error;if(alive.current)setCode(data);}
  }catch(e){if(alive.current)setNotice(membershipError(e));}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function complete(lesson:CentreLesson){
  if(lock.current||!lesson.can_complete||!lesson.membership_id||!lesson.membership_version||!lesson.assignment_version)return;
  if(!confirm(`Confermi che la lezione «${lesson.service_name}» con ${lesson.client_name} è stata realmente svolta? La conferma sarà registrata a tuo nome e visibile al centro.`))return;
  lock.current=true;setBusy(true);setNotice('');
  try{const {data,error}=await supabase.rpc('complete_assigned_centre_lesson',{p_booking_id:lesson.id,p_membership_id:lesson.membership_id,p_membership_version:lesson.membership_version,p_assignment_version:lesson.assignment_version});if(error)throw error;
   if(alive.current){setNotice(data?.already_completed?'La lezione risultava già svolta.':'Lezione segnata come svolta. Il centro vede la tua conferma.');await Promise.all([reload(),loadAgenda()]);}
  }catch(e){if(alive.current){setNotice(membershipError(e));await Promise.all([reload(),loadAgenda()]);}}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 const memberships=rows.filter(r=>!r.is_centre);
 const day=(value:string)=>new Date(value).toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
 const hour=(value:string)=>new Date(value).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
 return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 text-[var(--pc-ink-950)]">
  <button className="text-sm underline" onClick={()=>navigate('/account/contacts')}>Profilo e recapiti</button>
  <header className="mt-6"><p className="pc-kicker">Il tuo lavoro nei centri</p><h1 className="pc-display mt-2 text-3xl font-semibold">Collaborazioni con i centri</h1><p className="mt-3 text-[var(--pc-muted-600)]">Un account personale, le tue lezioni assegnate. Scegli tu quali collegamenti accettare e puoi interromperli in qualsiasi momento.</p></header>
  {notice&&<p role="status" className="pc-card mt-5 p-4">{notice}</p>}
  <section className="pc-card mt-6 p-5" aria-labelledby="link-code-heading"><h2 id="link-code-heading" className="text-xl font-semibold">Collegati a un centro</h2><p className="mt-2 text-sm">Mostra il tuo codice al responsabile: potrà proporti il collegamento. Nessun accesso viene attivato senza la tua accettazione.</p>
   {code?<div className="mt-4"><label className="text-sm font-semibold">Il tuo codice<input readOnly value={code.code} onFocus={e=>e.target.select()} className="mt-2 block w-full rounded-xl border p-3 font-mono text-sm"/></label><p className="mt-2 text-sm">Valido fino al {new Date(code.expires_at).toLocaleDateString('it-IT')}. Seleziona il codice per copiarlo.</p></div>:<button disabled={busy} className="pc-btn pc-btn-secondary mt-4" onClick={()=>void action()}>Mostra il mio codice</button>}
  </section>
  <section className="mt-8" aria-labelledby="memberships-heading"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="memberships-heading" className="text-xl font-semibold">I tuoi collegamenti</h2><button disabled={busy||loading} className="text-sm underline" onClick={()=>{void reload();void loadAgenda();}}>Aggiorna</button></div>
   {loading?<p role="status" className="mt-4">Caricamento…</p>:error?<p role="alert" className="mt-4">{error}</p>:!memberships.length?<p className="pc-card mt-4 p-5">Non hai ancora proposte. Condividi il codice con il centro con cui collabori.</p>:<div className="mt-4 space-y-3">{memberships.map(row=><article key={row.id} className="pc-card p-5"><h3 className="text-lg font-semibold">{row.centre_name}</h3><p className="mt-1 text-sm">{row.instructor_name} · {membershipLabels[row.status]}</p>
    {row.status==='pending'&&<><p className="mt-3 text-sm leading-relaxed">Accettando confermi la collaborazione con questo centro. Potrai leggere data, orario, servizio e nomi del cliente e del cane per le lezioni assegnate che iniziano dopo la conferma. Il centro vedrà il nome del tuo account. Il centro può concederti separatamente messaggi, completamento e registrazione di note delle lezioni assegnate. Le note conservano il tuo nome e rimangono negli archivi tuo e del centro. Questo collegamento non verifica qualifiche professionali.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy||!row.instructor_active} className="pc-btn pc-btn-primary" onClick={()=>void action(row,'accept')}>Accetta collegamento</button><button disabled={busy} className="pc-btn pc-btn-secondary" onClick={()=>void action(row,'decline')}>Rifiuta</button></div></>}
    {row.status==='active'&&<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm">{row.instructor_active?(row.can_complete_lessons?'Il centro ti autorizza a segnare come svolte le tue lezioni assegnate.':'Completamento delle lezioni non abilitato.'):'Accesso sospeso dal centro.'}</p><button disabled={busy} className="text-sm underline" onClick={()=>void action(row,'revoke')}>Lascia il centro</button></div>}
    {row.status==='active'&&row.instructor_active&&row.can_message_clients&&<p className="mt-3 text-sm">Puoi leggere e inviare messaggi nelle tue lezioni assegnate. Le risposte mostrano il tuo nome al cliente e al centro.</p>}
    {row.status==='active'&&row.instructor_active&&row.can_record_notes&&<p className="mt-3 text-sm">Puoi registrare note delle lezioni svolte con relazione di continuità autorizzata. Il centro conserva i contributi con il tuo nome.</p>}{row.status==='active'&&row.instructor_active&&<InstructorTimeOff instructorId={row.instructor_id} name={row.instructor_name}/>}
   </article>)}</div>}
  </section>
  <section className="mt-8" aria-labelledby="assigned-agenda-heading"><h2 id="assigned-agenda-heading" className="text-2xl font-semibold">La tua agenda nei centri</h2><p className="mt-2 text-sm">Orari nel fuso del dispositivo. Per modificare data, orario o assegnazione, contatta il centro. Se autorizzato, puoi confermare una lezione svolta dopo l’orario di fine.</p>
   <div className="my-5 flex flex-wrap items-center justify-between gap-3"><button aria-label="Mese precedente" className="pc-btn pc-btn-secondary" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>←</button><strong>{month.toLocaleDateString('it-IT',{month:'long',year:'numeric'})}</strong><button aria-label="Mese successivo" className="pc-btn pc-btn-secondary" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>→</button></div>
   {agendaLoading&&!agenda?<p role="status">Caricamento agenda…</p>:agendaError?<p role="alert">{agendaError} <button className="underline" onClick={()=>void loadAgenda()}>Riprova agenda</button></p>:agenda?.items.length?<div className="space-y-3">{agenda.items.map(lesson=><article key={lesson.id} className="pc-card p-5"><p className="text-sm font-semibold text-[var(--pc-forest-700)]">{day(lesson.start_at)} · {hour(lesson.start_at)}–{hour(lesson.end_at)}</p><h3 className="mt-2 text-lg font-semibold">{lesson.service_name}</h3><p className="mt-1 text-sm">{lesson.centre_name} · {lesson.status==='completed'?'Svolta':'Confermata'}</p><p className="mt-3">{lesson.client_name}{lesson.dog_names.length>0&&` · ${lesson.dog_names.join(', ')}`}</p>{lesson.completed_by&&<p className="mt-3 text-sm">Confermata come svolta da {lesson.completed_by}.</p>}{lesson.can_complete&&<button disabled={busy||agendaLoading} className="pc-btn pc-btn-primary mt-4" onClick={()=>void complete(lesson)}>Segna lezione svolta</button>}<div className="mt-4"><CentreLessonNotes lesson={lesson}/></div>{lesson.can_message&&lesson.membership_id&&lesson.membership_version&&lesson.assignment_version&&<div className="mt-4"><BookingConversation bookingId={lesson.id} assigned={{membershipId:lesson.membership_id,membershipVersion:lesson.membership_version,assignmentVersion:lesson.assignment_version}} summary={{booking_id:lesson.id,message_count:lesson.message_count||0,unread_count:lesson.unread_count||0}}/></div>}</article>)}{agenda.truncated&&<p role="status">Mostrate le prime 300 lezioni del mese. Chiedi al centro il quadro completo.</p>}</div>:<p className="pc-card p-5">Nessuna lezione assegnata visibile in questo mese.</p>}
  </section>
 <CentreNoteAuthorArchive/>
 </main>;
}
