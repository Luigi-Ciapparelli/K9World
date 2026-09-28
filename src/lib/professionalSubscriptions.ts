import { useEffect, useRef, useState } from 'react';
import { passRpc, type ClientPass } from './professionalPasses';

export type PeriodUnit = 'week' | 'fortnight' | 'month';
export interface SubscriptionPlan {
  id: string; name: string; description: string; service_id: string | null; service_name: string | null;
  service_active: boolean; period_unit: PeriodUnit | null; period_uses: number | null;
  period_price: number | null; active: boolean; version: number;
}
export interface ClientSubscription {
  id: string; plan_id: string; client_name: string; professional_name: string; name: string; description: string | null;
  service_name: string | null; period_unit: PeriodUnit | null; period_uses: number | null; period_price: number | null;
  starts_on: string | null; lifecycle: 'open' | 'closed' | 'legacy'; version: number; closure_reason: string | null;
  closed_at: string | null; started_at: string; latest_period_id: string | null; latest_start: string | null;
  latest_end: string | null; next_start: string | null; next_end: string | null; can_renew: boolean;
}
export interface SubscriptionPeriod extends ClientPass {
  ordinal: number; starts_on: string; ends_on: string; scheduled: boolean;
}
export const periodLabels: Record<PeriodUnit, string> = { week: 'Ogni settimana', fortnight: 'Ogni 2 settimane', month: 'Ogni mese' };
export const subscriptionLabels = { open: 'Rinnovo manuale', closed: 'Rinnovi chiusi', legacy: 'Da verificare' };
export const subscriptionDate = (value: string | null) => value
  ? new Date(`${value}T12:00:00Z`).toLocaleDateString('it-IT', { timeZone: 'UTC' }) : 'Da verificare';
export function periodRange(start: string | null, end: string | null) {
  if (!start || !end) return 'Date da verificare';
  const last = new Date(`${end}T12:00:00Z`); last.setUTCDate(last.getUTCDate() - 1);
  return `${subscriptionDate(start)} – ${subscriptionDate(last.toISOString().slice(0, 10))}`;
}
export function subscriptionToday() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function subscriptionError(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  const messages: Record<string, string> = {
    '42501': 'Operazione non autorizzata. Per assegnare o rinnovare servono un professionista approvato e un cliente con una prenotazione accettata o completata.',
    '40001': 'I dati sono cambiati. Chiudi la finestra, aggiorna l’elenco e riprova.',
    '22023': 'Controlla servizio, lezioni, prezzo e data di inizio (da oggi, entro un anno).',
    PSB01: 'Piano o servizio non disponibile. Completa il piano e controlla che il servizio sia attivo.',
    PSB02: 'Questo cliente ha già un abbonamento aperto per lo stesso piano. Usa quello esistente o chiudi i suoi rinnovi.',
    PSB03: 'I rinnovi di questo abbonamento sono chiusi. I periodi già confermati rimangono nello storico.',
    PSB04: 'Hai già confermato un periodo futuro. Potrai rinnovare ancora quando sarà iniziato.',
    PSB05: 'Il periodo successivo è già trascorso. Chiudi i rinnovi e assegna un nuovo abbonamento con la nuova data di inizio.',
    '23505': 'Operazione già registrata o identificativo in conflitto. Aggiorna l’elenco.',
    PGRST202: 'Gli abbonamenti non sono ancora disponibili sul server.',
  };
  return messages[code] || 'Operazione non completata. Controlla la connessione e riprova: il tentativo mantiene lo stesso identificativo.';
}
export function useSubscriptionMutation(onSaved: () => void) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const lock = useRef(false); const alive = useRef(true); const operation = useRef<{ key: string; id: string }>();
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function run(name: string, args: Record<string, unknown>, withId = false) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const key = JSON.stringify([name, args]);
    if (!operation.current || operation.current.key !== key) operation.current = { key, id: crypto.randomUUID() };
    try { await passRpc(name, withId ? { ...args, p_id: operation.current.id } : args); if (alive.current) onSaved(); }
    catch (e) { if (alive.current) setError(subscriptionError(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  return { busy, error, run };
}
