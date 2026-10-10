import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Star, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { loadServiceReviews, reviewError, type ServiceReview, type ServiceReviews } from '../lib/serviceReviews';
import { RouteLink } from './RouteLink';

const action = 'rounded-full bg-[var(--pc-forest-900)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
const secondary = 'rounded-full border border-[var(--pc-line)] px-4 py-2 text-sm font-semibold disabled:opacity-50';
const date = (value: string) => new Date(value).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });

export function ServiceReviewNotice({ professional = false }: { professional?: boolean }) {
  const { user } = useAuth();
  return user ? <ReviewNoticeBody key={user.id} professional={professional} /> : null;
}
function ReviewNoticeBody({ professional }: { professional: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    loadServiceReviews(professional, 0, 1).then(data => { if (active) setCount(data.pending_count); }).catch(() => {});
    return () => { active = false; };
  }, [professional]);
  if (!count) return null;
  return <aside aria-label="Esperienze da valutare" className="pc-card my-4 flex flex-wrap items-center justify-between gap-4 border-[var(--pc-forest-700)] p-5">
    <div><p className="flex items-center gap-2 font-bold"><MessageSquare className="h-5 w-5" aria-hidden="true" /> Come è andata?</p><p className="mt-1 text-sm">{count === 1 ? 'Hai un’esperienza da valutare.' : `Hai ${count} esperienze da valutare.`} Bastano un voto{professional ? '.' : ' e, se vuoi, poche parole.'}</p></div>
    <RouteLink to={professional ? '/pro/bookings' : '/owner/bookings'} className={action}>Valuta l’esperienza</RouteLink>
  </aside>;
}

