import { FormEvent, useEffect, useRef, useState } from 'react';
import { X, LockKeyhole } from 'lucide-react';
import { ClientPortrait } from './ClientPortrait';
import { DogPhoto } from './DogPhoto';
import { supabase } from '../lib/supabase';
import { useUnsavedChanges } from '../lib/RouterContext';
import { ClientNote, ProfessionalClient, clientDate, clientFailure, clientMoney } from '../lib/professionalClients';

export function ProfessionalClientDialog({ client, userId, portrait, onClose }: { client: ProfessionalClient; userId: string; portrait?: string; onClose: (changed: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const alive = useRef(false), saving = useRef(false), changed = useRef(false);
  const [notes, setNotes] = useState<ClientNote[]>([]), [tags, setTags] = useState(client.tags);
  const [noteText, setNoteText] = useState(''), [tagText, setTagText] = useState('');
  const noteRequest = useRef(crypto.randomUUID()), tagRequest = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(''), [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState(''), [readError, setReadError] = useState('');
  const [loading, setLoading] = useState(true), [more, setMore] = useState(false);
  const [page, setPage] = useState(0), [revision, setRevision] = useState(0);
  useUnsavedChanges(Boolean(noteText.trim() || tagText.trim() || busy));
  useEffect(() => {
    alive.current = true;
    const element = dialog.current, overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = 'hidden';
    return () => { alive.current = false; element?.close(); document.body.style.overflow = overflow; };
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setReadError('');
    void (async () => {
      try {
        const response = await supabase.from('client_notes').select('id,content,created_at').eq('professional_id', userId).eq('client_id', client.id)
          .order('created_at', { ascending: false }).order('id', { ascending: false }).range(page * 20, page * 20 + 20).abortSignal(controller.signal);
        if (response.error) throw response.error;
        if (!Array.isArray(response.data)) throw new Error('Missing notes');
        if (active) {
          const rows = response.data.slice(0, 20) as ClientNote[];
          setNotes(previous => page === 0 ? rows : [...new Map([...previous, ...rows].map(row => [row.id, row])).values()]);
          setMore(response.data.length > 20);
        }
      } catch (error) { if (active) setReadError(clientFailure(error, 'Non è stato possibile caricare gli appunti.')); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [userId, client.id, page, revision]);
  function close() {
    if (saving.current) return;
    if ((noteText.trim() || tagText.trim()) && !window.confirm('Hai appunti o etichette non salvati. Vuoi chiudere e perderli?')) return;
    onClose(changed.current);
  }
  async function save(event: FormEvent, kind: 'note' | 'tag') {
    event.preventDefault();
    const text = (kind === 'note' ? noteText : tagText).trim();
    if (!text || saving.current) return;
    saving.current = true; setBusy(kind); setSaveError(''); setMessage('');
    try {
      const response = await supabase.rpc('save_professional_client_item', { p_client_id: client.id, p_request_id: kind === 'note' ? noteRequest.current : tagRequest.current, p_kind: kind, p_text: text });
      if (response.error) throw response.error;
      const value = response.data;
      if (!value || typeof value.id !== 'string' || typeof value[kind === 'note' ? 'content' : 'tag'] !== 'string') throw new Error('Missing receipt');
      if (!alive.current) return;
      changed.current = true;
      if (kind === 'note') {
        setNoteText(''); noteRequest.current = crypto.randomUUID();
        // Restart pagination so concurrent inserts cannot create gaps or duplicates.
        setNotes([]); setPage(0); setRevision(n => n + 1);
        setMessage('Appunto salvato.');
      } else {
        setTags(previous => previous.some(tag => tag.trim().toLowerCase() === value.tag.trim().toLowerCase()) ? previous : [...previous, value.tag]);
        setTagText(''); tagRequest.current = crypto.randomUUID(); setMessage('Etichetta salvata.');
      }
    } catch (error) {
      if (alive.current) setSaveError(clientFailure(error, 'Salvataggio non confermato. Il testo è ancora qui: riprova senza modificarlo per evitare duplicati.'));
    } finally { saving.current = false; if (alive.current) setBusy(''); }
  }
  const field = 'w-full rounded-xl border border-stone-300 bg-white p-3 text-sm disabled:opacity-60';
  return <dialog ref={dialog} aria-labelledby="client-title" onCancel={event => { event.preventDefault(); close(); }} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/60">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-100 bg-white p-4 sm:p-6"><div className="flex min-w-0 items-center gap-3"><ClientPortrait src={portrait} name={client.full_name} /><div className="min-w-0"><p className="text-xs text-stone-500">Scheda cliente</p><h2 id="client-title" className="break-words text-xl font-bold">{client.full_name}</h2></div></div><button type="button" autoFocus disabled={!!busy} aria-label="Chiudi scheda cliente" onClick={close} className="rounded-xl p-3 hover:bg-stone-100 disabled:opacity-40"><X aria-hidden="true" className="h-5 w-5" /></button></div>
    <div className="space-y-6 p-4 sm:p-6">
      <section aria-label="Recapiti"><h3 className="mb-2 font-semibold">Recapiti</h3><p className="break-words text-sm text-stone-600">{client.email || 'Email non disponibile'}</p><p className="mt-1 text-sm text-stone-600">{client.phone || 'Telefono non indicato'}</p></section>
      <section aria-label="Attività del cliente" className="grid gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2"><div><p className="text-xs text-stone-500">Prenotazioni accettate o svolte</p><p className="mt-1 text-xl font-bold">{client.booking_count}</p></div><div><p className="text-xs text-stone-500">Valore dei servizi svolti</p><p className="mt-1 text-xl font-bold">{clientMoney(client.total_spend)}</p><p className="text-xs text-stone-500">Importi delle prenotazioni, non incassi verificati.</p>{client.missing_prices > 0 && <p className="mt-1 text-xs text-amber-800">{client.missing_prices} servizi senza un importo valido, esclusi dal totale.</p>}</div><p className="text-xs leading-relaxed text-stone-600 sm:col-span-2">Ultimo servizio svolto: {clientDate(client.last_visit)}<br />Prossimo appuntamento: {clientDate(client.next_booking)}<br />Orari italiani.</p></section>
      <section aria-label="Cani seguiti"><h3 className="mb-3 font-semibold">Cani seguiti</h3>{!client.dogs.length ? <p className="text-sm text-stone-500">Nessun cane attualmente collegato alle prenotazioni di questo cliente.</p> : <div className="grid gap-2 sm:grid-cols-2">{client.dogs.map(dog => <div key={dog.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200 p-3"><DogPhoto photoPath={dog.photo_url} alt={dog.name} fallbackUrl="/images/dog-placeholder.svg" className="h-11 w-11 shrink-0 rounded-full object-cover" /><div className="min-w-0"><p className="break-words font-semibold">{dog.name}</p><p className="break-words text-xs text-stone-500">{dog.breed || 'Razza non indicata'}</p></div></div>)}</div>}</section>
      <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900"><LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><p>Etichette e appunti sono privati della tua attività. Non vengono condivisi con il cliente o con altri professionisti. Le note delle lezioni restano nell’archivio dedicato.</p></div>
      {saveError && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{saveError}</p>}
      {message && <p role="status" className="text-sm font-semibold text-emerald-800">{message}</p>}
      <section aria-labelledby="client-tags"><h3 id="client-tags" className="mb-3 font-semibold">Etichette private</h3><div className="mb-3 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="max-w-full break-words rounded-lg bg-emerald-50 px-3 py-1 text-sm text-emerald-900">{tag}</span>)}</div><form onSubmit={event => void save(event, 'tag')} className="flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1 basis-48"><label htmlFor="client-tag" className="mb-1 block text-xs text-stone-600">Nuova etichetta · massimo 60 caratteri</label><input id="client-tag" disabled={!!busy} maxLength={60} value={tagText} onChange={event => { setTagText(event.target.value); tagRequest.current = crypto.randomUUID(); setMessage(''); setSaveError(''); }} placeholder="Ad esempio: primo percorso" className={field} /></div><button disabled={!!busy || !tagText.trim()} className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy === 'tag' ? 'Salvataggio…' : 'Aggiungi etichetta'}</button></form></section>
      <section aria-labelledby="client-notes"><h3 id="client-notes" className="mb-3 font-semibold">Appunti privati</h3><form onSubmit={event => void save(event, 'note')}><label htmlFor="client-note" className="mb-1 block text-xs text-stone-600">Nuovo appunto · massimo 5.000 caratteri</label><textarea id="client-note" rows={4} maxLength={5000} disabled={!!busy} value={noteText} onChange={event => { setNoteText(event.target.value); noteRequest.current = crypto.randomUUID(); setMessage(''); setSaveError(''); }} className={field} /><button disabled={!!busy || !noteText.trim()} className="mt-2 rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy === 'note' ? 'Salvataggio…' : 'Salva appunto'}</button></form>
        {readError && <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm"><p>{readError}</p><button type="button" onClick={() => setRevision(n => n + 1)} className="mt-2 font-semibold underline">Riprova caricamento appunti</button></div>}
        {loading && <p role="status" className="mt-4 text-sm text-stone-500">Caricamento degli appunti…</p>}
        {!loading && !readError && !notes.length && <p className="mt-4 text-sm text-stone-500">Non hai ancora scritto appunti per questo cliente.</p>}
        <div className="mt-4 space-y-3">{notes.map(note => <article key={note.id} className="rounded-xl bg-stone-50 p-4"><p className="mb-2 text-xs text-stone-500">{clientDate(note.created_at)}</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{note.content}</p></article>)}</div>
        {more && !readError && <button type="button" disabled={loading || !!busy} onClick={() => setPage(n => n + 1)} className="mt-4 text-sm font-semibold text-emerald-800 underline disabled:opacity-40">Carica altri appunti</button>}
      </section>
    </div>
  </dialog>;
}
