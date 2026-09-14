import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { messagesChanged, notifyMessagesChanged, messageButtonStyle } from '../lib/bookingMessages';
import { BookingConversationDialog } from './BookingConversation';

type InboxRow = { booking_id: string; peer_name: string; notes: string | null; start_at: string; unread_count: number; total_count: number };

export function BookingMessageInbox({ professional = false }: { professional?: boolean }) {
  const { user } = useAuth();
  return user ? <InboxContent key={user.id} professional={professional} /> : null;
}

function InboxContent({ professional }: { professional: boolean }) {
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [open, setOpen] = useState<InboxRow | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    setLoading(true);
    const load = async () => {
      if (!active || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const { data, error: failure } = await supabase.rpc('get_my_booking_message_inbox', { p_limit: 20, p_offset: page * 20 });
        if (failure) throw failure;
        if (!active) return;
        if (!data?.length && page > 0) { setPage(0); return; }
        setRows((data || []) as InboxRow[]); setError(false);
      } catch { if (active) setError(true); }
      finally { inFlight = false; if (active) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    window.addEventListener('focus', load); window.addEventListener(messagesChanged, load); document.addEventListener('visibilitychange', load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', load); window.removeEventListener(messagesChanged, load); document.removeEventListener('visibilitychange', load); };
  }, [page, revision]);
  return <section aria-label="Messaggi da leggere" className="mb-6 rounded-2xl border border-emerald-200 bg-white p-5 text-stone-900">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold"><MessageCircle className="mr-2 inline h-5 w-5" />Messaggi da leggere</h2><button type="button" disabled={loading} onClick={() => setRevision((value) => value + 1)} className="text-sm font-semibold underline">Aggiorna</button></div>
    {loading ? <p role="status" className="mt-3 text-sm text-stone-500">Caricamento…</p> : error ? <p role="alert" className="mt-3 text-sm text-rose-700">Non è stato possibile aggiornare i messaggi.</p>
      : !rows.length ? <p className="mt-3 text-sm text-stone-500">Non ci sono nuovi messaggi.</p> : <div className="mt-3 space-y-3">{rows.map((row) => <div key={row.booking_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3">
        <div><p className="font-semibold">{row.peer_name}</p><p className="text-xs text-stone-600">Prenotazione del {new Date(row.start_at).toLocaleDateString('it-IT')} · {row.unread_count} nuovi messaggi</p></div>
        <button type="button" onClick={() => setOpen(row)} className={messageButtonStyle}>Leggi e rispondi</button>
      </div>)}</div>}
    {!loading && !error && (page > 0 || Number(rows[0]?.total_count) > 20) && <div className="mt-3 flex items-center gap-4 text-sm"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="underline disabled:opacity-50">Precedenti</button><span>Pagina {page + 1}</span><button type="button" disabled={(page + 1) * 20 >= Number(rows[0]?.total_count)} onClick={() => setPage((value) => value + 1)} className="underline disabled:opacity-50">Successivi</button></div>}
    {open && <BookingConversationDialog key={open.booking_id} bookingId={open.booking_id} professional={professional} requestNotes={open.notes} onClose={() => { setOpen(null); notifyMessagesChanged(); }} />}
  </section>;
}
