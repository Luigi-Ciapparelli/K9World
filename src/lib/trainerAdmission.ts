import { supabase } from './supabase';

export type AdmissionAuthority = 'ENCI' | 'CSEN' | 'OPES' | 'FISC';
export type TrainerAdmission = {
  required: boolean;
  token: string;
  identity: { name: string | null; email: string; email_verified: boolean; listing_type: string };
  credentials: { id: string; title: string; issuer_name: string; version: string; revision: number }[];
};
export type AdmissionProof = {
  credentialId: string; holderName: string; identityChecked: boolean; holderChecked: boolean; reviewNote: string;
};
export const emptyAdmissionProof = (): AdmissionProof => ({ credentialId: '', holderName: '', identityChecked: false, holderChecked: false, reviewNote: '' });

export async function readTrainerAdmission(id: string, signal: AbortSignal): Promise<TrainerAdmission> {
  const { data, error } = await supabase.rpc('admin_get_trainer_admission', { p_id: id }).abortSignal(signal);
  if (error) throw error;
  if (!data || typeof data.required !== 'boolean' || !/^[a-f0-9]{32}$/.test(data.token)
    || !data.identity || typeof data.identity.email !== 'string' || typeof data.identity.email_verified !== 'boolean'
    || !(data.identity.name === null || typeof data.identity.name === 'string') || typeof data.identity.listing_type !== 'string'
    || !Array.isArray(data.credentials) || !data.credentials.every((c: TrainerAdmission['credentials'][number]) =>
      c && typeof c.id === 'string' && typeof c.title === 'string' && typeof c.issuer_name === 'string'
      && ['ENCI', 'CSEN', 'OPES', 'FISC'].includes(c.issuer_name.trim().toUpperCase())
      && typeof c.version === 'string' && Number.isInteger(c.revision))) throw new Error('Admission response missing or malformed');
  return data as TrainerAdmission;
}

export function admissionProofReady(context: TrainerAdmission | null, proof: AdmissionProof) {
  if (!context) return false;
  if (!context.required) return true;
  return context.identity.email_verified && context.credentials.some(c => c.id === proof.credentialId)
    && proof.holderName.trim().length >= 2 && proof.identityChecked && proof.holderChecked
    && proof.reviewNote.trim().length >= 20;
}

export async function approveTrainer(id: string, context: TrainerAdmission, proof: AdmissionProof, notes: string | null, signal: AbortSignal) {
  const credential = context.credentials.find(c => c.id === proof.credentialId);
  if (!credential || !admissionProofReady(context, proof)) throw new Error('Incomplete admission');
  const { error } = await supabase.rpc('admin_approve_trainer', {
    p_id: id, p_token: context.token, p_credential_id: credential.id,
    p_authority: credential.issuer_name.trim().toUpperCase() as AdmissionAuthority,
    p_holder_name: proof.holderName.trim(), p_identity_checked: proof.identityChecked,
    p_holder_checked: proof.holderChecked, p_review_note: proof.reviewNote.trim(), p_admin_notes: notes,
  }).abortSignal(signal);
  if (error) throw error;
}
