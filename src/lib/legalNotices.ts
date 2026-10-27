/** Bump the revision and archive the published texts whenever these notices change. */
export const LEGAL_NOTICE_VERSION = '2026-10-21.1';
export const LEGAL_NOTICE_DATE = '21 ottobre 2026';
export const PRIVACY_CONTACT = 'info@portalecinofilo.com';

// A declaration supplied at signup, not an immutable receipt or an access-control claim.
// Supabase user_metadata is user-editable. Never use this object to authorize anything.
export function signupLegalDeclaration(role: 'owner' | 'professional') {
  return {
    terms_version: LEGAL_NOTICE_VERSION,
    professional_terms_version: role === 'professional' ? LEGAL_NOTICE_VERSION : null,
    privacy_notice_version: LEGAL_NOTICE_VERSION,
    terms_accepted: true,
    source: 'website-signup',
  };
}
