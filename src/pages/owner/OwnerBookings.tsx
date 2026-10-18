import { BookingDetails } from '../../components/BookingDetails';
import { useBookingDetails } from '../../lib/useBookingDetails';
import { bookingDateTime, bookingPrice } from '../../lib/bookingDetails';
import { BookingInstructor, InstructorLoadError } from '../../components/BookingInstructor';
import { useBookingInstructors } from '../../lib/centreTeam';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { ServiceReviewPanel, ReviewEditor } from '../../components/ServiceReviews';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from './OwnerDashboard';
import { BookingConversation } from '../../components/BookingConversation';
import { useBookingMessageSummaries } from '../../lib/bookingMessages';

type OwnerBooking = { id: string; professional_name: string; start_at: string; status: string; price: number | string | null; notes: string | null };

export function OwnerBookings() {
  const { user } = useAuth();
  return user ? <OwnerBookingsBody key={user.id} /> : null;
}

function OwnerBookingsBody() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [reviewing, setReviewing] = useState<OwnerBooking | null>(null);
  const [legacyReviewIds, setLegacyReviewIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const loadGeneration = useRef(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const details = useBookingDetails(bookings.map(booking => booking.id), reload);
  const userId = user?.id;
  const instructors = useBookingInstructors(bookings.map(b => b.id), reload);
  const summaries = useBookingMessageSummaries(bookings.map((booking) => booking.id));

  const load = useCallback(async () => {
    if (!userId) return;
    const generation = ++loadGeneration.current;
    setLoading(true); setLoadError(false); setLegacyReviewIds([]);
    try {
      const { data, error, count: total } = await supabase.rpc('get_my_owner_bookings', {}, { count: 'exact' })
        .order('start_at', { ascending: false }).order('id', { ascending: false }).range(page * 20, (page + 1) * 20 - 1);
      if (generation !== loadGeneration.current) return;
      if (error || total === null) throw error || new Error('Missing total');
      if (page > 0 && page * 20 >= total) { setPage(Math.max(0, Math.ceil(total / 20) - 1)); return; }
      setBookings(data || []); setCount(total);
      const reviews = await supabase.rpc('get_legacy_review_bookings', { p_booking_ids: (data || []).map((booking: { id: string }) => booking.id) });
      if (generation === loadGeneration.current && !reviews.error) setLegacyReviewIds(reviews.data || []);
    } catch { if (generation === loadGeneration.current) setLoadError(true); }
    finally { if (generation === loadGeneration.current) setLoading(false); }
  }, [userId, page]);
  useEffect(() => { void load(); return () => { loadGeneration.current += 1; }; }, [load, reload]);

  const cancel = async (id: string) => {
    if (lock.current || !confirm('Annullare questa richiesta di prenotazione?')) return;
    lock.current = true; setBusyId(id); setNotice(null);
    try {
      const { error } = await supabase.rpc('change_booking_status', { p_booking_id: id, p_new_status: 'cancelled' });
      if (error) throw error;
      if (mounted.current) setNotice({ error: false, text: 'Richiesta annullata.' });
    } catch {
      if (mounted.current) setNotice({ error: true, text: 'Esito non confermato. Controlla lo stato aggiornato prima di riprovare: la richiesta potrebbe essere già annullata o accettata.' });
    } finally {
      lock.current = false;
      if (mounted.current) { setBusyId(null); setReload(value => value + 1); }
    }
  };

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-28">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold text-stone-900">Prenotazioni e messaggi</h1><button type="button" disabled={loading || busyId !== null} onClick={() => setReload(value => value + 1)} className="text-sm font-semibold underline">Aggiorna</button></div>
        <p className="mb-5 text-sm text-stone-600">Orari italiani, come nel calendario del professionista.</p>
        {notice && <p role={notice.error ? 'alert' : 'status'} className="mb-4 rounded-xl border border-stone-200 bg-white p-4 text-sm">{notice.text}</p>}
        <ServiceReviewPanel refresh={reload} />
        {instructors.error && <InstructorLoadError retry={instructors.reload} />}
        {loading ? <p role="status">Caricamento prenotazioni…</p> : loadError ? <div role="alert" className="rounded-xl border border-rose-200 bg-white p-5">Prenotazioni non caricate. <button type="button" onClick={() => void load()} className="font-semibold underline">Riprova</button></div> : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-600">Non hai ancora prenotazioni.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <article key={b.id} className="bg-white rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{b.professional_name}</div>
                  <div className="text-sm text-stone-600">{bookingDateTime(b.start_at)}</div>
                  <div className="text-xs text-stone-500 mt-1">{bookingPrice(b.price)}</div>
                  <BookingDetails row={details.rows[b.id]} loading={details.loading} onRetry={details.retry} />
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-stone-600">{b.notes || 'Nessuna nota alla richiesta.'}</p>
                  <BookingInstructor row={instructors.rows[b.id]} onSaved={instructors.reload} />
                </div>
                <StatusBadge status={b.status} />
                <div className="flex flex-wrap gap-2">
                  <BookingConversation bookingId={b.id} summary={summaries[b.id]} requestNotes={b.notes} />
                  {b.status === 'pending' && <button type="button" disabled={busyId !== null} onClick={() => void cancel(b.id)} className="text-xs text-rose-600 font-semibold disabled:opacity-50">{busyId === b.id ? 'Annullamento…' : 'Annulla richiesta'}</button>}
                  {legacyReviewIds.includes(b.id) && <button onClick={() => setReviewing(b)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"><Star className="w-3 h-3" /> Lascia una recensione</button>}
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading && !loadError && count > 20 && <nav aria-label="Pagine prenotazioni" className="mt-6 flex items-center gap-4 text-sm"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="underline disabled:opacity-50">Precedenti</button><span>Pagina {page + 1} di {Math.ceil(count / 20)}</span><button type="button" disabled={(page + 1) * 20 >= count} onClick={() => setPage((value) => value + 1)} className="underline disabled:opacity-50">Successive</button></nav>}
      </div>
      {reviewing && <ReviewEditor legacyBooking={reviewing} onClose={() => setReviewing(null)} onSaved={() => { setReviewing(null); setReload(value => value + 1); }} />}
    </div>
  );
}
