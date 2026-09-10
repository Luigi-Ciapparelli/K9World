-- Verification codes are server-managed only.
-- Browser clients must use the Edge Functions.

drop policy if exists "Users view own codes" on public.verification_codes;
drop policy if exists "Users insert own codes" on public.verification_codes;
drop policy if exists "Users update own codes" on public.verification_codes;

revoke select, insert, update, delete
on public.verification_codes
from anon, authenticated;
