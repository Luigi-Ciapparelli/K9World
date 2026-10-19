import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
import { passError } from './professionalPasses';

export type LessonInput = {
  p_client_pass_id: string; p_booking_id: string | null;
  p_occurred_at: string | null; p_description: string | null;
};
type Attempt = { id: string; input: LessonInput; uncertain: boolean };
// Memory only, partitioned by actor + package. Modal reopening/navigation can
// recover the same input; full reload cannot. Never persist private text here.
const attempts = new Map<string, Attempt>();
export function hasPendingLesson(actorId: string | undefined, packId: string): boolean {
  return !!actorId && attempts.has(`${actorId}:${packId}`);
}
const knownRejection = new Set(['22023', '40001', 'PAP01', 'PAP02', 'PAP03', 'PAP04', 'PAP05', '23505', '42501']);

export function useLessonRecording(packId: string, onSaved: () => void) {
  const { user } = useAuth();
  const key = `${user?.id || ''}:${packId}`;
  const [pending, setPending] = useState<Attempt | undefined>(() => attempts.get(key));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(false);
  const lock = useRef(false);
  const active = useRef<{ controller: AbortController; attempt: Attempt }>();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (active.current) {
        active.current.attempt.uncertain = true;
        active.current.controller.abort();
      }
    };
  }, []);

  async function submit(input: LessonInput) {
    if (lock.current || !user || input.p_client_pass_id !== packId) return;
    lock.current = true; setBusy(true); setError('');
    const previous = attempts.get(key);
    const attempt: Attempt = previous ? { ...previous, uncertain: true }
      : { id: crypto.randomUUID(), input: { ...input }, uncertain: false };
    attempts.set(key, attempt); setPending(attempt);
    const controller = new AbortController(); active.current = { controller, attempt };
    const timer = window.setTimeout(() => controller.abort(), 15000);
    try {
      const { data, error: failure } = await supabase.rpc('record_pass_use', {
        p_id: attempt.id, ...attempt.input,
      }).abortSignal(controller.signal);
      if (failure) throw failure;
      if (data !== attempt.id) throw new Error('Unconfirmed lesson response');
      // A late result from an unmounted dialog must not replace newer state.
      if (attempts.get(key) === attempt) attempts.delete(key);
      if (alive.current) { setPending(undefined); onSaved(); }
    } catch (failure) {
      const code = (failure as { code?: string })?.code;
      // A later rejection cannot disprove an earlier unconfirmed commit.
      if (!attempt.uncertain && code && knownRejection.has(code)) {
        if (attempts.get(key) === attempt) attempts.delete(key);
        if (alive.current) { setPending(undefined); setError(passError(failure)); }
      } else {
        attempt.uncertain = true;
        if (alive.current) {
          setPending({ ...attempt });
          setError('Esito non confermato. Riprova lo stesso invio: i dati rimangono invariati e il server riconosce il tentativo già registrato.');
        }
      }
    } finally {
      window.clearTimeout(timer); lock.current = false; active.current = undefined;
      if (alive.current) setBusy(false);
    }
  }
  return { busy, error, pending, submit };
}
