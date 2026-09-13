import { useRef, useState, type FormEvent } from 'react';
import { Plus, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { serviceColor } from '../lib/professionalCalendar';

type Service = {
  id: string; name: string; service_type: string; price: number | string;
  duration_minutes: number; duration_kind: string; calendar_color?: string; active: boolean;
};
const categories = [
  ['trainer', 'Educazione e addestramento', '#2563EB'],
  ['boarding', 'Pensione', '#7C3AED'], ['enci_course', 'Corso ENCI', '#B45309'],
  ['walker', 'Passeggiata', '#047857'], ['sitter', 'Dog sitting', '#BE185D'],
  ['groomer', 'Toelettatura', '#0E7490'], ['other', 'Altro', '#57534E'],
] as const;
const field = 'mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900';

export function CalendarServices({ services, onChange }: { services: Service[]; onChange: (rows: Service[]) => void }) {
  const [editing, setEditing] = useState<Service | null>(null);
  const [notice, setNotice] = useState('');
  const add = () => {
    setNotice('');
    setEditing({ id: crypto.randomUUID(), name: '', service_type: 'trainer', price: 25,
      duration_minutes: 60, duration_kind: 'hourly', calendar_color: '#2563EB', active: true });
  };
  return <div className="space-y-4 text-stone-900">
    <p className="text-sm text-stone-600">Ogni servizio ha un colore nel calendario. Salva le modifiche con il pulsante dedicato; disattiva un servizio per sospenderne le nuove richieste.</p>
    {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {editing ? <ServiceEditor key={editing.id} initial={editing} onCancel={() => setEditing(null)} onSaved={(saved) => {
      onChange(services.some((s) => s.id === saved.id) ? services.map((s) => s.id === saved.id ? { ...s, ...saved } : s) : [saved, ...services]);
      setEditing(null); setNotice('Servizio salvato. Il colore è aggiornato nel calendario.');
    }} /> : <>
      {services.map((service) => <div key={service.id} className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4">
        <div className="min-w-0 flex items-center gap-3">
          <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full border border-stone-300" style={{ backgroundColor: serviceColor(service.calendar_color) }} />
          <div><p className="font-semibold break-words">{service.name || 'Servizio senza nome'}</p>
            <p className="text-sm text-stone-600">{Number(service.price || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} · {service.duration_minutes} min · {service.active ? 'Attivo' : 'Disattivato'}</p></div>
        </div>
        <button type="button" onClick={() => { setNotice(''); setEditing(service); }} className="shrink-0 rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold">Modifica</button>
      </div>)}
      {!services.length && <p className="text-sm text-stone-600">Aggiungi il primo servizio.</p>}
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white"><Plus className="h-4 w-4" />Aggiungi servizio</button>
    </>}
  </div>;
}

function ServiceEditor({ initial, onSaved, onCancel }: { initial: Service; onSaved: (value: Service) => void; onCancel: () => void }) {
  const [value, setValue] = useState({ ...initial, calendar_color: serviceColor(initial.calendar_color), price: String(initial.price ?? 0), duration_minutes: String(initial.duration_minutes || 60) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const saved = { ...value, name: value.name.trim(), price: Number(value.price), duration_minutes: Number(value.duration_minutes) };
      const { error: failure } = await supabase.rpc('save_my_calendar_service', {
        p_service_id: saved.id, p_name: saved.name, p_service_type: saved.service_type,
        p_price: saved.price, p_duration_minutes: saved.duration_minutes, p_duration_kind: saved.duration_kind,
        p_calendar_color: saved.calendar_color, p_active: saved.active,
      });
      if (failure) throw failure;
      onSaved(saved);
    } catch {
      setError('Salvataggio non confermato. Riprova: lo stesso servizio verrà aggiornato senza crearne una copia.');
    } finally { lock.current = false; setBusy(false); }
  };
  const patch = (part: Partial<typeof value>) => setValue((current) => ({ ...current, ...part }));
  return <form onSubmit={save} className="rounded-2xl border border-stone-300 bg-stone-50 p-4">
    <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2 disabled:opacity-60">
      <label className="text-sm font-semibold sm:col-span-2">Nome del servizio<input autoFocus required maxLength={120} value={value.name} onChange={(e) => patch({ name: e.target.value })} className={field} /></label>
      <label className="text-sm font-semibold">Categoria<select value={value.service_type} onChange={(e) => {
        const selected = categories.find(([id]) => id === e.target.value);
        patch({ service_type: e.target.value, calendar_color: selected?.[2] || value.calendar_color });
      }} className={field}>
        {!categories.some(([id]) => id === value.service_type) && <option value={value.service_type}>{value.service_type}</option>}
        {categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label className="text-sm font-semibold">Colore nel calendario<input type="color" value={value.calendar_color} onChange={(e) => patch({ calendar_color: e.target.value })} className="mt-1 block h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white p-1" /></label>
      <label className="text-sm font-semibold">Prezzo per prenotazione (€)<input type="number" required min="0" max="100000" step="0.01" value={value.price} onChange={(e) => patch({ price: e.target.value })} className={field} /></label>
      <label className="text-sm font-semibold">Durata occupata nel calendario (minuti)<input type="number" required min="1" max="525600" step="1" value={value.duration_minutes} onChange={(e) => patch({ duration_minutes: e.target.value })} className={field} /></label>
      <label className="text-sm font-semibold">Tipo di durata<select value={value.duration_kind} onChange={(e) => patch({ duration_kind: e.target.value })} className={field}><option value="hourly">Orario</option><option value="daily">Giornaliero</option><option value="variable">Variabile</option></select></label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={value.active} onChange={(e) => patch({ active: e.target.checked })} />Servizio attivo</label>
      <p className="text-xs text-stone-600 sm:col-span-2">Per 24 ore indica 1440 minuti. Il prezzo si riferisce all’intera durata indicata.</p>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3"><button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{busy ? 'Salvataggio…' : 'Salva servizio'}</button>
      <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-stone-300 px-4 py-2 font-semibold">Chiudi</button></div>
  </form>;
}
