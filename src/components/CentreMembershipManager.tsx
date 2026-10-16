import {useEffect,useRef,useState,type FormEvent} from 'react';
import {supabase} from '../lib/supabase';
import {type CentreInstructor} from '../lib/centreTeam';
import {membershipError,membershipLabels,type CentreMembership,useCentreMemberships} from '../lib/centreMemberships';
export function CentreMembershipManager({members}:{members:CentreInstructor[]}){
 const {rows,loading,error,reload}=useCentreMemberships();
 const [memberId,setMemberId]=useState(''),[code,setCode]=useState(''),[editing,setEditing]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const requestId=useRef(crypto.randomUUID()),lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const managed=rows.filter(r=>r.is_centre);
 async function invite(event:FormEvent){event.preventDefault();const member=members.find(m=>m.id===memberId);if(!member||lock.current)return;
  lock.current=true;setBusy(true);setMessage('');
  try{const {error}=await supabase.rpc('invite_centre_account',{p_id:requestId.current,p_instructor_id:member.id,p_code:code.trim(),p_expected_version:member.version});if(error)throw error;
   if(alive.current){setEditing(false);setCode('');requestId.current=crypto.randomUUID();setMessage('Proposta pronta nell’account dell’istruttore. L’accesso inizia soltanto quando accetta.');await reload();}
  }catch(e){if(alive.current)setMessage(membershipError(e));}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function revoke(row:CentreMembership){if(lock.current||!confirm('Revocare il collegamento? L’istruttore perderà l’accesso all’agenda del centro. Le assegnazioni delle lezioni rimangono.'))return;
  lock.current=true;setBusy(true);setMessage('');try{const {error}=await supabase.rpc('change_centre_membership',{p_id:row.id,p_action:'revoke',p_expected_version:row.version});if(error)throw error;
   if(alive.current){setMessage('Accesso revocato. Controlla le lezioni ancora assegnate nell’agenda.');await reload();}
  }catch(e){if(alive.current)setMessage(membershipError(e));}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function permission(row:CentreMembership){
  if(lock.current)return;const allowed=!row.can_complete_lessons;
  if(allowed&&!confirm('Consentire a questo istruttore di segnare come svolte le proprie lezioni assegnate, dopo l’orario di fine? Non potrà modificare appuntamenti, messaggi o note.'))return;
  lock.current=true;setBusy(true);setMessage('');
  try{const {error}=await supabase.rpc('set_centre_lesson_permission',{p_membership_id:row.id,p_allowed:allowed,p_expected_version:row.version});if(error)throw error;
   if(alive.current){setMessage(allowed?'Permesso attivato per le sole lezioni assegnate.':'Permesso rimosso. L’istruttore conserva la lettura della propria agenda.');await reload();}
  }catch(e){if(alive.current){setMessage(membershipError(e));await reload();}}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 return <section className="pc-card mt-8 p-5 sm:p-6" aria-labelledby="centre-accounts-title">
  <div className="flex flex-wrap items-center justify-between gap-3"><p className="pc-kicker">Lavora insieme al tuo team</p><button disabled={busy||loading} className="text-sm underline" onClick={()=>void reload()}>Aggiorna collegamenti</button></div><h2 id="centre-accounts-title" className="mt-2 text-2xl font-semibold">Collega gli account degli istruttori</h2>
  <p className="mt-3 max-w-2xl text-sm leading-relaxed">Chiedi all’istruttore il codice che trova in <strong>Profilo e recapiti → Collaborazioni con i centri</strong>. Dopo la sua conferma potrà leggere date, servizi, nomi dei clienti e dei cani delle sole lezioni assegnate, a partire dall’accettazione. Messaggi, recapiti e note private restano riservati.</p>
  {message&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-stone-900">{message}</p>}
  {error&&<p role="alert" className="mt-4">{error} <button disabled={busy} className="underline" onClick={()=>void reload()}>Riprova</button></p>}
  {loading?<p role="status" className="mt-4">Caricamento collegamenti…</p>:<>
   {managed.length>0&&<ul className="mt-5 space-y-3">{managed.map(row=><li key={row.id} className="flex flex-wrap justify-between gap-3 rounded-xl border p-4"><div><p className="font-semibold">{row.instructor_name}</p><p className="text-sm">Account: {row.account_name} · {membershipLabels[row.status]}</p>{row.status==='active'&&!row.instructor_active&&<p className="text-sm">Accesso sospeso: istruttore o centro inattivo.</p>}</div>{row.status==='active'&&<div className="w-full rounded-xl bg-[var(--pc-bone-50)] p-3 text-sm"><p className="font-semibold">{row.can_complete_lessons?'Può segnare come svolte le proprie lezioni':'Agenda in sola lettura'}</p><p className="mt-1">Il centro mantiene la gestione di richieste, orari e assegnazioni.</p><button disabled={busy||Boolean(error)||(!row.can_complete_lessons&&!row.instructor_active)} className="mt-2 underline" onClick={()=>void permission(row)}>{row.can_complete_lessons?'Rimuovi permesso di completamento':'Consenti completamento lezioni'}</button></div>}{['pending','active'].includes(row.status)&&<button disabled={busy} className="text-sm underline" onClick={()=>void revoke(row)}>Revoca collegamento</button>}</li>)}</ul>}
   {editing?<form className="mt-5 space-y-4" onSubmit={invite} aria-label="Collega account istruttore">
    <div><label htmlFor="centre-account-instructor" className="block text-sm font-semibold">Istruttore da collegare</label><select id="centre-account-instructor" required disabled={busy} value={memberId} onChange={e=>{setMemberId(e.target.value);requestId.current=crypto.randomUUID();}} className="mt-2 block w-full rounded-xl border p-3"><option value="">Scegli dall’elenco</option>{members.filter(m=>m.active&&!managed.some(r=>r.instructor_id===m.id&&['pending','active'].includes(r.status))).map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}</select></div>
    <label className="block text-sm font-semibold">Codice ricevuto dall’istruttore<input required disabled={busy} autoComplete="off" spellCheck={false} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" value={code} onChange={e=>{setCode(e.target.value.trim());requestId.current=crypto.randomUUID();}} className="mt-2 block w-full rounded-xl border p-3 font-mono text-sm"/></label>
    <div className="flex flex-wrap gap-3"><button disabled={busy||!memberId||!code} className="pc-btn pc-btn-primary">{busy?'Salvataggio…':'Proponi collegamento'}</button><button type="button" disabled={busy} className="pc-btn pc-btn-secondary" onClick={()=>setEditing(false)}>Annulla</button></div>
   </form>:<button disabled={busy||Boolean(error)} className="pc-btn pc-btn-secondary mt-5" onClick={()=>{setEditing(true);setMessage('');requestId.current=crypto.randomUUID();}}>Collega un account</button>}
  </>}
 </section>;
}
