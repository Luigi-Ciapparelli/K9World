import { supabase } from './supabase';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ProfessionalApproval = {
  id: string;
  approval_status: ApprovalStatus | null;
  approved: boolean | null;
  admin_notes: string | null;
  rejection_reason: string | null;
};
export const approvalLabels: Record<ApprovalStatus, string> = {
  pending: 'In attesa', approved: 'Approvato', rejected: 'Rifiutato',
};

// Aborting a write does not prove a database rollback. Never retry a mutation
// automatically: read its result instead. Nothing is stored in browser storage.
async function bounded<T>(run: (signal: AbortSignal) => PromiseLike<T>, parent: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let rejectAbort: (reason: Error) => void = () => {};
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const abort = () => { controller.abort(); rejectAbort(new DOMException('Aborted', 'AbortError')); };
  if (parent.aborted) throw new DOMException('Aborted', 'AbortError');
  parent.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(abort, 15000);
  try { return await Promise.race([run(controller.signal), aborted]); }
  finally { window.clearTimeout(timeout); parent.removeEventListener('abort', abort); }
}

export async function readProfessionalApproval(id: string, signal: AbortSignal): Promise<ProfessionalApproval> {
  const { data, error } = await bounded(s => supabase.from('professionals')
    .select('id, approval_status, approved, admin_notes, rejection_reason')
    .eq('id', id).abortSignal(s).maybeSingle(), signal);
  if (error) throw error;
  const nullableText = (value: unknown) => value === null || typeof value === 'string';
  if (!data || data.id !== id || ![null, 'pending', 'approved', 'rejected'].includes(data.approval_status)
    || !(data.approved === null || typeof data.approved === 'boolean')
    || !nullableText(data.admin_notes) || !nullableText(data.rejection_reason)) {
    throw new Error('Approval record missing or malformed');
  }
  return data as ProfessionalApproval;
}

export function sameApproval(a: ProfessionalApproval, b: ProfessionalApproval) {
  return a.id === b.id && a.approval_status === b.approval_status && a.approved === b.approved
    && a.admin_notes === b.admin_notes && a.rejection_reason === b.rejection_reason;
}

export async function writeProfessionalApproval(record: ProfessionalApproval, signal: AbortSignal) {
  const { error } = await bounded(s => supabase.rpc('admin_set_professional_approval', {
    target_professional_id: record.id,
    new_approval_status: record.approval_status,
    new_admin_notes: record.admin_notes,
    new_rejection_reason: record.rejection_reason,
  }).abortSignal(s), signal);
  if (error) throw error;
}
