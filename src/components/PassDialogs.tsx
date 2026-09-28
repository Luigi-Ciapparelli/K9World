import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { passDate, passError, passMoney, passRpc, localPassTime, type ClientPass, type PassBooking, type PassEvent, type PassTemplate } from '../lib/professionalPasses';

export const passButton = 'rounded-xl bg-emerald-800 px-4 py-2.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed';
export const passSecondary = 'rounded-xl border border-stone-300 bg-white px-4 py-2.5 font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50';
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900';
export function PassAlert({ children }: { children: ReactNode }) {
  return <p role="alert" className="my-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{children}</p>;
}
export function PassDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); }; }, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white p-5 text-stone-900 shadow-xl backdrop:bg-stone-900/50 sm:p-6">
    <div className="mb-4 flex items-start justify-between gap-4"><h2 id={id} className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} disabled={busy} className="p-1 underline">Chiudi</button></div>
    {children}
  </dialog>;
}
function usePassMutation(onSaved: () => void) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const lock = useRef(false); const operation = useRef<{ key: string; id: string }>();
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function run(name: string, args: Record<string, unknown>, withId = true) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const key = JSON.stringify([name, args]);
    if (!operation.current || operation.current.key !== key) operation.current = { key, id: crypto.randomUUID() };
    try {
      await passRpc(name, withId ? { ...args, p_id: operation.current.id } : args);
      if (alive.current) onSaved();
    } catch (e) { if (alive.current) setError(passError(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return { busy, error, run };
}
export function PassTemplateDialog({ model, services, onClose, onSaved }: {
  model: PassTemplate | null; services: { id: string; name: string; active: boolean }[]; onClose: () => void; onSaved: () => void;
}) {
  const [id] = useState(() => model?.id || crypto.randomUUID());
  const [name, setName] = useState(model?.name || ''); const [description, setDescription] = useState(model?.description || '');
  const [service, setService] = useState(model?.service_id || ''); const [uses, setUses] = useState(model?.total_uses || 5);
  const [price, setPrice] = useState(model?.price || 0); const [days, setDays] = useState(model?.valid_days || 90);
  const { busy, error, run } = usePassMutation(onSaved);
  function submit(e: FormEvent) { e.preventDefault(); void run('save_own_pass_template', {
    p_id: id, p_version: model?.version || 0, p_service_id: service, p_name: name.trim(), p_description: description.trim(),
    p_total_uses: uses, p_price: price, p_valid_days: days,
  }, false); }
  return <PassDialog title={model ? 'Modifica modello' : 'Nuovo modello di pacchetto'} busy={busy} onClose={onClose}>
    <form onSubmit={submit}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Nome del pacchetto<input className={inputClass} value={name} onChange={e => setName(e.target.value)} required maxLength={100} /></label>
      <label className="block">Servizio incluso<select aria-label="Servizio incluso" className={inputClass} value={service} onChange={e => setService(e.target.value)} required><option value="">Scegli un servizio attivo</option>{services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label>Numero di lezioni<input type="number" className={inputClass} value={uses} onChange={e => setUses(Number(e.target.value))} required min={1} max={200} step={1} /></label>
        <label>Prezzo totale (€)<input type="number" className={inputClass} value={price} onChange={e => setPrice(Number(e.target.value))} required min={0} max={100000} step="0.01" /></label></div>
      <label className="block">Validità dall’assegnazione (giorni)<input type="number" className={inputClass} value={days} onChange={e => setDays(Number(e.target.value))} required min={1} max={1095} step={1} /></label>
      <label className="block">Descrizione del modello<textarea className={inputClass} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={3} /></label>
      <p className="text-sm text-stone-600">Le modifiche valgono per le prossime assegnazioni. I pacchetti già assegnati mantengono servizio, prezzo, lezioni e scadenza originali.</p>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton}>{busy ? 'Salvataggio…' : 'Salva modello'}</button>
    </fieldset></form>
  </PassDialog>;
}
export function IssuePassDialog({ models, onClose, onSaved }: { models: PassTemplate[]; onClose: () => void; onSaved: () => void }) {
  const [template, setTemplate] = useState(''); const [client, setClient] = useState(''); const [query, setQuery] = useState('');
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]); const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(''); const [retry, setRetry] = useState(0);
  const { busy, error, run } = usePassMutation(onSaved); const selected = models.find(m => m.id === template);
  useEffect(() => {
    let alive = true; setLoading(true); setLoadError('');
    const timer = window.setTimeout(async () => {
      const result = await supabase.rpc('get_professional_clients').select('id,full_name').ilike('full_name', `%${query.trim().replace(/[%_]/g, '')}%`).limit(50);
      if (!alive) return;
      if (result.error) { setClients([]); setLoadError('Impossibile caricare i clienti.'); }
      else setClients((result.data || []) as { id: string; full_name: string }[]);
      setLoading(false);
    }, 200);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, retry]);
  return <PassDialog title="Assegna un pacchetto" busy={busy} onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); void run('issue_client_pass', { p_template_id: template, p_client_id: client }); }}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Modello<select aria-label="Modello" className={inputClass} value={template} onChange={e => setTemplate(e.target.value)} required><option value="">Scegli il pacchetto</option>{models.filter(m => m.active && m.service_active).map(m => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label>
      <label className="block">Cerca cliente per nome<input className={inputClass} value={query} onChange={e => { setQuery(e.target.value); setClient(''); }} /></label>
      <label className="block">Cliente<select aria-label="Cliente" className={inputClass} value={client} onChange={e => setClient(e.target.value)} required disabled={loading || !!loadError}><option value="">{loading ? 'Caricamento…' : 'Scegli il cliente'}</option>{clients.map(c => <option value={c.id} key={c.id}>{c.full_name || 'Cliente senza nome'}</option>)}</select></label>
      <p className="text-sm text-stone-600">Sono disponibili i clienti con una tua prenotazione accettata o completata. La ricerca mostra fino a 50 nomi.</p>
      {loadError && <PassAlert>{loadError} <button type="button" className="underline" onClick={() => setRetry(v => v + 1)}>Riprova</button></PassAlert>}
      {selected && <div className="rounded-xl bg-emerald-50 p-4 text-emerald-950"><strong>{selected.total_uses} lezioni · {passMoney(selected.price)}</strong><p>{selected.service_name} · {selected.valid_days} giorni dall’assegnazione</p></div>}
      <p className="text-sm text-stone-600">Conferma un accordo già preso con il cliente. L’assegnazione non esegue né registra un pagamento.</p>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton} disabled={loading || !!loadError || !client || !template}>{busy ? 'Assegnazione…' : 'Conferma assegnazione'}</button>
    </fieldset></form>
  </PassDialog>;
}
export function UsePassDialog({ pack, onClose, onSaved }: { pack: ClientPass; onClose: () => void; onSaved: () => void }) {
  const [mode, setMode] = useState<'manual' | 'booking'>('manual'); const [bookings, setBookings] = useState<PassBooking[]>([]);
  const [booking, setBooking] = useState(''); const [date, setDate] = useState(localPassTime()); const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true); const [loadError, setLoadError] = useState('');
  const { busy, error, run } = usePassMutation(onSaved);
  useEffect(() => { let alive = true;
    passRpc<PassBooking[]>('list_pass_eligible_bookings', { p_id: pack.id }).then(data => { if (alive) setBookings(data); })
      .catch(() => { if (alive) setLoadError('Prenotazioni non disponibili. Chiudi e riapri per riprovare.'); })
      .finally(() => { if (alive) setLoading(false); }); return () => { alive = false; };
  }, [pack.id]);
  return <PassDialog title="Registra lezione" busy={busy} onClose={onClose}>
    <p className="mb-4">{pack.client_name} · {pack.service_name} · <strong>{pack.remaining_uses} lezioni residue</strong></p>
    <form onSubmit={e => { e.preventDefault(); void run('record_pass_use', { p_client_pass_id: pack.id, p_booking_id: mode === 'booking' ? booking : null, p_occurred_at: mode === 'manual' ? new Date(date).toISOString() : null, p_description: mode === 'manual' ? description.trim() : null }); }}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Come vuoi registrarla?<select aria-label="Come vuoi registrarla?" className={inputClass} value={mode} onChange={e => setMode(e.target.value as 'manual' | 'booking')}><option value="manual">Lezione svolta senza prenotazione sul portale</option><option value="booking">Collega una prenotazione completata</option></select></label>
      {mode === 'booking' ? <><label className="block">Prenotazione<select aria-label="Prenotazione" className={inputClass} value={booking} onChange={e => setBooking(e.target.value)} required disabled={loading || !!loadError}><option value="">{loading ? 'Caricamento…' : 'Scegli una lezione'}</option>{bookings.map(b => <option value={b.id} key={b.id}>{passDate(b.start_at)} · {b.service_name}</option>)}</select></label>{loadError && <PassAlert>{loadError}</PassAlert>}{!loading && !loadError && !bookings.length && <p>Nessuna prenotazione completata compatibile da scalare.</p>}</>
        : <><label className="block">Data e ora della lezione<input className={inputClass} type="datetime-local" step="1" value={date} onChange={e => setDate(e.target.value)} min={localPassTime(new Date(pack.purchased_at))} max={localPassTime()} required /></label><label className="block">Breve descrizione visibile al cliente<textarea className={inputClass} value={description} onChange={e => setDescription(e.target.value)} minLength={3} maxLength={300} required rows={2} /></label></>}
      <p className="text-sm text-stone-600">Verrà scalata una lezione. Deve essere già svolta nel periodo di validità. Per gli appunti riservati usa l’archivio professionale.</p>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton} disabled={mode === 'booking' && (!booking || loading || !!loadError)}>{busy ? 'Registrazione…' : 'Scala una lezione'}</button>
    </fieldset></form>
  </PassDialog>;
}
export function PassReasonDialog({ pack, event, onClose, onSaved }: { pack: ClientPass; event?: PassEvent; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState(''); const { busy, error, run } = usePassMutation(onSaved);
  return <PassDialog title={event ? 'Storna una lezione' : 'Annulla pacchetto'} busy={busy} onClose={onClose}>
    <p className="mb-4">{event ? 'La lezione torna disponibile e lo storico conserva la rettifica.' : 'Il cliente non potrà più utilizzare le lezioni residue. Il pacchetto rimane nello storico; nessun rimborso viene eseguito.'}</p>
    <form onSubmit={e => { e.preventDefault(); void run(event ? 'reverse_pass_use' : 'cancel_own_client_pass', event ? { p_use_id: event.id, p_reason: reason.trim() } : { p_id: pack.id, p_version: pack.version, p_reason: reason.trim() }, !!event); }}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Motivo visibile al cliente<textarea className={inputClass} value={reason} onChange={e => setReason(e.target.value)} minLength={3} maxLength={300} required rows={3} /></label>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton}>{busy ? 'Salvataggio…' : event ? 'Conferma storno' : 'Conferma annullamento'}</button>
    </fieldset></form>
  </PassDialog>;
}
export function PassHistoryDialog({ pack, professional, onClose, onReverse }: { pack: ClientPass; professional: boolean; onClose: () => void; onReverse: (event: PassEvent) => void }) {
  const [events, setEvents] = useState<PassEvent[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => { let alive = true; setLoading(true); setError('');
    passRpc<PassEvent[]>('get_client_pass_events', { p_id: pack.id }).then(data => { if (alive) setEvents(data); })
      .catch(e => { if (alive) setError(passError(e)); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [pack.id, retry]);
  return <PassDialog title={`Storico · ${pack.name}`} busy={false} onClose={onClose}>
    <p className="mb-4 text-sm text-stone-600">Assegnato il {passDate(pack.purchased_at)}. Orari nel fuso del dispositivo.</p>
    {loading ? <p role="status">Caricamento storico…</p> : error ? <PassAlert>{error} <button className="underline" onClick={() => setRetry(v => v + 1)}>Riprova</button></PassAlert> : !events.length ? <p>Nessuna lezione registrata.</p> : <ol className="space-y-3">{events.map(e => <li key={e.id} className="rounded-xl border border-stone-200 p-4">
      <div className="flex justify-between gap-2"><strong>{e.kind === 'reversal' ? '+1 · Storno' : e.reversed_at ? 'Lezione stornata' : '−1 · Lezione'}</strong><span className="text-sm">{passDate(e.occurred_at)}</span></div>
      <p className="mt-2 whitespace-pre-wrap break-words">{e.description}</p>
      {professional && e.kind === 'use' && !e.reversed_at && <button className={`${passSecondary} mt-3 text-sm`} onClick={() => onReverse(e)}>Storna questa lezione</button>}
    </li>)}</ol>}
  </PassDialog>;
}