export function ServiceReviewPanel({ professional = false, refresh = 0 }: { professional?: boolean; refresh?: number }) {
  const { user } = useAuth();
  return user ? <ReviewPanelBody key={`${user.id}:${professional}`} professional={professional} refresh={refresh} /> : null;
}
function ReviewPanelBody({ professional, refresh }: { professional: boolean; refresh: number }) {
  const [data, setData] = useState<ServiceReviews | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ServiceReview | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; generation.current++; }; }, []);
  const load = useCallback(async () => {
    const run = ++generation.current;
    setLoading(true); setError('');
    try {
      const next = await loadServiceReviews(professional, page);
      if (run !== generation.current || !alive.current) return;
      if (page > 0 && page * 5 >= next.count) { setPage(Math.max(0, Math.ceil(next.count / 5) - 1)); return; }
      setData(next);
    } catch { if (run === generation.current && alive.current) setError('Non è stato possibile caricare le valutazioni.'); }
    finally { if (run === generation.current && alive.current) setLoading(false); }
  }, [professional, page]);
  useEffect(() => { void load(); }, [load, refresh]);
  const dismiss = async (id: string) => {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      const { error: failure } = await supabase.rpc('dismiss_service_review', { p_thread_id: id });
      if (!alive.current) return;
      if (failure) throw failure;
      setNotice('Promemoria nascosto. Potrai valutare da questa sezione quando vorrai.');
      await load();
    } catch (failure) { if (alive.current) setError(reviewError(failure)); }
    finally { if (alive.current) setBusy(false); }
  };
  return <section aria-labelledby="service-reviews-title" className="my-6 rounded-3xl border border-[var(--pc-line)] bg-[var(--pc-paper)] p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="service-reviews-title" className="text-xl font-bold">Le vostre esperienze</h2><button type="button" disabled={loading || busy} onClick={() => void load()} className="text-sm font-semibold underline disabled:opacity-50">Aggiorna valutazioni</button></div>
    <p className="mt-2 text-sm text-[var(--pc-muted-600)]">{professional ? 'Ogni recensione riguarda il servizio svolto in quella prenotazione. Il feedback sulla collaborazione durante la lezione resta tra te e il cliente.' : 'Valuta il servizio che hai ricevuto in quella prenotazione. Il giudizio non è un voto generale all’addestratore o al centro.'}</p>
    {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
    {error ? <p role="alert" className="mt-4 text-sm">{error} <button type="button" onClick={() => void load()} className="font-bold underline">Riprova</button></p> : loading ? <p role="status" className="mt-4 text-sm">Caricamento valutazioni…</p> : !data?.items.length ? <p className="mt-4 text-sm text-[var(--pc-muted-600)]">Le valutazioni delle lezioni si attivano dalla seconda prestazione formativa conclusa presso la stessa attività, anche in un centro. Per pensione, toelettatura e handler basta il primo servizio concluso. Un appuntamento accettato o un pacchetto acquistato non bastano.</p> : <div className="mt-5 space-y-4">
      {data.items.map(item => <article key={item.id} className="rounded-2xl border border-[var(--pc-line)] p-4">
        <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold break-words">{item.service_name}</h3><span className="text-xs font-semibold text-[var(--pc-muted-600)]">{item.review_scope === 'legacy_relationship' ? 'Storico precedente' : item.kind === 'boarding' ? 'Soggiorno svolto' : item.kind === 'trainer' ? 'Lezione svolta' : 'Servizio svolto'}</span></div>
        <p className="mt-1 text-sm text-[var(--pc-muted-600)]">{item.counterpart_name}{item.end_at && <> · concluso il {date(item.end_at)}</>}</p>
        {item.owner_rating !== null && <div className="mt-3 text-sm"><p className="font-semibold">{professional ? 'Recensione del cliente' : 'La tua recensione pubblica'}: {item.owner_rating}/5</p>{item.owner_comment && <p className="mt-1 whitespace-pre-wrap break-words">{item.owner_comment}</p>}</div>}
        {item.professional_rating !== null && <p className="mt-3 text-sm"><span className="font-semibold">{item.review_scope === 'legacy_relationship' ? 'Feedback privato precedente' : professional ? 'Il tuo feedback privato sulla lezione' : 'Feedback privato sulla collaborazione nella lezione'}: {item.professional_rating}/5.</span> Visibile solo a voi due.</p>}
        {item.review_scope === 'legacy_relationship' && <p className="mt-3 text-xs text-[var(--pc-muted-600)]">Valutazione raccolta con le regole precedenti, conservata senza attribuirla a una singola lezione. Nessun punteggio generale è calcolato da questo storico.</p>}
        <div className="mt-4 flex flex-wrap gap-2">{item.can_write && <button type="button" onClick={() => { setNotice(''); setEditing(item); }} className={action}>{item.own_rating === null ? (professional ? 'Valuta la collaborazione' : 'Scrivi la recensione') : 'Aggiorna la tua valutazione'}</button>}{item.pending && <button type="button" disabled={busy} onClick={() => void dismiss(item.id)} className={secondary}>Non ora</button>}</div>
        {!item.can_write && item.review_scope === 'booking_service' && !(professional && item.kind !== 'trainer') && <p className="mt-2 text-xs text-[var(--pc-muted-600)]">La finestra di rettifica è terminata. Una nuova prestazione avrà una valutazione distinta.</p>}
      </article>)}
    </div>}
    {!!data && data.count > 5 && <nav aria-label="Pagine valutazioni" className="mt-4 flex flex-wrap items-center gap-3 text-sm"><button type="button" disabled={page === 0 || loading} onClick={() => setPage(v => v - 1)} className={secondary}>Precedenti valutazioni</button><span>{page + 1} / {Math.ceil(data.count / 5)}</span><button type="button" disabled={(page + 1) * 5 >= data.count || loading} onClick={() => setPage(v => v + 1)} className={secondary}>Altre valutazioni</button></nav>}
    <details className="mt-4 text-sm text-[var(--pc-muted-600)]"><summary className="cursor-pointer font-semibold">Come funzionano le valutazioni</summary><p className="mt-2">Una valutazione per singola prenotazione conclusa. Per le lezioni si parte dalla seconda prestazione formativa presso la stessa attività; i soggiorni non contano verso questa soglia. Ogni nuova lezione ha una scheda distinta. Puoi rettificare l’invio entro 7 giorni. Il giudizio resta legato al servizio anche se cambia il nome nel catalogo. Per le pensioni recensisce solo il cliente. Nessun promemoria via email o SMS.</p><p className="mt-2">I giudizi non certificano qualifiche o risultati sportivi. Per segnalare un contenuto, scrivi a <a href="mailto:info@portalecinofilo.com" className="underline">info@portalecinofilo.com</a> indicando il riferimento della prenotazione.</p></details>
    {editing && <ReviewEditor item={editing} professional={professional} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice(professional ? 'Voto privato salvato.' : 'Recensione pubblicata. Grazie per il tuo contributo.'); void load(); }} />}
  </section>;
}

