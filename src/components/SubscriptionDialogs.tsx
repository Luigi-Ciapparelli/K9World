import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { passMoney } from '../lib/professionalPasses';
import { periodLabels, periodRange, subscriptionToday, useSubscriptionMutation, type SubscriptionPlan, type ClientSubscription, type PeriodUnit } from '../lib/professionalSubscriptions';
import { PassAlert, PassDialog, passButton } from './PassDialogs';
const input = 'mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 text-stone-900';
type DialogCallbacks = { onClose: () => void; onSaved: () => void };

export function SubscriptionPlanDialog({ plan, services, onClose, onSaved }: DialogCallbacks & {
  plan: SubscriptionPlan | null; services: { id: string; name: string; active: boolean }[];
}) {
  const [id] = useState(() => plan?.id || crypto.randomUUID());
  const [name, setName] = useState(plan?.name || ''); const [description, setDescription] = useState(plan?.description || '');
  const [service, setService] = useState(plan?.service_id || ''); const [unit, setUnit] = useState<PeriodUnit>(plan?.period_unit || 'month');
  const [uses, setUses] = useState(plan?.period_uses || 4); const [price, setPrice] = useState(plan?.period_price || 0);
  const { busy, error, run } = useSubscriptionMutation(onSaved);
  return <PassDialog title={plan ? 'Modifica piano' : 'Nuovo piano di abbonamento'} busy={busy} onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); void run('save_own_subscription_plan', { p_id: id, p_version: plan?.version || 0, p_name: name.trim(), p_description: description.trim(), p_service_id: service, p_period_unit: unit, p_period_uses: uses, p_period_price: price }); }}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Nome del piano<input className={input} value={name} onChange={e => setName(e.target.value)} required maxLength={100} /></label>
      <label className="block">Servizio incluso<select aria-label="Servizio incluso" className={input} value={service} onChange={e => setService(e.target.value)} required><option value="">Scegli un servizio attivo</option>{services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="block">Durata di ogni periodo<select aria-label="Durata di ogni periodo" className={input} value={unit} onChange={e => setUnit(e.target.value as PeriodUnit)}>{Object.entries(periodLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label>Lezioni per periodo<input type="number" className={input} value={uses} onChange={e => setUses(Number(e.target.value))} min={1} max={200} step={1} required /></label><label>Prezzo per periodo (€)<input type="number" className={input} value={price} onChange={e => setPrice(Number(e.target.value))} min={0} max={100000} step="0.01" required /></label></div>
      <label className="block">Descrizione<textarea className={input} value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={2000} /></label>
      <p className="text-sm text-stone-600">Ogni periodo ha le sue lezioni e la sua scadenza; quelle non utilizzate non si sommano al rinnovo. Le modifiche al piano valgono per le nuove assegnazioni. Gli abbonamenti esistenti mantengono le condizioni concordate.</p>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton}>{busy ? 'Salvataggio…' : 'Salva piano'}</button>
    </fieldset></form>
  </PassDialog>;
}

export function AssignSubscriptionDialog({ plans, onClose, onSaved }: DialogCallbacks & { plans: SubscriptionPlan[] }) {
  const [planId, setPlanId] = useState(''); const [client, setClient] = useState(''); const [query, setQuery] = useState('');
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([]); const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false); const [retry, setRetry] = useState(0); const [start, setStart] = useState(subscriptionToday());
  const { busy, error, run } = useSubscriptionMutation(onSaved); const selected = plans.find(p => p.id === planId);
  useEffect(() => {
    let alive = true; setLoading(true); setLoadError(false);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await supabase.rpc('get_professional_clients').select('id,full_name').ilike('full_name', `%${query.trim().replace(/[%_]/g, '')}%`).limit(50);
          if (result.error) throw result.error;
          if (alive) setClients((result.data || []) as { id: string; full_name: string }[]);
        } catch { if (alive) { setClients([]); setLoadError(true); } }
        finally { if (alive) setLoading(false); }
      })();
    }, 200);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [query, retry]);
  return <PassDialog title="Assegna abbonamento" busy={busy} onClose={onClose}>
    <form onSubmit={e => { e.preventDefault(); if (selected) void run('issue_client_subscription', { p_plan_id: selected.id, p_plan_version: selected.version, p_client_id: client, p_starts_on: start }, true); }}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Piano<select aria-label="Piano" className={input} value={planId} onChange={e => setPlanId(e.target.value)} required><option value="">Scegli un piano</option>{plans.filter(p => p.active && p.service_active && p.period_unit).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="block">Cerca cliente per nome<input className={input} value={query} onChange={e => { setQuery(e.target.value); setClient(''); }} /></label>
      <label className="block">Cliente<select aria-label="Cliente" className={input} value={client} onChange={e => setClient(e.target.value)} required disabled={loading || loadError}><option value="">{loading ? 'Caricamento…' : 'Scegli il cliente'}</option>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || 'Cliente senza nome'}</option>)}</select></label>
      <p className="text-sm text-stone-600">Clienti con una tua prenotazione accettata o completata. La ricerca mostra fino a 50 nomi.</p>
      {loadError && <PassAlert>Impossibile caricare i clienti. <button type="button" className="underline" onClick={() => setRetry(v => v + 1)}>Riprova</button></PassAlert>}
      <label className="block">Inizio primo periodo<input type="date" className={input} value={start} onChange={e => setStart(e.target.value)} min={subscriptionToday()} required /></label>
      {selected?.period_unit && <div className="rounded-xl bg-emerald-50 p-4 text-emerald-950"><strong>{selected.period_uses} lezioni · {passMoney(selected.period_price)}</strong><p>{periodLabels[selected.period_unit]} · {selected.service_name}</p></div>}
      <p className="text-sm text-stone-600">Conferma un accordo già preso con il cliente. Attivi il primo periodo; i successivi richiedono una tua conferma. Le date seguono il fuso italiano. Non vengono eseguiti né registrati pagamenti.</p>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton} disabled={loading || loadError || !selected || !client}>{busy ? 'Assegnazione…' : 'Conferma primo periodo'}</button>
    </fieldset></form>
  </PassDialog>;
}

