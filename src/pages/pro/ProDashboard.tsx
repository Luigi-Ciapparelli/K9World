import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bell, Calendar, Check, Settings, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { acceptanceError } from '../../lib/professionalCalendar';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { ProLayout } from './ProLayout';

type DashboardBooking = {
  id: string;
  start_at: string;
  price: number | string | null;
  client_name: string;
  notes: string | null;
};
type BookingList = { rows: DashboardBooking[]; count: number; error: boolean };
const emptyList = (): BookingList => ({ rows: [], count: 0, error: false });

export function ProDashboard() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const userId = user?.id;
  const [pending, setPending] = useState<BookingList>(emptyList);
  const [today, setToday] = useState<BookingList>(emptyList);
  const [next, setNext] = useState<DashboardBooking | null>(null);
  const [nextError, setNextError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const mutationLock = useRef(false);
  const session = useRef(0);

  useEffect(() => {
    session.current += 1;
    setBusyId(null);
    setNotice(null);
    return () => { session.current += 1; };
  }, [userId]);

  useEffect(() => {
    let active = true;
    setPending(emptyList());
    setToday(emptyList());
    setNext(null);
    setNextError(false);
    setLoading(Boolean(userId));
    if (!userId) return;

    async function load() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      try {
        const results = await Promise.allSettled([
          supabase.rpc('get_professional_bookings', {}, { count: 'exact' })
            .eq('status', 'pending')
            .order('start_at', { ascending: true }).order('id').limit(5),
          supabase.rpc('get_professional_bookings', {}, { count: 'exact' })
            .eq('status', 'accepted')
            .gte('start_at', start.toISOString()).lt('start_at', end.toISOString())
            .order('start_at', { ascending: true }).order('id').limit(5),
          supabase.rpc('get_professional_bookings')
            .eq('status', 'accepted')
            .gt('start_at', now.toISOString())
            .order('start_at', { ascending: true }).order('id').limit(1),
        ]);
        if (!active) return;
        const [requests, schedule, upcoming] = results;
        for (const [result, setter] of [[requests, setPending], [schedule, setToday]] as const) {
          if (result.status === 'fulfilled' && !result.value.error && result.value.count !== null) {
            setter({ rows: (result.value.data || []) as DashboardBooking[], count: result.value.count, error: false });
          } else {
            setter({ ...emptyList(), error: true });
          }
        }
        if (upcoming.status === 'fulfilled' && !upcoming.value.error) {
          setNext((upcoming.value.data as DashboardBooking[] | null)?.[0] ?? null);
        } else {
          setNextError(true);
        }
      } catch {
        if (!active) return;
        setPending({ ...emptyList(), error: true });
        setToday({ ...emptyList(), error: true });
        setNextError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [userId, reloadKey]);

  const retry = () => setReloadKey((key) => key + 1);
  const updateStatus = async (id: string, status: 'accepted' | 'declined') => {
    if (!userId || mutationLock.current) return;
    mutationLock.current = true;
    const currentSession = session.current;
    setBusyId(id);
    setNotice(null);
    try {
      const { error } = await supabase.rpc('change_booking_status', {
        p_booking_id: id,
        p_new_status: status,
      });
      if (session.current !== currentSession) return;
      if (error) throw error;
      setNotice({ error: false, text: status === 'accepted' ? 'Richiesta accettata.' : 'Richiesta rifiutata.' });
      retry();
    } catch (error) {
      if (session.current !== currentSession) return;
      setNotice({ error: true, text: acceptanceError(error) });
      retry();
    } finally {
      mutationLock.current = false;
      if (session.current === currentSession) setBusyId(null);
    }
  };
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  return (
    <ProLayout active="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 text-[var(--pc-ink-950)]">
        <header className="mb-7">
          <p className="pc-kicker">La tua attività</p>
          <h1 className="pc-display text-4xl md:text-5xl font-semibold mt-2">{firstName ? `Ciao, ${firstName}.` : 'La tua area professionale'}</h1>
          <p className="text-[var(--pc-muted-600)] text-lg mt-3">Gestisci le richieste e organizza il lavoro con clienti e cani.</p>
        </header>

        {notice && <p role={notice.error ? 'alert' : 'status'} className="pc-card p-4 mb-5 text-sm">{notice.text}</p>}

        <div className="grid xl:grid-cols-2 gap-6">
          <section className="pc-card p-5 md:p-6" aria-labelledby="pro-requests-title" aria-busy={loading}>
            <p className="pc-kicker">Da gestire</p>
            <h2 id="pro-requests-title" className="pc-display text-2xl font-semibold mt-1">Richieste in attesa{!loading && !pending.error ? ` · ${pending.count}` : ''}</h2>
            <div className="mt-5">
              {loading ? <Loading /> : pending.error ? <LoadError onRetry={retry} /> : pending.rows.length === 0 ? (
                <p className="text-sm text-[var(--pc-muted-600)]">Non ci sono richieste in attesa.</p>
              ) : <div className="space-y-4">{pending.rows.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-[var(--pc-line)] p-4">
                  <BookingSummary booking={booking} />
                  <section className="mt-3 rounded-xl bg-stone-50 p-3" aria-label="Messaggio del richiedente">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-stone-600">Messaggio del richiedente</h3>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-900">{booking.notes?.trim() || 'Nessuna nota inserita.'}</p>
                  </section>
                  {new Date(booking.start_at).getTime() <= Date.now() && <p className="text-sm text-[var(--pc-muted-600)] mt-2">La data richiesta è trascorsa: controlla i dettagli prima di decidere.</p>}
                  <button type="button" onClick={() => navigate('/pro/bookings')} className="mt-3 text-sm font-bold text-[var(--pc-forest-700)] underline">Consulta dettagli</button>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button type="button" disabled={busyId !== null} onClick={() => void updateStatus(booking.id, 'accepted')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--pc-forest-900)] text-white px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-wait"><Check className="w-4 h-4" />{busyId === booking.id ? 'Aggiornamento…' : 'Accetta'}</button>
                    <button type="button" disabled={busyId !== null} onClick={() => void updateStatus(booking.id, 'declined')} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--pc-line)] px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-wait"><X className="w-4 h-4" />Rifiuta</button>
                  </div>
                </article>
              ))}</div>}
            </div>
            {!loading && !pending.error && pending.count > pending.rows.length && <p className="mt-4 text-sm text-[var(--pc-muted-600)]">Mostrate {pending.rows.length} richieste su {pending.count}, ordinate per data dell’appuntamento.</p>}
            <SectionLink onClick={() => navigate('/pro/bookings')}>Vedi tutte le richieste</SectionLink>
          </section>

          <section className="pc-card p-5 md:p-6" aria-labelledby="pro-today-title" aria-busy={loading}>
            <p className="pc-kicker">Agenda di oggi</p>
            <h2 id="pro-today-title" className="pc-display text-2xl font-semibold mt-1">Appuntamenti accettati{!loading && !today.error ? ` · ${today.count}` : ''}</h2>
            <p className="mt-2 text-sm text-[var(--pc-muted-600)]">Orari nel fuso del tuo dispositivo. Appuntamenti con inizio oggi.</p>
            <div className="mt-5">
              {loading ? <Loading /> : today.error ? <LoadError onRetry={retry} /> : today.rows.length === 0 ? <p className="text-sm text-[var(--pc-muted-600)]">Nessun appuntamento accettato con inizio oggi.</p> : (
                <div className="divide-y divide-[var(--pc-line)]">{today.rows.map((booking) => <div key={booking.id} className="py-4 first:pt-0"><BookingSummary booking={booking} /></div>)}</div>
              )}
            </div>
            {!loading && !today.error && today.count > today.rows.length && <p className="mt-4 text-sm text-[var(--pc-muted-600)]">Mostrati {today.rows.length} appuntamenti su {today.count}.</p>}
            <SectionLink onClick={() => navigate('/pro/bookings')}>Apri prenotazioni</SectionLink>
          </section>
        </div>

        <section className="pc-card p-5 md:p-6 mt-6" aria-labelledby="pro-next-title" aria-busy={loading}>
          <p className="pc-kicker">In programma</p>
          <h2 id="pro-next-title" className="pc-display text-2xl font-semibold mt-1">Prossimo impegno</h2>
          <div className="mt-4">{loading ? <Loading /> : nextError ? <LoadError onRetry={retry} /> : next ? <BookingSummary booking={next} /> : <p className="text-sm text-[var(--pc-muted-600)]">Non ci sono appuntamenti accettati con inizio futuro.</p>}</div>
          <SectionLink onClick={() => navigate('/pro/bookings')}>Consulta prenotazioni</SectionLink>
        </section>
        <section aria-label="Strumenti professionali" className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-7">
          <QuickCard icon={<Bell className="w-5 h-5" />} label="Richieste e prenotazioni" description="Consulta dettagli e gestisci le richieste." onClick={() => navigate('/pro/bookings')} />
          <QuickCard icon={<Users className="w-5 h-5" />} label="Clienti e cani" description="Apri la gestione clienti e le informazioni disponibili." onClick={() => navigate('/pro/crm')} />
          <QuickCard icon={<Calendar className="w-5 h-5" />} label="Calendario e disponibilità" description="Impegni per servizio, colori e periodi di assenza." onClick={() => navigate('/pro/calendar')} />
          <QuickCard icon={<Settings className="w-5 h-5" />} label="Profilo e servizi" description="Aggiorna presentazione e servizi offerti." onClick={() => navigate('/pro/settings')} />
        </section>

      </div>
    </ProLayout>
  );
}