export function ReviewEditor({ item, legacyBooking, professional = false, onClose, onSaved }: {
  item?: ServiceReview; legacyBooking?: { id: string; professional_name: string };
  professional?: boolean; onClose: () => void; onSaved: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const alive = useRef(true);
  const locked = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);
  const [rating, setRating] = useState(item?.own_rating || 0);
  const [comment, setComment] = useState(item?.own_comment || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    alive.current = true; const dialog = ref.current; const focused = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { alive.current = false; dialog?.close(); focused?.focus(); };
  }, []);
  const submit = async () => {
    if (locked.current) return;
    if (!rating || Array.from(comment.trim()).length > 500) { setError('Scegli un voto e limita il commento a 500 caratteri.'); return; }
    locked.current = true; setBusy(true); setError('');
    const fingerprint = JSON.stringify([rating, comment.trim()]);
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const { error: failure } = item
        ? await supabase.rpc('write_service_review', { p_thread_id: item.id, p_expected_version: item.version, p_rating: rating, p_comment: professional ? '' : comment.trim(), p_request_id: request.current.id })
        : await supabase.rpc('submit_review', { p_booking_id: legacyBooking?.id, p_rating: rating, p_comment: comment.trim() });
      if (!alive.current) return;
      if (failure) throw failure;
      onSaved();
    } catch (failure) { if (alive.current) setError(reviewError(failure)); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  return <dialog ref={ref} aria-labelledby="review-dialog-title" onCancel={event => { event.preventDefault(); if (!locked.current) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl bg-[var(--pc-paper)] p-5 text-[var(--pc-ink-950)] shadow-xl backdrop:bg-black/50 sm:p-7">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--pc-muted-600)]">{professional ? 'Solo tra voi due' : 'Recensione pubblica'}</p><h2 id="review-dialog-title" className="mt-1 text-xl font-bold">{professional ? 'Come avete collaborato?' : 'Come è andata l’esperienza?'}</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="Chiudi valutazione" className="rounded-full p-2 disabled:opacity-50"><X aria-hidden="true" className="h-5 w-5" /></button></div>
    <p className="mt-2 text-sm break-words">{item ? <><strong>{item.service_name}</strong> · {item.counterpart_name}{item.end_at && <> · {date(item.end_at)}</>}</> : legacyBooking?.professional_name}</p>
    <p className="mt-3 text-sm text-[var(--pc-muted-600)]">{professional ? 'Valuta la collaborazione durante questa lezione. Il voto riguarda questa prestazione: sarà visibile al cliente e a te, mai sul suo profilo pubblico o ad altri professionisti.' : 'Valuta esclusivamente il servizio svolto in questa prenotazione. Il voto e il commento saranno pubblici insieme al nome del servizio e al tuo primo nome, senza recapiti o orari della prenotazione. Non diventano un voto all’addestratore o al centro. Evita dati personali, sanitari o informazioni su terzi.'}</p>
    <form onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={busy} className="mt-5"><legend className="text-sm font-semibold">Il tuo voto, da 1 a 5</legend><div className="mt-2 flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(value => <label key={value} className="relative cursor-pointer"><input type="radio" name="review-rating" value={value} checked={rating === value} onChange={() => { setRating(value); setError(''); }} className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" aria-label={`${value} su 5`} /><span className={`flex h-12 w-12 items-center justify-center rounded-xl border peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${rating === value ? 'border-[var(--pc-forest-700)] bg-[var(--pc-forest-100)]' : 'border-[var(--pc-line)]'}`}><Star aria-hidden="true" className={`h-6 w-6 ${value <= rating ? 'fill-amber-400 text-amber-600' : 'text-stone-400'}`} /></span></label>)}</div><p className="mt-2 text-sm" aria-live="polite">{rating ? `${rating} su 5` : 'Nessun voto selezionato'}</p></fieldset>
      {!professional && <div className="mt-5"><label htmlFor="review-comment" className="text-sm font-semibold">Un commento breve (facoltativo)</label><textarea id="review-comment" disabled={busy} value={comment} onChange={e => { setComment(e.target.value); setError(''); }} rows={4} className="mt-2 w-full rounded-xl border border-[var(--pc-line)] bg-[var(--pc-paper)] p-3 text-sm" aria-describedby="review-count" /><p id="review-count" className="mt-1 text-xs">{Array.from(comment.trim()).length}/500 caratteri</p></div>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={busy} className={`${action} mt-5 w-full`}>{busy ? 'Salvataggio…' : professional ? 'Salva voto privato' : 'Pubblica recensione'}</button>
    </form>
  </dialog>;
}
