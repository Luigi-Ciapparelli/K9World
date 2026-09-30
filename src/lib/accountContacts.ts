import { supabase } from './supabase';
export type ContactKind = 'email' | 'phone';
export interface ContactStatus { email: string; phone: string; emailVerified: boolean; phoneVerified: boolean; emailDeliveryReady: boolean; smsDeliveryReady: boolean }
export interface ContactChallenge { id: string; kind: ContactKind; target: string; otherTarget: string | null; expiresIn: number }

export async function contactRequest<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Accedi nuovamente per gestire i recapiti.');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/account-contacts`, {
    method: 'POST', signal: AbortSignal.timeout(35000),
    headers: { Authorization: `Bearer ${data.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.error) throw new Error(result?.error || 'Servizio recapiti non disponibile. Riprova tra poco.');
  return result as T;
}
