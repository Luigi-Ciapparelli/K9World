import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Package, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { supabase } from '../lib/supabase';
import { passDate, passError, passLabels, passMoney, passRpc, type ClientPass, type PassEvent, type PassTemplate } from '../lib/professionalPasses';
import { IssuePassDialog, PassAlert, PassHistoryDialog, PassReasonDialog, PassTemplateDialog, UsePassDialog, passButton, passSecondary } from '../components/PassDialogs';
import { ProLayout } from './pro/ProLayout';

type Modal = { kind: 'template'; model: PassTemplate | null } | { kind: 'issue' }
  | { kind: 'use' | 'history' | 'cancel'; pack: ClientPass } | { kind: 'reverse'; pack: ClientPass; event: PassEvent };
const pageSize = 24;
export function PassesPage({ professional = false }: { professional?: boolean }) {
  const { user } = useAuth();
  if (!user) return null;
  return professional ? <ProLayout active="passes"><PassesContent key={user.id} professional userId={user.id} /></ProLayout>
    : <PassesContent key={user.id} professional={false} userId={user.id} />;
}
function PassesContent({ professional, userId }: { professional: boolean; userId: string }) {
  const { navigate } = useRouter(); const [tab, setTab] = useState<'clients' | 'templates'>('clients');
  const [packs, setPacks] = useState<ClientPass[]>([]); const [models, setModels] = useState<PassTemplate[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [modal, setModal] = useState<Modal | null>(null); const [reload, setReload] = useState(0);
  const [page, setPage] = useState(0); const [more, setMore] = useState(false); const [state, setState] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false); const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let current = true; setLoading(true); setError('');
    (async () => {
      try {
        let request = supabase.rpc('list_my_client_passes', { p_professional: professional });
        if (state) request = request.eq('state', state);
        const results = await Promise.all([
          request.order('purchased_at', { ascending: false }).order('id').range(page * pageSize, (page + 1) * pageSize),
          professional ? supabase.rpc('list_own_pass_templates') : Promise.resolve({ data: [], error: null }),
          professional ? supabase.from('services').select('id,name,active').eq('professional_id', userId).order('name') : Promise.resolve({ data: [], error: null }),
        ]);
        for (const result of results) if (result.error) throw result.error;
        if (!current) return;
        setPacks((results[0].data || []).slice(0, pageSize) as ClientPass[]); setMore((results[0].data || []).length > pageSize);
        setModels((results[1].data || []) as PassTemplate[]); setServices(results[2].data || []);
      } catch (e) { if (current) setError(passError(e)); }
      finally { if (current) setLoading(false); }
    })(); return () => { current = false; };
  }, [professional, userId, reload, page, state]);
  function saved() { setModal(null); setNotice('Operazione registrata.'); setReload(v => v + 1); }
  async function toggle(model: PassTemplate) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setNotice(''); setError('');
    try { await passRpc('set_own_pass_template_active', { p_id: model.id, p_version: model.version, p_active: !model.active }); if (alive.current) saved(); }
    catch (e) { if (alive.current) setError(passError(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return <div className={`mx-auto max-w-6xl p-4 text-stone-900 sm:p-8 ${professional ? '' : 'min-h-[70vh]'}`}>
    {!professional && <button className="mb-5 inline-flex items-center gap-2 text-sm font-semibold" onClick={() => navigate('/owner')}><ArrowLeft className="h-4 w-4" />Area proprietario</button>}
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-emerald-800"><Package className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wider">Lezioni e percorsi</span></div>
      <h1 className="text-3xl font-bold">{professional ? 'Pacchetti di lezioni' : 'I miei pacchetti'}</h1><p className="mt-2 max-w-xl text-stone-600">{professional ? 'Assegna un percorso ai tuoi clienti e tieni il conto delle lezioni svolte.' : 'Lezioni residue, scadenze e storico dei pacchetti assegnati dai tuoi professionisti.'}</p></div>
      <button className={passSecondary} onClick={() => { setNotice(''); setReload(v => v + 1); }} disabled={loading || busy}><RefreshCw className="mr-2 inline h-4 w-4" />Aggiorna elenco</button></header>
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-900">{notice}</p>}
    {professional && <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Sezioni pacchetti"><button className={tab === 'clients' ? passButton : passSecondary} aria-pressed={tab === 'clients'} onClick={() => setTab('clients')}>Pacchetti dei clienti</button><button className={tab === 'templates' ? passButton : passSecondary} aria-pressed={tab === 'templates'} onClick={() => setTab('templates')}>Modelli</button></div>}
    {error && <PassAlert>{error}</PassAlert>}
    {loading ? <p role="status">Caricamento pacchetti…</p> : !error && <>
      {tab === 'templates' && professional ? <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">I tuoi modelli</h2><button className={passButton} disabled={!services.some(s => s.active)} onClick={() => setModal({ kind: 'template', model: null })}><Plus className="mr-1 inline h-4 w-4" />Nuovo modello</button></div>
        {!services.some(s => s.active) && <p className="mb-5">Aggiungi un servizio attivo in <button className="font-semibold underline" onClick={() => navigate('/pro/settings')}>Profilo e servizi</button> per creare un pacchetto.</p>}
        {!models.length ? <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center"><h3 className="font-bold">Prepara il primo pacchetto</h3><p className="mt-2 text-stone-600">Scegli il servizio, quante lezioni include, il prezzo e la durata.</p></div> : <div className="grid gap-4 lg:grid-cols-2">{models.map(m => <article key={m.id} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex justify-between gap-3"><h3 className="font-bold">{m.name}</h3><span className="text-sm text-stone-600">{m.active ? 'Disponibile' : 'Archiviato'}</span></div><p className="mt-1 text-sm text-stone-600">{m.service_name || 'Seleziona un servizio'}{!m.service_active && ' · Servizio non attivo'}</p><p className="mt-4 font-semibold">{m.total_uses} lezioni · {passMoney(m.price)} · {m.valid_days} giorni</p>{m.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.description}</p>}<div className="mt-4 flex flex-wrap gap-2"><button className={passSecondary} disabled={busy} onClick={() => setModal({ kind: 'template', model: m })}>Modifica</button><button className={passSecondary} disabled={busy} onClick={() => void toggle(m)}>{m.active ? 'Archivia modello' : 'Riattiva modello'}</button></div></article>)}</div>}
        <p className="mt-5 text-sm text-stone-600">Archiviare un modello impedisce nuove assegnazioni. I pacchetti già assegnati restano utilizzabili secondo le loro condizioni.</p>
      </> : <>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><label className="text-sm font-semibold">Stato<select className="ml-3 rounded-xl border border-stone-300 bg-white p-2" value={state} onChange={e => { setState(e.target.value); setPage(0); }}><option value="">Tutti</option>{Object.entries(passLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          {professional && <button className={passButton} disabled={!models.some(m => m.active && m.service_active)} onClick={() => setModal({ kind: 'issue' })}><Plus className="mr-1 inline h-4 w-4" />Assegna pacchetto</button>}</div>
        {professional && !models.some(m => m.active && m.service_active) && <p className="mb-5">Per assegnare un pacchetto, <button className="font-semibold underline" onClick={() => setTab('templates')}>prepara un modello con un servizio attivo</button>.</p>}
        {!packs.length ? <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center"><h2 className="font-bold">Nessun pacchetto {state ? 'con questo stato' : 'assegnato'}</h2><p className="mt-2 text-stone-600">{professional ? 'Qui compariranno i percorsi assegnati ai tuoi clienti.' : 'Quando un professionista ti assegna un pacchetto, lo ritrovi qui.'}</p></div> : <div className="grid gap-4 lg:grid-cols-2">{packs.map(p => <article key={p.id} className="rounded-2xl border border-stone-200 bg-white p-5" aria-label={`${p.name} · ${professional ? p.client_name : p.professional_name}`}>
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-800">{professional ? p.client_name : p.professional_name}</p><h2 className="mt-1 text-lg font-bold">{p.name}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.state === 'active' ? 'bg-emerald-50 text-emerald-900' : 'bg-stone-100 text-stone-700'}`}>{passLabels[p.state]}</span></div>
          <p className="mt-1 text-sm text-stone-600">{p.service_name}</p><p className="mt-5 text-3xl font-bold">{p.state === 'legacy' ? 'Da verificare' : <>{p.remaining_uses}<span className="text-base font-normal text-stone-600"> / {p.total_uses} lezioni residue</span></>}</p>
          <p className="mt-3 text-sm">Scadenza: {passDate(p.expires_at)}</p><p className="mt-1 text-sm text-stone-600">Prezzo concordato: {passMoney(p.price)}</p>
          {p.state === 'legacy' && <p className="mt-3 text-sm text-amber-900">Registrazione della versione precedente: le condizioni originali richiedono una verifica. Non è possibile scalare lezioni.</p>}
          {p.cancellation_reason && <p className="mt-3 whitespace-pre-wrap break-words text-sm">Motivo annullamento: {p.cancellation_reason}</p>}
          <div className="mt-5 flex flex-wrap gap-2">{professional && (p.state === 'active' || (p.state === 'expired' && p.remaining_uses > 0)) && <button className={passButton} onClick={() => setModal({ kind: 'use', pack: p })}>Registra lezione</button>}<button className={passSecondary} onClick={() => setModal({ kind: 'history', pack: p })}>Storico</button>{professional && p.state !== 'cancelled' && <button className="px-2 py-2 text-sm text-stone-600 underline" onClick={() => setModal({ kind: 'cancel', pack: p })}>Annulla pacchetto</button>}</div>
        </article>)}</div>}
        {(page > 0 || more) && <div className="mt-6 flex items-center justify-center gap-4"><button className={passSecondary} disabled={page === 0} onClick={() => setPage(v => v - 1)}>Precedente</button><span>Pagina {page + 1}</span><button className={passSecondary} disabled={!more} onClick={() => setPage(v => v + 1)}>Successiva</button></div>}
      </>}
    </>}
    {modal?.kind === 'template' && <PassTemplateDialog model={modal.model} services={services} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'issue' && <IssuePassDialog models={models} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'use' && <UsePassDialog pack={modal.pack} onClose={() => setModal(null)} onSaved={saved} />}
    {modal?.kind === 'history' && <PassHistoryDialog pack={modal.pack} professional={professional} onClose={() => setModal(null)} onReverse={event => setModal({ kind: 'reverse', pack: modal.pack, event })} />}
    {(modal?.kind === 'cancel' || modal?.kind === 'reverse') && <PassReasonDialog pack={modal.pack} event={modal.kind === 'reverse' ? modal.event : undefined} onClose={() => setModal(null)} onSaved={saved} />}
  </div>;
}
