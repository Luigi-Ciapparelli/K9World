import { useRef, useState, type FormEvent } from 'react';
import { continuityRpc, displayDate } from '../lib/continuity';
import { grantStatus, notifySharingChanged, sharingButton, sharingSecondary, sharingError, useSharingRows, type ContinuityGrant, type OwnContinuityNote } from '../lib/continuitySharing';
import { ReceivedContinuityDialog, SharingPager } from './ContinuitySharingCommon';

export function ProfessionalContinuitySharing({ refreshKey }: { refreshKey: number }) {
  const [tab, setTab] = useState<'received' | 'own'>('received');
  return <section aria-labelledby="professional-sharing-title" className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-6">
    <h2 id="professional-sharing-title" className="text-2xl font-bold">Storico condiviso del cane</h2>
    <p className="mt-2 text-sm text-stone-600">Consulta i contributi autorizzati e scegli quali revisioni del tuo lavoro rendere condivisibili.</p>
    <div className="my-4 flex flex-wrap gap-3" role="group" aria-label="Sezioni dello storico">
      <button type="button" aria-pressed={tab === 'received'} onClick={() => setTab('received')} className={tab === 'received' ? sharingButton : sharingSecondary}>Storico ricevuto</button>
      <button type="button" aria-pressed={tab === 'own'} onClick={() => setTab('own')} className={tab === 'own' ? sharingButton : sharingSecondary}>Condividi il tuo lavoro</button>
    </div>
    <div hidden={tab !== 'received'}><ReceivedGrants refreshKey={refreshKey} /></div>
    <div hidden={tab !== 'own'}><OwnPublications refreshKey={refreshKey} /></div>
  </section>;
}

