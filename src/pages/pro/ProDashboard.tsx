import { BookingDetails } from '../../components/BookingDetails';
import { useBookingDetails } from '../../lib/useBookingDetails';
import { bookingDateTime, bookingPrice, bookingTodayBounds, type BookingDetailsRow } from '../../lib/bookingDetails';
import { ClientPortrait, useClientPortraits } from '../../components/ClientPortrait';
import { ServiceReviewNotice } from '../../components/ServiceReviews';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bell, Calendar, CalendarPlus, Check, Settings, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useManualAppointments } from '../../lib/manualAppointments';
import { addDays, calendarTime, dayLabel, romeDay, acceptanceError } from '../../lib/professionalCalendar';
import { BookingConversation } from '../../components/BookingConversation';
import { BookingMessageInbox } from '../../components/BookingMessageInbox';
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
  const todayKey = romeDay();
  const manual = useManualAppointments(profile?.role === 'professional' ? userId : undefined,todayKey,addDays(todayKey,1),reloadKey);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const details = useBookingDetails([...pending.rows, ...today.rows, ...(next ? [next] : [])].map(booking => booking.id), reloadKey);
  const portraits = useClientPortraits([], [...pending.rows, ...today.rows, ...(next ? [next] : [])].map(booking => booking.id), reloadKey);
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
      const { from, until } = bookingTodayBounds(now);
      try {
        const results = await Promise.allSettled([
          supabase.rpc('get_professional_bookings', {}, { count: 'exact' })
            .eq('status', 'pending')
            .order('start_at', { ascending: true }).order('id').limit(5),
          supabase.rpc('get_professional_bookings', {}, { count: 'exact' })
            .eq('status', 'accepted')
            .gte('start_at', from).lt('start_at', until)
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
    if (!userId || mutationLock.current || !details.rows[id]) return;
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
      <div className="pg-desk max-w-7xl mx-auto px-4 sm:px-6 py-6 text-[var(--pc-ink-950)]">
        <header className="pg-daybreak"><div><p className="pg-day-stamp"><Calendar size={15} /> {dayLabel(todayKey,true)}</p>
          <h1>{firstName ? `Ciao, ${firstName}.` : 'La tua giornata'}</h1><p>Gli appuntamenti di oggi e le richieste da gestire.</p></div>
          <div className="pg-day-actions"><button className="pg-agenda-cta" onClick={()=>navigate('/pro/calendar?new=1')}><CalendarPlus size={19} /> Nuovo appuntamento</button>
          <button className="pg-day-link" onClick={()=>navigate('/pro/calendar')}>Apri calendario</button></div></header>
        {notice && <p role={notice.error ? 'alert' : 'status'} className="pc-card p-4 mb-5 text-sm">{notice.text}</p>}


        <div className="pg-desk-panels">
          <section className="pc-card p-5 md:p-6" aria-labelledby="pro-requests-title" aria-busy={loading}>
            <p className="pc-kicker">Da gestire</p>
            <h2 id="pro-requests-title" className="pc-display text-2xl font-semibold mt-1">Richieste in attesa{!loading && !pending.error ? ` · ${pending.count}` : ''}</h2>
            <div className="mt-5">
              {loading ? <Loading /> : pending.error ? <LoadError onRetry={retry} /> : pending.rows.length === 0 ? (
                <p className="text-sm text-[var(--pc-muted-600)]">Non ci sono richieste in attesa.</p>
              ) : <div className="space-y-4">{pending.rows.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-[var(--pc-line)] p-4">
                  <BookingSummary booking={booking} portrait={portraits[booking.id]} details={details.rows[booking.id]} loading={details.loading} onRetry={details.retry} />
                  {new Date(booking.start_at).getTime() <= Date.now() && <p className="text-sm text-[var(--pc-muted-600)] mt-2">La data richiesta è trascorsa: controlla i dettagli prima di decidere.</p>}
                  <button type="button" onClick={() => navigate('/pro/bookings')} className="mt-3 text-sm font-bold text-[var(--pc-forest-700)] underline">Consulta dettagli</button>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <BookingConversation bookingId={booking.id} professional requestNotes={booking.notes} />
                    <button type="button" disabled={busyId !== null || !details.rows[booking.id]} onClick={() => void updateStatus(booking.id, 'accepted')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--pc-forest-900)] text-white px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-wait"><Check className="w-4 h-4" />{busyId === booking.id ? 'Aggiornamento…' : 'Accetta'}</button>
                    <button type="button" disabled={busyId !== null || !details.rows[booking.id]} onClick={() => void updateStatus(booking.id, 'declined')} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--pc-line)] px-4 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-wait"><X className="w-4 h-4" />Rifiuta</button>
                  </div>
                </article>
              ))}</div>}
            </div>
            {!loading && !pending.error && pending.count > pending.rows.length && <p className="mt-4 text-sm text-[var(--pc-muted-600)]">Mostrate {pending.rows.length} richieste su {pending.count}, ordinate per data dell’appuntamento.</p>}
            <SectionLink onClick={() => navigate('/pro/bookings')}>Vedi tutte le richieste</SectionLink>
          </section>

          <section className="pc-card p-5 md:p-6" aria-labelledby="pro-today-title" aria-busy={loading}>
            <p className="pc-kicker">Agenda di oggi</p>
            <h2 id="pro-today-title" className="pc-display text-2xl font-semibold mt-1">I tuoi appuntamenti</h2>
            <p className="mt-2 text-sm text-[var(--pc-muted-600)]">Prenotazioni confermate e appuntamenti segnati da te, in ora italiana.</p>
            <div className="mt-5">
              {loading && <Loading />}{today.error && <LoadError onRetry={retry} />}
              {manual.loading && <p role="status" className="text-sm">Caricamento agenda privata…</p>}
              {manual.error && <p className="pg-agenda-warning" role="alert">Appuntamenti manuali non caricati. <button onClick={retry}>Riprova</button></p>}
              {!loading && !manual.loading && !today.error && !manual.error && !today.count && !manual.rows.length && <p className="text-sm text-[var(--pc-muted-600)]">Nessun appuntamento in agenda per oggi.</p>}
              {[...today.rows.map(b=>({kind:'online' as const, b, start:b.start_at})),...manual.rows.map(a=>({kind:'manual' as const,a,start:a.start_at}))]
                .sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)).slice(0,5).map(item=>item.kind==='online'
                  ? <div key={'online-'+item.b.id} className="py-4"><BookingSummary booking={item.b} portrait={portraits[item.b.id]} details={details.rows[item.b.id]} loading={details.loading} onRetry={details.retry} /></div>
                  : <div className="pg-desk-manual" key={'manual-'+item.a.id}><time>{romeDay(item.start)<todayKey?'In corso':calendarTime(item.start)}</time><span><strong>{item.a.service_name}{item.a.dog_label ? ' · '+item.a.dog_label : ''}</strong><small>Segnato in agenda{item.a.instructor_name ? ' · '+item.a.instructor_name : ''}</small></span></div>)}
              {!loading && !manual.loading && !today.error && !manual.error && today.count+manual.rows.length>5 && <p className="mt-3 text-sm">Altri {today.count+manual.rows.length-5} impegni in calendario.</p>}
            </div>
            <SectionLink onClick={() => navigate('/pro/calendar')}>Apri l’agenda di oggi</SectionLink>
          </section>
        </div>
        <BookingMessageInbox professional />
        <ServiceReviewNotice professional />

        <section className="pc-card p-5 md:p-6 mt-6" aria-labelledby="pro-next-title" aria-busy={loading}>
          <p className="pc-kicker">In programma</p>
          <h2 id="pro-next-title" className="pc-display text-2xl font-semibold mt-1">Prossima prenotazione online</h2>
          <div className="mt-4">{loading ? <Loading /> : nextError ? <LoadError onRetry={retry} /> : next ? <BookingSummary booking={next} portrait={portraits[next.id]} details={details.rows[next.id]} loading={details.loading} onRetry={details.retry} /> : <p className="text-sm text-[var(--pc-muted-600)]">Nessuna prenotazione online accettata con inizio futuro.</p>}</div>
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

function BookingSummary({ booking, portrait, details, loading, onRetry }: { booking: DashboardBooking; portrait?: string; details?: BookingDetailsRow; loading: boolean; onRetry: () => void }) {
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p className="font-bold mb-1 flex items-center gap-3"><ClientPortrait src={portrait} name={booking.client_name} />{booking.client_name || 'Nome non indicato'}</p>
      <p className="font-bold">{bookingDateTime(booking.start_at)}</p>
      <p className="mt-1 text-xs text-[var(--pc-muted-600)]">Riferimento {booking.id.slice(0, 8)}</p>
    </div>
    <p className="text-sm font-semibold">{bookingPrice(booking.price)}</p>
    </div>
    <BookingDetails row={details} loading={loading} onRetry={onRetry} />
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
