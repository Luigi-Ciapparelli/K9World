import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { membershipError, type CentreMembership } from '../lib/centreMemberships';

export function CentreAgendaPermission({row,disabled,onChanged}:{row:CentreMembership;disabled:boolean;onChanged:()=>Promise<void>}) {
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const alive=useRef(true),lock=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function change(){
  if(lock.current||disabled)return;
  const allowed=!row.can_manage_agenda;
  if(!confirm(allowed?'Consentire a questo collega di vedere le lezioni del centro dalla concessione del permesso e assegnare quelle future agli altri istruttori? Vedrà nomi di clienti e cani. Le proprie assegnazioni restano al centro; questo permesso non apre messaggi, note o recapiti.':'Revocare il coordinamento dell’agenda? Le assegnazioni già salvate restano registrate con il nome di chi le ha effettuate.'))return;
  lock.current=true;setBusy(true);setNotice('');
  try {
   const {error}=await supabase.rpc('set_centre_agenda_permission',{p_membership_id:row.id,p_allowed:allowed,p_expected_version:row.version});
   if(error)throw error;
   if(alive.current)setNotice(allowed?'Coordinamento abilitato. Il collega trova l’agenda nelle proprie collaborazioni.':'Coordinamento revocato. Le assegnazioni salvate sono conservate.');
  } catch(error){if(alive.current)setNotice(membershipError(error));}
  finally {await onChanged();lock.current=false;if(alive.current)setBusy(false);}
 }
 return <details className="w-full rounded-xl border border-emerald-200 p-3 text-sm">
  <summary className="cursor-pointer font-semibold">Coordinamento agenda · {row.can_manage_agenda?'abilitato':'non abilitato'}</summary>
  <p className="mt-3 leading-relaxed">Delega le assegnazioni delle lezioni future agli altri istruttori. Il collega vede servizi, orari e nomi dei clienti e dei cani. Le sue lezioni restano gestite dal centro; messaggi e note richiedono i rispettivi permessi.</p>
  <button className="pc-btn pc-btn-secondary mt-3" disabled={disabled||busy||(!row.can_manage_agenda&&!row.instructor_active)} onClick={()=>void change()}>{busy?'Salvataggio…':row.can_manage_agenda?'Revoca coordinamento':'Consenti coordinamento'}</button>
  {notice&&<p className="mt-3" role="status">{notice}</p>}
 </details>;
}
