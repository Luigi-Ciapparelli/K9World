import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { addDays, dayLabel, romeDay, type PublicAvailability } from '../lib/professionalCalendar';

export function PublicBookingAvailability({ professionalId }: { professionalId: string }) {
  const [data, setData] = useState<PublicAvailability | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const today = romeDay();
  useEffect(() => {
    let active = true;
    setData(null); setError(false); setLoading(true);
    void (async () => {
      try {
        const result = await supabase.rpc('get_public_booking_availability', {
          p_professional_id: professionalId, p_from: today, p_to: addDays(today, 60),
        });
        if (result.error || !result.data) throw result.error || new Error('Unavailable profile');
        if (active) setData(result.data as PublicAvailability);
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [professionalId, today, reload]);
  return <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-900">
    <p className="font-semibold">Disponibilità</p>
    {loading ? <p role="status" className="mt-1 text-stone-600">Caricamento…</p> : error ? <p className="mt-1 text-stone-600">Disponibilità non caricata. <button type="button" onClick={() => setReload((n) => n + 1)} className="font-semibold underline">Riprova</button></p> : data && <>
      <p className="mt-1">{data.paused ? 'Nuove richieste temporaneamente sospese.' : 'Il professionista riceve nuove richieste.'}</p>
      {data.periods.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-semibold">Periodi non disponibili nei prossimi 60 giorni</summary>
        <ul className="mt-2 space-y-1">{data.periods.map((period, i) => <li key={`${period.start_date}-${i}`}>{dayLabel(period.start_date)} – {dayLabel(period.end_date)} (compresi)</li>)}</ul>
      </details>}
      <p className="mt-2 text-xs text-stone-600">Le date indicate seguono l’ora italiana. Ogni richiesta richiede conferma.</p>
    </>}
  </div>;
}
