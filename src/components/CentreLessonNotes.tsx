import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { continuityEnabled, continuityRpc, displayDate } from '../lib/continuity';
import { notifySharingChanged } from '../lib/continuitySharing';
import type { CentreLesson } from '../lib/centreMemberships';

type Revision = { session_id: string; note_id: string; booking_id: string; membership_id: string;
  author_name: string; centre_name: string; dog_name: string; occurred_at: string; activity: string;
  revision_number: number; body: string; change_reason: string | null; revision_created_at: string;
  allow_continuity: boolean; has_publication: boolean; total_count: number };
type Context = { relationships: { id: string; dog_name: string }[]; author_name: string };
const field = 'mt-2 block w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900';
const changed = 'pc-centre-notes-changed';
function notify() { window.dispatchEvent(new Event(changed)); notifySharingChanged(); }
function errorText(error: unknown) {
  const code = (error as {code?: string})?.code;
  if (code === '42501') return 'Permesso o relazione non più disponibili. Chiudi e aggiorna l’agenda. I contributi già salvati restano nel tuo archivio.';
  if (code === '40001') return 'Assegnazione, permesso o revisione cambiati. Il testo resta qui: copialo, poi chiudi e aggiorna prima di riprovare.';
  if (code === '22023') return 'Controlla testo e attività. Una richiesta già inviata non può essere cambiata.';
  return 'Esito non confermato. Riprova la stessa richiesta per evitare duplicati.';
}

