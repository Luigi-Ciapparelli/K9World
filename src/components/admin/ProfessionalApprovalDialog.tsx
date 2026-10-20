import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { approvalLabels, readProfessionalApproval, sameApproval, writeProfessionalApproval } from '../../lib/professionalApproval';
import type { ApprovalStatus, ProfessionalApproval } from '../../lib/professionalApproval';

const actions: Record<ApprovalStatus, { title: string; confirm: string; effect: string }> = {
  approved: { title: 'Approva il profilo', confirm: 'Conferma approvazione', effect: 'Il profilo potrà comparire nelle ricerche, secondo i servizi e la visibilità impostati.' },
  pending: { title: 'Rimetti il profilo in attesa', confirm: 'Conferma attesa', effect: 'Il profilo resterà da controllare e non sarà mostrato nelle ricerche pubbliche.' },
  rejected: { title: 'Rifiuta il profilo', confirm: 'Conferma rifiuto', effect: 'Il profilo non sarà mostrato nelle ricerche pubbliche. Indica cosa deve correggere il professionista.' },
};
type Phase = 'loading' | 'ready' | 'loadError' | 'saving' | 'uncertain' | 'checking' | 'result';

export function ProfessionalApprovalDialog({ id, name, status, onClose, onObserved }: {
  id: string; name: string; status: ApprovalStatus; onClose: () => void;
  onObserved: (record: ProfessionalApproval) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const attempted = useRef(false);
  const snapshot = useRef<ProfessionalApproval | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [current, setCurrent] = useState<ProfessionalApproval | null>(null);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const action = actions[status];

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const ticket = ++generation.current;
    const request = new AbortController(); controller.current = request;
    setPhase(attempted.current ? 'checking' : 'loading'); setError('');
    try {
      const row = await readProfessionalApproval(id, request.signal);
      if (ticket !== generation.current) return;
      const changed = snapshot.current !== null && !sameApproval(snapshot.current, row);
      if (!snapshot.current || changed || attempted.current) {
        setNotes(row.admin_notes || ''); setReason(row.rejection_reason || '');
      }
      snapshot.current = row; setCurrent(row); onObserved(row);
      if (attempted.current) {
        setNotice(`Stato attuale: ${approvalLabels[row.approval_status || 'pending']}. Le note qui sotto sono quelle lette dal server.`);
        setPhase('result');
      } else {
        if (changed) setError('Lo stato o le note sono cambiati. Sono stati aggiornati nel modulo: rileggili prima di confermare. Nessuna decisione inviata.');
        setPhase('ready');
      }
    } catch {
      if (ticket !== generation.current) return;
      setError(attempted.current
        ? 'Esito non confermato. Non inviare di nuovo la decisione: verifica lo stato quando torna la connessione.'
        : 'Non è stato possibile leggere lo stato attuale del profilo. Nessuna decisione inviata. Riprova il caricamento.');
      setPhase(attempted.current ? 'uncertain' : 'loadError');
    } finally { if (ticket === generation.current) inFlight.current = false; }
  }, [id, onObserved]);

  const cancelPending = useCallback(() => {
    ++generation.current; inFlight.current = false; controller.current?.abort();
  }, []);
  useEffect(() => {
    const element = dialog.current; element?.showModal();
    void load();
    return () => { cancelPending(); element?.close(); };
  }, [load, cancelPending]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || attempted.current || phase !== 'ready' || !current || (status === 'rejected' && !reason.trim())) return;
    inFlight.current = true;
    const ticket = ++generation.current;
    const request = new AbortController(); controller.current = request;
    setPhase('saving'); setError(''); setNotice('');
    try {
      // Detect intervening changes before sending. The legacy RPC does not
      // provide atomic compare-and-swap; this read is not a concurrency lock.
      const latest = await readProfessionalApproval(id, request.signal);
      if (ticket !== generation.current) return;
      if (!sameApproval(current, latest)) {
        snapshot.current = latest; setCurrent(latest); setNotes(latest.admin_notes || ''); setReason(latest.rejection_reason || ''); onObserved(latest);
        setError('Lo stato o le note sono cambiati. Sono stati aggiornati nel modulo: rileggili prima di confermare. Nessuna decisione inviata.');
        setPhase('ready'); return;
      }
      const expected: ProfessionalApproval = {
        id, approval_status: status, approved: status === 'approved',
        admin_notes: notes === '' ? null : notes,
        rejection_reason: status === 'rejected' ? reason.trim() : null,
      };
      attempted.current = true;
      await writeProfessionalApproval(expected, request.signal);
      if (ticket !== generation.current) return;
      const observed = await readProfessionalApproval(id, request.signal);
      if (ticket !== generation.current) return;
      snapshot.current = observed; setCurrent(observed); onObserved(observed); setNotes(observed.admin_notes || ''); setReason(observed.rejection_reason || '');
      if (sameApproval(expected, observed)) setNotice(`Decisione registrata. Stato attuale: ${approvalLabels[status]}.`);
      else setError(`Lo stato letto non corrisponde alla decisione inviata. Stato attuale: ${approvalLabels[observed.approval_status || 'pending']}. Controlla le note prima di effettuare altre modifiche.`);
      setPhase('result');
    } catch {
      if (ticket !== generation.current) return;
      setError(attempted.current
        ? 'Esito non confermato. La decisione potrebbe essere stata registrata. Premi Verifica esito: verrà letto lo stato senza ripetere l’invio.'
        : 'Non è stato possibile ricontrollare il profilo. Nessuna decisione inviata. Riprova il caricamento.');
      setPhase(attempted.current ? 'uncertain' : 'loadError');
    } finally { if (ticket === generation.current) inFlight.current = false; }
  }

  const busy = phase === 'saving' || phase === 'checking';
  const editable = phase === 'ready';
  const close = () => { if (!inFlight.current || phase === 'loading') onClose(); };
  return <dialog ref={dialog} aria-labelledby="professional-approval-title" aria-describedby="professional-approval-description"
    onCancel={event => { event.preventDefault(); close(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-0 text-stone-900 backdrop:bg-stone-900/50">
    <form onSubmit={event => void submit(event)} className="p-5 sm:p-7" aria-busy={busy || phase === 'loading'}>
      <h2 id="professional-approval-title" className="text-xl font-bold">{action.title}</h2>
      <p className="mt-2 break-words font-semibold">{name}</p>
      <p id="professional-approval-description" className="mt-3 text-sm text-stone-600">{action.effect}</p>
      {current && <p className="mt-3 text-sm">Stato letto: <strong>{approvalLabels[current.approval_status || 'pending']}</strong></p>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">{notice}</p>}
      {(phase === 'loading' || phase === 'checking') && <p role="status" className="mt-4 text-sm">{phase === 'checking' ? 'Verifica dello stato…' : 'Caricamento dello stato attuale…'}</p>}
      {current && phase !== 'loading' && phase !== 'loadError' && <div className="mt-4 space-y-4">
        <label className="block text-sm font-semibold">Note di amministrazione
          <textarea rows={3} value={notes} disabled={!editable} onChange={event => setNotes(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-300 p-3 font-normal disabled:bg-stone-50" />
          <span className="mt-1 block text-xs font-normal text-stone-600">Le note esistenti sono conservate. Modificale solo se necessario.</span>
        </label>
        {(status === 'rejected' || (phase === 'result' && reason)) && <label className="block text-sm font-semibold">Motivo del rifiuto
          <textarea rows={3} required={editable && status === 'rejected'} value={reason} disabled={!editable} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-300 p-3 font-normal disabled:bg-stone-50" />
          <span className="mt-1 block text-xs font-normal text-stone-600">Spiega in modo concreto cosa manca o deve essere corretto.</span>
        </label>}
      </div>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" disabled={busy} onClick={close} className="rounded-xl border border-stone-300 px-4 py-2.5 font-semibold disabled:opacity-50">{attempted.current ? 'Chiudi' : 'Annulla'}</button>
        {phase === 'loadError' && <button type="button" onClick={() => void load()} className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white">Riprova caricamento</button>}
        {(editable || phase === 'saving') && <button type="submit" disabled={!editable || (status === 'rejected' && !reason.trim())} className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{phase === 'saving' ? 'Registrazione in corso…' : action.confirm}</button>}
        {phase === 'uncertain' && <button type="button" onClick={() => void load()} className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white">Verifica esito</button>}
      </div>
    </form>
  </dialog>;
}
