import { createClient } from '@supabase/supabase-js';
import { captureSignupReturn, resolveSignupReturn } from './signupConfirmation';

function initializeClient() {
  const incoming = captureSignupReturn();
  const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return { supabase, signupReturn: resolveSignupReturn(supabase.auth, incoming) };
}
export const { supabase, signupReturn } = initializeClient();
