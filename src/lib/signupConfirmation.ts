import type { SupabaseClient } from '@supabase/supabase-js';

export const confirmationPage = '/account/confirm-email';
// This is the existing allow-listed Auth redirect. Ordinary visits to it stay private.
export const signupEmailRedirect = () => new URL('/account/contacts', window.location.origin).href;
export type ConfirmationResult =
  | { state: 'open' | 'invalid' | 'expired' | 'unavailable' }
  | { state: 'confirmed'; id: string };
type Incoming = ConfirmationResult | { state: 'grant'; token: string };

// Run before createClient and the router: Auth removes the fragment while initializing.
export function captureSignupReturn(): Incoming {
  const open = { state: 'open' } as const;
  if (typeof window === 'undefined') return open;
  const url = new URL(window.location.href);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (url.hash.startsWith('#/') || ![confirmationPage, '/account/contacts', '/', '/signin'].includes(path)) return open;
  const hash = new URLSearchParams(url.hash.slice(1));
  const get = (key: string) => url.searchParams.get(key) ?? hash.get(key);
  const type = get('type');
  if (type && !['signup', 'email'].includes(type)) return open;
  const code = get('error_code');
  const failed = Boolean(code || get('error') || get('error_description'));
  const signup = type === 'signup' || type === 'email';
  const expectedPath = path === confirmationPage || path === '/account/contacts';
  if (!signup && !(expectedPath && failed) && !(code === 'otp_expired' && failed)) return open;
  const token = get('access_token');
  if (!failed && signup && token && get('refresh_token') && get('expires_in') && get('token_type')) {
    // Keep only the standard Auth grant in the fragment. It must survive until the SDK reads it.
    const grant = new URLSearchParams();
    for (const key of ['type', 'access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type']) {
      const value = get(key);
      if (value) grant.set(key, value);
    }
    window.history.replaceState(window.history.state, '', confirmationPage + '#' + grant);
    return { state: 'grant', token };
  }
  window.history.replaceState(window.history.state, '', confirmationPage);
  return { state: code === 'otp_expired' ? 'expired' : 'invalid' };
}

// The SDK passes its parsed snapshot to this hook before consuming the grant.
// Remove the original credential-bearing history entry before the SDK changes the hash.
export function detectSignupGrant(url: URL, params: Record<string, string>) {
  if (url.pathname === confirmationPage && params.access_token && ['signup', 'email'].includes(params.type)) {
    window.history.replaceState(window.history.state, '', confirmationPage);
  }
  return Boolean(params.access_token || params.error || params.error_code || params.error_description);
}

export async function resolveSignupReturn(auth: SupabaseClient['auth'], incoming: Incoming): Promise<ConfirmationResult> {
  if (incoming.state !== 'grant') return incoming;
  try {
    // A previously signed-in user is not evidence that this particular link worked.
    const { error } = await auth.initialize();
    if (error) return { state: error.status === 0 || (error.status ?? 0) >= 500 || error.name === 'AuthRetryableFetchError' ? 'unavailable' : 'invalid' };
    const { data: { session } } = await auth.getSession();
    if (!session || session.access_token !== incoming.token) return { state: 'invalid' };
    // Only Auth can attest confirmation. Do not infer it from browser storage or the profile.
    const { data: { user }, error: lookupError } = await auth.getUser(incoming.token);
    if (lookupError) return { state: lookupError.status === 401 || lookupError.status === 403 ? 'invalid' : 'unavailable' };
    return user?.id === session.user.id && user.email_confirmed_at
      ? { state: 'confirmed', id: user.id }
      : { state: 'invalid' };
  } catch {
    return { state: 'unavailable' };
  } finally {
    if (window.location.pathname === confirmationPage && !window.location.hash.startsWith('#/') && window.location.href !== window.location.origin + confirmationPage) {
      window.history.replaceState(window.history.state, '', confirmationPage);
    }
  }
}
