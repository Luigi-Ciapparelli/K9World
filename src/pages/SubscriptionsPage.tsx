import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { supabase } from '../lib/supabase';
import { passLabels, passMoney, type PassEvent } from '../lib/professionalPasses';
import { periodLabels, periodRange, subscriptionLabels, subscriptionError, useSubscriptionMutation, type ClientSubscription, type SubscriptionPeriod, type SubscriptionPlan } from '../lib/professionalSubscriptions';
import { PassAlert, PassDialog, PassHistoryDialog, PassReasonDialog, UsePassDialog, passButton, passSecondary } from '../components/PassDialogs';
import { AssignSubscriptionDialog, CloseSubscriptionDialog, RenewSubscriptionDialog, SubscriptionPlanDialog } from '../components/SubscriptionDialogs';
import { ProLayout } from './pro/ProLayout';

type Modal = { kind: 'plan'; plan: SubscriptionPlan | null } | { kind: 'assign' }
  | { kind: 'renew' | 'close'; subscription: ClientSubscription }
  | { kind: 'use' | 'history' | 'cancel'; period: SubscriptionPeriod } | { kind: 'reverse'; period: SubscriptionPeriod; event: PassEvent };
const pageSize = 24;
export function SubscriptionsPage({ professional = false }: { professional?: boolean }) {
  const { user } = useAuth(); if (!user) return null;
  return professional ? <ProLayout active="subscriptions"><Content key={user.id} professional userId={user.id} /></ProLayout>
    : <Content key={user.id} professional={false} userId={user.id} />;
}
function Content({ professional, userId }: { professional: boolean; userId: string }) {
  const { navigate } = useRouter(); const [tab, setTab] = useState<'clients' | 'plans'>('clients');
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]); const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0); const [page, setPage] = useState(0); const [more, setMore] = useState(false); const [filter, setFilter] = useState('');
  const [modal, setModal] = useState<Modal | null>(null); const [detail, setDetail] = useState<ClientSubscription | null>(null);
  function saved() { setModal(null); setNotice('Operazione registrata.'); setReload(v => v + 1); }
  const mutation = useSubscriptionMutation(saved);
  useEffect(() => {
    let current = true; setLoading(true); setError('');
    void (async () => {
      try {
        let request = supabase.rpc('list_my_subscriptions', { p_professional: professional });
        if (filter) request = request.eq('lifecycle', filter);
        const results = await Promise.all([
          request.order('started_at', { ascending: false }).order('id').range(page * pageSize, (page + 1) * pageSize),
          professional ? supabase.rpc('list_own_subscription_plans') : Promise.resolve({ data: [], error: null }),
          professional ? supabase.from('services').select('id,name,active').eq('professional_id', userId).order('name') : Promise.resolve({ data: [], error: null }),
        ]);
        for (const result of results) if (result.error) throw result.error;
        if (!current) return;
        setSubscriptions((results[0].data || []).slice(0, pageSize)); setMore((results[0].data || []).length > pageSize);
        setPlans(results[1].data || []); setServices(results[2].data || []);
      } catch (e) { if (current) setError(subscriptionError(e)); }
      finally { if (current) setLoading(false); }
    })(); return () => { current = false; };
  }, [professional, userId, reload, page, filter]);
  const assignable = plans.filter(p => p.active && p.service_active && p.period_unit);
  return <div className="mx-auto max-w-6xl p-4 pb-24 text-stone-900 sm:p-8 sm:pb-10">
    {!professional && <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold" onClick={() => navigate('/owner')}><ArrowLeft className="h-4 w-4" />Area proprietario</button>}
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800"><CalendarDays className="h-5 w-5" />Lezioni con continuità</p><h1 className="text-3xl font-bold">{professional ? 'Abbonamenti' : 'I miei abbonamenti'}</h1><p className="mt-2 max-w-xl text-stone-600">{professional ? 'Organizza percorsi periodici: condizioni chiare, rinnovi confermati e lezioni sempre sotto controllo.' : 'Consulta i periodi concordati con il professionista, le lezioni residue e lo storico.'}</p></div>
      <button className={passSecondary} disabled={loading || mutation.busy} onClick={() => { setNotice(''); setReload(v => v + 1); }}><RefreshCw className="mr-2 inline h-4 w-4" />Aggiorna elenco</button></header>
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-900">{notice}</p>}
    {professional && <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Sezioni abbonamenti"><button className={tab === 'clients' ? passButton : passSecondary} aria-pressed={tab === 'clients'} onClick={() => setTab('clients')}>Abbonamenti dei clienti</button><button className={tab === 'plans' ? passButton : passSecondary} aria-pressed={tab === 'plans'} onClick={() => setTab('plans')}>Piani</button></div>}
    {error && <PassAlert>{error}</PassAlert>}{mutation.error && <PassAlert>{mutation.error}</PassAlert>}
    {loading ? <p role="status">Caricamento abbonamenti…</p> : !error && <>
      {tab === 'plans' && professional ? <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">I tuoi piani</h2><button className={passButton} disabled={!services.some(s => s.active)} onClick={() => setModal({ kind: 'plan', plan: null })}><Plus className="mr-1 inline h-4 w-4" />Nuovo piano</button></div>
        {!services.some(s => s.active) && <p className="mb-5">Aggiungi un servizio attivo in <button className="font-semibold underline" onClick={() => navigate('/pro/settings')}>Profilo e servizi</button>.</p>}
        {!plans.length ? <Empty title="Prepara il primo piano" text="Scegli il servizio, le lezioni incluse e il prezzo per settimana, due settimane o mese." /> : <div className="grid gap-4 lg:grid-cols-2">{plans.map(p => <article key={p.id} className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex justify-between gap-3"><h3 className="font-bold">{p.name}</h3><span className="text-sm text-stone-600">{!p.period_unit ? 'Da completare' : p.active ? 'Disponibile' : 'Archiviato'}</span></div><p className="mt-1 text-sm text-stone-600">{p.service_name || 'Scegli un servizio'}{!p.service_active && ' · Servizio non attivo'}</p>
          <p className="mt-4 font-semibold">{p.period_unit ? `${p.period_uses} lezioni · ${passMoney(p.period_price)} · ${periodLabels[p.period_unit].toLowerCase()}` : 'Condizioni della precedente versione da verificare'}</p>
          {p.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{p.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2"><button className={passSecondary} disabled={mutation.busy} onClick={() => setModal({ kind: 'plan', plan: p })}>Modifica piano</button><button className={passSecondary} disabled={mutation.busy || !p.period_unit} onClick={() => void mutation.run('set_subscription_plan_active', { p_id: p.id, p_version: p.version, p_active: !p.active })}>{p.active ? 'Archivia piano' : 'Riattiva piano'}</button></div>
        </article>)}</div>}
        <p className="mt-5 text-sm text-stone-600">Modificare o archiviare un piano riguarda le nuove assegnazioni. I clienti già iscritti mantengono le condizioni originali e possono essere rinnovati.</p>
      </> : <>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><label className="text-sm font-semibold">Stato<select className="ml-3 rounded-xl border border-stone-300 bg-white p-2" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="">Tutti</option>{Object.entries(subscriptionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{professional && <button className={passButton} disabled={!assignable.length} onClick={() => setModal({ kind: 'assign' })}><Plus className="mr-1 inline h-4 w-4" />Assegna abbonamento</button>}</div>
        {professional && !assignable.length && <p className="mb-5">Per iniziare, <button className="font-semibold underline" onClick={() => setTab('plans')}>prepara un piano con un servizio attivo</button>.</p>}
        {!subscriptions.length ? <Empty title="Nessun abbonamento in elenco" text={professional ? 'Qui compariranno gli abbonamenti assegnati ai tuoi clienti.' : 'Quando un professionista ti assegna un abbonamento, lo ritrovi qui.'} /> : <div className="grid gap-4 lg:grid-cols-2">{subscriptions.map(s => <article key={s.id} className="rounded-2xl border border-stone-200 bg-white p-5" aria-label={`${s.name} · ${professional ? s.client_name : s.professional_name}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-800">{professional ? s.client_name : s.professional_name}</p><h2 className="mt-1 text-lg font-bold">{s.name}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.lifecycle === 'open' ? 'bg-emerald-50 text-emerald-900' : 'bg-stone-100 text-stone-700'}`}>{subscriptionLabels[s.lifecycle]}</span></div>
          <p className="mt-1 text-sm text-stone-600">{s.service_name}</p>
          {s.period_unit && <p className="mt-4 text-lg font-semibold">{s.period_uses} lezioni · {passMoney(s.period_price)}<span className="block text-sm font-normal text-stone-600">{periodLabels[s.period_unit]}</span></p>}
          {s.latest_start && <p className="mt-4 text-sm">Ultimo periodo confermato<br /><strong>{periodRange(s.latest_start, s.latest_end)}</strong></p>}
          {s.lifecycle === 'legacy' && <p className="mt-4 text-sm text-amber-900">Registrazione della versione precedente: condizioni e periodi non verificati. Nessuna lezione o rinnovo viene ricostruito automaticamente.</p>}
          {s.closure_reason && <p className="mt-3 whitespace-pre-wrap break-words text-sm">Chiusura rinnovi: {s.closure_reason}</p>}
          <div className="mt-5 flex flex-wrap gap-2">{s.lifecycle !== 'legacy' && <button className={passSecondary} onClick={() => setDetail(s)}>Periodi e lezioni</button>}{professional && s.lifecycle === 'open' && <><button className={passButton} disabled={!s.can_renew} onClick={() => setModal({ kind: 'renew', subscription: s })}>Rinnova periodo</button><button className="px-2 py-2 text-sm text-stone-600 underline" onClick={() => setModal({ kind: 'close', subscription: s })}>Chiudi rinnovi</button></>}</div>
          {professional && s.lifecycle === 'open' && !s.can_renew && <p className="mt-3 text-sm text-stone-600">Il rinnovo richiede un servizio attivo e un profilo approvato. Attendi l’inizio dell’ultimo periodo confermato; se il periodo successivo è già trascorso, chiudi i rinnovi e assegna un nuovo abbonamento.</p>}
        </article>)}</div>}
        {(page > 0 || more) && <div className="mt-6 flex items-center justify-center gap-4"><button className={passSecondary} disabled={!page} onClick={() => setPage(v => v - 1)}>Precedente</button><span>Pagina {page + 1}</span><button className={passSecondary} disabled={!more} onClick={() => setPage(v => v + 1)}>Successiva</button></div>}
        <p className="mt-5 text-sm text-stone-600">I rinnovi richiedono una conferma del professionista. I periodi seguono il fuso italiano; le lezioni non utilizzate scadono alla fine del rispettivo periodo.</p>
      </>}
    </>}
    {detail && !modal && <PeriodsDialog key={`${detail.id}-${reload}`} subscription={detail} professional={professional} onClose={() => setDetail(null)} onAction={(kind, period) => setModal({ kind, period })} />}
    {modal?.kind === 'plan' && <SubscriptionPlanDialog plan={modal.plan} services={services} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'assign' && <AssignSubscriptionDialog plans={plans} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'renew' && <RenewSubscriptionDialog subscription={modal.subscription} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'close' && <CloseSubscriptionDialog subscription={modal.subscription} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'use' && <UsePassDialog pack={modal.period} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'history' && <PassHistoryDialog pack={modal.period} professional={professional} onClose={() => setModal(null)} onReverse={event => setModal({ kind: 'reverse', period: modal.period, event })} />}
    {modal?.kind === 'cancel' && <PassReasonDialog pack={modal.period} period onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'reverse' && <PassReasonDialog pack={modal.period} event={modal.event} onClose={() => setModal(null)} onSaved={saved} />}
  </div>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center"><h2 className="font-bold">{title}</h2><p className="mt-2 text-stone-600">{text}</p></div>;
}
function PeriodsDialog({ subscription, professional, onClose, onAction }: { subscription: ClientSubscription; professional: boolean; onClose: () => void; onAction: (kind: 'use' | 'history' | 'cancel', period: SubscriptionPeriod) => void }) {
  const [periods, setPeriods] = useState<SubscriptionPeriod[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [page, setPage] = useState(0); const [more, setMore] = useState(false); const [retry, setRetry] = useState(0);
  useEffect(() => { let current = true; setLoading(true); setError('');
    void (async () => {
      try {
        const result = await supabase.rpc('get_subscription_periods', { p_id: subscription.id }).order('ordinal', { ascending: false }).range(page * 12, (page + 1) * 12);
        if (result.error) throw result.error;
        if (current) { setPeriods((result.data || []).slice(0, 12)); setMore((result.data || []).length > 12); }
      } catch (e) { if (current) setError(subscriptionError(e)); } finally { if (current) setLoading(false); }
    })(); return () => { current = false; };
  }, [subscription.id, page, retry]);
  return <PassDialog title={`Periodi · ${subscription.name}`} busy={false} onClose={onClose}>
    <p className="mb-4 text-sm text-stone-600">{professional ? subscription.client_name : subscription.professional_name} · Ogni periodo mantiene il proprio conteggio.</p>
    {subscription.description && <p className="mb-4 whitespace-pre-wrap break-words text-sm">{subscription.description}</p>}
    {loading ? <p role="status">Caricamento periodi…</p> : error ? <PassAlert>{error} <button className="underline" onClick={() => setRetry(v => v + 1)}>Riprova</button></PassAlert> : <>
      {!periods.length && <p>Nessun periodo confermato.</p>}<ol className="space-y-4">{periods.map(p => <li key={p.id} className="rounded-xl border border-stone-200 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{periodRange(p.starts_on, p.ends_on)}</strong><span className="text-sm text-stone-600">{p.state === 'cancelled' ? passLabels[p.state] : p.scheduled ? 'In programma' : passLabels[p.state]}</span></div><p className="mt-3 text-2xl font-bold">{p.remaining_uses}<span className="text-sm font-normal text-stone-600"> / {p.total_uses} lezioni residue</span></p><p className="mt-1 text-sm">Prezzo concordato: {passMoney(p.price)}</p>{p.cancellation_reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm">Annullamento: {p.cancellation_reason}</p>}<div className="mt-4 flex flex-wrap gap-2">{professional && !p.scheduled && p.remaining_uses > 0 && (p.state === 'active' || p.state === 'expired') && <button className={passButton} onClick={() => onAction('use', p)}>Registra lezione</button>}<button className={passSecondary} onClick={() => onAction('history', p)}>Storico lezioni</button>{professional && p.state !== 'cancelled' && <button className="px-2 py-2 text-sm text-stone-600 underline" onClick={() => onAction('cancel', p)}>Annulla periodo</button>}</div></li>)}</ol>
      {(page > 0 || more) && <div className="mt-4 flex justify-between gap-3"><button className={passSecondary} disabled={!page} onClick={() => setPage(v => v - 1)}>Periodi precedenti nella lista</button><button className={passSecondary} disabled={!more} onClick={() => setPage(v => v + 1)}>Periodi più vecchi</button></div>}
    </>}
  </PassDialog>;
}
