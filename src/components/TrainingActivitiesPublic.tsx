import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TRAINING_ACTIVITIES, type TrainingFocus } from '../lib/trainerSpecializations';
export function TrainingActivitiesPublic({ professionalId }: { professionalId: string }) {
  const [areas, setAreas] = useState<Partial<Record<TrainingFocus, boolean>> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true; setAreas(null); setError(false);
    void (async () => {
      try {
        const result = await supabase.rpc('get_public_training_activities', { p_professional_id: professionalId });
        if (result.error) throw result.error;
        if (current) setAreas(result.data);
      } catch { if (current) setError(true); }
    })();
    return () => { current = false; };
  }, [professionalId, attempt]);
  if (error) return <p role="status" className="mt-4 text-sm">Attività di addestramento non disponibili. <button className="underline" onClick={() => setAttempt(n => n + 1)}>Riprova</button></p>;
  const selected = TRAINING_ACTIVITIES.filter(area => areas?.[area.id]);
  if (!selected.length) return null;
  return <div className="mt-4"><p className="text-sm font-semibold">Come può aiutarti</p><ul className="mt-2 flex flex-wrap gap-2">{selected.map(area => <li key={area.id} className="rounded-full bg-[var(--pc-bone-50)] px-3 py-2 text-sm">{area.label}</li>)}</ul></div>;
}
