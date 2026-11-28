import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarPlus, Clock3, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { type CentreTeam } from '../lib/centreTeam';
import { type AgendaService, type ManualAppointment, manualError } from '../lib/manualAppointments';
import { addDays, calendarTime, romeDay, serviceColor } from '../lib/professionalCalendar';
import { approvedForAgenda, agendaIsConfirmed, hasDuration } from '../lib/agendaReadiness';
import { supabase } from '../lib/supabase';

export function ManualAppointmentDialog({ initial, initialDay, team, teamError, onClose, onSaved }: {
  initial?: ManualAppointment; initialDay: string; team: CentreTeam | null; teamError: boolean;
  onClose: () => void; onSaved: (date: string, removed: boolean) => void;
}) {
  const { user, profile } = useAuth(); const confirmed = agendaIsConfirmed(user,profile); const { navigate } = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const alive = useRef(true); const lock = useRef(false);
  const [id] = useState(() => initial?.id || crypto.randomUUID());
  const [day, setDay] = useState(initial ? romeDay(initial.start_at) : initialDay);
  const [time, setTime] = useState(initial ? calendarTime(initial.start_at) : '');
  const [dog, setDog] = useState(initial?.dog_label || '');
  const [instructor, setInstructor] = useState(initial?.instructor_id || '');
  const [choice, setChoice] = useState(initial?.service_id || '');
  const [services, setServices] = useState<AgendaService[] | null>(null);
  const [approved, setApproved] = useState(true);
  const [serviceError, setServiceError] = useState(false); const [tick, setTick] = useState(0);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const uid = user?.id;
  useEffect(() => {
    alive.current = true; const node = dialog.current; const before = document.activeElement;
    node?.showModal();
    return () => { alive.current = false; node?.close(); if (before instanceof HTMLElement && before.isConnected) before.focus(); };
  }, []);
  useEffect(() => {
    let live = true; setServices(null); setServiceError(false);
    void (async () => {
      try {
        if (!uid) throw new Error();
        const [servicesResult, admission] = await Promise.all([
          supabase.from('services').select('id,name,duration_minutes,calendar_color').eq('professional_id',uid).eq('active',true).order('name'),
          supabase.from('professionals').select('approved,approval_status').eq('id',uid).maybeSingle(),
        ]);
        const data = servicesResult.data;
        if (servicesResult.error || admission.error || !Array.isArray(data)) throw servicesResult.error || admission.error;
        if (live) setApproved(approvedForAgenda(admission.data) && confirmed);
        const rows: AgendaService[] = data.filter(s => s.id !== initial?.service_id && hasDuration(s));
        if (initial) rows.unshift({ id: initial.service_id, name: initial.service_name, calendar_color: initial.calendar_color, duration_minutes: initial.duration_minutes });
        if (live) { setServices(rows); setChoice(value => rows.some(s => s.id === value) ? value : rows[0]?.id || ''); }
      } catch { if (live) setServiceError(true); }
    })(); return () => { live = false; };
  }, [uid, initial, tick, confirmed]);
  const selected = services?.find(s => s.id === choice);
  const submit = async (remove: boolean) => {
    if (lock.current || (!remove && (!selected || !time || !day))) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const {data,error: failure} = remove
        ? await supabase.rpc('cancel_my_manual_appointment',{p_id:id,p_version:initial!.version})
        : await supabase.rpc('save_my_manual_appointment',{p_id:id,p_version:initial?.version || 0,p_service_id:choice,p_day:day,p_time:time,p_dog:dog.trim(),p_instructor:instructor || null});
      if (failure || (remove ? data !== true : !Number.isInteger(data))) throw failure || new Error();
      if (alive.current) onSaved(remove && initial ? romeDay(initial.start_at) : day, remove);
    } catch (e) { if (alive.current) setError(manualError(e)); }
    finally { lock.current=false; if (alive.current) setBusy(false); }
  };
  const save = (e: FormEvent) => { e.preventDefault(); void submit(false); };
  return <dialog ref={dialog} className="pg-agenda-dialog" aria-labelledby="manual-title" onCancel={e => { e.preventDefault(); if (!lock.current) onClose(); }}>
    <div className="pg-dialog-top"><span><CalendarPlus size={18} /> Agenda privata</span><button type="button" onClick={onClose} disabled={busy} aria-label="Chiudi appuntamento"><X size={20} /></button></div>
    <div className="pg-dialog-body"><h2 id="manual-title">{initial ? 'Modifica appuntamento' : 'Nuovo appuntamento'}</h2>
      <p>Segna un impegno preso al campo, al telefono o in chat. Nessun messaggio verrà inviato.</p>
      {serviceError ? <p role="alert">Servizi non caricati. <button className="underline" onClick={() => setTick(n => n + 1)}>Riprova</button></p>
        : !services ? <p role="status">Caricamento servizi…</p> : !approved ? <div className="pg-agenda-empty"><strong>Il tuo profilo deve essere approvato</strong><p>Puoi segnare appuntamenti quando il tuo profilo professionale è approvato e la tua email è confermata.</p><button className="pg-agenda-secondary" onClick={() => { onClose(); navigate('/pro/settings'); }}>Apri il profilo guidato</button></div> : !services.length ? <div className="pg-agenda-empty"><strong>Aggiungi il tuo primo servizio</strong><p>Il calendario userà la durata e il colore che scegli.</p><button className="pg-agenda-secondary" onClick={() => { onClose(); navigate('/pro/settings?step=services'); }}>Configura servizi</button></div>
        : <form onSubmit={save}><fieldset disabled={busy || confirmDelete}>
          <label>Servizio<select required value={choice} onChange={e => setChoice(e.target.value)}>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          {selected && <span className="pg-duration"><i style={{backgroundColor:serviceColor(selected.calendar_color)}} /><Clock3 size={14} /> {selected.duration_minutes} min</span>}
          <div className="pg-date-pair"><label>Data<input required type="date" min={addDays(romeDay(),-365)} max={addDays(romeDay(),730)} value={day} onChange={e=>setDay(e.target.value)} /></label>
          <label>Ora italiana<input required type="time" step={60} value={time} onChange={e=>setTime(e.target.value)} /></label></div>
          <label>Nome del cane <small>facoltativo</small><input value={dog} maxLength={64} autoComplete="off" onChange={e=>setDog(e.target.value)} /></label>
          {team?.enabled && <label>Istruttore <small>facoltativo</small><select value={instructor} onChange={e=>setInstructor(e.target.value)}><option value="">Da assegnare</option>{team.members.filter(m=>m.active || m.id===instructor).map(m=><option key={m.id} value={m.id}>{m.display_name}{!m.active?' (inattivo)':''}</option>)}</select></label>}
          {teamError && <p role="status">Elenco istruttori non disponibile. Puoi segnare l’orario e assegnare l’istruttore in seguito.</p>}
        </fieldset>
        {!confirmDelete && <div className="pg-dialog-actions"><button type="submit" className="pg-agenda-cta" disabled={busy}><CalendarPlus size={18} />{busy ? 'Salvataggio…' : 'Salva appuntamento'}</button>
        </div>}</form>}
      {initial && !confirmDelete && <button type="button" className="pg-remove" disabled={busy} onClick={()=>{setConfirmDelete(true);setError('');}}>Rimuovi</button>}
      {confirmDelete && <div className="pg-confirm-delete"><strong>Rimuovere questo impegno dall’agenda?</strong><div><button disabled={busy} className="pg-remove" onClick={()=>void submit(true)}>Sì, rimuovi</button><button disabled={busy} onClick={()=>setConfirmDelete(false)}>Mantieni</button></div></div>}
      {error && <p role="alert" className="pg-dialog-error">{error}</p>}
    </div></dialog>;
}
