import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Users, Plus } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from '../../lib/RouterContext';
import { type CentreInstructor, type CentreTeam, teamError } from '../../lib/centreTeam';
import { ProLayout } from './ProLayout';
export function ProTeam(){const {user}=useAuth();return <ProLayout active="team">{user&&<Team key={user.id}/>}</ProLayout>;}
function Team(){
 const {navigate}=useRouter();const [team,setTeam]=useState<CentreTeam|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [editor,setEditor]=useState<CentreInstructor|null>(null);const [name,setName]=useState('');
 const alive=useRef(true),lock=useRef(false);const request=useRef(0);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current++;};},[]);
 const load=useCallback(async()=>{const generation=++request.current;setLoading(true);setError('');
  try{const {data,error}=await supabase.rpc('get_my_centre_team');if(error)throw error;
   if(alive.current&&generation===request.current)setTeam(data as CentreTeam);
  }catch{if(alive.current&&generation===request.current)setError('Elenco non caricato. Riprova.');}
  finally{if(alive.current&&generation===request.current)setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function write(member:CentreInstructor,displayName:string,active:boolean){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice('');
  try{const {error}=await supabase.rpc('save_centre_instructor',{p_id:member.id,p_name:displayName.trim(),p_active:active,p_expected_version:member.version||null});if(error)throw error;
   if(alive.current){setEditor(null);setName('');setNotice('Elenco aggiornato. Le assegnazioni già registrate conservano il nome precedente.');await load();}
  }catch(error){if(alive.current)setNotice(teamError(error));}
  finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 function submit(event:FormEvent){event.preventDefault();if(editor)void write(editor,name,editor.active);}
 return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 text-[var(--pc-ink-950)]">
  <header className="flex flex-wrap justify-between gap-4"><div><p className="pc-kicker">Organizza il centro</p><h1 className="pc-display mt-2 text-3xl font-semibold">Gli istruttori del centro</h1><p className="mt-3 max-w-2xl text-[var(--pc-muted-600)]">Indica chi segue ciascuna lezione. Il cliente ritroverà il nome nella prenotazione e nello storico del cane.</p></div><Users className="h-9 w-9 text-[var(--pc-forest-700)]" aria-hidden="true"/></header>
  {notice&&<p role="status" className="pc-card mt-5 p-4">{notice}</p>}
  {loading?<p role="status" className="mt-6">Caricamento…</p>:error?<div role="alert" className="pc-card mt-6 p-5">{error}<button onClick={()=>void load()} className="ml-3 underline">Riprova</button></div>:!team?.enabled?<div className="pc-card mt-6 p-6"><p>Questa area è dedicata alle attività registrate come centro cinofilo.</p><button className="pc-btn pc-btn-secondary mt-4" onClick={()=>navigate('/pro/settings?step=identity')}>Vai al profilo dell’attività</button></div>:<>
   <div className="mt-6 grid gap-3 sm:grid-cols-3">{[['1','Aggiungi i nomi','Un elenco semplice, senza creare nuovi account.'],['2','Assegna alla lezione','Nelle richieste accettate o nel calendario.'],['3','Conserva il percorso','Il nome resta legato alla prestazione svolta.']].map(([n,title,text])=><div key={n} className="rounded-2xl bg-[var(--pc-bone-50)] p-5"><span className="text-sm font-bold text-[var(--pc-forest-700)]">{n}</span><h2 className="mt-2 font-semibold">{title}</h2><p className="mt-1 text-sm">{text}</p></div>)}</div>
   <p className="mt-4 text-sm text-[var(--pc-muted-600)]">I nomi sono dichiarati dal centro: non attestano qualifiche e non danno accesso agli account dei clienti.</p>
   {editor?<form onSubmit={submit} className="pc-card mt-6 p-5" aria-label="Scheda istruttore"><h2 className="text-xl font-semibold">{editor.version?'Modifica il nome':'Aggiungi un istruttore'}</h2><label className="mt-4 block text-sm font-semibold">Nome e cognome<input autoFocus required minLength={2} maxLength={120} disabled={busy} value={name} onChange={e=>setName(e.target.value)} className="mt-2 block w-full rounded-xl border p-3"/></label><div className="mt-4 flex gap-3"><button disabled={busy||name.trim().length<2} className="pc-btn pc-btn-primary">{busy?'Salvataggio…':'Salva istruttore'}</button><button type="button" disabled={busy} className="pc-btn pc-btn-secondary" onClick={()=>setEditor(null)}>Annulla</button></div></form>:<button disabled={busy} className="pc-btn pc-btn-primary mt-6" onClick={()=>{setEditor({id:crypto.randomUUID(),display_name:'',active:true,version:''});setName('');setNotice('');}}><Plus className="h-4 w-4"/>Aggiungi istruttore</button>}
   <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Il tuo elenco · {team.members.length}</h2><button disabled={busy} className="underline text-sm" onClick={()=>{setEditor(null);void load();}}>Aggiorna elenco</button></div>
   {!team.members.length?<p className="pc-card mt-4 p-6">Aggiungi il primo istruttore, poi apri una lezione accettata per assegnarlo.</p>:<div className="mt-4 grid gap-3">{team.members.map(member=><article key={member.id} className="pc-card flex flex-wrap items-center justify-between gap-4 p-5"><div><h3 className="font-bold break-words">{member.display_name}</h3><p className="mt-1 text-sm">{member.active?'Attivo':'Inattivo'} · {member.assigned_bookings||0} lezioni accettate assegnate</p></div><div className="flex flex-wrap gap-3"><button disabled={busy} className="underline text-sm" onClick={()=>{setEditor(member);setName(member.display_name);setNotice('');}}>Modifica</button><button disabled={busy} className="underline text-sm" onClick={()=>{if(member.active&&!confirm('Rendere inattivo questo istruttore? Non sarà selezionabile per nuove assegnazioni. Le lezioni già assegnate restano da controllare.'))return;void write(member,member.display_name,!member.active);}}>{member.active?'Metti inattivo':'Riattiva'}</button></div></article>)}</div>}
   <button className="pc-btn pc-btn-secondary mt-6" onClick={()=>navigate('/pro/bookings')}>Vai alle lezioni prenotate</button>
  </>}
 </div>;
}
