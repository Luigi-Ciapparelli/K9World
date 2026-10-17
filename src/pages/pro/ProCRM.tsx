import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, Users } from 'lucide-react';
import { ClientPortrait, useClientPortraits } from '../../components/ClientPortrait';
import { ProfessionalClientDialog } from '../../components/ProfessionalClientDialog';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ClientPage, ProfessionalClient, clientDate, clientFailure, parseClientPage } from '../../lib/professionalClients';
import { ProLayout } from './ProLayout';

export function ProCRM() {
  const { user, profile } = useAuth();
  return <ProLayout active="crm">{user && profile?.role === 'professional' && <ClientWorkspace key={user.id} userId={user.id} />}</ProLayout>;
}
function ClientWorkspace({ userId }: { userId: string }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState({ query: '', page: 0, revision: 0 });
  const [result, setResult] = useState<{ key: string; data?: ClientPage; error?: string }>({ key: '' });
  const [selected, setSelected] = useState<ProfessionalClient | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const key = JSON.stringify([userId, search]);
  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await supabase.rpc('get_professional_client_page', { p_query: search.query, p_page: search.page }).abortSignal(controller.signal);
        if (response.error) throw response.error;
        const data = parseClientPage(response.data, search.page);
        if (current) setResult({ key, data });
      } catch (error) {
        if (current) setResult({ key, error: clientFailure(error, 'Non è stato possibile caricare i clienti. Riprova.') });
      }
    })();
    return () => { current = false; controller.abort(); };
  }, [key, search.query, search.page]);
  const ready = result.key === key;
  const data = ready ? result.data : undefined;
  const error = ready ? result.error : undefined;
  const portraits = useClientPortraits(data?.rows.map(row => row.id) || []);
  function submit(event: FormEvent) { event.preventDefault(); setSearch({ query: input.trim(), page: 0, revision: search.revision + 1 }); }
  function refresh() { setSearch(old => ({ ...old, revision: old.revision + 1 })); }
  return <div className="mx-auto max-w-6xl p-4 sm:p-8">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">La tua attività</p>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold text-stone-900">Clienti e cani</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">Ritrova i tuoi clienti, i cani seguiti e i tuoi appunti privati. Compaiono qui dopo una prenotazione accettata.</p></div>
      <button type="button" onClick={refresh} className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold">Aggiorna clienti</button>
    </div>
    <form onSubmit={submit} className="mb-6 flex max-w-2xl flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1 basis-48"><label htmlFor="client-search" className="mb-2 block text-sm font-semibold text-stone-700">Cerca per cliente, cane o etichetta</label>
        <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
          <input id="client-search" maxLength={100} value={input} onChange={event => setInput(event.target.value)} placeholder="Ad esempio: Kyros" className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-9 pr-3 text-sm" /></div></div>
      <button className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white">Cerca</button>
    </form>
    {!ready && <p role="status" className="rounded-2xl border border-stone-200 bg-white p-8">Caricamento dei clienti…</p>}
    {error && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><p>{error}</p><button type="button" onClick={refresh} className="mt-3 font-semibold underline">Riprova</button></div>}
    {data && <>
      <p role="status" className="mb-4 text-sm text-stone-500">{data.total} {data.total === 1 ? 'cliente' : 'clienti'}{search.query && ` · Ricerca: ${search.query}`}</p>
      {data.rows.length === 0 ? <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center"><Users aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-emerald-700" />
        <h2 className="text-lg font-semibold">{search.page > 0 ? 'Questa pagina non contiene più clienti' : search.query ? 'Nessun risultato per questa ricerca' : 'I tuoi clienti compariranno qui'}</h2>
        <p className="mt-2 text-sm text-stone-600">{search.query ? 'Prova un altro nome oppure elimina la ricerca.' : 'Le richieste ancora in attesa non aggiungono un cliente alla rubrica.'}</p>
        {(search.query || search.page > 0) && <button type="button" onClick={() => { setInput(''); setSearch({ query: '', page: 0, revision: search.revision + 1 }); }} className="mt-4 font-semibold text-emerald-800 underline">Mostra tutti i clienti</button>}
      </div> : <div className="grid gap-4 md:grid-cols-2">
        {data.rows.map(client => <button key={client.id} type="button" aria-label={`Apri scheda di ${client.full_name}`} onClick={event => { opener.current = event.currentTarget; setSelected(client); }} className="group min-w-0 rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-emerald-600 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700">
          <span className="flex items-center gap-3"><ClientPortrait src={portraits[client.id]} name={client.full_name} /><span className="min-w-0 flex-1"><span className="block break-words text-lg font-bold text-stone-900">{client.full_name}</span><span className="block break-words text-sm text-stone-600">{client.dogs.map(dog => dog.name).join(', ') || 'Nessun cane attualmente collegato'}</span></span><ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-700" /></span>
          <span className="mt-4 grid gap-2 border-t border-stone-100 pt-4 text-xs leading-relaxed text-stone-500"><span>Ultimo servizio svolto <strong className="block text-sm font-medium text-stone-800">{client.last_visit ? clientDate(client.last_visit) : 'Nessun servizio segnato come svolto'}</strong></span>{client.next_booking && <span>Prossimo appuntamento <strong className="block text-sm font-medium text-emerald-800">{clientDate(client.next_booking)}</strong></span>}</span>
          {!!client.tags.length && <span className="mt-4 flex flex-wrap gap-1.5">{client.tags.slice(0, 3).map(tag => <span key={tag} className="max-w-full break-words rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-900">{tag}</span>)}{client.tags.length > 3 && <span className="p-1 text-xs text-stone-500">+{client.tags.length - 3}</span>}</span>}
        </button>)}
      </div>}
      {(data.total > 20 || search.page > 0) && <nav aria-label="Pagine clienti" className="mt-6 flex items-center justify-between gap-2 text-sm"><button type="button" disabled={search.page === 0} onClick={() => setSearch(old => ({ ...old, page: old.page - 1 }))} className="rounded-xl border px-4 py-3 disabled:opacity-40">Precedente</button><span>Pagina {search.page + 1}</span><button type="button" disabled={(search.page + 1) * 20 >= data.total} onClick={() => setSearch(old => ({ ...old, page: old.page + 1 }))} className="rounded-xl border px-4 py-3 disabled:opacity-40">Successiva</button></nav>}
    </>}
    {selected && <ProfessionalClientDialog key={selected.id} client={selected} userId={userId} portrait={portraits[selected.id]} onClose={changed => { setSelected(null); if (changed) refresh(); window.requestAnimationFrame(() => { const target = opener.current; if (target?.isConnected) target.focus(); else heading.current?.focus(); }); }} />}
  </div>;
}
