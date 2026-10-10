import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface SportDiscipline {
  id: string;
  label: string;
  description: string;
  aliases: string[];
}

export interface ProfessionalSearchModes {
  show_companion: boolean;
  show_sport: boolean;
  show_livestock: boolean;
  show_hunting: boolean;
  discipline_ids: string[];
}

export function useSportDisciplines(enabled = true) {
  const [disciplines, setDisciplines] = useState<SportDiscipline[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const { data, error: loadError } = await supabase.rpc('list_sport_disciplines');
        if (loadError) throw loadError;
        if (current) setDisciplines(data || []);
      } catch {
        if (current) setError('Non è stato possibile caricare le discipline.');
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => { current = false; };
  }, [enabled, attempt]);

  return { disciplines, loading, error, retry: () => setAttempt(value => value + 1) };
}
