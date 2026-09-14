import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { messageButtonStyle, notifyMessagesChanged, type BookingMessage, type MessageSummary, type ReplyTemplate } from '../lib/bookingMessages';

type Props = { bookingId: string; professional?: boolean; summary?: MessageSummary; requestNotes?: string | null };

export function BookingConversation({ bookingId, professional = false, summary, requestNotes }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className={messageButtonStyle}>
      <MessageCircle className="h-4 w-4" />Messaggi
      {Number(summary?.unread_count) > 0 && <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-xs text-white">{summary?.unread_count} nuovi</span>}
      {summary && Number(summary.unread_count) === 0 && Number(summary.message_count) > 0 && <span className="text-xs text-stone-500">({summary.message_count})</span>}
    </button>
    {open && user && <BookingConversationDialog key={`${user.id}:${bookingId}`} bookingId={bookingId} professional={professional} requestNotes={requestNotes} onClose={() => { setOpen(false); notifyMessagesChanged(); }} />}
  </>;
}

export function BookingConversationDialog({ bookingId, professional, requestNotes, onClose }: Props & { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const loadingRef = useRef(false);
  const refreshQueued = useRef(false);
  const list = useRef<HTMLOListElement>(null);
  const followLatest = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const sendLock = useRef(false);
  const rowsRef = useRef<BookingMessage[]>([]);
  const readSequence = useRef(0);
  const attempt = useRef<{ p_request_id: string; p_booking_id: string; p_body: string } | null>(null);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [hasOlder, setHasOlder] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [templateError, setTemplateError] = useState(false);
  const [templateReload, setTemplateReload] = useState(0);

  const load = useCallback(async (mode: 'initial' | 'new' | 'older' = 'new'): Promise<void> => {
    if (!active.current) return;
    if (loadingRef.current) { if (mode === 'new') refreshQueued.current = true; return; }
    loadingRef.current = true; setLoadError('');
    if (mode === 'older') { followLatest.current = false; setAtBottom(false); }
    if (mode !== 'new') setLoading(true);
    try {
      if (mode === 'new' && !rowsRef.current.length) mode = 'initial';
      let after = mode === 'new' ? Number(rowsRef.current[rowsRef.current.length - 1]?.sequence || 0) : null;
      const before = mode === 'older' ? Number(rowsRef.current[0]?.sequence || 1) : null;
      const incoming: BookingMessage[] = [];
      do {
        const { data, error } = await supabase.rpc('get_booking_messages', {
          p_booking_id: bookingId, p_before_sequence: before, p_after_sequence: after, p_limit: 50,
        });
        if (error) throw error;
        if (!active.current) return;
        const page = (data || []) as BookingMessage[];
        incoming.push(...page);
        if (mode !== 'new') { setHasOlder(page.length === 50); break; }
        if (page.length < 50) break;
        after = Number(page[page.length - 1].sequence);
      } while (active.current);
      if (!active.current) return;
      const merged = new Map((mode === 'initial' ? [] : rowsRef.current).map((message) => [message.id, message]));
      for (const message of incoming) merged.set(message.id, message);
      rowsRef.current = [...merged.values()].sort((a, b) => Number(a.sequence) - Number(b.sequence));
      setMessages(rowsRef.current);
    } catch {
      if (active.current) setLoadError('Messaggi non aggiornati. Riprova tra poco.');
    } finally {
      loadingRef.current = false;
      if (active.current) setLoading(false);
      if (active.current && refreshQueued.current) { refreshQueued.current = false; void load(); }
    }
  }, [bookingId]);

  useEffect(() => {
    active.current = true;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.showModal();
    void load('initial');
    const refresh = () => { if (document.visibilityState !== 'hidden') void load(); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => {
      active.current = false; window.clearInterval(timer);
      window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh);
      dialog.current?.close(); document.body.style.overflow = previousOverflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [load]);

  useEffect(() => {
    let live = true;
    if (!professional) return;
    setTemplateError(false);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('list_my_reply_templates');
        if (error) throw error;
        if (live) setTemplates((data || []) as ReplyTemplate[]);
      } catch { if (live) setTemplateError(true); }
    })();
    return () => { live = false; };
  }, [professional, templateReload]);

  useEffect(() => {
    // Mark only the highest message loaded into this visible dialog. New arrivals
    // after that sequence stay unread; a stale acknowledgement cannot move backwards.
    const highest = Number(messages[messages.length - 1]?.sequence || 0);
    if (!highest || !atBottom || highest <= readSequence.current || document.visibilityState === 'hidden' || loadError) return;
    let live = true;
    void (async () => {
      try {
        const { error } = await supabase.rpc('mark_booking_messages_read', { p_booking_id: bookingId, p_through_sequence: highest });
        if (live && !error) { readSequence.current = highest; notifyMessagesChanged(); }
      } catch { /* Leave the unread marker unchanged and retry after the next refresh. */ }
    })();
    return () => { live = false; };
  }, [messages, bookingId, loadError, atBottom]);

  useLayoutEffect(() => {
    if (followLatest.current && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);

  const close = () => {
    if (sendLock.current) return;
    if ((body.trim() || uncertain) && !window.confirm(uncertain
      ? 'Invio non confermato. Chiudendo dovrai controllare la conversazione prima di inviare di nuovo. Chiudere?'
      : 'Chiudere senza inviare il testo scritto?')) return;
    onClose();
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (sendLock.current || (!attempt.current && !body.trim())) return;
    const request = attempt.current || { p_request_id: crypto.randomUUID(), p_booking_id: bookingId, p_body: body.trim() };
    attempt.current = request; sendLock.current = true; setSending(true); setSendError('');
    try {
      const { data, error } = await supabase.rpc('send_booking_message', request);
      if (error) throw error;
      if (!data?.[0]) throw new Error('Missing confirmation');
      if (!active.current) return;
      attempt.current = null; setUncertain(false); setBody('');
      followLatest.current = true; setAtBottom(true);
      await load(); notifyMessagesChanged();
    } catch (error) {
      if (!active.current) return;
      const code = (error as { code?: string })?.code;
      const rejected = code === '22023' || code === '42501';
      if (rejected) attempt.current = null;
      setUncertain(!rejected);
      setSendError(rejected ? 'Messaggio non inviato. Controlla il testo e che la prenotazione sia ancora disponibile.'
        : 'Esito non confermato. Premi “Riprova lo stesso invio”: non verrà creata una copia del messaggio.');
    } finally { sendLock.current = false; if (active.current) setSending(false); }
  };

  return <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); close(); }} aria-labelledby="booking-conversation-title"
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl bg-white p-0 text-stone-900 backdrop:bg-stone-900/50">
    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 id="booking-conversation-title" className="text-xl font-bold">Messaggi della prenotazione</h2><p className="mt-1 text-xs text-stone-500">Riferimento {bookingId.slice(0, 8)} · Visibili a te e all’altro partecipante.</p></div>
        <button type="button" onClick={close} disabled={sending} aria-label="Chiudi messaggi" className="rounded-lg p-2"><X className="h-5 w-5" /></button></div>
      {requestNotes?.trim() && <details open className="mt-4 rounded-xl bg-stone-50 p-3 text-sm"><summary className="cursor-pointer font-semibold">Note della richiesta</summary><p className="mt-2 whitespace-pre-wrap break-words">{requestNotes}</p></details>}
      <div className="mt-4 flex items-center justify-between gap-2"><button type="button" disabled={loading} onClick={() => void load()} className="text-sm font-semibold underline">Aggiorna messaggi</button>{hasOlder && <button type="button" disabled={loading} onClick={() => void load('older')} className="text-sm font-semibold underline">Carica precedenti</button>}</div>
      {loading && <p role="status" className="mt-3 text-sm text-stone-500">Caricamento…</p>}
      {loadError && <p role="alert" className="mt-3 text-sm text-rose-700">{loadError}</p>}
      <ol ref={list} aria-label="Conversazione" onScroll={() => {
        const box = list.current;
        if (box) { const nearEnd = box.scrollHeight - box.scrollTop - box.clientHeight < 24; followLatest.current = nearEnd; setAtBottom(nearEnd); }
      }} className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => <li key={message.id} className={`rounded-2xl p-4 ${message.from_me ? 'ml-6 bg-emerald-50' : 'mr-6 bg-stone-100'}`}>
          <p className="text-xs font-bold">{message.from_me ? 'Tu' : message.sender_name}{message.is_automatic ? ' · Risposta automatica' : ''}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.body}</p>
          <time className="mt-2 block text-xs text-stone-500" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
        </li>)}
      </ol>
      {!loading && !loadError && !messages.length && <p className="my-4 text-sm text-stone-600">Nessun messaggio. Puoi scrivere qui per concordare i dettagli.</p>}
      <form onSubmit={(event) => void send(event)} className="mt-5 border-t border-stone-200 pt-4">
        {professional && <div className="mb-3">
          <label className="text-sm font-semibold">Usa un modello<select value="" disabled={sending || uncertain} onChange={(event) => {
            const template = templates.find((item) => item.id === event.target.value);
            if (template && (!body.trim() || window.confirm('Sostituire il testo scritto con questo modello?'))) setBody(template.body);
          }} className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"><option value="">Scegli un testo salvato…</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></label>
          {templateError ? <p className="mt-1 text-xs text-rose-700">Modelli non caricati. <button type="button" onClick={() => setTemplateReload((value) => value + 1)} className="underline">Riprova</button></p>
            : <p className="mt-1 text-xs text-stone-500">Gestisci i modelli in “Profilo e servizi”. Puoi modificare il testo prima dell’invio.</p>}
        </div>}
        <label className="text-sm font-semibold">Messaggio<textarea required maxLength={4000} rows={3} value={body} disabled={sending || uncertain} onChange={(event) => setBody(event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" placeholder="Scrivi al cliente o al professionista…" /></label>
        <p className="mt-1 text-right text-xs text-stone-500">{body.length}/4000</p>
        {sendError && <p role="alert" className="mt-2 text-sm text-rose-700">{sendError}</p>}
        <button type="submit" disabled={sending || (!uncertain && !body.trim())} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4" />{sending ? 'Invio…' : uncertain ? 'Riprova lo stesso invio' : 'Invia messaggio'}</button>
      </form>
    </div>
  </dialog>;
}