export function RenewSubscriptionDialog({ subscription, onClose, onSaved }: DialogCallbacks & { subscription: ClientSubscription }) {
  const { busy, error, run } = useSubscriptionMutation(onSaved);
  return <PassDialog title="Conferma rinnovo" busy={busy} onClose={onClose}>
    <p className="font-semibold">{subscription.client_name} · {subscription.name}</p>
    <div className="my-4 rounded-xl bg-emerald-50 p-4"><p>Nuovo periodo: <strong>{periodRange(subscription.next_start, subscription.next_end)}</strong></p><p className="mt-2">{subscription.period_uses} lezioni · {passMoney(subscription.period_price)}</p></div>
    <p className="mb-4 text-sm text-stone-600">Conferma il rinnovo concordato con il cliente. Le lezioni residue restano nel periodo precedente, con la sua scadenza. Nessun pagamento viene eseguito o registrato.</p>
    {error && <PassAlert>{error}</PassAlert>}<button className={passButton} disabled={busy || !subscription.can_renew} onClick={() => void run('renew_client_subscription', { p_subscription_id: subscription.id, p_last_period_id: subscription.latest_period_id }, true)}>{busy ? 'Rinnovo…' : 'Conferma nuovo periodo'}</button>
  </PassDialog>;
}

export function CloseSubscriptionDialog({ subscription, onClose, onSaved }: DialogCallbacks & { subscription: ClientSubscription }) {
  const [reason, setReason] = useState(''); const { busy, error, run } = useSubscriptionMutation(onSaved);
  return <PassDialog title="Chiudi rinnovi" busy={busy} onClose={onClose}>
    <p className="mb-4">I periodi già confermati restano utilizzabili fino alle rispettive scadenze. Lo storico rimane consultabile e non verranno aggiunti altri periodi.</p>
    <form onSubmit={e => { e.preventDefault(); void run('close_client_subscription', { p_id: subscription.id, p_version: subscription.version, p_reason: reason.trim() }); }}><fieldset disabled={busy} className="space-y-4">
      <label className="block">Motivo visibile al cliente<textarea className={input} value={reason} onChange={e => setReason(e.target.value)} minLength={3} maxLength={300} required rows={3} /></label>
      {error && <PassAlert>{error}</PassAlert>}<button className={passButton}>{busy ? 'Salvataggio…' : 'Conferma chiusura rinnovi'}</button>
    </fieldset></form>
  </PassDialog>;
}
