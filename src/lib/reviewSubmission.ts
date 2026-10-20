import { useSyncExternalStore } from 'react';
import { reviewRpc, type ServiceReview } from './serviceReviews';

export type ReviewTarget = { item?: ServiceReview; legacyBooking?: { id: string; professional_name: string }; professional: boolean };
export type ReviewAttempt = ReviewTarget & {
  key: string; rating: number; comment: string; requestId: string;
  uncertain: boolean; inFlight: boolean;
};
let actor: string | null = null;
let attempts: ReviewAttempt[] = [];
const listeners = new Set<() => void>();
function emit() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
// Review text remains in this tab's memory only. No browser storage or logs.
export function setReviewAccount(next: string | null) {
  if (actor === next) return;
  actor = next; attempts = []; emit();
}
export function reviewTargetKey(target: ReviewTarget) {
  return (target.professional ? 'professional:' : 'owner:') + (target.item?.id || target.legacyBooking?.id);
}
export function useReviewAttempts() { return useSyncExternalStore(subscribe, () => attempts); }
function replace(attempt: ReviewAttempt, next?: ReviewAttempt) {
  if (!attempts.includes(attempt)) return false;
  attempts = next ? attempts.map(value => value === attempt ? next : value) : attempts.filter(value => value !== attempt);
  emit(); return true;
}
const rejections = new Set(['22023', '42501', '40001', 'PCR01', 'PCR02', 'PCR03', 'PCR04', 'PGRST202', '42883']);

export async function submitServiceReview(actorId: string, target: ReviewTarget, rating: number, comment: string, signal: AbortSignal) {
  if (actor !== actorId || signal.aborted || (!target.item && !target.legacyBooking)) return false;
  const key = reviewTargetKey(target);
  const previous = attempts.find(value => value.key === key);
  if (previous?.inFlight) return false;
  const attempt: ReviewAttempt = previous ? { ...previous, inFlight: true, uncertain: true }
    : { ...target, key, rating, comment: target.professional ? '' : comment.trim(), requestId: crypto.randomUUID(), uncertain: false, inFlight: true };
  if (previous) replace(previous, attempt);
  else { attempts = [...attempts, attempt]; emit(); }
  const current = () => actor === actorId && attempts.includes(attempt);
  try {
    const item = attempt.item;
    const result = item
      ? await reviewRpc('write_service_review', { p_thread_id: item.id, p_expected_version: item.version,
        p_rating: attempt.rating, p_comment: attempt.comment, p_request_id: attempt.requestId }, signal)
      : await reviewRpc('submit_review', { p_booking_id: attempt.legacyBooking!.id, p_rating: attempt.rating, p_comment: attempt.comment }, signal);
    const valid = item ? result && typeof result === 'object' && 'version' in result && result.version === item.version + 1
      : typeof result === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(result);
    if (!valid) throw new Error('Unconfirmed review response');
    if (!current()) return false;
    replace(attempt); return true;
  } catch (failure) {
    if (!current()) return false;
    const code = (failure as { code?: string })?.code;
    // A later denial cannot rule out a successful first submission whose reply
    // was lost. Keep its original version, body and idempotency key frozen.
    if (!attempt.uncertain && code && rejections.has(code)) replace(attempt);
    else replace(attempt, { ...attempt, inFlight: false, uncertain: true });
    throw failure;
  }
}
