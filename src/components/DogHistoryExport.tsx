import { useEffect, useId, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { downloadHistory, exportError, exportLabels, exportRequest, historyRpc, prepareHistoryDownload, type ExportPreview, type ExportRequest, type ExportScope } from '../lib/dogHistoryExport';

const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-50';
export function DogHistoryExport({ scope, subjectId, label = 'Scarica storico' }: { scope: ExportScope; subjectId: string; label?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return <ExportControl key={`${user.id}:${scope}:${subjectId}`} userId={user.id} scope={scope} subjectId={subjectId} label={label} />;
}
function ExportControl({ userId, scope, subjectId, label }: { userId: string; scope: ExportScope; subjectId: string; label: string }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className={secondary} onClick={() => setOpen(true)}><Download className="h-4 w-4" aria-hidden="true" />{label}</button>
    {open && <ExportDialog userId={userId} scope={scope} subjectId={subjectId} onClose={() => setOpen(false)} />}</>;
}
function ExportDialog({ userId, scope, subjectId, onClose }: { userId: string; scope: ExportScope; subjectId: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const alive = useRef(true); const lock = useRef(false);
  const titleId = useId(); const [from, setFrom] = useState(''); const [through, setThrough] = useState('');
  const [preview, setPreview] = useState<ExportPreview | null>(null); const [request, setRequest] = useState<ExportRequest | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [photo, setPhoto] = useState(true);
  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement; const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.showModal();
    return () => { alive.current = false; dialog.current?.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  const invalidate = () => { setPreview(null); setRequest(null); setNotice(''); setError(''); };
  async function check() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice(''); setPreview(null); setRequest(null);
    try {
      const next = exportRequest(scope, subjectId, from, through);
      const data = await historyRpc<ExportPreview>(next, true);
      if (alive.current) { setPreview(data); setRequest(next); }
    } catch (e) { if (alive.current) setError(exportError(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function save(format: 'html' | 'json') {
    if (!request || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const data = await prepareHistoryDownload(request, photo, userId, () => alive.current);
      if (!alive.current || !data) return;
      downloadHistory(data, format);
      setNotice(`Download avviato con i dati attualmente autorizzati.${data.photo?.status === 'omitted' ? ` ${data.photo.detail}` : ''}`);
      // Further downloads require a fresh preview. No note bodies are stored in component state.
      setPreview(null); setRequest(null);
    } catch (e) { if (alive.current) { setError(exportError(e)); setPreview(null); setRequest(null); } }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} className="m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-5 text-stone-900 backdrop:bg-stone-950/60 sm:p-8">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-800">Il percorso, da conservare</p><h2 id={titleId} className="mt-1 text-2xl font-bold">{exportLabels[scope]}</h2></div><button type="button" onClick={onClose} aria-label="Chiudi esportazione" className="rounded-lg p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button></div>
    <p className="mt-4 text-sm leading-relaxed text-stone-600">{scope === 'owner' ? 'Anagrafica, appuntamenti con le relative conversazioni, relazioni e note rese condivisibili dagli autori.' : scope === 'professional' ? 'Sessioni e tutte le revisioni del tuo archivio per questa relazione, anche se conclusa. Sono inclusi gli appuntamenti collegati ancora disponibili.' : 'Soltanto le revisioni selezionate dal proprietario e ancora autorizzate per questa concessione.'}</p>
    <form onSubmit={e => { e.preventDefault(); void check(); }} className="mt-5 space-y-4">
      <details><summary className="cursor-pointer text-sm font-semibold underline">Scegli un periodo (facoltativo)</summary><fieldset disabled={busy} className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Dall’attività del<input type="date" value={from} onChange={e => { setFrom(e.target.value); invalidate(); }} className="mt-1 block w-full rounded-xl border border-stone-300 bg-white p-3" /></label><label className="text-sm font-semibold">Fino al giorno incluso<input type="date" value={through} onChange={e => { setThrough(e.target.value); invalidate(); }} className="mt-1 block w-full rounded-xl border border-stone-300 bg-white p-3" /></label></fieldset><p className="mt-2 text-xs text-stone-500">Date nel fuso del dispositivo. Anagrafica e relazioni restano incluse; per ogni appuntamento selezionato vengono inclusi tutti i suoi messaggi.</p></details>
      <button type="submit" disabled={busy} className={primary}>{busy ? 'Preparazione in corso…' : preview ? 'Aggiorna riepilogo' : 'Prepara il riepilogo'}</button>
    </form>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {preview && <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5" aria-label="Riepilogo esportazione">
      <h3 className="text-lg font-bold">{preview.dog_name}</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{Object.entries({ relationships: 'Relazioni', bookings: 'Appuntamenti', messages: 'Messaggi', notes: 'Note / revisioni' }).map(([key, text]) => <div key={key}><dt className="text-stone-600">{text}</dt><dd className="text-xl font-bold">{preview.counts[key as keyof typeof preview.counts]}</dd></div>)}</dl>
      {scope === 'owner' && preview.photo_present && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={photo} disabled={busy} onChange={e => setPhoto(e.target.checked)} />Includi la foto del cane, se disponibile</label>}
      <p className="mt-4 text-sm text-stone-600">I permessi vengono ricontrollati al download. Il file può contenere meno contributi se nel frattempo una condivisione viene ritirata.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row"><button type="button" className={primary} disabled={busy} onClick={() => void save('html')}>Scarica documento</button><button type="button" className={secondary} disabled={busy} onClick={() => void save('json')}>Scarica dati JSON</button></div>
      <p className="mt-3 text-xs text-stone-600">Il documento HTML si apre nel browser anche offline: usa Stampa → Salva come PDF. Il JSON conserva la struttura dei dati.</p>
    </section>}
    <p className="mt-5 text-xs leading-relaxed text-stone-500">Il file resta sul dispositivo: conservalo con cura. Le copie già scaricate non possono essere ritirate a distanza. Luoghi non registrati e allegati non disponibili saranno indicati nel documento.</p>
  </dialog>;
}
