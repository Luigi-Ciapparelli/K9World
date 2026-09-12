import { useEffect, useRef, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';
import { StatusBadge } from '../owner/OwnerDashboard';

type BookingRow = {
  id: string; start_at: string; status: string;
  price: number | string | null; notes: string | null; client_name: string;
};
const statuses = [
  ['all', 'Tutte'], ['pending', 'In attesa'], ['accepted', 'Accettata'],
  ['completed', 'Completata'], ['cancelled', 'Annullata'], ['declined', 'Rifiutata'],
] as const;
const pageSize = 20;

export function ProBookings() {
  const { user } = useAuth();
  const userId = user?.id;
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const lock = useRef(false);
  const session = useRef(0);

  useEffect(() => {
    session.current += 1;
    setNotice(null);
    setBusyId(null);
    return () => { session.current += 1; };
  }, [userId]);

  useEffect(() => {
    let active = true;
    setLoading(Boolean(userId));
    setLoadError(false);
    setBookings([]);
    setCount(0);
    if (!userId) return;
    (async () => {
      try {
        let query = supabase.rpc('get_professional_bookings', {}, { count: 'exact' });
        if (filter !== 'all') query = query.eq('status', filter);
        if (search) query = query.ilike('client_name', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
        const { data, error, count: total } = await query
          .order('request_priority', { ascending: true })
          .order('start_at', { ascending: true }).order('id', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (!active) return;
        if (error || total === null) throw error || new Error('Missing count');
        if (page > 0 && page * pageSize >= total) {
          setPage(Math.max(0, Math.ceil(total / pageSize) - 1));
          return;
        }
        setBookings((data || []) as BookingRow[]);
        setCount(total);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId, filter, search, page, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);
  const updateStatus = async (id: string, status: 'accepted' | 'declined' | 'completed') => {
    if (!userId || lock.current) return;
    lock.current = true;
    const currentSession = session.current;
    setBusyId(id);
    setNotice(null);
    try {
      const { error } = await supabase.rpc('change_booking_status', { p_booking_id: id, p_new_status: status });
      if (currentSession !== session.current) return;
      if (error) throw error;
      setNotice({ error: false, text: status === 'accepted' ? 'Richiesta accettata.' : status === 'declined' ? 'Richiesta rifiutata.' : 'Prenotazione completata.' });
      reload();
    } catch {
      if (currentSession !== session.current) return;
      setNotice({ error: true, text: 'Non è stato possibile confermare l’esito. Controlla lo stato aggiornato prima di riprovare.' });
      reload();
    } finally {
      lock.current = false;
      if (currentSession === session.current) setBusyId(null);
    }
  };

  return (
    <ProLayout active="bookings">
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto text-[var(--pc-ink-950)]">
        <p className="pc-kicker">La tua attività</p>
        <h1 className="pc-display text-3xl sm:text-4xl font-semibold mt-2">Richieste e prenotazioni</h1>
        <p className="text-[var(--pc-muted-600)] mt-3 mb-6">Prima le richieste in attesa, poi gli appuntamenti accettati e lo storico. In ogni gruppo, le date più vicine all’inizio dell’elenco.</p>

        <div aria-label="Filtra per stato" className="flex flex-wrap gap-2 mb-4">
          {statuses.map(([value, label]) => (
            <button type="button" key={value} aria-pressed={filter === value}
              onClick={() => { setFilter(value); setPage(0); }}
              className={`px-4 py-2 rounded-full text-sm border ${filter === value ? 'border-[var(--pc-forest-700)] bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)] font-bold' : 'border-[var(--pc-line)] bg-[var(--pc-paper)]'}`}>{label}</button>
          ))}
        </div>
        <form className="flex flex-wrap items-end gap-2 mb-5" onSubmit={(event) => { event.preventDefault(); setSearch(q.trim()); setPage(0); }}>
          <div className="w-full sm:w-auto sm:flex-1 max-w-md">
            <label htmlFor="client-search" className="block text-sm font-semibold mb-1">Nome del richiedente</label>
            <div className="relative">
              <SearchIcon aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input id="client-search" value={q} onChange={(event) => setQ(event.target.value)} className="w-full pl-10 pr-3 py-2 border border-[var(--pc-line)] rounded-xl text-sm" />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 rounded-full bg-[var(--pc-forest-900)] text-white text-sm font-bold">Cerca</button>
          {(q || search) && <button type="button" onClick={() => { setQ(''); setSearch(''); setPage(0); }} className="px-3 py-2 text-sm underline">Cancella ricerca</button>}
        </form>

        {notice && <p role={notice.error ? 'alert' : 'status'} className="pc-card p-4 mb-4 text-sm">{notice.text}</p>}
        <section aria-label="Elenco prenotazioni" aria-busy={loading} className="space-y-4">
          {loading ? <p role="status" className="pc-card p-6">Caricamento…</p> : loadError ? (
            <div role="alert" className="pc-card p-6"><p>Non è stato possibile caricare le prenotazioni.</p><button type="button" onClick={reload} className="mt-3 font-bold underline">Riprova</button></div>
          ) : bookings.length === 0 ? <p className="pc-card p-6 text-[var(--pc-muted-600)]">Nessuna prenotazione corrisponde ai filtri selezionati.</p> : bookings.map((booking) => (
            <article key={booking.id} className="pc-card p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg break-words">{booking.client_name || 'Nome non indicato'}</h2>
                  <p className="text-sm mt-1">{new Date(booking.start_at).toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-[var(--pc-muted-600)] mt-1">Riferimento {booking.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-start gap-3"><StatusBadge status={booking.status} /><span className="text-sm font-semibold">{formatPrice(booking.price)}</span></div>
              </div>
              <div className="mt-4 rounded-xl bg-[var(--pc-bone-50)] p-4">
                <h3 className="text-sm font-bold">Note della richiesta</h3>
                <p className="whitespace-pre-wrap break-words text-sm mt-1">{booking.notes?.trim() || 'Nessuna nota inserita.'}</p>
              </div>
              {busyId === booking.id && <p role="status" className="text-sm mt-3">Aggiornamento…</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                {booking.status === 'pending' && <>
                  <Action disabled={busyId !== null} onClick={() => void updateStatus(booking.id, 'accepted')}>Accetta</Action>
                  <Action disabled={busyId !== null} onClick={() => void updateStatus(booking.id, 'declined')}>Rifiuta</Action>
                </>}
                {booking.status === 'accepted' && <Action disabled={busyId !== null} onClick={() => void updateStatus(booking.id, 'completed')}>Segna completata</Action>}
              </div>
            </article>
          ))}
        </section>
        {!loading && !loadError && count > 0 && <nav aria-label="Pagine prenotazioni" className="flex flex-wrap items-center gap-4 mt-6 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="underline disabled:opacity-40">Precedente</button>
          <span>Pagina {page + 1} di {Math.ceil(count / pageSize)} · {count} risultati</span>
          <button type="button" disabled={(page + 1) * pageSize >= count} onClick={() => setPage((value) => value + 1)} className="underline disabled:opacity-40">Successiva</button>
        </nav>}
      </div>
    </ProLayout>
  );
}
function formatPrice(value: number | string | null) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : 'Prezzo da confermare';
}
function Action({ children, disabled, onClick }: { children: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="px-4 py-2 rounded-full border border-[var(--pc-forest-700)] text-[var(--pc-forest-900)] font-bold text-sm disabled:opacity-50">{children}</button>;
}
