import { createClient } from '@supabase/supabase-js';
import { captureSignupReturn, detectSignupGrant, resolveSignupReturn } from './signupConfirmation';

function initializeClient() {
  const incoming = captureSignupReturn();
  const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true, autoRefreshToken: true,
      ...(incoming.state === 'grant' ? { detectSessionInUrl: detectSignupGrant } : {}),
    },
  });
  return { supabase, signupReturn: resolveSignupReturn(supabase.auth, incoming) };
}
export const { supabase, signupReturn } = initializeClient();
