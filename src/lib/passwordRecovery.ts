import { useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type RecoveryState =
  | { status: 'idle' | 'checking' }
  | { status: 'invalid'; reason: 'link' | 'connection' }
  | { status: 'ready'; userId: string; email: string; expiresAt: number };
type RecoveryMarker = { userId: string; expiresAt: number };
const markerKey = 'pc-password-recovery-v1';
const listeners = new Set<() => void>();
const idle: RecoveryState = { status: 'idle' };
const browser = typeof window !== 'undefined';
// Inspect only the kind of callback. Tokens are consumed and validated by Supabase.
const { callback, hasError } = (() => {
  if (!browser) return { callback: false, hasError: false };
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.startsWith('#/') ? '' : url.hash.slice(1));
  const has = (key: string) => fragment.has(key) || url.searchParams.has(key);
  return {
    hasError: ['error', 'error_code', 'error_description'].some(has),
    callback: fragment.get('type') === 'recovery' || url.searchParams.get('type') === 'recovery'
      || (url.pathname === '/reset-password' && ['access_token', 'code', 'error', 'error_code', 'error_description'].some(has)),
  };
})();
function readMarker(): RecoveryMarker | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(markerKey) || 'null');
    return value && typeof value.userId === 'string' && Number.isFinite(value.expiresAt)
      && value.expiresAt > Date.now() ? value : null;
  } catch { return null; }
}
let saved = browser ? readMarker() : null;
let state: RecoveryState = browser && (callback || saved) ? { status: 'checking' } : idle;
let acceptingCallback = Boolean(callback && !hasError);
let timer: ReturnType<typeof setTimeout> | undefined;
function publish(next: RecoveryState) {
  state = next;
  listeners.forEach(listener => listener());
}
function forgetMarker() {
  saved = null;
  try { sessionStorage.removeItem(markerKey); } catch { /* Recovery still works without storage. */ }
}
function cleanCallbackUrl() {
  if (browser && callback) window.history.replaceState(window.history.state, '', '/reset-password');
}
export function invalidatePasswordRecovery(reason: 'link' | 'connection' = 'link') {
  acceptingCallback = false;
  clearTimeout(timer);
  forgetMarker();
  cleanCallbackUrl();
  publish({ status: 'invalid', reason });
}
export function finishPasswordRecovery() {
  acceptingCallback = false;
  clearTimeout(timer);
  forgetMarker();
  publish(idle);
}
function activate(session: Session, deadline?: number) {
  const expiresAt = Math.min(deadline ?? Date.now() + 30 * 60 * 1000, (session.expires_at ?? 0) * 1000);
  if (expiresAt <= Date.now()) { invalidatePasswordRecovery(); return; }
  saved = { userId: session.user.id, expiresAt };
  // This marker only restores the screen after reload. It is not an authorization token.
  try { sessionStorage.setItem(markerKey, JSON.stringify(saved)); } catch { /* Optional. */ }
  clearTimeout(timer);
  timer = setTimeout(() => invalidatePasswordRecovery(), expiresAt - Date.now());
  cleanCallbackUrl();
  publish({ status: 'ready', userId: session.user.id, email: session.user.email || '', expiresAt });
}
if (browser) {
  // Subscribe before React/lazy pages mount so the initial recovery event cannot be lost.
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    // Never await another Auth operation from inside this callback (Auth holds a lock).
    if (event === 'PASSWORD_RECOVERY' && acceptingCallback && session) {
      acceptingCallback = false;
      activate(session);
    } else if (state.status === 'ready' && (!session || session.user.id !== state.userId)) {
      invalidatePasswordRecovery();
    }
  });
  if (state.status === 'checking') {
    timer = setTimeout(() => invalidatePasswordRecovery('connection'), 20000);
    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      // Supabase queues PASSWORD_RECOVERY after initialization; let that event run first.
      setTimeout(() => {
        if (state.status !== 'checking') return;
        if (callback || error || !session || saved?.userId !== session.user.id) {
          invalidatePasswordRecovery(error ? 'connection' : 'link');
        } else if (saved) {
          activate(session, saved.expiresAt);
        }
      }, 0);
    }).catch(() => { if (state.status === 'checking') invalidatePasswordRecovery('connection'); });
  }
  if (import.meta.hot) import.meta.hot.dispose(() => { subscription.unsubscribe(); clearTimeout(timer); });
}
export function getPasswordRecoveryState() { return state; }
export function usePasswordRecovery() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => listeners.delete(listener); }, getPasswordRecoveryState, () => idle);
}
export function passwordRecoveryRedirect() {
  return new URL('/reset-password', window.location.origin).href;
}
