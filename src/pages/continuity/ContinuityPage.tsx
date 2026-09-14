import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { supabase } from '../../lib/supabase';
import { ProLayout } from '../pro/ProLayout';
import { ProfessionalContinuitySharing } from '../../components/ProfessionalContinuitySharing';
import { OwnerContinuitySharing } from '../../components/OwnerContinuitySharing';
import { notifySharingChanged } from '../../lib/continuitySharing';
import { continuityEnabled, continuityError, continuityRpc, displayDate, relationshipLabels, type NoteRevision, type Relationship } from '../../lib/continuity';

const button = 'rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50';
const secondary = 'rounded-xl border border-stone-300 px-4 py-2 font-semibold disabled:opacity-50';
const input = 'mt-1 block w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900';
const card = 'rounded-2xl border border-stone-200 bg-white p-5 space-y-3';

export function ContinuityPage({ professional }: { professional: boolean }) {
  const { user, profile } = useAuth();
  if (!continuityEnabled || !user || profile?.role !== (professional ? 'professional' : 'owner')) {
    return <p className="p-8">Area non disponibile per questo account.</p>;
  }
  // Remount forms and in-memory notes on account/role changes.
  return <ContinuityWorkspace key={`${user.id}:${professional}`} professional={professional} userId={user.id} verified={profile.email_verified} />;
}

