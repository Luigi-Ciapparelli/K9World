import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type ManualAppointment = {
  id: string; version: number; service_id: string; service_name: string; calendar_color: string;
  duration_minutes: number; start_at: string; end_at: string; dog_label: string;
  instructor_id: string | null; instructor_name: string | null;
};
export type AgendaService = { id: string; name: string; duration_minutes: number; calendar_color: string };

export function useManualAppointments(userId: string | undefined, from: string, to: string, refresh: number) {
  const key = [userId, from, to, refresh].join(':');
  const [state, setState] = useState<{ key: string; rows: ManualAppointment[]; error: boolean }>({ key: '', rows: [], error: false });
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void (async () => {
      try {
        const rows: ManualAppointment[] = [];
        for (let offset = 0; alive; offset += 200) {
          const { data, error } = await supabase.rpc('list_my_manual_appointments', { p_from: from, p_to: to, p_offset: offset });
          if (error || !Array.isArray(data)) throw error || new Error('Agenda incompleta');
          rows.push(...data);
          if (data.length < 200) break;
        }
        if (alive) setState({ key, rows, error: false });
      } catch { if (alive) setState({ key, rows: [], error: true }); }
    })();
    return () => { alive = false; };
  }, [key, userId, from, to]);
  return state.key === key ? { ...state, loading: false } : { rows: [], error: false, loading: Boolean(userId) };
}

export function manualError(error: unknown) {
  switch ((error as {code?: string} | null)?.code) {
    case 'PCJ01': return 'Hai già un impegno in questo orario. Cambia ora o istruttore.';
    case 'PCA02': return 'Il periodo è segnato come indisponibile. Scegli un’altra data.';
    case 'PCX02': return 'L’istruttore è assente in questo orario.';
    case 'PCX04': return 'L’orario è fuori dal turno dell’istruttore.';
    case 'PCJ03': return 'Quest’ora manca o si ripete per il cambio dell’ora. Scegli un altro orario.';
    case 'PCJ04': return 'Il servizio non è più attivo. Ricarica i servizi.';
    case '40001': return 'L’appuntamento è cambiato. Chiudi e aggiorna il calendario prima di modificarlo.';
    case '42501': return 'Per segnare un appuntamento servono email confermata e profilo professionale approvato.';
    case '22023': return 'Controlla il servizio, l’istruttore e la data scelta.';
    default: return 'Salvataggio non confermato. Riprova: lo stesso appuntamento non verrà duplicato.';
  }
}
