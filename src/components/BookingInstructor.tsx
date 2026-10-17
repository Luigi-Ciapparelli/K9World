import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { supabase } from '../lib/supabase';
import { teamError, type BookingInstructorRow, type CentreTeam } from '../lib/centreTeam';

export function BookingInstructor({row,professional=false,onSaved}:{row?: BookingInstructorRow; professional?: boolean;onSaved:()=>void}) {
 const {user}=useAuth();
 return row&&user?<InstructorContent key={`${user.id}:${row.booking_id}:${row.version}`} row={row} professional={professional} onSaved={onSaved}/>:null;
}
function InstructorContent({row,professional,onSaved}:{row:BookingInstructorRow;professional:boolean;onSaved:()=>void}) {
 const {navigate}=useRouter(); const [editing,setEditing]=useState(false);
 const [team,setTeam]=useState<CentreTeam|null>(null);const [selected,setSelected]=useState(row.instructor_id||'');
 const [overlap,setOverlap]=useState(false);const [allowOverlap,setAllowOverlap]=useState(false);
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const mounted=useRef(true);const lock=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 async function open(){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice('');
  try{const {data,error}=await supabase.rpc('get_my_centre_team');if(error)throw error;
   if(mounted.current){setTeam(data as CentreTeam);setEditing(true);}
  }catch{if(mounted.current)setNotice('Elenco istruttori non caricato. Riprova.');}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 async function save(){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice('');
  try{const {error}=await supabase.rpc('assign_booking_instructor_checked',{p_booking_id:row.booking_id,p_instructor_id:selected||null,p_expected_version:row.version,p_allow_overlap:overlap&&allowOverlap});if(error)throw error;
   if(mounted.current){setEditing(false);onSaved();}
  }catch(error){if(mounted.current){setNotice(teamError(error));setOverlap((error as {code?:string})?.code==='PCX01');setAllowOverlap(false);}}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 }
 return <div className="mt-3 rounded-xl border border-[var(--pc-line)] p-3 text-sm" aria-label="Istruttore della lezione">
  <p><strong>Istruttore:</strong> {row.instructor_name||'Non ancora indicato dal centro'}</p>
  <p className="mt-1 text-xs text-[var(--pc-muted-600)]">Indicazione del centro per questa lezione.</p>
  {professional&&row.assigned_by&&<p className="mt-2 text-sm">Assegnazione aggiornata da <strong>{row.assigned_by}</strong>.</p>}
  {professional&&row.completed_by&&<p className="mt-2 text-sm">Segnata come svolta da <strong>{row.completed_by}</strong>.</p>}
  {professional&&row.instructor_active===false&&row.instructor_name&&<p className="mt-2 text-amber-800">Questo istruttore è inattivo nell’elenco. L’assegnazione registrata resta conservata.</p>}
  {professional&&row.instructor_unavailable&&<p role="status" className="mt-2 font-semibold text-amber-900">Istruttore indisponibile nell’orario della lezione: la lezione è ancora confermata. Controlla l’assegnazione e concorda eventuali cambiamenti con il cliente.</p>}
  {professional&&row.outside_shift&&<p role="status" className="mt-2 font-semibold text-amber-900">Lezione fuori dai turni settimanali attuali. Rimane confermata: controlla l’assegnazione con il cliente e l’istruttore.</p>}
  {professional&&row.overlap_confirmed&&<p className="mt-2 text-xs text-amber-900">Sovrapposizione di orario confermata dal centro al momento dell’assegnazione.</p>}
  {notice&&<p role="alert" className="mt-2">{notice} <button type="button" className="underline" disabled={busy} onClick={onSaved}>Aggiorna</button></p>}
  {professional&&row.can_assign&&!editing&&<button type="button" disabled={busy} onClick={()=>void open()} className="mt-2 font-semibold underline">{busy?'Caricamento…':row.instructor_name?'Cambia istruttore':'Assegna istruttore'}</button>}
  {professional&&editing&&team&&<div className="mt-3 space-y-3">
   <label htmlFor={`lesson-instructor-${row.booking_id}`} className="block">Chi segue la lezione?</label>
   <select id={`lesson-instructor-${row.booking_id}`} value={selected} onChange={e=>{setSelected(e.target.value);setOverlap(false);setAllowOverlap(false);setNotice('');}} disabled={busy} className="mt-1 block w-full rounded-lg border p-2">
    <option value="">Nessun istruttore assegnato</option>
    {team.members.filter(m=>m.active||m.id===row.instructor_id).map(m=><option key={m.id} value={m.id} disabled={!m.active}>{m.display_name}{!m.active?' (inattivo)':''}</option>)}
   </select>
   {!team.members.some(m=>m.active)&&<p>Aggiungi prima gli istruttori del centro.</p>}
   {overlap&&<label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-950"><input type="checkbox" className="mt-1" disabled={busy} checked={allowOverlap} onChange={e=>setAllowOverlap(e.target.checked)}/><span>Confermo che le lezioni possono essere svolte insieme, ad esempio come lezione di gruppo.</span></label>}
   <div className="flex flex-wrap gap-3"><button type="button" disabled={busy||(overlap&&!allowOverlap)||Boolean(selected&&!team.members.some(m=>m.id===selected&&m.active))} onClick={()=>void save()} className="pc-btn pc-btn-primary">{busy?'Salvataggio…':'Salva assegnazione'}</button><button type="button" disabled={busy} onClick={()=>{setEditing(false);setOverlap(false);setAllowOverlap(false);setNotice('');}} className="pc-btn pc-btn-secondary">Annulla</button><button type="button" disabled={busy} onClick={()=>navigate('/pro/team')} className="underline">Gestisci istruttori</button></div>
  </div>}
 </div>;
}
export function InstructorLoadError({retry}:{retry:()=>void}){return <p role="alert" className="my-3 text-sm">Istruttori delle lezioni non caricati. <button type="button" className="underline font-semibold" onClick={retry}>Riprova</button></p>;}
