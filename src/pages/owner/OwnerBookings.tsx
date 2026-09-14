import { useCallback, useEffect, useRef, useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from './OwnerDashboard';
import { BookingConversation } from '../../components/BookingConversation';
import { useBookingMessageSummaries } from '../../lib/bookingMessages';

export function OwnerBookings() {
  const { user } = useAuth();
  return user ? <OwnerBookingsBody key={user.id} /> : null;
}

function OwnerBookingsBody() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviewing, setReviewing] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const loadGeneration = useRef(0);
  const userId = user?.id;
  const summaries = useBookingMessageSummaries(bookings.map((booking) => booking.id));

  const load = useCallback(async () => {
    if (!userId) return;
    const generation = ++loadGeneration.current;
    setLoading(true); setLoadError(false);
    try {
      const { data, error, count: total } = await supabase.rpc('get_my_owner_bookings', {}, { count: 'exact' })
        .order('start_at', { ascending: false }).order('id', { ascending: false }).range(page * 20, (page + 1) * 20 - 1);
      if (generation !== loadGeneration.current) return;
      if (error || total === null) throw error || new Error('Missing total');
      if (page > 0 && page * 20 >= total) { setPage(Math.max(0, Math.ceil(total / 20) - 1)); return; }
      setBookings(data || []); setCount(total);
    } catch { if (generation === loadGeneration.current) setLoadError(true); }
    finally { if (generation === loadGeneration.current) setLoading(false); }
  }, [userId, page]);
  useEffect(() => { void load(); return () => { loadGeneration.current += 1; }; }, [load, reload]);

  const cancel = async (id: string) => {
    if (!confirm('Annullare questa richiesta di prenotazione?')) return;
    const { error } = await supabase.rpc('change_booking_status', {
      p_booking_id: id,
      p_new_status: 'cancelled',
    });

    if (error) {
      alert(error.message);
      return;
    }

    setReload((value) => value + 1);
  };

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold text-stone-900">Prenotazioni e messaggi</h1><button type="button" disabled={loading} onClick={() => void load()} className="text-sm font-semibold underline">Aggiorna</button></div>
        {loading ? <p role="status">Caricamento prenotazioni…</p> : loadError ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-5">Prenotazioni non caricate. <button type="button" onClick={() => void load()} className="font-semibold underline">Riprova</button></div> : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-600">Non hai ancora prenotazioni.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <div className="font-bold">{b.professional_name}</div>
                  <div className="text-sm text-stone-700">{b.service_name}</div>
                  <div className="text-sm text-stone-600">{new Date(b.start_at).toLocaleString('it-IT')}</div>
                  <div className="text-xs text-stone-500 mt-1">{Number(b.price || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-600">{b.notes || 'Nessuna nota alla richiesta.'}</p>
                </div>
                <StatusBadge status={b.status} />
                <div className="flex flex-wrap gap-2">
                  <BookingConversation bookingId={b.id} summary={summaries[b.id]} requestNotes={b.notes} />
                  {b.status === 'pending' && <button onClick={() => cancel(b.id)} className="text-xs text-rose-600 font-semibold">Annulla richiesta</button>}
                  {b.status === 'completed' && <button onClick={() => setReviewing(b)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"><Star className="w-3 h-3" /> Lascia una recensione</button>}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !loadError && count > 20 && <nav aria-label="Pagine prenotazioni" className="mt-6 flex items-center gap-4 text-sm"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="underline disabled:opacity-50">Precedenti</button><span>Pagina {page + 1} di {Math.ceil(count / 20)}</span><button type="button" disabled={(page + 1) * 20 >= count} onClick={() => setPage((value) => value + 1)} className="underline disabled:opacity-50">Successive</button></nav>}
      </div>
      {reviewing && <ReviewModal booking={reviewing} onClose={() => { setReviewing(null); setReload((value) => value + 1); }} />}
    </div>
  );
}

function ReviewModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = async () => {
    const { error } = await supabase.rpc('submit_review', {
      p_booking_id: booking.id,
      p_rating: rating,
      p_comment: comment,
    });

    if (error) {
      alert(error.message);
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Lascia una recensione</h2><button onClick={onClose} aria-label="Chiudi recensione"><X className="w-5 h-5" /></button></div>
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)}><Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} /></button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Racconta la tua esperienza…" rows={4} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
        <button onClick={submit} className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold">Invia recensione</button>
      </div>
    </div>
  );
}