function ContinuityWorkspace({ professional, userId, verified }: { professional: boolean; userId: string; verified: boolean }) {
  const { path, navigate } = useRouter();
  const target = new URLSearchParams(path.split('?')[1] || '').get('professional') || '';
  const [relations, setRelations] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const [selected, setSelected] = useState<Relationship | null>(null);
  const [archiveKey, setArchiveKey] = useState(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError('');
    try {
      const rows = await continuityRpc<Relationship[]>('list_my_dog_relationships');
      if (current === generation.current) setRelations(rows);
    } catch (e) { if (current === generation.current) { setError(continuityError(e)); setRelations([]); } }
    finally { if (current === generation.current) setLoading(false); }
  }, []);
  useEffect(() => { void reload(); return () => { generation.current++; }; }, [reload]);
  async function act(r: Relationship, accept?: boolean) {
    if (lock.current) return;
    if (accept === undefined && !window.confirm(professional
      ? `Concludere la relazione con ${r.dog_name}? Le note già registrate restano nel tuo archivio.`
      : `Revocare l’autorizzazione per ${r.dog_name}? Il professionista non potrà registrare nuove sessioni; le note già prodotte restano nel suo archivio.`)) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      await continuityRpc(accept === undefined ? 'close_dog_relationship' : 'respond_dog_relationship', {
        p_relationship_id: r.id, ...(accept === undefined ? {} : { p_accept: accept }),
      });
      setMessage(accept === true ? 'Invito accettato.' : accept === false ? 'Invito rifiutato.' : 'Relazione chiusa.');
      setSelected(null); setArchiveKey((value) => value + 1); await reload();
    } catch (e) { setError(continuityError(e)); }
    finally { lock.current = false; setBusy(false); }
  }
  const content = <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 text-stone-900">
    <header className="space-y-3">
      {!professional && <button className="underline" onClick={() => navigate('/owner')}>Torna alla tua area</button>}
      <h1 className="text-3xl font-bold">{professional ? 'Relazioni e archivio' : 'Professionisti dei tuoi cani'}</h1>
      <p className="text-stone-600">{professional
        ? 'Accetta gli inviti e registra il lavoro svolto. Le note nascono private; scegli quali revisioni rendere condivisibili e consulta lo storico autorizzato.'
        : 'Invita un professionista dal suo profilo. La relazione inizia quando accetta e puoi revocarla in qualsiasi momento.'}</p>
      {!professional && <p className="text-sm text-stone-600">L’invito autorizza la registrazione di sessioni sul cane. Gli appunti privati del professionista restano riservati; non vengono condivisi con altri addestratori.</p>}
    </header>
    {professional ? <ProfessionalContinuitySharing refreshKey={archiveKey} /> : <OwnerContinuitySharing userId={userId} verified={verified} refreshKey={archiveKey} />}
    {!professional && target && <InviteForm key={target} professionalId={target} userId={userId} verified={verified} onSaved={() => { setMessage('Invito registrato. Controlla lo stato nell’elenco.'); void reload(); }} />}
    {!professional && !target && <button className={button} onClick={() => navigate('/search')}>Trova un professionista</button>}
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Relazioni</h2><button className={secondary} disabled={loading || busy || selected !== null} onClick={() => void reload()}>Aggiorna</button></div>
    {message && <p role="status" className="text-emerald-800">{message}</p>}
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {loading ? <p role="status">Caricamento relazioni…</p> : !error && !relations.length ? <p>Nessuna relazione presente.</p> : null}
    {!loading && relations.map(r => <article key={r.id} className={card}>
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-lg">{r.dog_name} · {r.professional_name}</h3><span className="rounded-full bg-stone-100 px-3 py-1 text-sm">{relationshipLabels[r.status] || 'Stato non disponibile'}</span></div>
      <p className="text-sm text-stone-600">Invito del {displayDate(r.authorized_at)}{r.accepted_at && ` · Accettato il ${displayDate(r.accepted_at)}`}</p>
      {(r.revoked_at || r.ended_at) && <p className="text-sm">Chiusura: {displayDate((r.revoked_at || r.ended_at)!)}</p>}
      <div className="flex flex-wrap gap-2">
        {professional && r.status === 'invited' && <><button className={button} disabled={busy || selected !== null} onClick={() => void act(r, true)}>Accetta invito</button><button className={secondary} disabled={busy || selected !== null} onClick={() => void act(r, false)}>Rifiuta invito</button></>}
        {professional && r.status === 'active' && <button className={button} disabled={busy || selected !== null} onClick={() => setSelected(r)}>Registra sessione</button>}
        {(r.status === 'active' || (!professional && r.status === 'invited')) && <button className={secondary} disabled={busy || selected !== null} onClick={() => void act(r)}>{professional ? 'Concludi relazione' : r.status === 'invited' ? 'Ritira invito' : 'Revoca autorizzazione'}</button>}
      </div>
      {selected?.id === r.id && <SessionForm relationship={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setArchiveKey(k => k + 1); setMessage('Sessione e nota privata registrate.'); }} />}
    </article>)}
    {professional && <Archive refreshKey={archiveKey} />}
  </div>;
  return professional ? <ProLayout active="archive">{content}</ProLayout> : <main className="bg-stone-50 min-h-screen">{content}</main>;
}

