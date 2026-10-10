import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Entry = {
  id: string; rating: number; comment: string; reviewer_name: string;
  review_scope: 'booking_service' | 'legacy_relationship';
  service_name: string | null; service_type: string | null;
};

export function PublicServiceReviews({ professionalId, services }: {
  professionalId: string; services: Array<{ id: string; name: string }>;
}) {
  const [service, setService] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ items: Entry[]; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setData(null);
    void (async () => {
      try {
        const { data: result, error: failure } = await supabase.rpc('get_public_service_reviews', {
          p_professional_id: professionalId, p_service_id: service || null,
          p_offset: page * 10, p_limit: 10,
        });
        if (failure || !result || !Array.isArray(result.items) || !Number.isInteger(result.count)) throw failure || new Error('Invalid response');
        if (active) {
          if (page > 0 && page * 10 >= result.count) setPage(Math.max(0, Math.ceil(result.count / 10) - 1));
          else setData(result);
        }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [professionalId, service, page, retry]);

  return <section aria-labelledby="public-service-reviews-title" className="rounded-[2rem] border border-[var(--pc-line)] bg-[var(--pc-paper)] p-6 shadow-sm md:p-8">
    <h2 id="public-service-reviews-title" className="text-2xl font-bold">Esperienze sui servizi svolti</h2>
    <p className="mt-2 text-sm text-[var(--pc-muted-600)]">Ogni valutazione riguarda una prestazione conclusa. Non è un punteggio complessivo dell’addestratore o del centro.</p>
    {services.length > 0 && <div className="mt-5">
      <label htmlFor="reviews-service" className="text-sm font-semibold">Leggi per servizio</label>
      <select id="reviews-service" value={service} onChange={e => { setService(e.target.value); setPage(0); }} className="mt-2 block w-full rounded-xl border border-[var(--pc-line)] bg-[var(--pc-paper)] p-3 text-sm">
        <option value="">Tutti i servizi e storico</option>
        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>}
    {error ? <p role="alert" className="mt-5 text-sm">Non è stato possibile caricare le valutazioni. <button type="button" className="font-bold underline" onClick={() => setRetry(v => v + 1)}>Riprova</button></p>
      : loading ? <p role="status" className="mt-5 text-sm">Caricamento esperienze…</p>
      : !data?.items.length ? <p className="mt-5 text-sm text-[var(--pc-muted-600)]">Nessuna valutazione pubblicata per {service ? 'questo servizio' : 'i servizi svolti'}.</p>
      : <div className="mt-5 space-y-4">{data.items.map(item => <article key={item.id} className="rounded-2xl border border-[var(--pc-line)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pc-muted-600)]">{item.review_scope === 'legacy_relationship' ? 'Storico precedente' : item.service_type === 'boarding' ? 'Soggiorno svolto' : ['trainer', 'enci_course'].includes(item.service_type || '') ? 'Lezione svolta' : 'Servizio svolto'}</p>
        <h3 className="mt-1 font-bold break-words">{item.review_scope === 'booking_service' ? item.service_name || 'Servizio prenotato' : 'Valutazione raccolta in precedenza'}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span>{item.reviewer_name}</span><span className="inline-flex items-center gap-1 font-semibold"><Star aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-600" />{item.rating}/5</span></div>
        {item.comment && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{item.comment}</p>}
        {item.review_scope === 'legacy_relationship' && <p className="mt-3 text-xs text-[var(--pc-muted-600)]">Conservata con il contesto originale; non attribuita retroattivamente a una singola lezione.</p>}
      </article>)}</div>}
    {data && data.count > 10 && <nav aria-label="Pagine esperienze pubbliche" className="mt-5 flex flex-wrap items-center gap-4 text-sm">
      <button type="button" disabled={page === 0 || loading} onClick={() => setPage(v => v - 1)} className="font-semibold underline disabled:opacity-40">Precedenti</button>
      <span>{page + 1} / {Math.ceil(data.count / 10)}</span>
      <button type="button" disabled={(page + 1) * 10 >= data.count || loading} onClick={() => setPage(v => v + 1)} className="font-semibold underline disabled:opacity-40">Successive</button>
    </nav>}
  </section>;
}
