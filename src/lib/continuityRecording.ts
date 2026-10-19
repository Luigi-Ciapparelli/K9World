import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import { continuityError, type NoteRevision } from './continuity';

export type SessionRequest = {
  p_request_id: string; p_relationship_id: string; p_occurred_at: string;
  p_activity: string; p_body: string;
};
type Attempt = { request: SessionRequest; uncertain: boolean };
let actor: string | null = null;
// Private text lives only in this tab's memory. Auth changes erase it, including
// a logout/login of the same person. No localStorage, URLs, logs or extra RPCs.
const attempts = new Map<string, Attempt>();
const listeners = new Set<() => void>();
function emit() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setContinuityRecordingAccount(next: string | null) {
  if (actor === next) return;
  actor = next; attempts.clear(); emit();
}
export function getPendingSession(actorId: string, relationshipId: string) {
  return actor === actorId ? attempts.get(relationshipId) : undefined;
}
export function usePendingSession(actorId: string, relationshipId: string) {
  return useSyncExternalStore(subscribe, () => getPendingSession(actorId, relationshipId));
}
export function confirmRecordedSessions(actorId: string, rows: NoteRevision[]): string[] {
  if (actor !== actorId) return [];
  const confirmed: string[] = [];
  for (const [id, attempt] of attempts) {
    const r = attempt.request;
    if (rows.some(row => row.session_id === r.p_request_id && row.revision_number === 1
      && row.activity === r.p_activity && row.body === r.p_body
      && Date.parse(row.occurred_at) === Date.parse(r.p_occurred_at))) {
      attempts.delete(id); confirmed.push(id);
    }
  }
  if (confirmed.length) emit();
  return confirmed;
}
const rejections = new Set(['22023', '42501', '55000', '40001', 'PGRST202', '42883']);

export function useContinuityRecording(actorId: string, relationshipId: string, onSaved: () => void) {
  const pending = usePendingSession(actorId, relationshipId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(false), lock = useRef(false);
  const active = useRef<AbortController>();
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; active.current?.abort(); };
  }, []);
  async function submit(input: Omit<SessionRequest, 'p_request_id'>) {
    if (lock.current || actor !== actorId || input.p_relationship_id !== relationshipId) return;
    lock.current = true; setBusy(true); setError('');
    const previous = attempts.get(relationshipId);
    const attempt: Attempt = previous ? { ...previous, uncertain: true }
      : { request: { ...input, p_request_id: crypto.randomUUID() }, uncertain: false };
    attempts.set(relationshipId, attempt); emit();
    const controller = new AbortController(); active.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 15000);
    const current = () => actor === actorId && attempts.get(relationshipId) === attempt;
    try {
      const { data, error: failure } = await supabase.rpc('record_professional_session', attempt.request).abortSignal(controller.signal);
      if (failure) throw failure;
      if (data !== attempt.request.p_request_id) throw new Error('Unconfirmed response');
      if (current()) {
        attempts.delete(relationshipId); emit();
        if (alive.current) onSaved();
      }
    } catch (failure) {
      if (!current()) return;
      const code = (failure as { code?: string })?.code;
      // Only a rejection of the very first request proves it was not saved.
      // A denial after a lost response may follow an actual commit + revocation.
      if (!attempt.uncertain && code && rejections.has(code)) {
        attempts.delete(relationshipId); emit();
        if (alive.current) setError(continuityError(failure));
      } else {
        attempts.set(relationshipId, { ...attempt, uncertain: true }); emit();
        if (alive.current) setError('Esito non confermato. Controlla l’archivio o riprova lo stesso invio. I dati e il riferimento della richiesta rimangono invariati.');
      }
    } finally {
      window.clearTimeout(timer); lock.current = false; active.current = undefined;
      if (alive.current) setBusy(false);
    }
  }
  return { pending, busy, error, submit };
}
