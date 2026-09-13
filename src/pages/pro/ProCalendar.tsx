import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { supabase } from '../../lib/supabase';
import { ProLayout } from './ProLayout';
import { StatusBadge } from '../owner/OwnerDashboard';
import {
  acceptanceError, addDays, bookingOnDay, calendarDateTime, calendarTime, dayLabel,
  monthDays, romeDay, serviceColor, shiftMonth, type CalendarBooking, type Schedule,
} from '../../lib/professionalCalendar';

const button = 'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-50';
const primary = 'rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const input = 'mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900';

export function ProCalendar() {
  const { user, profile } = useAuth();
  return <ProLayout active="calendar">{user && profile?.role === 'professional'
    ? <CalendarContent key={user.id} />
    : <p className="p-6">Accedi con il tuo account professionista per consultare il calendario.</p>}
  </ProLayout>;
}

function CalendarContent() {
  const { navigate } = useRouter();
  const today = romeDay();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [service, setService] = useState('all');
  const [showClosed, setShowClosed] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [privateNote, setPrivateNote] = useState('');
  const [uncertainPeriod, setUncertainPeriod] = useState(false);
  const attempt = useRef<{ p_request_id: string; p_start_date: string; p_end_date: string; p_private_note: string } | null>(null);
  const lock = useRef(false);
  const mounted = useRef(false);
  const days = useMemo(() => monthDays(month), [month]);
  const from = days[0];
  const to = addDays(days[41], 1);
  const refresh = () => setReload((n) => n + 1);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError(false); setBookings([]); setSchedule(null);
    void (async () => {
      try {
        const scheduleResult = await supabase.rpc('get_my_schedule', { p_from: from, p_to: to });
        if (scheduleResult.error || !scheduleResult.data) throw scheduleResult.error || new Error('Missing schedule');
        const rows: CalendarBooking[] = [];
        for (let offset = 0; ; offset += 200) {
          if (!active) return;
          const result = await supabase.rpc('get_my_booking_calendar', { p_from: from, p_to: to, p_limit: 200, p_offset: offset });
          if (result.error) throw result.error;
          const page = (result.data || []) as CalendarBooking[];
          rows.push(...page);
          if (page.length < 200) break;
        }
        if (active) {
          setBookings(Array.from(new Map(rows.map((row) => [row.id, row])).values()));
          setSchedule(scheduleResult.data as Schedule);
        }
      } catch { if (active) setLoadError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [from, to, reload]);

  const visible = bookings.filter((booking) => (showClosed || !['cancelled', 'declined'].includes(booking.status))
    && (service === 'all' || (booking.service_id || 'deleted') === service));
  const selectedBookings = visible.filter((booking) => bookingOnDay(booking, selected));
  const selectedPeriods = schedule?.periods.filter((period) => period.start_date <= selected && period.end_date >= selected) || [];
  const legend = Array.from(new Map(bookings.map((booking) => [booking.service_id || 'deleted', booking])).entries());

  const perform = async (work: () => Promise<string>) => {
    if (lock.current || loading || !schedule) return;
    lock.current = true; setBusy(true); setNotice(null);
    try {
      const text = await work();
      if (mounted.current) setNotice({ error: false, text });
    } catch (error) {
      if (mounted.current) setNotice({ error: true, text: acceptanceError(error) });
    } finally {
      lock.current = false;
      if (mounted.current) { setBusy(false); refresh(); }
    }
  };
  const changeStatus = (id: string, status: 'accepted' | 'declined' | 'completed') => void perform(async () => {
    const result = await supabase.rpc('change_booking_status', { p_booking_id: id, p_new_status: status });
    if (result.error) throw result.error;
    return status === 'accepted' ? 'Richiesta accettata.' : status === 'declined' ? 'Richiesta rifiutata.' : 'Appuntamento completato.';
  });
  const togglePause = () => void perform(async () => {
    const paused = !schedule?.paused;
    const result = await supabase.rpc('set_my_booking_pause', { p_paused: paused });
    if (result.error) throw result.error;
    return paused ? 'Nuove richieste sospese. Gli appuntamenti già presenti restano nel calendario.' : 'Ricezione delle nuove richieste riattivata.';
  });
  const addPeriod = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || loading || !schedule) return;
    const request = attempt.current || { p_request_id: crypto.randomUUID(), p_start_date: startDate, p_end_date: endDate, p_private_note: privateNote.trim() };
    attempt.current = request;
    lock.current = true; setBusy(true); setNotice(null);
    try {
      const { data, error } = await supabase.rpc('add_my_time_off', request);
      if (error) throw error;
      if (!data?.[0]) throw new Error('Missing confirmation');
      if (!mounted.current) return;
      const count = Number(data[0].accepted_bookings);
      setNotice({ error: count > 0, text: count > 0
        ? `Indisponibilità registrata. Ci sono ${count} appuntamenti già accettati in questo periodo: restano confermati. Contatta i clienti per concordare eventuali cambiamenti.`
        : 'Indisponibilità registrata. Le nuove richieste e le accettazioni sovrapposte sono bloccate fino al termine del periodo.' });
      setMonth(request.p_start_date.slice(0, 7)); setSelected(request.p_start_date);
      setUncertainPeriod(false); setPrivateNote(''); attempt.current = null;
    } catch (error) {
      if (!mounted.current) return;
      const code = (error as { code?: string })?.code;
      const rejected = code === '22023' || code === '42501';
      if (rejected) attempt.current = null;
      setUncertainPeriod(!rejected);
      setNotice({ error: true, text: rejected
        ? 'Periodo non salvato. Controlla le date: massimo 366 giorni compresi e termine non già passato.'
        : 'Esito non confermato. Usa “Riprova lo stesso invio”: verrà conservato un solo periodo, anche se il primo invio è già arrivato.' });
    } finally {
      lock.current = false;
      if (mounted.current) { setBusy(false); refresh(); }
    }
  };
  const removePeriod = (id: string) => {
    if (!window.confirm('Rimuovere questa indisponibilità? Sarà nuovamente possibile ricevere e accettare richieste in queste date.')) return;
    void perform(async () => {
      const result = await supabase.rpc('remove_my_time_off', { p_period_id: id });
      if (result.error) throw result.error;
      return result.data ? 'Indisponibilità rimossa.' : 'Il periodo non è più presente. Calendario aggiornato.';
    });
  };
  const moveMonth = (amount: number) => {
    const next = shiftMonth(month, amount);
    setMonth(next); setSelected(`${next}-01`); setService('all');
  };

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-stone-900 sm:px-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="pc-kicker">La tua attività</p><h1 className="mt-2 text-3xl font-semibold">Calendario e disponibilità</h1>
        <p className="mt-2 text-sm text-stone-600">Impegni per servizio, richieste e periodi di assenza. Date e orari seguono l’ora italiana.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || loading} onClick={refresh} className={button}><RefreshCw className="mr-2 inline h-4 w-4" />Aggiorna</button>
        <button type="button" onClick={() => navigate('/pro/settings')} className={button}>Servizi e colori</button></div>
    </header>
    {notice && <p role={notice.error ? 'alert' : 'status'} className={`rounded-2xl border p-4 text-sm ${notice.error ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>{notice.text}</p>}
    {loadError && <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-5"><p>Calendario non caricato. Riprova tra poco.</p><button type="button" onClick={refresh} className={`${button} mt-3`}>Riprova</button></div>}
    <section aria-label="Ricezione delle richieste" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5">
      <div><h2 className="font-bold">{loading ? 'Caricamento disponibilità…' : schedule ? schedule.paused ? 'Nuove richieste sospese' : 'Ricezione richieste attiva' : 'Disponibilità non caricata'}</h2>
        <p className="mt-1 max-w-2xl text-sm text-stone-600">La sospensione dura fino alla riattivazione. Per un’assenza con termine automatico, aggiungi un periodo di indisponibilità. Gli appuntamenti accettati restano confermati.</p></div>
      <button type="button" disabled={busy || loading || !schedule} onClick={togglePause} className={primary}>{schedule?.paused ? 'Riattiva nuove richieste' : 'Sospendi nuove richieste'}</button>
    </section>
    <section aria-label="Calendario mensile" className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 className="text-xl font-bold capitalize">{new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00Z`))}</h2>
        <div className="flex gap-2"><button type="button" disabled={busy} aria-label="Mese precedente" onClick={() => moveMonth(-1)} className={button}><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" disabled={busy} onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); setService('all'); }} className={button}>Oggi</button>
          <button type="button" disabled={busy} aria-label="Mese successivo" onClick={() => moveMonth(1)} className={button}><ChevronRight className="h-5 w-5" /></button></div>
      </div>
      <div className="flex flex-wrap items-end gap-4 border-t border-stone-100 px-4 py-3">
        <label className="text-sm font-semibold">Servizio<select value={service} onChange={(e) => setService(e.target.value)} className={input}><option value="all">Tutti i servizi</option>{legend.map(([id, booking]) => <option key={id} value={id}>{booking.service_name}</option>)}</select></label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />Mostra anche annullate e rifiutate</label>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 pb-4 text-xs">{legend.map(([id, booking]) => <span key={id} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-stone-300" aria-hidden="true" style={{ backgroundColor: serviceColor(booking.calendar_color) }} />{booking.service_name}</span>)}</div>
      {loading ? <p role="status" className="p-6 text-stone-600">Caricamento impegni…</p> : !loadError && <>
        <div className="grid grid-cols-7 border-t border-stone-200 bg-stone-50 text-center text-xs font-bold">{['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => <div key={day} className="py-2">{day}</div>)}</div>
        <div className="grid grid-cols-7">{days.map((day) => {
          const events = visible.filter((booking) => bookingOnDay(booking, day));
          const blocked = schedule?.periods.some((period) => period.start_date <= day && period.end_date >= day);
          const selectedDay = day === selected;
          return <button type="button" key={day} onClick={() => setSelected(day)} aria-pressed={selectedDay}
            aria-label={`${dayLabel(day, true)}: ${events.length} impegni${blocked ? ', indisponibile' : ''}`}
            className={`min-w-0 border-t border-r border-stone-200 p-1 text-left align-top sm:p-2 ${selectedDay ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-800' : blocked ? 'bg-amber-50' : 'bg-white'} ${day.slice(0, 7) !== month ? 'text-stone-400' : 'text-stone-900'}`}>
            <div className="min-h-20 sm:min-h-28"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${day === today ? 'bg-emerald-900 text-white' : ''}`}>{Number(day.slice(-2))}</span>
              {blocked && <span className="block truncate text-[10px] font-bold text-amber-900" title="Indisponibile">Indisponibile</span>}
              {events.slice(0, 3).map((booking) => <span key={booking.id} className="mt-1 block truncate border-l-4 pl-1 text-[10px] text-stone-800 sm:text-xs" style={{ borderLeftColor: serviceColor(booking.calendar_color) }}>
                {romeDay(booking.start_at) === day ? calendarTime(booking.start_at) : '↳'} <span className="hidden sm:inline">{booking.client_name} · {booking.service_name}</span><span className="sm:hidden">{booking.service_name}</span>
              </span>)}
              {events.length > 3 && <span className="mt-1 block text-xs font-semibold text-stone-700">+{events.length - 3}</span>}
            </div>
          </button>;
        })}</div>
      </>}
    </section>
    {!loading && !loadError && <section aria-label="Impegni del giorno" className="space-y-3">
      <h2 className="text-xl font-bold capitalize">{dayLabel(selected, true)}</h2>
      {selectedPeriods.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Giorno segnato come indisponibile. Gli impegni già accettati restano confermati.</p>}
      {!selectedBookings.length && <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">Nessun impegno per questo giorno e questi filtri.</p>}
      {selectedBookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-stone-200 border-l-4 bg-white p-5" style={{ borderLeftColor: serviceColor(booking.calendar_color) }}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{booking.client_name}</h3><p className="mt-1 text-sm">{booking.service_name}</p></div><StatusBadge status={booking.status} /></div>
        <p className="mt-3 text-sm text-stone-600">{calendarDateTime(booking.start_at)} – {calendarDateTime(booking.end_at)} · {Number(booking.price || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
        <div className="mt-3 rounded-xl bg-stone-50 p-3"><p className="text-xs font-bold text-stone-600">Note del cliente</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{booking.notes?.trim() || 'Nessuna nota inserita.'}</p></div>
        <div className="mt-4 flex flex-wrap gap-2">{booking.status === 'pending' && <><button type="button" disabled={busy} onClick={() => changeStatus(booking.id, 'accepted')} className={primary}>Accetta</button><button type="button" disabled={busy} onClick={() => changeStatus(booking.id, 'declined')} className={button}>Rifiuta</button></>}
          {booking.status === 'accepted' && <button type="button" disabled={busy} onClick={() => changeStatus(booking.id, 'completed')} className={primary}>Segna completata</button>}</div>
      </article>)}
    </section>}
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="text-xl font-bold"><CalendarDays className="mr-2 inline h-5 w-5" />Periodi di indisponibilità</h2>
      <p className="mt-2 text-sm text-stone-600">Entrambe le date sono comprese. Il blocco termina a mezzanotte dopo l’ultimo giorno, secondo l’ora italiana. Eventuali appuntamenti già accettati restano confermati e vengono segnalati dopo il salvataggio.</p>
      <form onSubmit={(event) => void addPeriod(event)} className="mt-4">
        <fieldset disabled={busy || loading || !schedule || uncertainPeriod} className="grid gap-3 sm:grid-cols-2 disabled:opacity-60">
          <label className="text-sm font-semibold">Primo giorno<input type="date" required value={startDate} min={today} onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }} className={input} /></label>
          <label className="text-sm font-semibold">Ultimo giorno<input type="date" required value={endDate} min={startDate || today} max={startDate ? addDays(startDate, 365) : undefined} onChange={(e) => setEndDate(e.target.value)} className={input} /></label>
          <label className="text-sm font-semibold sm:col-span-2">Promemoria privato (facoltativo)<input value={privateNote} maxLength={500} onChange={(e) => setPrivateNote(e.target.value)} placeholder="Visibile solo a te" className={input} /></label>
        </fieldset>
        <button type="submit" disabled={busy || loading || !schedule} className={`${primary} mt-4`}>{busy ? 'Aggiornamento…' : uncertainPeriod ? 'Riprova lo stesso invio' : 'Aggiungi indisponibilità'}</button>
      </form>
      <h3 className="mt-6 font-bold">Periodi che attraversano il mese visualizzato</h3>
      {schedule && !schedule.periods.length && <p className="mt-2 text-sm text-stone-600">Nessun periodo di indisponibilità in questa vista.</p>}
      <div className="mt-3 space-y-3">{schedule?.periods.map((period) => <div key={period.id} className="rounded-xl border border-stone-200 p-4">
        <p className="font-semibold">{dayLabel(period.start_date)} – {dayLabel(period.end_date)}</p>
        {period.private_note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-stone-600">{period.private_note}</p>}
        {period.accepted_bookings > 0 && <p className="mt-2 text-sm font-semibold text-amber-900">{period.accepted_bookings} appuntamenti già accettati da gestire con i clienti.</p>}
        <button type="button" disabled={busy || loading} onClick={() => removePeriod(period.id)} className={`${button} mt-3`}>Rimuovi indisponibilità</button>
      </div>)}</div>
    </section>
  </div>;
}