function BookingSummary({ booking }: { booking: DashboardBooking }) {
  const price = booking.price === null ? NaN : Number(booking.price);
  const date = new Date(booking.start_at);
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p className="font-bold mb-1">{booking.client_name || 'Nome non indicato'}</p>
      <p className="font-bold">{Number.isNaN(date.getTime()) ? 'Data da controllare' : date.toLocaleString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <p className="mt-1 text-xs text-[var(--pc-muted-600)]">Riferimento {booking.id.slice(0, 8)}</p>
    </div>
    <p className="text-sm font-semibold">{Number.isFinite(price) && price > 0 ? price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : 'Prezzo da confermare'}</p>
    </div>
    <div className="mt-3 rounded-xl bg-[var(--pc-bone-50)] p-3">
      <p className="text-sm font-bold">Note della richiesta</p>
      <p className="text-sm whitespace-pre-wrap break-words mt-1">{booking.notes?.trim() || 'Nessuna nota inserita.'}</p>
    </div>
  </div>;
}
function Loading() { return <p role="status" className="text-sm text-[var(--pc-muted-600)]">Caricamento…</p>; }
function LoadError({ onRetry }: { onRetry: () => void }) {
  return <div role="alert"><p className="text-sm">Non è stato possibile caricare questi dati.</p><button type="button" onClick={onRetry} className="mt-3 text-sm font-bold text-[var(--pc-forest-700)] underline">Riprova</button></div>;
}
function SectionLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--pc-forest-700)]">{children}<ArrowRight className="w-4 h-4" /></button>;
}
function QuickCard({ icon, label, description, onClick }: { icon: ReactNode; label: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="pc-card p-5 text-left hover:border-[var(--pc-forest-700)] transition">
    <span className="w-10 h-10 rounded-full bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)] flex items-center justify-center">{icon}</span>
    <span className="block font-bold mt-4">{label}</span>
    <span className="block text-sm leading-6 text-[var(--pc-muted-600)] mt-1">{description}</span>
  </button>;
}