export function CentreLessonNotes({ lesson }: {lesson: CentreLesson}) {
  const {user} = useAuth();
  const [open, setOpen] = useState(false);
  if (!continuityEnabled || !user || !lesson.can_record_notes) return null;
  return <>
    <button type="button" className="pc-btn pc-btn-secondary" onClick={() => setOpen(true)}>Note della lezione</button>
    {open && <NoteDialog key={`${user.id}:${lesson.id}:${lesson.membership_version}:${lesson.assignment_version}`} lesson={lesson} onClose={() => setOpen(false)} />}
  </>;
}
function NoteDialog({lesson, onClose}: {lesson: CentreLesson; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null), alive = useRef(true), lock = useRef(false);
  const [context, setContext] = useState<Context | null>(null), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [blocked, setBlocked] = useState(false);
  const [relationship, setRelationship] = useState(''), [activity, setActivity] = useState(lesson.service_name);
  const [body, setBody] = useState(''), [reason, setReason] = useState(''), [allow, setAllow] = useState(false);
  const [editing, setEditing] = useState<Revision | null>(null), [notice, setNotice] = useState('');
  const attempt = useRef<{name: string; args: Record<string, unknown>} | null>(null);
  const dirty = useRef(false);
  const args = {p_booking_id: lesson.id, p_membership_id: lesson.membership_id,
    p_membership_version: lesson.membership_version, p_assignment_version: lesson.assignment_version};
  const key = JSON.stringify(args);
  const loadContext = useCallback(async () => {
    if (lock.current) return;
    setLoading(true); setError('');
    try {
      const data = await continuityRpc<Context>('get_centre_lesson_note_context', JSON.parse(key));
      if (alive.current) { setContext(data); setRelationship(value => value || (data.relationships.length === 1 ? data.relationships[0].id : '')); }
    } catch (e) { if (alive.current) { setContext(null); setError(errorText(e)); } }
    finally { if (alive.current) setLoading(false); }
  }, [key]);
  useEffect(() => {
    alive.current = true; const node = dialog.current; node?.showModal(); void loadContext();
    return () => {alive.current = false; node?.close();};
  }, [loadContext]);
  function close() {
    if (lock.current) return;
    if (dirty.current && !window.confirm(attempt.current ? 'L’invio potrebbe essere riuscito. Chiudere? Potrai verificare i tuoi contributi nell’archivio, ma perderai il riferimento per riprovare questo invio.' : 'Chiudere e scartare il testo non salvato?')) return;
    onClose();
  }
  function edit(row: Revision) {
    if (lock.current || attempt.current || (dirty.current && !window.confirm('Scartare il testo non salvato per rettificare questa revisione?'))) return;
    setEditing(row); setBody(row.body); setReason(''); setAllow(false); setActivity(row.activity); setError(''); setNotice(''); dirty.current = false;
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current || blocked || !context) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    if (!attempt.current) {
      attempt.current = editing ? {name: 'revise_centre_lesson_note', args: {
        p_note_id: editing.note_id, p_expected_revision: editing.revision_number,
        p_membership_id: lesson.membership_id, p_membership_version: lesson.membership_version,
        p_assignment_version: lesson.assignment_version, p_body: body.trim(), p_reason: reason.trim(), p_allow_continuity: allow,
      }} : {name: 'record_centre_lesson_note', args: {...args, p_request_id: crypto.randomUUID(),
        p_relationship_id: relationship, p_activity: activity.trim(), p_body: body.trim(), p_allow_continuity: allow}};
    }
    try {
      await continuityRpc(attempt.current.name, attempt.current.args);
      if (alive.current) { setNotice(editing ? 'Rettifica salvata. La versione precedente resta nella cronologia.' : 'Nota salvata nel tuo archivio e in quello del centro.');
        attempt.current = null; dirty.current = false; setEditing(null); setBody(''); setReason(''); setAllow(false); setActivity(lesson.service_name); notify(); }
    } catch (e) {
      if (alive.current) {setError(errorText(e)); if (['42501','40001','22023'].includes((e as {code?: string})?.code || '')) setBlocked(true);}
    } finally {lock.current = false; if (alive.current) setBusy(false);}
  }
  return <dialog ref={dialog} aria-labelledby="centre-note-title" onCancel={event => {event.preventDefault(); close();}}
    className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-5 text-stone-900 backdrop:bg-stone-900/50 sm:p-7">
    <div className="flex items-start justify-between gap-4"><h2 id="centre-note-title" className="text-2xl font-semibold">Note della lezione</h2><button type="button" className="underline" disabled={busy} onClick={close}>Chiudi</button></div>
    <p className="mt-3">{lesson.service_name} · {displayDate(lesson.start_at)}</p>
    <p className="mt-2 text-sm text-stone-600">Scrivi soltanto attività realmente svolte. Il centro conserva la nota e vede il tuo nome. Gli altri istruttori non accedono ai tuoi appunti.</p>
    {loading && <p role="status" className="mt-4">Controllo autorizzazioni…</p>}
    {error && <p role="alert" className="mt-4 text-rose-700">{error}</p>}
    {!context && !loading && <button className="pc-btn pc-btn-secondary mt-3" onClick={() => void loadContext()}>Riprova autorizzazioni</button>}
    {notice && <p role="status" className="mt-4 text-emerald-800">{notice}</p>}
    {context && !context.relationships.length && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm">Per registrare una nota serve una relazione di continuità con il centro già attiva all’inizio della lezione. Il proprietario invia l’invito dal profilo del centro e il centro lo accetta. La sola prenotazione non attiva questa autorizzazione.</p>}
    {context && context.relationships.length > 0 && <form className="mt-5 space-y-4" onSubmit={event => void submit(event)}>
      <h3 className="font-semibold">{editing ? `Rettifica · revisione ${editing.revision_number}` : 'Registra il lavoro svolto'}</h3>
      <fieldset className="space-y-4" disabled={busy || blocked || attempt.current !== null} onChange={() => {dirty.current = true;}}>
        {!editing && <label className="block text-sm font-semibold">Cane<select className={field} required value={relationship} onChange={e => setRelationship(e.target.value)}><option value="">Scegli il cane autorizzato</option>{context.relationships.map(r => <option key={r.id} value={r.id}>{r.dog_name}</option>)}</select></label>}
        <label className="block text-sm font-semibold">Attività<input className={field} required maxLength={200} value={activity} readOnly={!!editing} onChange={e => setActivity(e.target.value)} /></label>
        <label className="block text-sm font-semibold">Nota del lavoro svolto<textarea aria-label="Nota del lavoro svolto" className={field} rows={5} required maxLength={20000} value={body} onChange={e => setBody(e.target.value)} placeholder="Osservazioni, esercizi e risultati. Distingui i fatti dalle interpretazioni." /></label>
        {editing && <label className="block text-sm font-semibold">Motivo della rettifica<input className={field} required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>}
        <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" checked={allow} onChange={e => setAllow(e.target.checked)} /><span>Consento al centro di proporre questa revisione per lo storico condiviso del cane. Solo dopo la scelta del centro sarà leggibile dal proprietario, che potrà autorizzare un altro professionista. Posso ritirare questo consenso dal mio archivio.</span></label>
      </fieldset>
      <div className="flex flex-wrap gap-3"><button className="pc-btn pc-btn-primary" disabled={busy || blocked || loading || (!editing && !relationship) || !body.trim() || !activity.trim()}>{busy ? 'Salvataggio…' : attempt.current ? 'Riprova lo stesso salvataggio' : editing ? 'Salva rettifica' : 'Salva nota'}</button>
        {editing && !attempt.current && <button type="button" className="pc-btn pc-btn-secondary" disabled={busy} onClick={() => {if(dirty.current && !window.confirm('Scartare questa rettifica non salvata?'))return;setEditing(null); setBody(''); setReason(''); setAllow(false);setActivity(lesson.service_name);dirty.current=false;}}>Annulla rettifica</button>}</div>
    </form>}
    <div className="mt-7 border-t pt-5"><h3 className="font-semibold">I tuoi contributi a questa lezione</h3><NoteHistory bookingId={lesson.id} onEdit={blocked || !context?.relationships.length ? undefined : edit} /></div>
  </dialog>;
}
export function CentreNoteAuthorArchive() {
  const {user} = useAuth(); const [open, setOpen] = useState(false);
  if (!continuityEnabled || !user) return null;
  return <section className="pc-card mt-8 p-5 sm:p-6" aria-labelledby="centre-author-archive">
    <h2 id="centre-author-archive" className="text-2xl font-semibold">Il tuo lavoro nei centri</h2>
    <p className="mt-3 text-sm">I contributi scritti da te, con revisioni e nomi conservati, anche dopo la fine della collaborazione. Non include gli appunti degli altri né nuovi dati del cliente.</p>
    <button className="pc-btn pc-btn-secondary mt-4" onClick={() => setOpen(value => !value)} aria-expanded={open}>{open ? 'Chiudi i tuoi contributi' : 'Apri i tuoi contributi'}</button>
    {open && <div className="mt-5"><NoteHistory key={user.id} /></div>}
  </section>;
}
function NoteHistory({bookingId, onEdit}: {bookingId?: string; onEdit?: (row: Revision) => void}) {
  const [rows, setRows] = useState<Revision[]>([]), [page, setPage] = useState(0), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [version, setVersion] = useState(0);
  const alive = useRef(true), lock = useRef(false);
  useEffect(() => {alive.current = true; return () => {alive.current = false;};}, []);
  useEffect(() => {const update = () => {setPage(0);setVersion(v => v + 1);}; window.addEventListener(changed, update); return () => window.removeEventListener(changed, update);}, []);
  useEffect(() => {
    let active = true; setLoading(true); setRows([]);setError('');
    void continuityRpc<Revision[]>('list_my_centre_note_revisions', {p_booking_id: bookingId || null, p_limit: 30, p_offset: page * 30})
      .then(data => {if (active) setRows(data);}).catch(() => {if (active) setError('Contributi non caricati. Riprova.');}).finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, [page, version, bookingId]);
  async function withdraw(row: Revision) {
    if (lock.current || !window.confirm('Ritirare il consenso alla condivisione di questa nota? Il centro e il tuo archivio conservano le revisioni. Proprietario e destinatari perderanno nuove letture; le copie già scaricate non possono essere richiamate.')) return;
    lock.current = true;setBusy(true);setError('');
    try {await continuityRpc('withdraw_my_centre_note_consent', {p_note_id: row.note_id}); if (alive.current) notify();}
    catch(e) {if(alive.current)setError(errorText(e));}
    finally {lock.current=false;if(alive.current)setBusy(false);}
  }
  async function download() {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try {
      const fresh = await continuityRpc<Revision[]>('list_my_centre_note_revisions', {p_booking_id: bookingId || null, p_limit: 30, p_offset: page * 30});
      if (!alive.current) return;
      const text = ['PortaleCinofilo — i tuoi contributi nei centri', `Esportato il ${new Date().toLocaleString('it-IT')}. Pagina ${page+1}, fino a 30 revisioni.`,
        'Solo contributi del tuo account. Le copie scaricate non possono essere revocate a distanza.', '',
        ...fresh.map(r => `${r.centre_name} · ${r.dog_name}\n${r.activity} · ${displayDate(r.occurred_at)}\nAutore: ${r.author_name}\nRevisione ${r.revision_number} del ${displayDate(r.revision_created_at)}\n${r.body}\n${r.change_reason ? 'Motivo: '+r.change_reason : ''}\n`)].join('\n');
      const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
      const a = document.createElement('a');a.href=url;a.download=`portalecinofilo-contributi-pagina-${page+1}.txt`;a.click();setTimeout(() => URL.revokeObjectURL(url),1000);
    } catch {if(alive.current)setError('Esportazione non riuscita. Nessun file scaricato.');}
    finally{lock.current=false;if(alive.current)setBusy(false);}
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-3"><button disabled={busy || loading} className="text-sm underline" onClick={() => setVersion(v => v+1)}>Aggiorna contributi</button><button disabled={busy || loading || !rows.length} className="text-sm underline" onClick={() => void download()}>Scarica queste revisioni</button></div>
    {error && <p role="alert" className="text-rose-700">{error}</p>}{loading ? <p role="status">Caricamento contributi…</p> : !error && !rows.length ? <p className="text-sm">Non ci sono contributi in questa pagina.</p> : null}
    {rows.map(r => <article key={`${r.note_id}:${r.revision_number}`} className="rounded-xl border border-stone-200 p-4">
      <h4 className="font-semibold">{r.dog_name} · {r.activity}</h4><p className="mt-1 text-sm">{r.author_name} · per {r.centre_name}</p>
      <p className="mt-1 text-sm text-stone-600">{displayDate(r.occurred_at)} · Revisione {r.revision_number}</p>
      <p className="mt-3 whitespace-pre-wrap break-words">{r.body}</p>{r.change_reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm">Motivo: {r.change_reason}</p>}
      <p className="mt-3 text-sm">{r.allow_continuity ? 'Consenso alla condivisione dato al centro per questa revisione.' : 'Nessun consenso alla condivisione per questa revisione.'}</p>
      <div className="mt-3 flex flex-wrap gap-3">{onEdit && <button disabled={busy} className="text-sm underline" onClick={() => onEdit(r)}>Rettifica da questa revisione</button>}{(r.allow_continuity || r.has_publication) && <button disabled={busy} className="text-sm underline" onClick={() => void withdraw(r)}>Ritira consenso della nota</button>}</div>
    </article>)}
    <div className="flex flex-wrap items-center gap-3 text-sm"><button disabled={loading || busy || !page} className="underline" onClick={() => setPage(p => p-1)}>Precedenti</button><span>Pagina {page+1} · fino a 30 revisioni</span><button disabled={loading || busy || !!error || (page+1)*30 >= Number(rows[0]?.total_count || 0)} className="underline" onClick={() => setPage(p => p+1)}>Successive</button></div>
  </div>;
}
