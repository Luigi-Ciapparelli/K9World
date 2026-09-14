import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { continuityRpc, displayDate } from '../lib/continuity';
import { sharingSecondary, sharingError, type SharedContinuityNote, type ContinuityGrant } from '../lib/continuitySharing';

export function SharingPager({ page, total, count, busy, onPage }: { page: number; total: number; count: number; busy: boolean; onPage: (page: number) => void }) {
  if (!page && total <= 20 && count < 20) return null;
  return <nav aria-label="Pagine storico" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
    <button type="button" disabled={busy || page === 0} onClick={() => onPage(page - 1)} className={sharingSecondary}>Precedenti</button>
    <span>Pagina {page + 1}</span><button type="button" disabled={busy || count < 20 || (page + 1) * 20 >= total} onClick={() => onPage(page + 1)} className={sharingSecondary}>Successive</button>
  </nav>;
}

export function SharedNoteText({ note }: { note: SharedContinuityNote }) {
  return <div className="space-y-2 text-stone-900">
    <h4 className="font-bold">{note.activity}</h4>
    <p className="text-sm text-stone-600">{note.author_name} · {displayDate(note.occurred_at)} · Revisione {note.revision_number}</p>
    <p className="whitespace-pre-wrap break-words text-sm">{note.body}</p>
    <p className="text-xs text-stone-500">Resa condivisibile il {displayDate(note.shared_at)}</p>
  </div>;
}

export function ReceivedContinuityDialog({ grant, onClose }: { grant: ContinuityGrant; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<SharedContinuityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.showModal();
    return () => { dialog.current?.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  useEffect(() => {
    let active = true; let inFlight = false;
    const pageHidden = () => document.visibilityState === 'hidden';
    setRows([]); setLoading(true); setError('');
    const load = async () => {
      if (!active || inFlight || pageHidden()) return;
      inFlight = true;
      try {
        const data = await continuityRpc<SharedContinuityNote[]>('read_received_continuity_notes', { p_grant_id: grant.grant_id, p_limit: 20, p_offset: page * 20 });
        if (active && !pageHidden()) { setRows(data || []); setError(''); if (!data?.length && page) setPage(0); }
      } catch (failure) { if (active) { setRows([]); setError(sharingError(failure)); } }
      finally { inFlight = false; if (active) setLoading(false); }
    };
    const visible = () => { setRows([]); setLoading(true); setRevision((value) => value + 1); };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    document.addEventListener('visibilitychange', visible); window.addEventListener('focus', visible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); window.removeEventListener('focus', visible); };
  }, [grant.grant_id, page, revision]);
  return <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby="received-continuity-title"
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 text-stone-900 backdrop:bg-stone-900/50 sm:p-7">
    <div className="flex items-start justify-between gap-4"><div><h3 id="received-continuity-title" className="text-xl font-bold">Storico autorizzato · {grant.dog_name}</h3><p className="mt-1 text-sm text-stone-600">Accesso fino al {displayDate(grant.expires_at)}, salvo revoca o fine della relazione.</p></div><button type="button" aria-label="Chiudi storico" onClick={onClose} className="p-2"><X className="h-5 w-5" /></button></div>
    <p className="my-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Questa selezione può rappresentare solo una parte del lavoro precedente. Comprende esclusivamente le revisioni autorizzate.</p>
    <button type="button" disabled={loading} onClick={() => setRevision((value) => value + 1)} className={sharingSecondary}>Aggiorna accesso e contributi</button>
    {loading && <p role="status" className="mt-4">Caricamento…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
    {!loading && !error && !rows.length && <p className="mt-4 text-sm">Nessun contributo consultabile: le revisioni selezionate potrebbero essere state ritirate.</p>}
    <div className="mt-4 space-y-4">{rows.map((note) => <article key={note.publication_id} className="rounded-2xl border border-stone-200 p-4"><SharedNoteText note={note} /></article>)}</div>
    <SharingPager page={page} total={Number(rows[0]?.total_count || 0)} count={rows.length} busy={loading} onPage={setPage} />
  </dialog>;
}
