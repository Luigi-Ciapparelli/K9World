import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, Euro, RefreshCw, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { ActivityRange, ActivitySummary, activityPreset, activityRangeError, readActivitySummary } from '../../lib/professionalAnalytics';
import { ProLayout } from './ProLayout';

const integer = new Intl.NumberFormat('it-IT');
const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const date = (iso: string) => new Intl.DateTimeFormat('it-IT', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(iso + 'T12:00:00Z'));
const statuses = [
  { key: 'pending', label: 'In attesa', color: 'bg-amber-500' },
  { key: 'accepted', label: 'Accettate', color: 'bg-sky-600' },
  { key: 'completed', label: 'Completate', color: 'bg-emerald-700' },
  { key: 'declined', label: 'Rifiutate', color: 'bg-rose-600' },
  { key: 'cancelled', label: 'Annullate', color: 'bg-stone-500' },
  { key: 'other', label: 'Altro stato', color: 'bg-violet-600' },
] as const;

export function ProAnalytics() {
  const { user } = useAuth();
  return <ProLayout active="analytics"><ActivityReport key={user?.id || 'signed-out'} userId={user?.id} /></ProLayout>;
}

function ActivityReport({ userId }: { userId?: string }) {
  const { navigate } = useRouter();
  const [range, setRange] = useState<ActivityRange>(() => activityPreset('month'));
  const [draft, setDraft] = useState(range);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: ActivitySummary; error?: string } | null>(null);
  const [validation, setValidation] = useState('');
  const requestKey = JSON.stringify([range.from, range.to, revision]);
  const current = result?.key === requestKey ? result : null;
  const loading = Boolean(userId && !current);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('get_professional_activity_summary', {
          p_from: range.from, p_to: range.to,
        }).abortSignal(controller.signal);
        if (error) throw error;
        const summary = readActivitySummary(data, range);
        if (active) setResult({ key: requestKey, data: summary });
      } catch (error) {
        if (active) setResult({ key: requestKey, error: (error as { code?: string })?.code === '42501'
          ? 'Statistiche non disponibili per questo account. Accedi come titolare dell’attività con email confermata.'
          : 'Non è stato possibile caricare le statistiche. Riprova tra poco.' });
      } finally { window.clearTimeout(timeout); }
    })();
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [userId, range, requestKey]);

  const apply = (next: ActivityRange) => {
    const error = activityRangeError(next);
    setValidation(error);
    if (error) return;
    setDraft(next); setRange(next); setRevision(v => v + 1);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); apply({ ...draft }); };
  const data = current?.data;
  const pendingDraft = draft.from !== range.from || draft.to !== range.to;
  return <div className="pg-shell">
    <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
      <div>
        <p className="pg-eyebrow">LA TUA ATTIVITÀ</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">Statistiche</h1>
        <p className="text-sm text-stone-600 mt-3 max-w-xl leading-relaxed">Un quadro delle prenotazioni e dei servizi svolti. Scegli il periodo che vuoi consultare.</p>
      </div>
      <button type="button" className="pg-secondary" onClick={() => navigate('/pro/calendar')}>Apri calendario <ArrowUpRight size={16} aria-hidden="true" /></button>
    </div>
    <section aria-label="Periodo delle statistiche" className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {([['month', 'Questo mese'], ['90days', 'Ultimi 90 giorni'], ['year', 'Quest’anno']] as const).map(([preset, label]) =>
          <button type="button" key={preset} onClick={() => apply(activityPreset(preset))}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50">{label}</button>)}
      </div>
      <form onSubmit={submit}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[180px] text-sm font-semibold">Dal
            <input type="date" min="2000-01-01" max="2100-12-31" required value={draft.from}
              onChange={e => { setDraft(v => ({ ...v, from: e.target.value })); setValidation(''); }}
              className="block w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-2 mt-1 text-stone-900" />
          </label>
          <label className="block flex-1 min-w-[180px] text-sm font-semibold">Al
            <input type="date" min="2000-01-01" max="2100-12-31" required value={draft.to}
              onChange={e => { setDraft(v => ({ ...v, to: e.target.value })); setValidation(''); }}
              className="block w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 py-2 mt-1 text-stone-900" />
          </label>
          <button type="submit" className="pg-primary min-h-[44px]">Visualizza</button>
        </div>
        <p className="text-xs text-stone-600 mt-3">Date dell’appuntamento, ora italiana. Entrambe le date sono incluse; massimo 366 giorni.</p>
        {validation && <p role="alert" className="text-sm text-red-700 mt-2">{validation}</p>}
        {pendingDraft && !validation && <p role="status" className="text-sm text-stone-600 mt-2">Premi Visualizza per applicare le nuove date.</p>}
      </form>
    </section>
    <div aria-busy={loading}>
      {!userId && <p role="alert">Accedi come professionista per consultare le statistiche.</p>}
      {loading && <p role="status" className="py-12 text-center text-stone-600">Caricamento delle statistiche…</p>}
      {current?.error && <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
        <p className="text-sm">{current.error}</p>
        <button type="button" className="pg-secondary mt-4" onClick={() => setRevision(v => v + 1)}>Riprova</button>
      </div>}
      {data && <>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <h2 className="text-lg font-bold">{date(data.from)} – {date(data.to)}</h2>
          <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold py-2" onClick={() => setRevision(v => v + 1)}>
            <RefreshCw size={15} aria-hidden="true" /> Aggiorna statistiche
          </button>
        </div>
        {data.total === 0 ? <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <CalendarDays size={30} className="mx-auto text-emerald-800 mb-4" aria-hidden="true" />
          <h3 className="text-xl font-bold">Nessuna prenotazione nel periodo</h3>
          <p className="text-sm text-stone-600 mt-3">Prova ad ampliare le date o consulta le richieste nella tua area.</p>
          <button type="button" className="pg-secondary mt-5" onClick={() => navigate('/pro/bookings')}>Apri richieste e messaggi</button>
        </div> : <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Metric icon={<CalendarDays size={19} />} label="Prenotazioni" value={integer.format(data.total)} hint="Tutti gli stati nel periodo." />
            <Metric icon={<CheckCircle2 size={19} />} label="Servizi svolti" value={integer.format(data.completed)} hint="Prenotazioni segnate come completate." />
            <Metric icon={<Users size={19} />} label="Clienti serviti" value={integer.format(data.customers)} hint="Clienti distinti con almeno un servizio completato." />
            <Metric icon={<Euro size={19} />} label="Valore dei servizi svolti"
              value={data.completed > 0 && data.missing_prices === data.completed ? 'Non disponibile' : money.format(data.completed_value)}
              hint={'Non sono incassi. ' + (data.missing_prices
                ? data.missing_prices === 1 ? 'Un servizio senza importo valido è escluso dal totale.' : `${integer.format(data.missing_prices)} servizi senza importo valido sono esclusi dal totale.`
                : 'Prezzi delle prenotazioni completate.')} />
          </div>
          <div className="grid xl:grid-cols-2 gap-5">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h3 className="text-lg font-bold">Stato delle prenotazioni</h3>
              <p className="text-sm text-stone-600 mt-2 mb-5">Lo stato attuale degli appuntamenti nel periodo scelto.</p>
              <dl className="space-y-4">
                {statuses.filter(s => s.key !== 'other' || data.other > 0).map(s => <div key={s.key}>
                  <div className="flex justify-between text-sm mb-2"><dt>{s.label}</dt><dd className="font-bold">{integer.format(data[s.key])}</dd></div>
                  <div aria-hidden="true" className="rounded-full bg-stone-100 h-1.5 overflow-hidden"><div className={s.color + ' h-full rounded-full'} style={{ width: `${data[s.key] / data.total * 100}%` }} /></div>
                </div>)}
              </dl>
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h3 className="text-lg font-bold">I servizi più svolti</h3>
              <p className="text-sm text-stone-600 mt-2 mb-5">Fino a cinque servizi, per numero di prenotazioni completate.</p>
              {data.completed === 0 ? <p className="text-sm text-stone-600">Non ci sono ancora servizi completati in questo periodo.</p> :
                <ol className="space-y-4">{data.top_services.map((s, i) => <li key={i} className="flex gap-3 border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                  <span aria-hidden="true" className="shrink-0 rounded-lg bg-emerald-50 text-emerald-800 w-8 h-8 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="font-semibold text-sm break-words">{s.name}</p>
                    <p className="text-xs text-stone-600 mt-1">{integer.format(s.completed)} {s.completed === 1 ? 'prenotazione completata' : 'prenotazioni completate'}</p>
                  </div>
                  <span className="text-sm font-semibold text-right shrink-0">{s.missing_prices === s.completed ? <span aria-label="Importo non disponibile">—</span> : money.format(s.value)}
                    {s.missing_prices > 0 && s.missing_prices < s.completed && <span className="block text-xs font-normal text-stone-600 mt-1">Parziale</span>}
                  </span>
                </li>)}</ol>}
              {data.service_groups > 5 && <p className="text-xs text-stone-600 mt-4">{data.service_groups === 6 ? 'Un altro servizio è incluso nei totali.' : `Altri ${integer.format(data.service_groups - 5)} servizi sono inclusi nei totali.`}</p>}
            </section>
          </div>
          <section className="rounded-2xl bg-emerald-950 text-white p-5 sm:p-7 mt-5 flex flex-wrap items-center gap-6">
            <div className="shrink-0">
              <p className="text-4xl font-bold">{data.returning_percent === null ? '—' : integer.format(data.returning_percent) + '%'}</p>
              <p className="text-xs text-emerald-100 mt-2">Clienti tornati nel periodo</p>
            </div>
            <div className="flex-1 min-w-[180px]">
              <h3 className="font-semibold">{data.customers > 0 ? `${integer.format(data.returning_customers)} su ${integer.format(data.customers)} clienti serviti` : 'Ancora nessun servizio completato'}</h3>
              <p className="text-sm text-emerald-100 mt-2 leading-relaxed">Clienti con almeno due prenotazioni completate tra le date selezionate. Gli appuntamenti di altri periodi non rientrano nel calcolo.</p>
            </div>
          </section>
        </>}
        <details className="mt-6 text-sm text-stone-600">
          <summary className="cursor-pointer font-semibold py-2">Come leggere questi numeri</summary>
          <div className="mt-2 space-y-2 leading-relaxed max-w-3xl">
            <p>Ogni prenotazione conta una volta, nella data di inizio dell’appuntamento in Italia. Le pensioni di più giorni non vengono moltiplicate per le notti.</p>
            <p>Gli importi sono i prezzi salvati nelle prenotazioni completate. Non indicano pagamenti ricevuti, fatture o ricavi da pacchetti e abbonamenti.</p>
            <p>I servizi sono raggruppati per identità, anche se rinominati; quando disponibile, mostriamo il nome registrato nell’ultima prestazione del periodo.</p>
            <p>I dati riguardano l’attività del tuo account. Le lezioni svolte per altri centri non sono sommate. Cancellazioni di dati o correzioni delle prenotazioni possono modificare i totali.</p>
            <p>Aggiornamento: {new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(data.as_of))}, ora italiana.</p>
          </div>
        </details>
      </>}
    </div>
  </div>;
}

function Metric({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return <section aria-label={label} className="rounded-2xl border border-stone-200 bg-white p-5 min-w-0">
    <div className="text-emerald-800 mb-4" aria-hidden="true">{icon}</div>
    <h3 className="text-sm font-semibold text-stone-600">{label}</h3>
    <p className="text-2xl font-bold tracking-tight mt-2 break-words">{value}</p>
    <p className="text-xs text-stone-600 leading-relaxed mt-2">{hint}</p>
  </section>;
}
