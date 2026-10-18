import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import { readBookingDetails, type BookingDetailsRow } from './bookingDetails';
export function useBookingDetails(ids: string[], refresh = 0) {
  const { user } = useAuth();
  const userId = user?.id;
  const key = [...new Set(ids)].sort().join(',');
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ identity: string; rows: Record<string, BookingDetailsRow>; loading: boolean; error: boolean }>({ identity: '', rows: {}, loading: false, error: false });
  const identity = JSON.stringify([userId, key, refresh, tick]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({ identity, rows: {}, loading: Boolean(userId && key), error: false });
    if (!userId || !key) return;
    const timer = window.setTimeout(() => controller.abort(), 15000);
    void (async () => {
      try {
        const rows: Record<string, BookingDetailsRow> = {};
        const requested = key.split(',');
        for (let offset = 0; offset < requested.length; offset += 100) {
          const batch = requested.slice(offset, offset + 100);
          const { data, error } = await supabase.rpc('get_booking_details', { p_booking_ids: batch }).abortSignal(controller.signal);
          if (!active) return;
          if (error) throw error;
          Object.assign(rows, readBookingDetails(data, batch));
        }
        if (active) setState({ identity, rows, loading: false, error: false });
      } catch {
        if (active) setState({ identity, rows: {}, loading: false, error: true });
      } finally { window.clearTimeout(timer); }
    })();
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [identity, userId, key]);
  const current = state.identity === identity;
  return { rows: current ? state.rows : {}, loading: Boolean(userId && key) && (!current || state.loading),
    error: current && state.error, retry: () => setTick(n => n + 1) };
}