function InviteForm({ professionalId, userId, verified, onSaved }: { professionalId: string; userId: string; verified: boolean; onSaved: () => void }) {
  const [dogs, setDogs] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState(''); const [dog, setDog] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [sent, setSent] = useState(false); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    void (async () => {
      try {
        const [p, d] = await Promise.all([
          supabase.from('public_professional_profiles').select('display_name').eq('id', professionalId).maybeSingle(),
          supabase.from('dogs').select('id, name').eq('owner_id', userId).order('name'),
        ]);
        if (p.error || d.error || !p.data) throw new Error();
        if (active) { setName(p.data.display_name); setDogs(d.data || []); }
      } catch { if (active) setError('Professionista o cani non disponibili. Riprova.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [professionalId, userId, retry]);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current || !dog || !verified || sent) return;
    lock.current = true; setBusy(true); setError('');
    try { await continuityRpc('invite_dog_professional', { p_dog_id: dog, p_professional_id: professionalId }); setSent(true); onSaved(); }
    catch (err) { setError(continuityError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className={card}>
    <h2 className="font-bold text-xl">{name ? `Invita ${name}` : 'Invita il professionista'}</h2>
    {loading ? <p>Caricamento…</p> : <>
      {!verified && <p role="alert">Verifica la tua email dalla dashboard prima di inviare un invito.</p>}
      <label className="block">Cane<select required className={input} value={dog} disabled={busy || sent} onChange={e => setDog(e.target.value)}><option value="">Scegli il cane</option>{dogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      {!dogs.length && !error && <p>Aggiungi prima un cane dalla tua area.</p>}
      <button className={button} disabled={!name || !dog || !verified || busy || sent}>{sent ? 'Invito registrato' : busy ? 'Invio…' : 'Autorizza e invia invito'}</button>
    </>}
    {error && <><p role="alert" className="text-rose-700">{error}</p><button type="button" className={secondary} disabled={busy} onClick={() => setRetry(k => k + 1)}>Ricarica dati</button></>}
  </form>;
}

type SessionRequest = { p_request_id: string; p_relationship_id: string; p_occurred_at: string; p_activity: string; p_body: string };
function SessionForm({ relationship, onClose, onSaved }: { relationship: Relationship; onClose: () => void; onSaved: () => void }) {
  // Seconds avoid truncating a newly accepted relationship to the preceding minute.
  const [when, setWhen] = useState(() => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19); });
  const [activity, setActivity] = useState(''); const [body, setBody] = useState('');
  const [attempt, setAttempt] = useState<SessionRequest | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    const occurred = new Date(when);
    if (!attempt && (!Number.isFinite(occurred.getTime()) || occurred.getTime() > Date.now() || occurred.getTime() < new Date(relationship.accepted_at!).getTime() || !body.trim() || !activity.trim())) {
      setError('Inserisci attività e nota, con una data successiva all’accettazione e non futura.'); return;
    }
    lock.current = true; setBusy(true); setError('');
    try {
      const request = attempt || { p_request_id: crypto.randomUUID(), p_relationship_id: relationship.id, p_occurred_at: occurred.toISOString(), p_activity: activity.trim(), p_body: body.trim() };
      setAttempt(request);
      await continuityRpc('record_professional_session', request); onSaved();
    } catch (err) { setError(continuityError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form className="space-y-3 border-t pt-4" onSubmit={submit}>
    <h4 className="font-bold">Nuova sessione · {relationship.dog_name}</h4>
    <p className="text-sm text-stone-600">Registra un’attività già svolta durante la relazione. La nota è privata; successive correzioni manterranno la cronologia.</p>
    <fieldset disabled={busy || attempt !== null} className="space-y-3">
      <label className="block">Data e ora dell’attività (ora del dispositivo)<input className={input} type="datetime-local" step="1" required value={when} onChange={e => setWhen(e.target.value)} /></label>
      <label className="block">Attività<input className={input} required maxLength={200} value={activity} onChange={e => setActivity(e.target.value)} /></label>
      <label className="block">Nota privata<textarea className={input} rows={7} required maxLength={20000} value={body} onChange={e => setBody(e.target.value)} placeholder="Osservazioni, obiettivi, attività svolte e risultati. Distingui i fatti dalle interpretazioni." /></label>
    </fieldset>
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {attempt && error && <p className="text-sm">Controlla l’archivio qui sotto. Se riprovi, verrà inviata la stessa richiesta per evitare duplicati. Conserva questo modulo aperto finché l’esito non è chiarito.</p>}
    <div className="flex flex-wrap gap-2"><button className={button} disabled={busy}>{busy ? 'Registrazione…' : attempt ? 'Riprova la stessa richiesta' : 'Registra sessione e nota'}</button><button type="button" className={secondary} disabled={busy} onClick={() => { if ((!body && !attempt) || window.confirm(attempt ? 'Hai controllato l’archivio? L’invio potrebbe essere riuscito. Chiudendo perderai il riferimento per riprovare la stessa richiesta.' : 'Chiudere e scartare il testo non salvato?')) onClose(); }}>Chiudi modulo</button></div>
  </form>;
}

function Archive({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<NoteRevision[]>([]); const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [reload, setReload] = useState(0); const [editing, setEditing] = useState<NoteRevision | null>(null);
  useEffect(() => { setPage(0); }, [refreshKey]);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setRows([]);
    void continuityRpc<NoteRevision[]>('list_own_professional_note_revisions', { p_limit: 50, p_offset: page * 50 })
      .then(data => { if (active) setRows(data); })
      .catch(e => { if (active) setError(continuityError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, reload, refreshKey]);
  return <section className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">Il tuo archivio privato</h2><button className={secondary} disabled={loading} onClick={() => { setPage(0); setReload(k => k + 1); }}>Aggiorna archivio</button></div>
    <p className="text-sm text-stone-600">Sessioni e revisioni del tuo lavoro, anche dopo la fine della relazione. I nomi sono quelli conservati nello storico.</p>
    {editing && <RevisionForm key={`${editing.note_id}:${editing.revision_number}`} revision={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setPage(0); setReload(k => k + 1); notifySharingChanged(); }} />}
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {loading ? <p role="status">Caricamento archivio…</p> : !error && !rows.length ? <p>Nessuna revisione in questa pagina.</p> : null}
    {rows.map(r => <article className={card} key={`${r.note_id}:${r.revision_number}`}>
      <h3 className="font-bold">{r.dog_name} · {r.activity}</h3>
      <p className="text-sm text-stone-600">Attività: {displayDate(r.occurred_at)} · Autore: {r.author_name}</p>
      <p className="text-sm">Revisione {r.revision_number} · Registrata il {displayDate(r.revision_created_at)}</p>
      <p className="whitespace-pre-wrap break-words">{r.body}</p>
      {r.change_reason && <p className="whitespace-pre-wrap break-words text-sm text-stone-600">Motivo della rettifica: {r.change_reason}</p>}
      <button className={secondary} disabled={editing !== null} onClick={() => setEditing(r)}>Rettifica da questa revisione</button>
    </article>)}
    <div className="flex flex-wrap items-center gap-3"><button className={secondary} disabled={loading || page === 0} onClick={() => setPage(p => p - 1)}>Precedenti</button><span>Pagina {page + 1} · fino a 50 revisioni</span><button className={secondary} disabled={loading || !!error || rows.length < 50} onClick={() => setPage(p => p + 1)}>Successive</button></div>
  </section>;
}
function RevisionForm({ revision, onClose, onSaved }: { revision: NoteRevision; onClose: () => void; onSaved: () => void }) {
  const [body, setBody] = useState(revision.body); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (lock.current || !body.trim() || !reason.trim()) return;
    lock.current = true; setBusy(true); setError('');
    try { await continuityRpc('revise_own_professional_note', { p_note_id: revision.note_id, p_expected_revision: revision.revision_number, p_body: body.trim(), p_reason: reason.trim() }); onSaved(); }
    catch (err) { setError(continuityError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className={card}>
    <h3 className="font-bold">Rettifica · {revision.dog_name} · {revision.activity}</h3>
    <p className="text-sm">Parti dalla revisione {revision.revision_number}. Il salvataggio sarà consentito solo se è ancora la più recente; le versioni precedenti saranno conservate.</p>
    <p className="text-sm text-stone-600">Se la nota era stata resa condivisibile, la versione precedente verrà ritirata dallo storico condiviso. La nuova revisione nascerà privata e potrai prepararla di nuovo per la continuità.</p>
    <label className="block">Nota corretta<textarea required rows={7} maxLength={20000} className={input} disabled={busy} value={body} onChange={e => setBody(e.target.value)} /></label>
    <label className="block">Motivo della rettifica<textarea required maxLength={1000} className={input} disabled={busy} value={reason} onChange={e => setReason(e.target.value)} /></label>
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    <div className="flex gap-2"><button className={button} disabled={busy}>Salva rettifica</button><button type="button" className={secondary} disabled={busy} onClick={() => { if ((body === revision.body && !reason) || window.confirm('Chiudere il modulo e scartare il testo non salvato?')) onClose(); }}>Chiudi</button></div>
  </form>;
}
