import { supabase } from './supabase';

export interface PassTemplate {
  id: string; name: string; description: string | null; total_uses: number; price: number;
  valid_days: number; service_id: string | null; service_name: string | null;
  service_active: boolean; active: boolean; version: number;
}
export type PassState = 'active' | 'expired' | 'exhausted' | 'cancelled' | 'legacy';
export interface ClientPass {
  id: string; pass_id: string; client_name: string; professional_name: string; name: string;
  service_name: string; total_uses: number | null; remaining_uses: number; price: number | null;
  purchased_at: string; expires_at: string | null; state: PassState; cancellation_reason: string | null; version: number;
}
export interface PassEvent {
  id: string; kind: 'use' | 'reversal'; delta: number; occurred_at: string; description: string;
  reversal_of: string | null; reversed_at: string | null; created_at: string;
}
export interface PassBooking { id: string; start_at: string; service_name: string }
export const passLabels: Record<PassState, string> = {
  active: 'Attivo', expired: 'Scaduto', exhausted: 'Esaurito', cancelled: 'Annullato', legacy: 'Da verificare',
};
export const passDate = (value: string | null) => value
  ? new Date(value).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'Non disponibile';
export const passMoney = (value: number | null) => value === null ? 'Da verificare'
  : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
export function passError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    '42501': 'Operazione non autorizzata. Per assegnare un pacchetto servono un profilo professionale approvato e una prenotazione del cliente accettata o completata.',
    '40001': 'Il pacchetto è stato modificato. Chiudi questa finestra, aggiorna l’elenco e riprova.',
    '22023': 'Controlla i dati inseriti e la compatibilità della lezione con il servizio del pacchetto.',
    PAP01: 'Questo pacchetto non ha lezioni disponibili o è stato annullato.',
    PAP02: 'La lezione deve essere già svolta, dopo l’assegnazione e prima della scadenza.',
    PAP03: 'Questa prenotazione è già stata scalata da un pacchetto.',
    '23505': 'Questa operazione risulta già registrata. Aggiorna l’elenco prima di riprovare.',
    PAP04: 'Questa lezione è già stata stornata.',
    PAP05: 'Il modello o il servizio non è più disponibile. Aggiorna l’elenco.',
    PGRST202: 'La funzione pacchetti non è ancora disponibile sul server.',
  };
  return (code && messages[code]) || 'Operazione non completata. Controlla la connessione e riprova: il tentativo mantiene lo stesso identificativo.';
}
export async function passRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}
export function localPassTime(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
}
