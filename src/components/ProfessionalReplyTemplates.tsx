import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { templateEvents, type ReplyTemplate } from '../lib/bookingMessages';

const field = 'mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900';
const button = 'rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold disabled:opacity-50';

export function ProfessionalReplyTemplates() {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [draft, setDraft] = useState<ReplyTemplate | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const lock = useRef(false);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setLoadFailed(false);
    try {
      const { data, error: failure } = await supabase.rpc('list_my_reply_templates');
      if (failure) throw failure;
      if (active.current) setTemplates((data || []) as ReplyTemplate[]);
    } catch { if (active.current) { setError('Modelli non caricati. Riprova.'); setLoadFailed(true); } }
    finally { if (active.current) setLoading(false); }
  }, []);
  useEffect(() => { active.current = true; void load(); return () => { active.current = false; }; }, [load]);
  const create = (whatsapp = false) => {
    setNotice(''); setError('');
    const normalizedPhone = phone.trim().replace(/[\s().-]/g, '');
    if (whatsapp && !/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) { setError('Inserisci il tuo numero WhatsApp, completo di prefisso internazionale (per esempio +39).'); return; }
    setDraft({ id: crypto.randomUUID(), title: whatsapp ? 'Contatto WhatsApp' : '',
      body: whatsapp ? `Grazie per la richiesta. Contattami su WhatsApp al numero ${normalizedPhone} per concordare i dettagli.` : '', automatic_event: null });
  };
  const remove = async (template: ReplyTemplate) => {
    if (lock.current || !window.confirm('Eliminare questo modello e disattivarne l’eventuale invio automatico? I messaggi già inviati restano nella conversazione.')) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const { error: failure } = await supabase.rpc('delete_my_reply_template', { p_template_id: template.id });
      if (failure) throw failure;
      if (active.current) { setNotice('Modello eliminato.'); await load(); }
    } catch { if (active.current) setError('Eliminazione non confermata. Aggiorna l’elenco per controllare.'); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };
  return <div className="space-y-4 text-stone-900">
    <p className="text-sm text-stone-600">Salva testi da usare nelle conversazioni. Puoi inviarli a mano, modificandoli prima dell’invio, oppure attivare una risposta automatica per le nuove richieste.</p>
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="text-sm text-rose-700">{error} <button type="button" onClick={() => void load()} className="underline">Aggiorna elenco</button></p>}
    {draft ? <TemplateEditor key={draft.id} initial={draft} onClose={() => setDraft(null)} onSaved={() => {
      setDraft(null); setNotice('Modello salvato. Gli invii automatici scelti valgono per i prossimi eventi.'); void load();
    }} /> : <>
      {loading ? <p role="status" className="text-sm">Caricamento modelli…</p> : templates.map((template) => <article key={template.id} className="rounded-xl border border-stone-200 p-4">
        <h3 className="font-bold">{template.title}</h3><p className="mt-1 text-xs font-semibold text-emerald-800">{templateEvents.find(([event]) => event === (template.automatic_event || ''))?.[1]}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-700">{template.body}</p>
        <div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => setDraft(template)} className={button}>Modifica</button><button type="button" disabled={busy} onClick={() => void remove(template)} className={button}>Elimina</button></div>
      </article>)}
      {!loading && !templates.length && !error && <p className="text-sm text-stone-600">Nessun modello salvato.</p>}
      <button type="button" disabled={busy || loading || loadFailed || templates.length >= 50} onClick={() => create()} className={button}>Nuovo modello</button>
      <div className="rounded-xl bg-stone-50 p-4"><label className="text-sm font-semibold">Numero WhatsApp con prefisso<input type="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+39 …" className={field} /></label>
        <button type="button" disabled={busy || loading || loadFailed || templates.length >= 50} onClick={() => create(true)} className={`${button} mt-3`}>Prepara modello WhatsApp</button>
        <p className="mt-2 text-xs text-stone-600">Il testo viene inviato nella conversazione sul sito. Sarà il cliente a contattarti su WhatsApp.</p>
      </div>
      <p className="text-xs text-stone-500">{templates.length}/50 modelli salvati.</p>
    </>}
  </div>;
}

function TemplateEditor({ initial, onClose, onSaved }: { initial: ReplyTemplate; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const { error: failure } = await supabase.rpc('save_my_reply_template', {
        p_template_id: draft.id, p_title: draft.title.trim(), p_body: draft.body.trim(), p_automatic_event: draft.automatic_event || null,
      });
      if (failure) throw failure;
      onSaved();
    } catch (failure) {
      setError((failure as { code?: string })?.code === 'PCM02' ? 'Hai raggiunto 50 modelli. Elimina un modello prima di aggiungerne un altro.'
        : 'Salvataggio non confermato. Riprova o chiudi e aggiorna l’elenco per controllare il modello.');
    } finally { lock.current = false; setBusy(false); }
  };
  return <form onSubmit={(event) => void save(event)} className="space-y-3 rounded-xl border border-stone-300 bg-stone-50 p-4">
    <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
      <label className="block text-sm font-semibold">Nome del modello<input autoFocus required maxLength={80} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={field} /></label>
      <label className="block text-sm font-semibold">Testo del messaggio<textarea required maxLength={4000} rows={4} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} className={field} /></label>
      <label className="block text-sm font-semibold">Quando inviarlo<select value={draft.automatic_event || ''} onChange={(event) => setDraft({ ...draft, automatic_event: event.target.value || null })} className={field}>{templateEvents.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {draft.automatic_event && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Salvando, questo testo verrà inviato automaticamente nella conversazione al verificarsi dell’evento scelto. Sostituisce l’eventuale altro modello assegnato allo stesso evento. Le prenotazioni precedenti non ricevono invii retroattivi.</p>}
    </fieldset>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <div className="flex gap-2"><button type="submit" disabled={busy} className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Salvataggio…' : 'Salva modello'}</button><button type="button" disabled={busy} onClick={onClose} className={button}>Chiudi</button></div>
  </form>;
}