function ReceivedGrants({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<ContinuityGrant | null>(null);
  const { rows, loading, error, reload } = useSharingRows<ContinuityGrant>('list_my_continuity_grants', { p_limit: 20, p_offset: page * 20 }, refreshKey);
  return <div className="space-y-4">
    <p className="text-sm text-stone-600">Il proprietario deve autorizzarti a leggere contributi precisi. Una relazione attiva, da sola, non rende visibili le note degli altri professionisti.</p>
    <button type="button" disabled={loading} onClick={reload} className={sharingSecondary}>Aggiorna autorizzazioni</button>
    {loading && <p role="status">Caricamento…</p>}{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {!loading && !error && !rows.length && <p className="text-sm">Nessuna autorizzazione in questa pagina. Chiedi al proprietario di selezionare lo storico dalla propria area.</p>}
    {rows.map((grant) => <article key={grant.grant_id} className="space-y-2 rounded-xl border border-stone-200 p-4">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold">{grant.dog_name}</h3><span className="text-sm font-semibold">{grantStatus(grant)}</span></div>
      <p className="whitespace-pre-wrap break-words text-sm">{grant.purpose}</p><p className="text-sm text-stone-600">Fino al {displayDate(grant.expires_at)} · {grant.selected_count} contributi selezionati · {grant.available_count} consultabili</p>
      <button type="button" disabled={!grant.is_current || Number(grant.available_count) === 0} onClick={() => setOpen(grant)} className={sharingButton}>Leggi lo storico autorizzato</button>
    </article>)}
    <SharingPager page={page} total={Number(rows[0]?.total_count || 0)} count={rows.length} busy={loading} onPage={setPage} />
    {open && <ReceivedContinuityDialog key={open.grant_id} grant={open} onClose={() => { setOpen(null); reload(); }} />}
  </div>;
}

function OwnPublications({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<OwnContinuityNote | null>(null);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const { rows, loading, error, reload } = useSharingRows<OwnContinuityNote>('list_my_continuity_notes', { p_limit: 20, p_offset: page * 20 }, refreshKey);
  const withdraw = async (note: OwnContinuityNote) => {
    if (!note.publication_id || lock.current || !window.confirm('Ritirare questa revisione dallo storico condiviso? Il proprietario e i destinatari perderanno le nuove letture. La nota resta nel tuo archivio.')) return;
    lock.current = true; setBusy(true); setFailure(''); setNotice('');
    try { await continuityRpc('withdraw_my_continuity_note', { p_publication_id: note.publication_id }); setNotice('Revisione ritirata. Il tuo archivio è conservato.'); notifySharingChanged(); }
    catch (e) { setFailure(sharingError(e)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="space-y-4">
    <p className="text-sm text-stone-600">Le note nascono private. Rendere condivisibile una revisione permette al proprietario attuale di leggerla e autorizzare professionisti specifici. Le altre revisioni e gli allegati non vengono inclusi.</p>
    <button type="button" disabled={loading || busy || selected !== null} onClick={reload} className={sharingSecondary}>Aggiorna contributi</button>
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {(error || failure) && <p role="alert" className="text-sm text-rose-700">{error || failure}</p>}
    {selected && <PublishConfirmation key={`${selected.note_id}:${selected.revision_number}`} note={selected} onClose={() => { setSelected(null); reload(); }} onSaved={() => { setSelected(null); setNotice('Revisione resa condivisibile. Il proprietario può ora selezionarla per una concessione.'); notifySharingChanged(); }} />}
    {loading && <p role="status">Caricamento…</p>}
    {!loading && !error && !rows.length && <p className="text-sm">Nessuna nota finalizzata in questa pagina. Registra prima una sessione nella relazione con il cane.</p>}
    {rows.map((note) => <article key={note.note_id} className="space-y-2 rounded-xl border border-stone-200 p-4">
      <h3 className="font-bold">{note.dog_name} · {note.activity}</h3>
      <p className="text-sm text-stone-600">{displayDate(note.occurred_at)} · Revisione {note.revision_number}</p>
      <p className="text-sm font-semibold">{note.publication_id ? 'Revisione disponibile per la continuità' : 'Revisione privata'}</p>
      <details><summary className="cursor-pointer text-sm font-semibold underline">Leggi la revisione corrente</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{note.body}</p></details>
      {note.publication_id ? <button type="button" disabled={busy || selected !== null} onClick={() => void withdraw(note)} className={sharingSecondary}>Ritira dallo storico condiviso</button>
        : <button type="button" disabled={!note.can_publish || busy || selected !== null} onClick={() => { setSelected(note); setNotice(''); setFailure(''); }} className={sharingButton}>Prepara per lo storico</button>}
      {!note.can_publish && !note.publication_id && <p className="text-xs text-stone-600">La condivisione richiede un profilo professionale approvato e lo stesso proprietario che autorizzò la sessione. Il tuo archivio resta consultabile.</p>}
    </article>)}
    <SharingPager page={page} total={Number(rows[0]?.total_count || 0)} count={rows.length} busy={loading || busy || selected !== null} onPage={setPage} />
  </div>;
}

function PublishConfirmation({ note, onClose, onSaved }: { note: OwnContinuityNote; onClose: () => void; onSaved: () => void }) {
  const request = useRef({ p_request_id: crypto.randomUUID(), p_note_id: note.note_id, p_expected_revision: note.revision_number, p_expected_publication_id: note.publication_id });
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (lock.current || blocked) return;
    lock.current = true; setBusy(true); setError('');
    try { await continuityRpc('prepare_my_continuity_note', request.current); setUncertain(false); onSaved(); }
    catch (e) { const known = ['42501','40001','22023'].includes((e as { code?: string })?.code || ''); setBlocked(known); setUncertain(!known); setError(sharingError(e)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <form onSubmit={(event) => void submit(event)} className="space-y-3 rounded-2xl border-2 border-emerald-700 bg-emerald-50 p-4">
    <h3 className="font-bold">Conferma condivisione · {note.dog_name}</h3><p className="text-sm">{note.activity} · Revisione {note.revision_number}</p>
    <p className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-white p-3 text-sm">{note.body}</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" required disabled={busy || blocked} className="mt-1" /><span>Rendo questa revisione leggibile al proprietario attuale e ai professionisti che autorizzerà. Ho controllato il testo da condividere.</span></label>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy || blocked} className={sharingButton}>{busy ? 'Salvataggio…' : uncertain ? 'Riprova la stessa richiesta' : 'Rendi condivisibile questa revisione'}</button>
      <button type="button" disabled={busy} className={sharingSecondary} onClick={() => { if (!uncertain || window.confirm('L’esito potrebbe essere già registrato. Chiudere e aggiornare lo stato prima di tentare un nuovo invio?')) onClose(); }}>Chiudi e aggiorna</button></div>
  </form>;
}
