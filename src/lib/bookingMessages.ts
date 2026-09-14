import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

export type BookingMessage = {
  id: string; sequence: number; sender_name: string; sender_kind: 'owner' | 'professional';
  body: string; from_me: boolean; is_automatic: boolean; created_at: string;
};
export type ReplyTemplate = { id: string; title: string; body: string; automatic_event: string | null };
export type MessageSummary = { booking_id: string; message_count: number; unread_count: number };
export const messageButtonStyle = 'inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-800 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-50';
export const templateEvents = [
  ['', 'Solo invio manuale'], ['received', 'Alla ricezione di una richiesta'],
  ['accepted', 'Quando accetti la richiesta'], ['declined', 'Quando rifiuti la richiesta'],
] as const;
export const messagesChanged = 'pc-booking-messages-changed';
export function notifyMessagesChanged() { window.dispatchEvent(new Event(messagesChanged)); }

export function useBookingMessageSummaries(ids: string[]) {
  const { user } = useAuth();
  const key = [...new Set(ids)].sort().join(',');
  const [state, setState] = useState<{ user: string; key: string; rows: Record<string, MessageSummary> }>({ user: '', key: '', rows: {} });
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const uid = user?.id;
    const load = async () => {
      if (!uid || !key || !active || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const batchIds = key.split(',');
        const rows: Record<string, MessageSummary> = {};
        for (let i = 0; i < batchIds.length; i += 200) {
          const { data, error } = await supabase.rpc('get_booking_message_summaries', { p_booking_ids: batchIds.slice(i, i + 200) });
          if (error) throw error;
          if (!active) return;
          for (const row of (data || []) as MessageSummary[]) rows[row.booking_id] = row;
        }
        if (active) setState({ user: uid, key, rows });
      } catch {
        // A failed counter request must not imply "zero unread" or hide the conversation button.
        if (active) setState({ user: uid, key, rows: {} });
      } finally { inFlight = false; }
    };
    void load();
    const interval = window.setInterval(() => void load(), 30000);
    window.addEventListener('focus', load);
    window.addEventListener(messagesChanged, load);
    document.addEventListener('visibilitychange', load);
    return () => {
      active = false; window.clearInterval(interval);
      window.removeEventListener('focus', load); window.removeEventListener(messagesChanged, load);
      document.removeEventListener('visibilitychange', load);
    };
  }, [user?.id, key]);
  return state.user === user?.id && state.key === key ? state.rows : {};
}
