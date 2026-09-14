import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { continuityRpc, displayDate } from '../lib/continuity';
import { grantStatus, notifySharingChanged, sharingButton, sharingSecondary, sharingField, sharingError, useSharingRows, type ContinuityGrant, type ContinuityRecipient, type SharedContinuityNote } from '../lib/continuitySharing';
import { SharedNoteText, SharingPager } from './ContinuitySharingCommon';

export function OwnerContinuitySharing({ userId, verified, refreshKey }: { userId: string; verified: boolean; refreshKey: number }) {
  const [dogs, setDogs] = useState<{ id: string; name: string }[]>([]);
  const [dog, setDog] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [grantPending, setGrantPending] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    void (async () => {
      try {
        const { data, error: failure } = await supabase.from('dogs').select('id,name').eq('owner_id', userId).order('name');
        if (failure) throw failure;
        if (active) { setDogs(data || []); setDog((current) => data?.some((item) => item.id === current) ? current : data?.[0]?.id || ''); }
      } catch { if (active) setError('Non è stato possibile caricare i tuoi cani.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId, revision, refreshKey]);
  return <section aria-labelledby="owner-sharing-title" className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-6">
    <h2 id="owner-sharing-title" className="text-2xl font-bold">Storico condiviso del cane</h2>
    <p className="text-sm text-stone-600">Leggi i contributi resi condivisibili dagli autori e autorizza un professionista a consultare una selezione precisa. Le sue nuove note e gli appunti privati degli altri restano esclusi.</p>
    {loading && <p role="status">Caricamento cani…</p>}
    {error && <p role="alert" className="text-sm text-rose-700">{error} <button type="button" onClick={() => setRevision((value) => value + 1)} className="underline">Riprova</button></p>}
    {!loading && !error && !dogs.length && <p className="text-sm">Aggiungi un cane dalla tua area per gestirne lo storico.</p>}
    {!!dogs.length && <label className="block text-sm font-semibold">Scegli il cane<select value={dog} disabled={loading || grantPending} onChange={(event) => {
      if (event.target.value !== dog && window.confirm('Cambiare cane? La selezione non ancora autorizzata verrà svuotata.')) setDog(event.target.value);
    }} className={sharingField}>{dogs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    {dog && <OwnerDogSharing key={dog} dogId={dog} verified={verified} refreshKey={refreshKey} onPendingChange={setGrantPending} />}
  </section>;
}

function OwnerDogSharing({ dogId, verified, refreshKey, onPendingChange }: { dogId: string; verified: boolean; refreshKey: number; onPendingChange: (pending: boolean) => void }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<string, SharedContinuityNote>>({});
  const [frozen, setFrozen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState('');
  useEffect(() => { onPendingChange(frozen); return () => onPendingChange(false); }, [frozen, onPendingChange]);
  const publications = useSharingRows<SharedContinuityNote>('list_owner_continuity_publications', { p_dog_id: dogId, p_limit: 20, p_offset: page * 20 }, refreshKey);
  const recipients = useSharingRows<ContinuityRecipient>('list_owner_continuity_recipients', { p_dog_id: dogId }, refreshKey);
  const chosen = Object.values(selected);
  const clearSelection = () => { setSelected({}); setFormKey((value) => value + 1); setFrozen(false); };
  const reload = () => {
    if (chosen.length && !window.confirm('Aggiornare i contributi e svuotare la selezione non ancora autorizzata?')) return;
    clearSelection(); publications.reload(); recipients.reload();
  };
  return <div className="space-y-5">
    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Lo storico può essere incompleto: l’assenza di contributi condivisi non significa che il cane non sia stato seguito da altri professionisti.</p>
    <button type="button" disabled={frozen || publications.loading || recipients.loading} onClick={reload} className={sharingSecondary}>Aggiorna contributi e destinatari</button>
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {publications.error && <p role="alert" className="text-sm text-rose-700">{publications.error}</p>}
    {publications.loading ? <p role="status">Caricamento contributi…</p> : !publications.error && !publications.rows.length ? <p className="text-sm">Nessun contributo condivisibile in questa pagina. Gli autori possono prepararli dalla loro area “Relazioni e archivio”.</p> : null}
    {publications.rows.map((note) => <article key={note.publication_id} className="space-y-3 rounded-xl border border-stone-200 p-4">
      <label className="flex items-start gap-3 text-sm font-semibold"><input type="checkbox" className="mt-1" checked={Boolean(selected[note.publication_id])} disabled={frozen || (!selected[note.publication_id] && chosen.length >= 100)} onChange={(event) => {
        setSelected((current) => { const next = { ...current }; if (event.target.checked) next[note.publication_id] = note; else delete next[note.publication_id]; return next; });
      }} /><span>Seleziona · {note.activity} · {note.author_name} · revisione {note.revision_number}</span></label>
      <details><summary className="cursor-pointer text-sm font-semibold underline">Leggi il contributo da autorizzare</summary><div className="mt-3"><SharedNoteText note={note} /></div></details>
    </article>)}
    <SharingPager page={page} total={Number(publications.rows[0]?.total_count || 0)} count={publications.rows.length} busy={frozen || publications.loading} onPage={setPage} />
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <h3 className="font-bold">Autorizza la lettura dei contributi selezionati</h3>
      <p className="mt-2 text-sm">{chosen.length}/100 contributi selezionati. Ogni concessione comprende solo queste revisioni e vale finché la relazione resta attiva, entro la scadenza scelta.</p>
      {!!chosen.length && <details className="my-3"><summary className="cursor-pointer text-sm font-semibold underline">Riepilogo della selezione</summary><ul className="mt-2 space-y-2">{chosen.map((note) => <li key={note.publication_id} className="flex items-start justify-between gap-3 text-sm"><span>{note.author_name} · {note.activity} · revisione {note.revision_number}</span><button type="button" disabled={frozen} className="underline disabled:opacity-50" onClick={() => setSelected((current) => { const next = { ...current }; delete next[note.publication_id]; return next; })}>Rimuovi</button></li>)}</ul></details>}
      {recipients.error && <p role="alert" className="my-3 text-sm text-rose-700">{recipients.error}</p>}
      {!recipients.loading && !recipients.error && !recipients.rows.length && <p className="my-3 text-sm">Occorre un professionista approvato che abbia già accettato l’invito a seguire questo cane.</p>}
      <GrantForm key={formKey} selected={chosen} recipients={recipients.rows} verified={verified} disabled={recipients.loading || Boolean(recipients.error) || Boolean(publications.error)} onFrozen={setFrozen}
        onSaved={() => { clearSelection(); setNotice('Autorizzazione registrata. Il professionista trova la selezione nello “Storico ricevuto”.'); notifySharingChanged(); }}
        onAbandon={() => { clearSelection(); publications.reload(); recipients.reload(); }} />
    </div>
    <OwnerGrantHistory dogId={dogId} refreshKey={refreshKey} />
  </div>;
}

type GrantRequest = { p_request_id: string; p_relationship_id: string; p_publication_ids: string[]; p_duration_days: number; p_purpose: string };
function GrantForm({ selected, recipients, verified, disabled, onFrozen, onSaved, onAbandon }: {
  selected: SharedContinuityNote[]; recipients: ContinuityRecipient[]; verified: boolean; disabled: boolean;
  onFrozen: (frozen: boolean) => void; onSaved: () => void; onAbandon: () => void;
}) {
  const [recipient, setRecipient] = useState('');
  const [days, setDays] = useState('30');
  const [purpose, setPurpose] = useState('Continuità del percorso educativo del cane');
  const [attempt, setAttempt] = useState<GrantRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (lock.current || !verified) return;
    if (!attempt && (!selected.length || !recipients.some((item) => item.relationship_id === recipient) || !Number.isInteger(Number(days)) || Number(days)<1 || Number(days)>365 || !purpose.trim())) {
      setError('Seleziona contributi e professionista, indica lo scopo e una durata da 1 a 365 giorni.'); return;
    }
    const request = attempt || { p_request_id: crypto.randomUUID(), p_relationship_id: recipient, p_publication_ids: selected.map((note) => note.publication_id).sort(), p_duration_days: Number(days), p_purpose: purpose.trim() };
    lock.current = true; setBusy(true); setError(''); setAttempt(request); onFrozen(true);
    try { await continuityRpc('grant_dog_continuity_access', request); onSaved(); }
    catch (e) {
      const known = ['42501','40001','22023'].includes((e as { code?: string })?.code || '');
      if (known) { setAttempt(null); onFrozen(false); }
      setError(sharingError(e));
    } finally { lock.current = false; setBusy(false); }
  };
  return <form className="mt-4 space-y-3" onSubmit={(event) => void submit(event)}>
    {!verified && <p className="text-sm text-amber-900">Verifica la tua email prima di autorizzare la lettura dello storico.</p>}
    <fieldset disabled={busy || attempt !== null || disabled || !verified} className="space-y-3 disabled:opacity-60">
      <label className="block text-sm font-semibold">Professionista destinatario<select required value={recipient} onChange={(event) => setRecipient(event.target.value)} className={sharingField}><option value="">Scegli il professionista…</option>{recipients.map((item) => <option key={item.relationship_id} value={item.relationship_id}>{item.professional_name}</option>)}</select></label>
      <label className="block text-sm font-semibold">Durata in giorni<input type="number" required min={1} max={365} step={1} value={days} onChange={(event) => setDays(event.target.value)} className={sharingField} /></label>
      <label className="block text-sm font-semibold">Scopo dell’accesso<input required maxLength={500} value={purpose} onChange={(event) => setPurpose(event.target.value)} className={sharingField} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required className="mt-1" /><span>Autorizzo il professionista scelto a leggere solo i contributi selezionati per questo periodo. Posso revocare l’accesso; le informazioni già lette o copiate non possono essere richiamate a distanza.</span></label>
    </fieldset>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy || !verified || (!attempt && (disabled || !selected.length || !recipient))} className={sharingButton}>{busy ? 'Registrazione…' : attempt ? 'Riprova la stessa autorizzazione' : 'Autorizza questa selezione'}</button>
      {attempt && !busy && <button type="button" className={sharingSecondary} onClick={() => { if (window.confirm('L’autorizzazione potrebbe essere già registrata. Svuotare il modulo e controllare l’elenco prima di un nuovo invio?')) onAbandon(); }}>Chiudi e controlla l’elenco</button>}</div>
  </form>;
}

function OwnerGrantHistory({ dogId, refreshKey }: { dogId: string; refreshKey: number }) {
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const lock = useRef(false);
  const { rows, loading, error, reload } = useSharingRows<ContinuityGrant>('list_my_continuity_grants', { p_dog_id: dogId, p_limit: 20, p_offset: page * 20 }, refreshKey);
  const revoke = async (grant: ContinuityGrant) => {
    if (lock.current || !window.confirm(`Revocare l’accesso allo storico per ${grant.professional_name}? L’archivio originale degli autori resta conservato.`)) return;
    lock.current = true; setBusy(true); setFailure('');
    try { await continuityRpc('revoke_dog_continuity_access', { p_grant_id: grant.grant_id }); notifySharingChanged(); }
    catch (e) { setFailure(sharingError(e)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <section className="space-y-3 border-t border-stone-200 pt-5" aria-label="Autorizzazioni allo storico">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Autorizzazioni rilasciate</h3><button type="button" disabled={loading || busy} onClick={reload} className={sharingSecondary}>Aggiorna autorizzazioni</button></div>
    {loading && <p role="status">Caricamento…</p>}{(error || failure) && <p role="alert" className="text-sm text-rose-700">{error || failure}</p>}
    {!loading && !error && !rows.length && <p className="text-sm">Nessuna autorizzazione in questa pagina.</p>}
    {rows.map((grant) => <article key={grant.grant_id} className="space-y-2 rounded-xl border border-stone-200 p-4">
      <div className="flex flex-wrap justify-between gap-2"><h4 className="font-bold">{grant.professional_name}</h4><span className="text-sm font-semibold">{grantStatus(grant)}</span></div>
      <p className="whitespace-pre-wrap break-words text-sm">{grant.purpose}</p>
      <p className="text-sm text-stone-600">Dal {displayDate(grant.created_at)} al {displayDate(grant.expires_at)} · {grant.selected_count} contributi selezionati · {grant.available_count} consultabili</p>
      {!grant.revoked_at && <button type="button" disabled={busy} onClick={() => void revoke(grant)} className={sharingSecondary}>Revoca accesso</button>}
    </article>)}
    <SharingPager page={page} total={Number(rows[0]?.total_count || 0)} count={rows.length} busy={loading || busy} onPage={setPage} />
  </section>;
}
